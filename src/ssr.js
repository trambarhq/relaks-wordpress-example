import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { DataSource } from 'relaks-wordpress-data-source';
import { RouteManager } from 'relaks-route-manager';
import { harvest } from 'relaks-harvest';
import { FrontEnd } from './front-end.jsx';
import { Route, routes } from './routing.js';

const basePath = process.env.BASE_PATH;

async function render(options) {
  const dataSource = new DataSource({
    baseURL: options.host + basePath + 'json',
    fetchFunc: options.fetch,
  });
  dataSource.activate();

  const routeManager = new RouteManager({
    routes,
    basePath,
  });
  routeManager.addEventListener('beforechange', (evt) => {
    const route = new Route(routeManager, dataSource);
    evt.postponeDefault(route.setParameters(evt, false));
  });
  routeManager.activate();
  await routeManager.start(options.path);

  const ssrElement = createElement(FrontEnd, { dataSource, routeManager, ssr: options.target });
  const rootNode = await harvest(ssrElement);
  const html = renderToString(rootNode);
  return html;
}

export {
  render,
  basePath,
};
