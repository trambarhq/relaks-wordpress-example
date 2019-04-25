const Bluebird = require('bluebird');
const Moment = require('moment');
const FS = Bluebird.promisifyAll(require('fs'));
const OS = require('os');
const Express = require('express');
const Compression = require('compression');
const SpiderDetector = require('spider-detector')
const DNSCache = require('dnscache');
const CrossFetch = require('cross-fetch');

const PageRenderer = require('./page-renderer');
const JSONRetriever = require('./json-retriever');
const NginxCache = require('./nginx-cache');

// enable DNS caching
const dnsCache = Bluebird.promisifyAll(DNSCache({
    enable: true,
    ttl: 300,
    cachesize: 100
}));

const SERVER_PORT = 80;
const WORDPRESS_HOST = process.env.WORDPRESS_HOST;
const CACHE_CONTROL = 'public,max-age=0,s-maxage=604800';

// start up Express
const app = Express();
const basePath = PageRenderer.basePath;
app.set('json spaces', 2);
app.use(Compression())
app.use(SpiderDetector.middleware());
app.use(basePath, Express.static(`${__dirname}/www`, { maxAge: 3600000 }));
app.get(basePath + '.mtime', handleTimestampRequest);
app.get(basePath + '.cache', handleCacheStatusRequest);
app.get(basePath + 'json/*', handleJSONRequest);
app.get(basePath + '*', handlePageRequest);
app.purge('*', handlePurgeRequest);
app.use(handleError);
app.listen(SERVER_PORT);

// purge cache when starting up and periodically
scheduleCachePurge();

async function handleTimestampRequest(req, res, next) {
    try {
        const now = new Date;
        const ts = now.toISOString();
        res.set({ 'Cache-Control': CACHE_CONTROL });
        res.type('text').send(ts);
    } catch (err) {
        next(err);
    }
}

async function handleCacheStatusRequest(req, res, next) {
    try {
        res.set({ 'X-Accel-Expires': 0 });
        res.type('html');
        res.write(`<html><head><title>Nginx Cache</title></head><body>`);
        res.write(`<table border="1" cellpadding="2">`);
        res.write(`<thead><th>URL</th><th>MD5</th><th>Modified time</th><th>Size</th></thead>`);
        res.write(`<tbody>`);
        const entries = await NginxCache.read();
        const total = 0;
        for (let { url, md5, mtime, size } of _.orderBy(entries, 'mtime', 'desc')) {
            const date = Moment(mtime).format('LLL');
            const sizeKB = _.round(size / 1024, 2);
            res.write(`<tr><td>${url}</td><td>${md5}</td><td>${date}</td><td>${sizeKB}KB</td></tr>`)
            total += size;
        }
        const totalMB = _.round(total / 1024 / 1024, 2);
        res.write(`<tr><td colspan="3">Total</td><td>${totalMB}MB</td></tr>`)
        res.write(`</tbody>`);
        res.write(`</table>`);
        res.write(`</body></html>`);
        res.end();
    } catch (err) {
        next(err);
    }
}

async function handleJSONRequest(req, res, next) {
    try {
        // exclude asterisk
        const root = req.route.path.substr(0, req.route.path.length - 1);
        const path = `/wp-json/${req.url.substr(root.length)}`;
        const json = await JSONRetriever.fetch(path);
        if (json.total) {
            res.set({ 'X-WP-Total': json.total });
        }
        res.set({ 'Cache-Control': CACHE_CONTROL });
        res.send(json.text);
    } catch (err) {
        next(err);
    }
}

const pageDependencies = {};

async function handlePageRequest(req, res, next) {
    try {
        const path = req.url;
        const noJS = (req.query.js === '0');
        const target = (req.isSpider() || noJS) ? 'seo' : 'hydrate';
        const page = await PageRenderer.generate(path, target);
        if (target === 'seo') {
            // not caching content generated for SEO
            res.set({ 'X-Accel-Expires': 0 });
        } else {
            res.set({ 'Cache-Control': CACHE_CONTROL });

            // remember the URLs used by the page
            pageDependencies[path] = page.sourceURLs;
        }
        res.type('html').send(page.html);
    } catch (err) {
        next(err);
    }
}

async function handlePurgeRequest(req, res) {
    // verify that require is coming from WordPress
    const remoteIP = req.connection.remoteAddress;
    res.end();
    const wordpressIP = await dnsCache.lookupAsync(WORDPRESS_HOST.replace(/^https?:\/\//, ''));
    if (remoteIP !== `::ffff:${wordpressIP}`) {
        return;
    }

    const url = req.url;
    const method = req.headers['x-purge-method'];
    if (method === 'regex' && url === '/.*') {
        pageDependencies = {};
        await NginxCache.purge(/.*/);
        await PageRenderer.prefetch('/');
    } else if (method === 'default') {
        // look for URLs that looks like /wp-json/wp/v2/pages/4/
        const m = /^\/wp\-json\/(\w+\/\w+\/\w+)\/(\d+)\/$/.exec(url);
        if (!m) {
            return;
        }

        // purge matching JSON files
        const folderPath = m[1];
        const pattern = new RegExp(`^/json/${folderPath}.*`);
        await NginxCache.purge(pattern);

        // purge the timestamp so CSR code knows something has changed
        await NginxCache.purge('/.mtime');

        // look for pages that made use of the purged JSONs
        for (let [ path, sourceURLs ] of Object.entries(pageDependencies)) {
            const affected = sourceURLs.some((sourceURL) => {
                return pattern.test(sourceURL);
            });
            if (affected) {
                // purge the cached page
                await NginxCache.purge(path);
                delete pageDependencies[path];

                if (path === '/') {
                    await PageRenderer.prefetch('/');
                }
            }
        }
    }
}

function handleError(err, req, res, next) {
    if (!res.headersSent) {
        const status = err.status || 400;
        res.type('text').status(status).send(err.message);
    }
    console.error(err);
}

async function scheduleCachePurge() {
    await Bluebird.delay(1000);
    for(;;) {
        try {
            await NginxCache.purge(/.*/);
            await PageRenderer.prefetch('/');

            // purge the cache again the next day at 4 AM
            const tomorrow = Moment().add(1, 'day').startOf('day').add(4, 'hour');
            await Bluebird.delay(tomorrow - Moment());
        } catch (err) {
            await Bluebird.delay(60000);
        }
    }
}

// restart process when a source file changes
Object.keys(require.cache).forEach((path) => {
    if (!/node_modules/.test(path)) {
        FS.watchFile(path, (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
                console.log('Restarting');
                process.exit(0);
            }
        });
    }
});

process.on('unhandledRejection', (err) => {
    console.error(err);
});
