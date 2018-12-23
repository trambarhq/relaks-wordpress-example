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
    'welcome': {
        path: '/',
        load: async (match) => {
            match.params.module = await import('pages/welcome-page' /* webpackChunkName: "welcome" */);
        }
    },
    'welcome-post': {
        path: '/posts/${post}',
        params: { post: String },
        load: async (match) => {
            match.params.module = await import('pages/welcome-post-page' /* webpackChunkName: "welcome-post" */);
        }
    },
    'page': {
        path: '/pages/${page}',
        params: { page: String },
        load: async (match) => {
            match.params.module = await import('pages/page-page' /* webpackChunkName: "page" */);
        }
    },
    'category': {
        path: '/categories/${category}',
        params: { category: String },
        load: async (match) => {
            match.params.module = await import('pages/category-page' /* webpackChunkName: "category" */);
        }
    },
    'category-post': {
        path: '/categories/${category}/${post}',
        params: { category: String, post: String },
        load: async (match) => {
            match.params.module = await import('pages/category-post-page' /* webpackChunkName: "category-post" */);
        }
    },
    'archive': {
        path: '/archive/${month}',
        params: { month: String },
        load: async (match) => {
            match.params.module = await import('pages/archive-page' /* webpackChunkName: "archive" */);
        }
    },
    'archive-post': {
        path: '/archive/${month}/${post}',
        params: { month: String, post: String },
        load: async (match) => {
            match.params.module = await import('pages/archive-page' /* webpackChunkName: "archive-post" */);
        }
    },
};

export { Route, routes };
