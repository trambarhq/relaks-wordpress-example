Zero-latency WordPress Front-end
================================
In this example, we're going to build a Zero-latency front-end for WordPress. When a visitor clicks on a link, a story will instantly appear. No hourglass. No spinner. No blank page. We'll accomplish this by aggressively prefetching data in our client-side code. At the same time, we're going to employ server-side rendering (SSR) to minimize time to first impression. The page should appear within a fraction of a second after the visitor enters the URL.

Combined with aggressive caching, what we'll end up with is a web site that feels very fast and is very cheap to host.

This is a complex example with many moving parts. It's definitely not for beginners. You should already be familiar with technologies involved: [React](https://reactjs.org/), [Nginx caching](https://www.nginx.com/blog/nginx-caching-guide/), and of course [WordPress](https://wordpress.org/) itself.

* [Live demo](#live-demo)
* [Server-side rendering](#server-side-rendering)
* [Back-end services](#back-end-services)
* [Uncached page access](#uncached-page-access)
* [Cached page access](#cached-page-access)
* [Cache purging](#cache-purging)
* [Getting started](#getting-started)
* [Docker Compose configuration](#docker-compose-configuration)
* [Nginx configuration](#nginx-configuration)
* [Back-end JavaScript](#back-end-javaScript)
* [Front-end JavaScript](#front-end-javaScript)
* [Cordova deployment](#cordova-deployment)
* [Final words](#final-words)

## Live demo

For the purpose of demonstrating what the example code can do, I've prepared three web sites:

* [pfj.trambar.io](https://pfj.trambar.io)
* [et.trambar.io](https://et.trambar.io)
* [rwt.trambar.io](https://rwt.trambar.io)

All three are hosted on the same AWS [AI medium instance](https://aws.amazon.com/ec2/instance-types/a1/), powered by a single core of an [Graviton CPU](https://www.phoronix.com/scan.php?page=article&item=ec2-graviton-performance&num=1) and backed by 2G of RAM. In terms of computational resources we have roughly one fourth that of a phone. Not much. For our system though, it's more than enough. Most requests will result in cache hits. Nginx will spend most of its time sending data already in memory. We'll be IO-bound long before we'll reach maximum CPU usage.

[pfj.trambar.io](https://pfj.trambar.io) obtains its data from a test WordPress instance running on the same server. It's populated with random lorem ipsum text. You can log into the [WordPress admin page](https://pfj.trambar.io/wp-admin/) and post a article using the account `bdickus` (password: `incontinentia`). Publication of a new article will trigger a cache purge. The article should appear in the front page automatically after 30 seconds or so.

You can see a list of what's in the Nginx cache [here](https://pfj.trambar.io/.cache/).

[et.trambar.io](https://et.trambar.io) and [rwt.trambar.io](https://rwt.trambar.io) obtain their data from [ExtremeTech](https://www.extremetech.com/) and [Real World Tech](https://www.realworldtech.com/) respectively. They are meant to give you a better sense of how the example code fares with real-world contents. Our server does not receive cache purge commands from these WordPress instances so the contents could be out of date. Cache misses will also lead to slightly longer pauses.

## Server-side rendering

Isomorphic React components are capable of rendering on a web server as well as in a web browser. A primary purpose of server-side rendering (SSR) is search engine optimization. Another is to mask JavaScript loading time. Rather than displaying a spinner or progress bar, we render the front-end on the server and send that to the browser. Effectively, we're using the front-end's own appearance as its loading screen.

The following animation depicts how an SSR-augmented single-page web-site works. Click on it if you wish to view it as separate images.

[![Server-side rendering](docs/img/ssr.gif)](docs/ssr.md)

While the SSR HTML is not backed by JavaScript, it does have functional hyperlinks. If the visitor clicks on a link before the JavaScript bundle is loaded, he'll end up at another SSR page. As the server has immediate access to both code and data, it can generate this page very quickly. It's also possible that the page exists in the server-side cache, in which case it'll be sent even sooner.

## Back-end services

Our back-end consists of three services: WordPress itself, Nginx, and Node.js. The following diagram shows how contents of various types move between them:

![Back-end services](docs/img/services.png)

Note how Nginx does not fetch JSON data directly from WordPress. Instead, data goes through Node first. This detour is due mainly to WordPress not attaching [e-tags](https://en.wikipedia.org/wiki/HTTP_ETag) to JSON responses. Without e-tags the browser cannot perform cache validation (i.e. conditional request ￫ 304 not modified). Passing the data through Node also gives us a chance to strip out unnecessary fields. Finally, it lets us compress the data prior to sending it to Nginx. Size reduction means more contents will fit in the cache. It also saves Nginx from having to gzip the same data over and over again.

Node will request JSON data from Nginx when it runs the front-end code. If the data isn't found in the cache, Node will end up serving its own request. This round-trip will result in Nginx caching the JSON data. We want that to happen since the browser will soon be requesting the same data (since it's running the same front-end code).

## Uncached page access

The following animation shows what happens when the browser requests a page and Nginx's cache is empty. Click on it to view it as separate images.

[![Uncached page access](docs/img/uncached.gif)](docs/uncached.md)

## Cached page access

The following animation shows how page requests are handled once contents (both HTML and JSON) are cached. This is what happens most of the time.

[![Cached page access](docs/img/cached.gif)](docs/cached.md)

## Cache purging

The following animation depicts what happens when a new article is published on WordPress.

[![Cached cache purging](docs/img/purge.gif)](docs/purge.md)

## Getting started

This example is delivered as a Docker app. Please install Docker and Docker Compose if they aren't already installed on your computer. On Windows and OSX, you might need to enable port forwarding for port 8000.

In the command line, run `npm install` or `npm ci`. Once all libraries have been downloaded, run `npm run start-server`. Docker will proceed to download four official images from Docker Hub: [WordPress](https://hub.docker.com/_/wordpress/), [MariaDB](https://hub.docker.com/_/mariadb), [Nginx](https://hub.docker.com/_/nginx), and [Node.js](https://hub.docker.com/_/node/).

Once the services are up and running, go to `http://localhost:8000/wp-admin/`. You should be greeted by WordPress's installation page. Enter some information about your test site and create the admin account. Log in and go to **Settings** > **Permalinks**. Choose one of the URL schemas.

Next, go to **Plugins** > **Add New**. Search for `Proxy Cache Purge`. Install and activate the plugin. A new **Proxy Cache** item will appear in the side navigation bar. Click on it. At the bottom of the page, set the **Custom IP** to 172.129.0.3. This is the address of our Node.js service.

In a different browser tab, go to `http://localhost:8000/`. You should see the front page with just a sample post:

![Welcome page](docs/img/front-page-initial.png)

Now return to the WordPress admin page and publish another test post. After 30 seconds or so, the post should automatically appear in the front page:

![Welcome page](docs/img/front-page-new-story.png)

To see the code running in debug mode, run `npm run watch`. The client-side code will be rebuilt whenever changes occurs.

To shut down the test server, run `npm run stop-server`. To remove Docker volumes used by the example, run `npm run remove-server`.

If you have a production web site running WordPress, you can see how its contents look in the example front-end (provided that the REST interface is exposed and permalinks are enabled). Open `docker-compose-remote.yml` and change the environment variable `WORDPRESS_HOST` to the address of the site. Then run `npm run start-server-remote`.

## Nginx configuration

Let us look at the [Nginx configuration file](https://github.com/chung-leong/relaks-wordpress-example/blob/master/server/nginx/default.conf). The first two lines tell Nginx where to place cached responses, how large the cache should be (1 GB), and for how long inactive entries are kept until they're deleted (7 days):

```
proxy_cache_path /var/cache/nginx/data keys_zone=data:10m max_size=1g inactive=7d;
proxy_temp_path /var/cache/nginx/tmp;
```

[`proxy_cache_path`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_path) is specified without `levels` so that files are stored in a flat directory structure. This makes it easier to scan the cache. [`proxy_temp_path`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_temp_path) is set to the a location on the same volume as the cache so Nginx can move files into it with a move operation.

The following section configures reverse-proxying for the WordPress admin page:

```
location ~ ^/wp-* {
    proxy_pass http://wordpress;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Host $server_name;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass_header Set-Cookie;
    proxy_redirect off;
}
```

The following section controls Nginx's interaction with Node:

```
location / {
    proxy_pass http://node;
    proxy_set_header Host $http_host;
    proxy_cache data;
    proxy_cache_key $uri$is_args$args;
    proxy_cache_min_uses 1;
    proxy_cache_valid 400 404 1m;
    proxy_hide_header Cache-Control;
    proxy_ignore_headers Vary;

    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Expose-Headers X-WP-Total;
    add_header Cache-Control "public,max-age=0";
    add_header X-Cache-Date $upstream_http_date;
    add_header X-Cache-Status $upstream_cache_status;
}
```

We select the cache zone we defined earlier with the [`proxy_cache`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache) directive. We set the cache key using [`proxy_cache_key`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_key). The MD5 hash of the path plus the query string will be the name used to save each cached server response. With the [`proxy_cache_min_uses`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_min_uses) directive we tell Nginx to start caching on the very first request. With the [`proxy_cache_valid`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_valid) directive we ask Nginx to cache error responses for one minute.

As we're going to add the `Cache-Control` header, we want strip off the one from Node.js first using [`proxy_hide_header`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_hide_header). The [`proxy_ignore_headers`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_ignore_headers) directive, meanwhile, is there to keep Nginx from creating separate cache entries when requests to the same URL have different `Accept-Encoding` headers (additional compression scheme, for example).

The first two headers we add are there to enable [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). The last two `X-Cache-*` headers are there for debugging purpose. They let us figure out whether a request has resulted in a cache hit when we examine it using the browser's development tools:

![Chrome Dev Tools](docs/img/dev-tool-x-cache.png)

## Back-end JavaScript

* [HTML page generation](#html-page-generation)
* [JSON data retrieval](#json-data-retrieval)
* [Purge request handling](#purge-request-handling)
* [Timestamp handling](#timestamp-handling)

### HTML page generation

The following Express handler ([index.js](https://github.com/chung-leong/relaks-wordpress-example/blob/master/server/index.js#L101)) is invoked when Nginx asks for an HTML page. It detects whether the remote agent is a search-engine spider and handle the request accordingly.

```javascript
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
            res.set({ 'Cache-Control': CACHE_CONTROL });

            // remember the URLs used by the page
            pageDependencies[path] = page.sourceURLs;
        }
        res.type('html').send(page.html);
    } catch (err) {
        next(err);
    }
}
```

`PageRenderer.generate()` ([page-renderer.js](https://github.com/chung-leong/relaks-wordpress-example/blob/master/server/page-renderer.js#L12)) uses our isomorphic front-end React code to generate the page. Since the fetch API doesn't exist on Node.js, we need to supply a compatible function to the data source. We use this opportunity to capture the list of URLs that the front-end accesses. Later, we'll use this list to determine whether a cached page has become out-of-date.

```javascript
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
```

`FrontEnd.render()` returns a ReactElement containing just plain HTML child elements. We use React DOM Server to convert that to actual HTML text. Then we stick it into our [HTML template](https://github.com/chung-leong/relaks-wordpress-example/blob/master/src/index.html), where a HTML comment sits inside the element that would host the root React component.

`FrontEnd.render()` is a function exported by our front-end's [bootstrap code](https://github.com/chung-leong/relaks-wordpress-example/blob/master/src/main.js#L68):

```javascript
async function serverSideRender(options) {
    let basePath = process.env.BASE_PATH;
    let dataSource = new WordpressDataSource({
        baseURL: options.host + basePath + 'json',
        fetchFunc: options.fetch,
    });
    dataSource.activate();

    let routeManager = new RouteManager({
        routes,
        basePath,
    });
    routeManager.addEventListener('beforechange', (evt) => {
        let route = new Route(routeManager, dataSource);
        evt.postponeDefault(route.setParameters(evt, false));
    });
    routeManager.activate();
    await routeManager.start(options.path);

    let ssrElement = createElement(FrontEnd, { dataSource, routeManager, ssr: options.target });
    return harvest(ssrElement);
}

exports.render = serverSideRender;
```

### JSON data retrieval

The following handler is invoked when Nginx requests a JSON file (i.e. when a cache miss occurs). It's quite simple. All it does is change the URL prefix from `/json/` to `/wp-json/` and set a couple HTTP headers:

```javascript
async function handleJSONRequest(req, res, next) {
    try {
        // exclude asterisk
        let root = req.route.path.substr(0, req.route.path.length - 1);
        let path = `/wp-json/${req.url.substr(root.length)}`;
        let json = await JSONRetriever.fetch(path);
        if (json.total) {
            res.set({ 'X-WP-Total': json.total });
        }
        res.set({ 'Cache-Control': CACHE_CONTROL });
        res.send(json.text);
    } catch (err) {
        next(err);
    }
}
```

`JSONRetriever.fetch()` ([json-retriever.js](https://github.com/chung-leong/relaks-wordpress-example/blob/master/server/json-retriever.js#L5)) is also relatively simple aside from the error correction code made necessary by certain WordPress plugins' nasty habit of dumping debug messages into the output stream.  

```javascript
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
```

### Purge request Handling

```javascript
async function handlePurgeRequest(req, res) {
    // verify that require is coming from WordPress
    let remoteIP = req.connection.remoteAddress;
    res.end();
    let wordpressIP = await dnsCache.lookupAsync(WORDPRESS_HOST.replace(/^https?:\/\//, ''));
    if (remoteIP !== `::ffff:${wordpressIP}`) {
        return;
    }

    let url = req.url;
    let method = req.headers['x-purge-method'];
    if (method === 'regex' && url === '/.*') {
        pageDependencies = {};
        await NginxCache.purge(/.*/);
        await PageRenderer.prefetch('/');
    } else if (method === 'default') {
        // look for URLs that looks like /wp-json/wp/v2/pages/4/
        let m = /^\/wp\-json\/(\w+\/\w+\/\w+)\/(\d+)\/$/.exec(url);
        if (!m) {
            return;
        }

        // purge matching JSON files
        let folderPath = m[1];
        let pattern = new RegExp(`^/json/${folderPath}.*`);
        await NginxCache.purge(pattern);

        // purge the timestamp so CSR code knows something has changed
        await NginxCache.purge('/.mtime');

        // look for pages that made use of the purged JSONs
        for (let [ path, sourceURLs ] of Object.entries(pageDependencies)) {
            let affected = sourceURLs.some((sourceURL) => {
                return pattern.test(sourceURL);
            });
            if (affected) {
                // purge the cached page
                await NginxCache.purge(path);
                delete pageDependencies[path];

                if (path === '/') {
                    await PageRenderer.prefetch('/');
                }
            }
        }
    }
}
```

### Timestamp handling

```javascript
async function handleTimestampRequest(req, res, next) {
    try {
        let now = new Date;
        let ts = now.toISOString();
        res.set({ 'Cache-Control': CACHE_CONTROL });
        res.type('text').send(ts);
    } catch (err) {
        next(err);
    }
}
```

## Front-end JavaScript

**TODO**

## Cordova deployment

**TODO**

## Final words

**TODO**
