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

**TODO**

## Docker Compose configuration

**TODO**

## Nginx configuration

**TODO**

## Back-end JavaScript

**TODO**

## Front-end JavaScript

**TODO**

## Cordova deployment

**TODO**

## Final words

**TODO**
