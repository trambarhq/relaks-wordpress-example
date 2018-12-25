import { createElement } from 'react';
import { hydrate, render } from 'react-dom';
import { FrontEnd } from 'front-end';
import { routes, setPageType } from 'routing';
import WordpressDataSource from 'wordpress-data-source';
import RouteManager from 'relaks-route-manager';
import { harvest } from 'relaks-harvest';
import Relaks from 'relaks';

const pageBasePath = '';

if (typeof(window) === 'object') {
    async function initialize(evt) {
        // create data source
        let host = `${location.protocol}//${location.host}`;
        if (process.env.NODE_ENV !== 'production' && process.env.WEBPACK_DEV_SERVER) {
            // use hardcoded URL when we're running in dev-server
            host = 'http://192.168.0.56:8000';
        }
        let dataSource = new WordpressDataSource({
            baseURL: `${host}/wp-json`,
        });
        dataSource.activate();

        // create route manager
        let routeManager = new RouteManager({
            routes,
            basePath: pageBasePath,
            preloadingDelay: 2000,
        });
        routeManager.addEventListener('beforechange', (evt) => {
            evt.postponeDefault(setPageType(dataSource, evt.params));
        });
        routeManager.activate();
        await routeManager.start();

        let appContainer = document.getElementById('app-container');
        if (!appContainer) {
            throw new Error('Unable to find app element in DOM');
        }
        // expect SSR unless we're running in dev-server
        if (!(process.env.NODE_ENV !== 'production' && process.env.WEBPACK_DEV_SERVER)) {
            let ssrElement = createElement(FrontEnd, { dataSource, routeManager, ssr: 'hydrate' });
            let seeds = await harvest(ssrElement, { seeds: true });
            Relaks.set('seeds', seeds);
            hydrate(ssrElement, appContainer);
        }

        let appElement = createElement(FrontEnd, { dataSource, routeManager });
        render(appElement, appContainer);
    }

    window.addEventListener('load', initialize);
} else {
    async function serverSideRender(options) {
        let dataSource = new WordpressDataSource({
            baseURL: `${options.host}/wp-json`,
            fetchFunc: options.fetch,
        });
        dataSource.activate();

        let routeManager = new RouteManager({
            routes,
            basePath: pageBasePath,
        });
        routeManager.activate();
        await routeManager.start(options.path);

        let ssrElement = createElement(FrontEnd, { dataSource, routeManager, ssr: options.target });
        return harvest(ssrElement);
    }

    exports.render = serverSideRender;
}
