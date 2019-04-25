const Bluebird = require('bluebird');
const FS = Bluebird.promisifyAll(require('fs'));
const HTTP = require('http');
const CrossFetch = require('cross-fetch');
const FrontEnd = require('./client/front-end');

const NGINX_HOST = process.env.NGINX_HOST;
const EXTERNAL_HOST = process.env.EXTERNAL_HOST;
const CACHE_SIZE = 500;
const HTML_TEMPLATE = `${__dirname}/client/index.html`;

async function generate(path, target) {
    console.log(`Regenerating page: ${path}`);
    // retrieve cached JSON through Nginx
    const host = NGINX_HOST;
    // create a fetch() that remembers the URLs used
    const sourceURLs = [];
    const agent = new HTTP.Agent({ keepAlive: true });
    const fetch = (url, options) => {
        if (url.startsWith(host)) {
            sourceURLs.push(url.substr(host.length));
            options = addHostHeader(options);
            options.agent = agent;
        }
        return CrossFetch(url, options);
    };
    const options = { host, path, target, fetch };
    const frontEndHTML = await FrontEnd.render(options);
    const htmlTemplate = await FS.readFileAsync(HTML_TEMPLATE, 'utf-8');
    let html = htmlTemplate.replace(`<!--REACT-->`, frontEndHTML);
    if (target === 'hydrate') {
        // add <noscript> tag to redirect to SEO version
        const meta = `<meta http-equiv=refresh content="0; url=?js=0">`;
        html += `<noscript>${meta}</noscript>`;
    }
    return { path, target, sourceURLs, html };
}

async function prefetch(path) {
    console.log(`Regenerating page: ${path}`);
    const url = NGINX_HOST + path;
    const options = addHostHeader({});
    return CrossFetch(url, options);
}

function addHostHeader(options) {
    if (EXTERNAL_HOST) {
        const [ protocol, domain ] = EXTERNAL_HOST.split('://');
        const port = (protocol === 'https') ? 443 : 80;
        const host = domain + ':' + port;
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
