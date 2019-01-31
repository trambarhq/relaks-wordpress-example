const Bluebird = require('bluebird');
const FS = Bluebird.promisifyAll(require('fs'));
const ReactDOMServer = require('react-dom/server');
const CrossFetch = require('cross-fetch');
const FrontEnd = require('./client/front-end');

const NGINX_HOST = process.env.NGINX_HOST;
const EXTERNAL_HOST = process.env.EXTERNAL_HOST;
const CACHE_SIZE = 500;
const HTML_TEMPLATE = `${__dirname}/client/index.html`;

async function generate(path, target) {
    console.log(`Regenerating page: ${path}`);
    // retrieve cached JSON through Nginx
    let host = NGINX_HOST;
    // create a fetch() that remembers the URLs used
    let sourceURLs = [];
    let fetch = (url, options) => {
        if (url.startsWith(host)) {
            sourceURLs.push(url.substr(host.length));
            options = addHostHeader(options);
        }
        return CrossFetch(url, options);
    };
    let options = { host, path, target, fetch };
    let rootNode = await FrontEnd.render(options);
    let appHTML = ReactDOMServer.renderToString(rootNode);
    let htmlTemplate = await FS.readFileAsync(HTML_TEMPLATE, 'utf-8');
    let html = htmlTemplate.replace(`<!--REACT-->`, appHTML);
    if (target === 'hydrate') {
        // add <noscript> tag to redirect to SEO version
        let meta = `<meta http-equiv=refresh content="0; url=?js=0">`;
        html += `<noscript>${meta}</noscript>`;
    }
    return { path, target, sourceURLs, html };
}

async function prefetch(path) {
    console.log(`Regenerating page: ${path}`);
    let url = NGINX_HOST + path;
    let options = addHostHeader({});
    return CrossFetch(url);
}

function addHostHeader(options) {
    if (EXTERNAL_HOST) {
        let [ protocol, domain ] = EXTERNAL_HOST.split('://');
        let port = (protocol === 'https') ? 443 : 80;
        let host = domain + ':' + port;
        options = Object.assign({}, options);
        options.headers = Object.assign({ Host: host }, options.headers);
    }
    return options;
}

module.exports = {
    generate,
    prefetch,
    basePath: FrontEnd.basePath
};
