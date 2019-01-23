const Bluebird = require('bluebird');
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
let dnsCache = Bluebird.promisifyAll(DNSCache({
    enable: true,
    ttl: 300,
    cachesize: 100
}));

const SERVER_PORT = 80;
const WORDPRESS_HOST = process.env.WORDPRESS_HOST;

// start up Express
let app = Express();
app.set('json spaces', 2);
app.use(Compression())
app.use(SpiderDetector.middleware());
app.use(`/`, Express.static(`${__dirname}/www`));
app.get('/.mtime', handleTimestampRequest);
app.get('/json/*', handleJSONRequest);
app.get(`/*`, handlePageRequest);
app.purge(`/*`, handlePurgeRequest);
app.use(handleError);
app.listen(SERVER_PORT);

// purge cache when starting up
NginxCache.purge(/.*/);

async function handleTimestampRequest(req, res, next) {
    try {
        let now = new Date;
        let ts = now.toISOString();
        res.type('text').send(ts);
    } catch (err) {
        next(err);
    }
}

async function handleJSONRequest(req, res, next) {
    try {
        let path = `/wp-json/${req.url.substr(6)}`;
        let json = await JSONRetriever.fetch(path);
        res.send(json.text);
    } catch (err) {
        next(err);
    }
}

let pageDependencies = {};

async function handlePageRequest(req, res, next) {
    try {
        let path = req.url;
        let noJS = (req.query.js === '0');
        let target = (req.isSpider() || noJS) ? 'seo' : 'hydrate';
        let page = await PageRenderer.generate(path, target);
        if (target === 'seo') {
            // not caching content generated for SEO
            res.set({ 'X-Accel-Expires': 0 });
        } else {
            // remember the URLs used by the page
            pageDependencies[path] = page.sourceURLs.map(addTrailingSlash);
        }
        res.type('html').send(page.html);
    } catch (err) {
        next(err);
    }
}

async function handlePurgeRequest(req, res) {
    // verify that require is coming from WordPress
    let remoteIP = req.connection.remoteAddress;
    res.end();
    let wordpressIP = await dnsCache.lookupAsync(WORDPRESS_HOST);
    if (remoteIP !== `::ffff:${wordpressIP}`) {
        return;
    }

    let url = req.url;
    let method = req.headers['x-purge-method'];
    if (method === 'regex' && url === '.*') {
        pageDependencies = {};
        await NginxCache.purge(/.*/);
    } else if (method === 'default') {
        // look for URLs that looks like /wp-json/wp/v2/pages/4/
        let m = /^\/wp\-json\/(\w+\/\w+\/\w+)\/(\d+)\/$/.exec(url);
        console.log(url, m)
        if (!m) {
            return;
        }

        // purge matching JSON files
        let folderPath = m[1];
        let pattern = new RegExp(`^/json/${folderPath}.*`);
        let purgedURLs = await NginxCache.purge(pattern);
        if (purgedURLs.length === 0) {
            return;
        }
        purgedURLs = purgedURLs.map(addTrailingSlash);

        // purge the timestamp so CSR code knows something has changed
        await NginxCache.purge('/.mtime');

        // look for pages that made use of the purged JSONs
        for (let [ path, sourceURLs ] of Object.entries(pageDependencies)) {
            let affected = sourceURLs.some((sourceURL) => {
                return purgedURLs.indexOf(sourceURL) !== -1;
            });
            if (affected) {
                // purge the cached page
                await NginxCache.purge(path);
                delete pageDependencies[path];
            }
        }
    }
}

function handleError(err, req, res, next) {
    if (!res.headersSent) {
        res.type('text').status(400).send(err.message);
    }
    console.error(err);
}

/**
 * Add trailing slash to URL
 *
 * @param  {String} url
 *
 * @return {String}
 */
function addTrailingSlash(url) {
    let qi = url.indexOf('?');
    if (qi === -1) {
        qi = url.length;
    }
    let lc = url.charAt(qi - 1);
    if (lc !== '/') {
        url = url.substr(0, qi) + '/' + url.substr(qi);
    }
    return url;
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
