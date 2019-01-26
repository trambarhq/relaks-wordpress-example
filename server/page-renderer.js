const Bluebird = require('bluebird');
const FS = Bluebird.promisifyAll(require('fs'));
const ReactDOMServer = require('react-dom/server');
const CrossFetch = require('cross-fetch');
const FrontEnd = require('./client/front-end');

const NGINX_HOST = process.env.NGINX_HOST;
const CACHE_SIZE = 500;
const HTML_TEMPLATE = `${__dirname}/client/index.html`;

async function generate(path, target) {
    // retrieve cached JSON through Nginx
    console.log(`Regenerating page: ${path}`);
    let host = `http://${NGINX_HOST}`;
    // create a fetch() that remembers the URLs used
    let sourceURLs = [];
    let fetch = (url, options) => {
        if (url.startsWith(host)) {
            sourceURLs.push(url.substr(host.length));
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

module.exports = {
    generate,
};
