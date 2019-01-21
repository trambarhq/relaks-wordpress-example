const Bluebird = require('bluebird');
const FS = Bluebird.promisifyAll(require('fs'));
const OS = require('os');
const Express = require('express');
const Compression = require('compression');
const SpiderDetector = require('spider-detector')
const DNSCache = require('dnscache');
const CrossFetch = require('cross-fetch');
const ReactDOMServer = require('react-dom/server');
const FrontEnd = require('./client/front-end');
const NginxCache = require('./nginx-cache');

// enable DNS caching
let dnsCache = DNSCache({ enable: true, ttl: 300, cachesize: 100 });

const perPage = 10;
const serverPort = 80;
const wordpressHost = process.env.WORDPRESS_HOST;
const nginxHost = process.env.NGINX_HOST;

let wordpressIP;
dnsCache.lookup(wordpressHost, (err, result) => {
    if (!err) {
        wordpressIP = `::ffff:${result}`;
    }
});

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
app.listen(serverPort);

let pageDependencies = {};

async function handleJSONRequest(req, res, next) {
    try {
        let path = `/wp-json/${req.url.substr(6)}`;
        let url = `http://${wordpressHost}${path}`;
        let sres = await CrossFetch(url);
        let text = await sres.text();
        res.send(text);
    } catch (err) {
        next(err);
    }
}

function handleTimestampRequest(req, res, next) {
    try {
        let now = new Date;
        let ts = now.toISOString();
        res.type('text').send(ts);
    } catch (err) {
        next(err);
    }
}

async function handlePageRequest(req, res, next) {
    try {
        let host = `http://${nginxHost}`;
        let path = req.url;
        let noScript = (req.query.js === '0')
        let target = (req.isSpider() || noScript) ? 'seo' : 'hydrate';
        let sourceURLs = [];
        // create a fetch() that remembers the URLs used
        let fetch = (url, options) => {
            console.log(`Fetching: ${url}`);
            if (url.startsWith(host)) {
                var relURL = url.substr(host.length);
                sourceURLs.push(relURL);
            }
            return CrossFetch(url, options);
        };
        let options = { host, path, target, fetch };
        let rootNode = await FrontEnd.render(options);
        let appHTML = ReactDOMServer.renderToString(rootNode);
        let indexHTMLPath = `${__dirname}/client/index.html`;
        let html = await replaceHTMLComment(indexHTMLPath, 'REACT', appHTML);

        if (target === 'hydrate') {
            // add <noscript> tag to redirect to SEO version
            let meta = `<meta http-equiv=refresh content="0; url=?js=0">`;
            html += `<noscript>${meta}</noscript>`;
        } else if (target === 'seo') {
            res.set({ 'X-Accel-Expires': 0 });
        }
        res.type('html').send(html);

        // save the URLs that the page depends on
        pageDependencies[path] = sourceURLs.map(addTrailingSlash);
    } catch (err) {
        next(err);
    }
}

function handleError(err, req, res, next) {
    if (!res.headersSent) {
        res.type('text').status(400).send(err.message);
    }
    console.error(err);
}

function handlePurgeRequest(req, res) {
    let remoteIP = req.connection.remoteAddress;
    if (remoteIP === wordpressIP) {
        let url = req.url;
        let method = req.headers['x-purge-method'];
        purgeCachedFile(url, method);
    }
    res.end();
}

async function purgeCachedFile(url, method) {
    let pattern, isJSON;
    if (method === 'default' && url.startsWith('/wp-json/')) {
        let path = url.substr(9);
        let m = /^(\w+\/\w+\/(\w+)\/)(\d+)\/$/.exec(path);
        if (m) {
            let folderPath = m[1];
            let folderType = m[2];
            pattern = new RegExp(`^/json/${folderPath}.*`);
        }
    } else if (method === 'regex' && url === '.*') {
        pattern = /.*/;
    }
    if (!pattern) {
        return;
    }
    let purged = await NginxCache.purge(pattern);
    for (let [ pageURL, sourceURLs ] of Object.entries(pageDependencies)) {
        let affected = false;
        for (let jsonURL of purged) {
            jsonURL = addTrailingSlash(jsonURL);
            if (sourceURLs.indexOf(jsonURL)) {
                affected = true;
                break;
            }
        }
        if (affected) {
            delete pageDependencies[pageURL];
            await NginxCache.purge(pageURL);
        }
    }
    await NginxCache.purge('/.mtime');
}

async function replaceHTMLComment(path, comment, newElement) {
    let text = await FS.readFileAsync(path, 'utf-8');
    return text.replace(`<!--${comment}-->`, newElement).replace(`<!--${comment}-->`, newElement);
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

[ './index', './nginx-cache', './client/front-end' ].forEach((path) => {
    let fullPath = require.resolve(path);
    FS.watchFile(fullPath, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
            console.log('Restarting');
            process.exit(0);
        }
    });
});

NginxCache.purge(/.*/);

process.on('unhandledRejection', (err) => {
    console.error(err);
});
