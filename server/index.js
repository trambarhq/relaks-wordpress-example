const FS = require('fs');
const OS = require('os');
const Express = require('express');
const CrossFetch = require('cross-fetch');
const DNSCache = require('dnscache');
const Crypto = require('crypto');
const SpiderDetector = require('spider-detector')
const ReactDOMServer = require('react-dom/server');
const ClientApp = require('./client/app');

// enable DNS caching
let dnsCache = DNSCache({ enable: true, ttl: 300, cachesize: 100 });

const basePath = `/`;
const perPage = 10;
const serverPort = 80;
const wordpressHost = process.env.WORDPRESS_HOST;
const nginxHost = process.env.NGINX_HOST;
const nginxCache = process.env.NGINX_CACHE;

let wordpressIP;
dnsCache.lookup(wordpressHost, (err, result) => {
    if (!err) {
        wordpressIP = `::ffff:${result}`;
    }
});

let app = Express();
app.set('json spaces', 2);
app.use(SpiderDetector.middleware());
app.use(`/`, Express.static(`${__dirname}/www`));
app.get('/.mtime', handleTimestampRequest);
app.get(`/*`, handlePageRequest);
app.purge(`/*`, handlePurgeRequest);
app.use(handleError);
app.listen(serverPort);

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
        let rootNode = await ClientApp.render(options);
        let appHTML = ReactDOMServer.renderToString(rootNode);
        let indexHTMLPath = `${__dirname}/client/index.html`;
        let html = await replaceHTMLComment(indexHTMLPath, 'APP', appHTML);

        if (target === 'hydrate') {
            // add <noscript> tag to redirect to SEO version
            let meta = `<meta http-equiv=refresh content="0; url=?js=0">`;
            html += `<noscript>${meta}</noscript>`;
        } else if (target === 'seo') {
            res.set({ 'X-Accel-Expires': 0 });
        }
        res.type('html').send(html);

        recordDependencies(path, sourceURLs);
    } catch (err) {
        next(err);
    }
}

function handleTimestampRequest(req, res, next) {
    try {
        let now = new Date;
        let ts = now.toISOString();
        res.type('text').send(ts);

        let path = req.url;
        recordDependencies(path, '*');
    } catch (err) {
        next(err);
    }
}

function handleError(err, req, res, next) {
    if (!res.headersSent) {
        res.type('text').status(400).send(err.message);
    } else {
        console.error(err);
    }
}

async function handlePurgeRequest(req, res) {
    let remoteIP = req.connection.remoteAddress;
    if (remoteIP === wordpressIP) {
        let url = req.url;
        let method = req.headers['x-purge-method'];
        await purgeCachedFile(url, method);

        let pattern = (method === 'regex') ? new RegExp(url) : url;
        let isJSON;
        if (pattern instanceof RegExp) {
            isJSON = pattern.test('/wp-json');
        } else {
            isJSON = pattern.startsWith('/wp-json');
        }
        if (isJSON) {
            await purgeDependentPages(pattern);
        }
    }
    res.end();
}

let pageDependencies = {};

function recordDependencies(url, sourceURLs) {
    if (sourceURLs instanceof Array) {
        sourceURLs = sourceURLs.map(removeTrailingSlash);
    }
    pageDependencies[url] = sourceURLs;
}

async function purgeDependentPages(host, pattern) {
    for (let [ url, sourceURLs ] of Object.entries(pageDependencies)) {
        let match = false;
        if (sourceURLs === '*') {
            match = true;
        } else if (pattern instanceof RegExp) {
            match = sourceURLs.some((sourceURL) => {
                return pattern.test(sourceURL);
            });
        } else {
            let url = removeTrailingSlash(pattern);
            if (sourceURLs.indexOf(url)) {
                match = true;
            }
        }
        if (match) {
            delete pageDependencies[pageURL];
            await purgeCachedFile(pageURL);
        }
    }
}

async function purgeCachedFile(url, method) {
    console.log(`Purging: ${url}`);
    if (method === 'regex') {
        // delete everything
        let files = await new Promise((resolve, reject) => {
            FS.readdir(nginxCache, (err, files) => {
                if (!err) {
                    resolve(files);
                } else {
                    resolve([]);
                }
            });
        });
        let isMD5 = /^[0-9a-f]{32}$/;
        for (let file of files) {
            if (isMD5.test(file)) {
                await unlinkFile(`${nginxCache}/${file}`);
            }
        }
    } else {
        let hash = Crypto.createHash('md5').update(url);
        let md5 = hash.digest("hex");
        await unlinkFile(`${nginxCache}/${md5}`);
    }
}

async function unlinkFile(path) {
    console.log(`Unlinking ${path}`);
    await new Promise((resolve, reject) => {
        FS.unlink(path, (err) => {
            if (!err) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

async function replaceHTMLComment(path, comment, newElement) {
    let text = await new Promise((resolve, reject) => {
        FS.readFile(path, 'utf-8', (err, text) => {
            if (!err) {
                resolve(text);
            } else {
                reject(err);
            }
        });
    });
    return text.replace(`<!--${comment}-->`, newElement).replace(`<!--${comment}-->`, newElement);
}

/**
 * Remove trailing slash from URL
 *
 * @param  {String} url
 *
 * @return {String}
 */
function removeTrailingSlash(url) {
    var lc = url.charAt(url.length - 1);
    if (lc === '/') {
        url = url.substr(0, url.length - 1);
    }
    return url;
}

process.on('unhandledRejection', (err) => {
    console.error(err);
});
