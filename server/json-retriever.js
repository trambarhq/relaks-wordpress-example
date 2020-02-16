const CrossFetch = require('cross-fetch');

const WORDPRESS_HOST = process.env.WORDPRESS_HOST;
const WORDPRESS_PROTOCOL = 'http' + (/^https:/.test(WORDPRESS_HOST) ? 's' : '');

const agent = new require(WORDPRESS_PROTOCOL).Agent({ keepAlive: true });

async function fetch(path) {
  console.log(`Retrieving data: ${path}`);
  const url = `${WORDPRESS_HOST}${path}`;
  const res = await CrossFetch(url, { agent });
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
    const msg = (object && object.message) ? object.message : resText;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const total = parseInt(res.headers.get('X-WP-Total'));
  removeSuperfluousProps(path, object);
  const text = JSON.stringify(object);
  return { path, text, total };
}

function removeSuperfluousProps(path, object) {
  if (object instanceof Array) {
    const objects = object;
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
