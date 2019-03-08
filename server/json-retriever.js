const CrossFetch = require('cross-fetch');

const WORDPRESS_HOST = process.env.WORDPRESS_HOST;
const WORDPRESS_PROTOCOL = 'http' + (/^https:/.test(WORDPRESS_HOST) ? 's' : '');

let agent = new require(WORDPRESS_PROTOCOL).Agent({ keepAlive: true });

async function fetch(path) {
    console.log(`Retrieving data: ${path}`);
    let url = `${WORDPRESS_HOST}${path}`;
    let res = await CrossFetch(url, { agent });
    let resText = await res.text();
    let object;
    try {
        object = JSON.parse(resText);
    } catch (err) {
        // remove any error msg that got dumped into the output stream
        if (res.status === 200) {
            resText = resText.replace(/^[^\{\[]+/, '');
            object = JSON.parse(resText);
        }
    }
    if (res.status >= 400) {
        let msg = (object && object.message) ? object.message : resText;
        let err = new Error(msg);
        err.status = res.status;
        throw err;
    }
    let total = parseInt(res.headers.get('X-WP-Total'));
    removeSuperfluousProps(path, object);
    let text = JSON.stringify(object);
    return { path, text, total };
}

function removeSuperfluousProps(path, object) {
    if (object instanceof Array) {
        let objects = object;
        for (let object of objects) {
            removeSuperfluousProps(path, object);
        }
    } else if (object instanceof Object) {
        delete object._links;
        if (path === '/wp-json/') {
            delete object.routes;
        } else {
            delete object.guid;
        }
    }
}

module.exports = {
    fetch,
};
