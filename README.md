Zero-latency WordPress Front-end
================================
In this example, we're going to build a zero-latency front-end for WordPress. When a visitor clicks on a link, a story will instantly appear. No hourglass. No spinner. No blank page. We'll accomplish this by aggressively prefetching data in our client-side code. At the same time, we're going to employ server-side rendering (SSR) to minimize time to first impression. The page should appear within a fraction of a second after the visitor enters the URL.

Combined with aggressive back-end caching, we'll end up with a web site that feels very fast and is cheap to host.

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

All three are hosted on the same AWS [A1 medium instance](https://aws.amazon.com/ec2/instance-types/a1/). It's powered by a single core of a [Graviton CPU](https://www.phoronix.com/scan.php?page=article&item=ec2-graviton-performance&num=1) and backed by 2G of RAM. In terms of computational resources, we have roughly one fourth that of a phone. Not much. For our system though, it's more than enough. Most requests will result in cache hits. Nginx will spend most of its time sending data already in memory. We'll be IO-bound long before we're CPU-bound.

[pfj.trambar.io](https://pfj.trambar.io) obtains its data from a test WordPress instance running on the same server. It's populated with random lorem ipsum text. You can log into the [WordPress admin page](https://pfj.trambar.io/wp-admin/) and post a article using the account `bdickus` (password: `incontinentia`). Publication of a new article will trigger a cache purge. The article should appear in the front page automatically after 30 seconds or so (no need to hit refresh button).

You can see a list of what's in the Nginx cache [here](https://pfj.trambar.io/.cache).

[et.trambar.io](https://et.trambar.io) and [rwt.trambar.io](https://rwt.trambar.io) obtain their data from [ExtremeTech](https://www.extremetech.com/) and [Real World Tech](https://www.realworldtech.com/) respectively. They are meant to give you a better sense of how the example code fares with real-world contents. Both sites have close to two decades' worth of articles. Our server does not receive cache purge commands from these WordPress instances so the contents could be out of date. Cache misses will also lead to slightly longer pauses.

## Server-side rendering

Isomorphic React components are capable of rendering on a web server as well as in a web browser. One primary purpose of server-side rendering (SSR) is search engine optimization. Another is to mask JavaScript loading time. Rather than displaying a spinner or progress bar, we render the front-end on the server and send the HTML to the browser. Effectively, we're using the front-end's own appearance as its loading screen.

The following animation depicts how an SSR-augmented single-page web-site works. Click on it if you wish to view it as separate images.

[![Server-side rendering](docs/img/ssr.gif)](docs/ssr.md)

While the SSR HTML is not backed by JavaScript, it does have functional hyperlinks. If the visitor clicks on a link before the JavaScript bundle is done loading, he'll end up at another SSR page. As the server has immediate access to both code and data, it can generate this page very quickly. It's also possible that the page exists already in the server-side cache, in which case it'll be sent even sooner.

## Back-end services

Our back-end consists of three services: WordPress itself, Nginx, and Node.js. The following diagram shows how contents of various types move between them:

![Back-end services](docs/img/services.png)

Note how Nginx does not fetch JSON data directly from WordPress. Instead, data goes through Node first. This detour is due mainly to WordPress not attaching [e-tags](https://en.wikipedia.org/wiki/HTTP_ETag) to JSON responses. Without e-tags the browser cannot perform cache validation (i.e. conditional request ￫ 304 not modified). Passing the data through Node also gives us a chance to strip out unnecessary fields. Finally, it lets us compress the data prior to sending it to Nginx. Size reduction means more contents will fit in the cache. It also saves Nginx from having to gzip the same data over and over again.

Node will request JSON data from Nginx when it runs the front-end code. If the data isn't found in the cache, Node will end up serving its own request. This round-trip will result in Nginx caching the JSON data. We want that to happen since the browser will soon be requesting the same data (since it'll be running the same front-end code).

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

In a command-line prompt, run `npm install` or `npm ci`. Once all libraries have been downloaded, run `npm run start-server`. Docker will proceed to download four official images from Docker Hub: [WordPress](https://hub.docker.com/_/wordpress/), [MariaDB](https://hub.docker.com/_/mariadb), [Nginx](https://hub.docker.com/_/nginx), and [Node.js](https://hub.docker.com/_/node/).

Once the services are up and running, go to `http://localhost:8000/wp-admin/`. You should be greeted by WordPress's installation page. Enter some information about your test site and create the admin account. Log in and go to **Settings** > **Permalinks**. Choose one of the URL schemas.

Next, go to **Plugins** > **Add New**. Search for `Proxy Cache Purge`. Install and activate the plugin. A new **Proxy Cache** item will appear in the side navigation bar. Click on it. At the bottom of the page, set the **Custom IP** to 172.129.0.3. This is the address of our Node.js service.

In a different browser tab, go to `http://localhost:8000/`. You should see the front page with just a sample post:

![Welcome page](docs/img/front-page-initial.png)

Now return to the WordPress admin page and publish another test post. After 30 seconds or so, the post should automatically appear in the front page:

![Welcome page](docs/img/front-page-new-story.png)

To see the code running in debug mode, run `npm run watch`. The client-side code will be rebuilt whenever changes occurs.

To populate your test site with dummy data, install the [FakerPress plugin](https://wordpress.org/plugins/fakerpress/).

To shut down the test server, run `npm run stop-server`. To remove Docker volumes used by the example, run `npm run remove-server`.

If you have a production web site running WordPress, you can see how its contents look in the example front-end (provided that the REST interface is exposed and permalinks are enabled). Open `docker-compose-remote.yml` and change the environment variable `WORDPRESS_HOST` to the address of the site. Then run `npm run start-server-remote`.

## Nginx configuration

Let us look at the [Nginx configuration file](https://github.com/trambarhq/relaks-wordpress-example/blob/master/server/nginx/default.conf). The first two lines tell Nginx where to place cached responses, how large the cache should be (1 GB), and for how long to keep inactive entries (7 days):

```
proxy_cache_path /var/cache/nginx/data keys_zone=data:10m max_size=1g inactive=7d;
proxy_temp_path /var/cache/nginx/tmp;
```

[`proxy_cache_path`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_path) is specified without `levels` so that files are stored in a flat directory structure. This makes it easier to scan the cache. [`proxy_temp_path`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_temp_path) is set to a location on the same volume as the cache so Nginx can move files into it with a rename operation.

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
    proxy_ignore_headers Vary;

    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Expose-Headers X-WP-Total;
    add_header X-Cache-Date $upstream_http_date;
    add_header X-Cache-Status $upstream_cache_status;
}
```

We select the cache zone we defined earlier with the [`proxy_cache`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache) directive. We set the cache key using [`proxy_cache_key`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_key). The MD5 hash of the path plus the query string will be the name used to save each cached server response. With the [`proxy_cache_min_uses`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_min_uses) directive we tell Nginx to start caching on the very first request. With the [`proxy_cache_valid`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_valid) directive we ask Nginx to cache error responses for one minute.

The [`proxy_ignore_headers`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_ignore_headers) directive is there to keep Nginx from creating separate cache entries when requests to the same URL have different `Accept-Encoding` headers (additional compression methods, for example).

The first two headers added using [add_header](http://nginx.org/en/docs/http/ngx_http_headers_module.html#add_header) are there to enable [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). The last two `X-Cache-*` headers are for debugging purpose. They let us figure out whether a request has resulted in a cache hit when we examine it using the browser's development tools:

![Chrome Dev Tools](docs/img/dev-tool-x-cache.png)

## Back-end JavaScript

* [HTML page generation](#html-page-generation)
* [JSON data retrieval](#json-data-retrieval)
* [Purge request handling](#purge-request-handling)
* [Timestamp handling](#timestamp-handling)

### HTML page generation

The following Express handler ([index.js](https://github.com/trambarhq/relaks-wordpress-example/blob/master/server/index.js#L101)) is invoked when Nginx asks for an HTML page. This should happen infrequently as page navigation is handled client-side. Most visitors will enter the site through the root page and that's inevitably cached.

The handler detects whether the remote agent is a search-engine spider and handle the request accordingly.

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

`PageRenderer.generate()` ([page-renderer.js](https://github.com/trambarhq/relaks-wordpress-example/blob/master/server/page-renderer.js#L12)) uses our isomorphic React code to generate the page. Since the fetch API doesn't exist on Node.js, we need to supply a compatible function to the data source. We use this opportunity to capture the list of URLs that the front-end accesses. Later, we'll use this list to determine whether a cached page has become out-of-date.

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

`FrontEnd.render()` returns a ReactElement containing plain HTML child elements. We use [React DOM Server](https://reactjs.org/docs/react-dom-server.html#rendertostring) to convert that to actual HTML text. Then we stick it into our [HTML template](https://github.com/trambarhq/relaks-wordpress-example/blob/master/src/index.html), where a HTML comment sits inside the element that would host the root React component.

`FrontEnd.render()` is a function exported by our front-end's [bootstrap code](https://github.com/trambarhq/relaks-wordpress-example/blob/master/src/main.js#L67):

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

The code initiates the data source and the route manager. Using these as props, it creates the root React element `<FrontEnd />`. The function `harvest()` (from [relaks-harvest](https://github.com/trambarhq/relaks-harvest)) then recursively renders the component tree until all we have are plain HTML elements:

![Component tree conversion](docs/img/harvest.png)

Our front-end is built with the help of [Relaks](https://github.com/trambarhq/relaks), a library that let us make asynchronous calls within a React component's render method. Data retrievals are done as part of the rendering cycle. This model makes SSR very straight forward. To render a page, we just call the render methods of all its components and wait for them to finish.

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

`JSONRetriever.fetch()` ([json-retriever.js](https://github.com/trambarhq/relaks-wordpress-example/blob/master/server/json-retriever.js#L5)) downloads JSON data from WordPress and performs error correction to deal with rogue plugins:

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

Fields that aren't needed are stripped out before the JSON object is stringified again.

### Purge request Handling

The [Proxy Cache Purge](https://wordpress.org/plugins/varnish-http-purge/) sends out `PURGE` requests whenever a new article is published on WordPress. We configured our system so that Node would receive these requests. Before we carry out the purge, we check if the request really is from WordPress. It may give us either an URL or a wildcard expression. We watch for two specific scenarios: when the plugin wants to purge the whole cache and when it wants to purge a single JSON object. In the latter case, we proceed to purge all queries that might be affected.

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

For example, when we receive `PURGE /wp-json/wp/v2/posts/100/`, we perform a purge of `/json/wp/v2/posts.*`. The approach is pretty conservative. Entries will often get purged when there's no need. This isn't terrible since the data can be reloaded fairly quickly. Since e-tags are based on contents, when no change has actually occurred we would end up with the same e-tag. Nginx will still send `304 not modified` to the browser despite a back-end cache miss.

After purging JSON data, we purge the `/.mtime` timestamp file. This act as a signal to the browser that it's time to rerun data queries.

Then we purge HTML files generated earlier that made use of the purged data. Recall how in `handlePageRequest()` we had saved the list of source URLs.

Only Nginx Plus (i.e. paid version of Nginx) supports cache purging. `NginxCache.purge()` ([nginx-cache.js](https://github.com/trambarhq/relaks-wordpress-example/blob/master/server/nginx-cache.js#L7)) is basically a workaround for that fact. The code is not terribly efficient but does the job. Hopefully cache purging will be available in the free version of Nginx in the future.

### Timestamp handling

The handle for timestamp requests is extremely simple:

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

* [DOM hydration](#dom-hydration)
* [Routing](#routing)
* [WelcomePage](#welcomepage)
* [PostList](#postlist)

### DOM hydration

The following function ([main.js](https://github.com/trambarhq/relaks-wordpress-example/blob/master/src/main.js#L12)) is responsible for bootstrapping the front-end:

```javascript
async function initialize(evt) {
    // create data source
    let host = process.env.DATA_HOST || `${location.protocol}//${location.host}`;
    let basePath = process.env.BASE_PATH;
    let dataSource = new WordpressDataSource({
        baseURL: host + basePath + 'json',
    });
    dataSource.activate();

    // create route manager
    let routeManager = new RouteManager({
        routes,
        basePath,
        useHashFallback: (location.protocol !== 'http:' && location.protocol !== 'https:'),
    });
    routeManager.addEventListener('beforechange', (evt) => {
        let route = new Route(routeManager, dataSource);
        evt.postponeDefault(route.setParameters(evt, true));
    });
    routeManager.activate();
    await routeManager.start();

    let container = document.getElementById('react-container');
    if (!process.env.DATA_HOST) {
        // there is SSR support when we're fetching data from the same host
        // as the HTML page
        let ssrElement = createElement(FrontEnd, { dataSource, routeManager, ssr: 'hydrate' });
        let seeds = await harvest(ssrElement, { seeds: true });
        plant(seeds);
        hydrate(ssrElement, container);
    }
    let csrElement = createElement(FrontEnd, { dataSource, routeManager });
    render(csrElement, container);

    // check for changes periodically
    let mtimeURL = host + basePath + '.mtime';
    let mtimeLast;
    for (;;) {
        try {
            let res = await fetch(mtimeURL);
            let mtime = await res.text();
            if (mtime !== mtimeLast) {
                if (mtimeLast) {
                    dataSource.invalidate();
                }
                mtimeLast = mtime;
            }
        } catch (err) {
        }
        await delay(30 * 1000);
    }
}
```

The code creates the data source and the route manager. When SSR is employed, we ["hydrate"](https://reactjs.org/docs/react-dom.html#hydrate) DOM elements that are already in the page. We first perform the same sequence of actions that was done on the server. Doing so pulls in data that will be needed for CSR later (while the visitor is still looking at the SSR HTML). Passing `{ seeds: true }` to `harvest()` tells it to return the contents of asynchronous Relaks components in a list. These "seeds" are then planted into Relaks, so that asynchronous components can return their initial appearances synchronously. Without this step, the small delays required by asynchronous rendering would lead to mismatches during the hydration process.

Once the DOM is hydrated, we complete the transition to CSR by rendering a second `<FrontEnd />` element, this time without the prop `ssr`.

Then we enter an endless loop that polls the server for content update every 30 seconds.

### Routing

We want our front-end to handle WordPress permalinks correctly. This makes page routing somewhat tricky since we cannot rely on simple pattern matching. The URL `/hello-world/` could potentially point to either a page, a post, or a list of posts with a given tag. It all depends on slug assignment. We always need information from the server in order to find the right route.

[`relaks-route-manager`](https://github.com/trambarhq/relaks-route-manager) was not designed with this usage scenario in mind. It does provide a mean, however, to perform asynchronous operations prior to a route change. When it emits a `beforechange` event, we can call `evt.postponeDefault()` to defer the default action (permitting the change) until a promise fulfills:

```javascript
routeManager.addEventListener('beforechange', (evt) => {
    let route = new Route(routeManager, dataSource);
    evt.postponeDefault(route.setParameters(evt, true));
});
```

`route.setParameters()` ([routing.js](https://github.com/trambarhq/relaks-wordpress-example/blob/master/src/routing.js#L62)) basically displaces the default parameter extraction mechanism. Our routing table is reduced to the following:

```javascript
let routes = {
    'page': { path: '*' },
};
```

Which simply matches any URL.

`route.setParameters()` itself calls `route.getParameters()` to obtain the parameters:

```javascript
async setParameters(evt, fallbackToRoot) {
    let params = await this.getParameters(evt.path, evt.query);
    if (params) {
        params.module = require(`pages/${params.pageType}-page`);
        _.assign(evt.params, params);
    } else {
        if (fallbackToRoot) {
            await this.routeManager.change('/');
            return false;
        } else {
            throw new RelaksRouteManagerError(404, 'Route not found');
        }
    }
}
```

The key parameter is `pageType`, which is used to load one of the [page components](https://github.com/trambarhq/relaks-wordpress-example/tree/master/src/pages).

As a glance `route.getParameters()` ([routing.js](https://github.com/trambarhq/relaks-wordpress-example/blob/master/src/routing.js#L77)) might seem  incredibly inefficient. To see if a URL points to a page, it fetches all pages and see if one of them has that URL:

```javascript
let allPages = await wp.fetchPages();
let page = _.find(allPages, matchLink);
if (page) {
   return { pageType: 'page', pageSlug: page.slug, siteURL };
}
```

It does the same check on categories:

```javascript
let allCategories = await wp.fetchCategories();
let category = _.find(allCategories, matchLink);
if (category) {
    return { pageType: 'category', categorySlug: category.slug, siteURL };
}
```

Most of the time, the data in question would be cached already. The top nav loads the pages, while the side nav loads the categories (and also top tags). Resolving the route wouldn't require actual data transfer. On cold start the process would be somewhat slow. Our SSR mechanism would mask this delay, however. A visitor wouldn't find it too noticeable. Of course, since we have all pages at hand, a page will pop up instantly when the visitor clicks on the nav bar.

`route.getObjectURL()` ([routing.js](https://github.com/trambarhq/relaks-wordpress-example/blob/master/src/routing.js#L32)) is used to obtain the URL to an object (post, page, category, etc.). The method just remove the site URL from the object's WP permalink:

```javascript
getObjectURL(object) {
    let { siteURL } = this.params;
    let link = object.link;
    if (!_.startsWith(link, siteURL)) {
        throw new Error(`Object URL does not match site URL`);
    }
    let path = link.substr(siteURL.length);
    return this.composeURL({ path });
}
```

In order to link to a post, we must download the post beforehand. Clicking on an article will nearly always bring it up instantly.

For links to categories and tags, we perform explicit prefetching:

```javascript
prefetchObjectURL(object) {
    let url = this.getObjectURL(object);
    setTimeout(() => { this.loadPageData(url) }, 50);
    return url;
}
```

The first ten posts are always fetched so the visitor sees something immediately after clicking.

### WelcomePage

`WelcomePage` [welcome-page.jsx](https://github.com/trambarhq/relaks-wordpress-example/blob/master/src/pages/welcome-page.jsx) is an asynchronous component. Its `renderAsync()` method fetches a list of posts and passes them to `WelcomePageSync` for actual rendering of the user interface:

```javascript
async renderAsync(meanwhile) {
    let { wp, route } = this.props;
    let props = { route };
    meanwhile.show(<WelcomePageSync {...props} />)
    props.posts = await wp.fetchPosts();
    meanwhile.show(<WelcomePageSync {...props} />)
    props.medias = await wp.fetchFeaturedMedias(props.posts, 10);
    return <WelcomePageSync {...props} />;
}
```

`WelcomePageSync`, meanwhile, delegate the task of rendering the list of posts to `PostList`:

```javascript
render() {
    let { route, posts, medias } = this.props;
    return (
        <div className="page">
            <PostList route={route} posts={posts} medias={medias} minimum={40} />
        </div>
    );
}
```

### PostList

The render method of `PostList` [post-list.jsx](https://github.com/trambarhq/relaks-wordpress-example/blob/master/src/widgets/post-list.jsx) doesn't do anything special:

```javascript
render() {
    let { route, posts, medias } = this.props;
    if (!posts) {
        return null;
    }
    return (
        <div className="posts">
        {
            posts.map((post) => {
                let media = _.find(medias, { id: post.featured_media });
                return <PostListView route={route} post={post} media={media} key={post.id} />
            })
        }
        </div>
    );
}
```

The only thing noteworthy about the component is that it perform data load on scroll:

```javascript
handleScroll = (evt) => {
    let { posts, maximum } = this.props;
    let { scrollTop, scrollHeight } = document.body.parentNode;
    if (scrollTop > scrollHeight * 0.5) {
        if (posts && posts.length < maximum) {
            posts.more();
        }
    }
}
```

## Cordova deployment

This is a bonus section. It shows how you can create a cheapskate mobile app with the help of [Cordova](https://cordova.apache.org/). To get started, first install [Android Studio](https://developer.android.com/studio/install) or [Xcode](https://developer.apple.com/xcode/). Then run `npm install -g cordova-cli` in the command line. Afterward, go to `relaks-wordpress-example/cordova/sample-app` and run `cordova prepare android` or `cordova prepare ios`. Open the newly created project in Android Studio or Xcode. You'll find it in `relaks-wordpress-example/cordova/sample-app/platforms/[android|ios]`. If nothing has gone amiss, you should be able to deploy the example to an attached phone. Cordova is a notoriously brittle platform, however. Your mileage may vary.

The Cordova code in the repo retrieves data from `https://et.trambar.io`. To change the location, set the environment variable `CORDOVA_DATA_HOST` to the desired address and run `npm run build`.

## Final words

I hope this example lend you some new inspirations. While WordPress is old software, with a bit of clever coding we can greatly enhance the end-user experience. Our demo system feels fast on initial load. It feels fast during subsequent navigation. More importantly perhaps, the system is cheap to operate.

The concepts demonstrated here aren't specific to WordPress. Server-side rendering (SSR) in particular is a very useful technique for any single-page web app. It lets us festoon our project with JavaScript libraries without having to worry too much about the negative impact on load time. For instance, no effort was made to optimize the example code. And as you can see in the [WebPart build report](http://pfj.trambar.io/report.html), our front-end takes up a whopping 850KB (242KB gzipped). Yet thanks to SSR, the garbage has no discernible impact.
