import { delay } from 'bluebird';
import { createElement } from 'react';
import { hydrate, render } from 'react-dom';
import { FrontEnd } from 'front-end';
import { Route, routes } from 'routing';
import WordpressDataSource from 'relaks-wordpress-data-source';
import RouteManager from 'relaks-route-manager';
import { harvest } from 'relaks-harvest';
import Relaks, { plant } from 'relaks';

const pageBasePath = '';

if (typeof(window) === 'object') {
    async function initialize(evt) {
        // create data source
        let host = process.env.DATA_HOST || `${location.protocol}//${location.host}`;
        let dataSource = new WordpressDataSource({
            baseURL: `${host}/json`,
        });
        dataSource.activate();

        // create route manager
        let routeManager = new RouteManager({
            routes,
            basePath: pageBasePath,
            preloadingDelay: 2000,
            useHashFallback: (location.host === ''),
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
        let mtimeURL = `${host}/.mtime`;
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
            await delay(10 * 1000);
        }
    }

    window.addEventListener('load', initialize);
} else {
    async function serverSideRender(options) {
        let dataSource = new WordpressDataSource({
            baseURL: `${options.host}/json`,
            fetchFunc: options.fetch,
        });
        dataSource.activate();

        let routeManager = new RouteManager({
            routes,
            basePath: pageBasePath,
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
}
