const CrossFetch = require('cross-fetch');

const WORDPRESS_HOST = process.env.WORDPRESS_HOST;

async function fetch(path) {
    console.log(`Retrieving data: ${path}`);
    let url = `${WORDPRESS_HOST}${path}`;
    let res = await CrossFetch(url);
    let resText = await res.text();
    let object;
    try {
        object = JSON.parse(resText);
    } catch (err) {
        // remove any error msg that got dumped into the output stream
        resText = resText.replace(/^[^\{\[]+/, '');
        object = JSON.parse(resText);
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
