const CrossFetch = require('cross-fetch');

const WORDPRESS_HOST = process.env.WORDPRESS_HOST;

async function fetch(path) {
    let url = `${WORDPRESS_HOST}${path}`;
    let res = await CrossFetch(url);
    let object = await res.json();
    removeSuperfluousProps(path, object);
    let text = JSON.stringify(object);
    return { path, text };
}

function removeSuperfluousProps(path, object) {
    if (object instanceof Array) {
        let objects = object;
        for (let object of objects) {
            return removeSuperfluousProps(path, object);
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
