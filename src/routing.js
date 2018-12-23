let _ = require('lodash');

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

    find(slugs) {
        return this.routeManager.find('page', { slugs });
    }
}

let routes = {
    'page': {
        path: {
            from(path, params) {
                params.slugs = path.split('/').filter(Boolean);
                return true;
            },
            to(params) {
                if (params.slugs instanceof Array) {
                    return `/${params.slugs.join('/')}`;
                } else {
                    return `/`;
                }
            }
        },
        load: (match) => {
            let type = match.params.pageType;
            if (type) {
                match.params.module = require(`pages/${type}-page`);
            }
        }
    },
};

async function setPageType(dataSource, params) {
    let type;
    let slugs = params.slugs;
    if (slugs.length > 0) {
        let rootSlugType = await getSlugType(dataSource, slugs[0]);
        if (rootSlugType === 'page') {
            type = 'page';
        } else if (rootSlugType === 'category') {
            if (slugs.length === 1) {
                type = 'category';
            } else if (slugs.length === 2) {
                type = 'category-post';
            }
        } else if (rootSlugType === 'archive') {
            if (slugs.length === 1 || slugs.length === 2) {
                type = 'archive';
            } else if (slugs.length === 3) {
                type = 'archive-post';
            }
        }
    }
    params.pageType = type || 'welcome';
}

async function getSlugType(dataSource, slug) {
    let options = {}; // { minimum: '100%' };
    let pages = await dataSource.fetchList('/wp/v2/pages/?parent=0', options);
    if (_.some(pages, { slug })) {
        return 'page';
    }
    let categories = await dataSource.fetchList('/wp/v2/categories/', options);
    if (_.some(categories, { slug })) {
        return 'category';
    }
    if (/^\d{4}\-\d{2}$/.test(slug)) {
        return 'archive';
    }
}

export { Route, routes, setPageType };
