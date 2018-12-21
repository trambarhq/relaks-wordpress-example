class Route {
    constructor(routeManager) {
        this.routeManager = routeManager;
        this.name = routeManager.name;
        this.params = routeManager.params;
        this.history = routeManager.history;
    }

    change(url, options) {
        return this.routeManager.change(url, options);
    }

    find(name, params) {
        return this.routeManager.find(name, params);
    }

    extractID(url) {
        var si = url.lastIndexOf('/');
        var ei;
        if (si === url.length - 1) {
            ei = si;
            si = url.lastIndexOf('/', ei - 1);
        }
        var text = url.substring(si + 1, ei);
        return parseInt(text);
    }
}

let routes = {
    'welcome-page': {
        path: '/',
        load: async (match) => {
            match.params.module = await import('pages/welcome-page' /* webpackChunkName: "welcome" */);
        }
    },
    'category-page': {
        path: '/${category}/',
        params: { category: String },
        load: async (match) => {
            match.params.module = await import('pages/category-page' /* webpackChunkName: "category" */);
        }
    },
    'story-page': {
        path: '/${category}/${slug}/',
        params: { category: String, slug: String },
        load: async (match) => {
            match.params.module = await import('pages/category-story-page' /* webpackChunkName: "category-story" */);
        }
    },
};

export { Route, routes };
