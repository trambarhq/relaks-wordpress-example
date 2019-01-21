let _ = require('lodash');

class Route {
    constructor(routeManager, dataSource) {
        this.routeManager = routeManager;
        this.name = routeManager.name;
        this.params = routeManager.params;
        this.history = routeManager.history;
        this.url = routeManager.url;
        this.dataSource = dataSource;
        this.pageLinkRegExp = null;
        this.imageLinkRegExp = null;
    }

    change(url, options) {
        return this.routeManager.change(url, options);
    }

    find(params) {
        if (params instanceof Array) {
            let slugs = params;
            return this.routeManager.find('page', { slugs });
        } else {
            return this.routeManager.find('page', params);
        }
    }

    async setPageType(params) {
        let slugs = params.slugs;
        if (slugs.length > 0) {
            let slugType1 = await this.getSlugType(slugs[0]);
            if (slugType1 === 'page') {
                params.pageType = 'page';
                params.pageSlug = _.last(slugs);
                params.parentPageSlugs = _.slice(slugs, 0, -1);
            } else if (slugType1 === 'category') {
                if (slugs.length === 1) {
                    params.pageType = 'category';
                    params.categorySlug = slugs[0];
                } else if (slugs.length === 2) {
                    params.pageType = 'post';
                    params.categorySlug = slugs[0];
                    params.postSlug = slugs[1];
                }
            } else if (slugType1 === 'archive') {
                if (slugs.length === 1) {
                    params.pageType = 'archive';
                    params.monthSlug = slugs[0];
                } else if (slugs.length === 2) {
                    let slugType2 = await this.getSlugType(slugs[1]);
                    if (slugType2 === 'category') {
                        params.pageType = 'archive';
                        params.monthSlug = slugs[0];
                        params.categorySlug = slugs[1];
                    } else {
                        params.pageType = 'post';
                        params.monthSlug = slugs[0];
                        params.postSlug = slugs[1];
                    }
                } else if (slugs.length === 3) {
                    params.pageType = 'post';
                    params.monthSlug = slugs[0];
                    params.categorySlug = slugs[1];
                    params.postSlug = slugs[2];
                }
            }
        }
        if (!params.pageType) {
            if (params.search !== undefined) {
                params.pageType = 'search';
            } else {
                params.pageType = 'welcome';
            }
        }
    }

    async getSlugType(slug) {
        let options = { minimum: '100%' };
        let pages = await this.dataSource.fetchList('/wp/v2/pages/?parent=0', options);
        if (_.some(pages, { slug })) {
            return 'page';
        }
        let categories = await this.dataSource.fetchList('/wp/v2/categories/', options);
        if (_.some(categories, { slug })) {
            return 'category';
        }
        if (/^\d{4}\-\d{2}$/.test(slug)) {
            return 'archive';
        }
    }

    async preloadPage(params) {
        try {
            if (params.postSlug) {
                this.dataSource.fetchOne('/wp/v2/posts/', params.postSlug);
            } else if (params.pageSlug) {
                this.dataSource.fetchOne('/wp/v2/pages/', params.pageSlug);
            }
        } catch (err) {
        }
    }

    transformLink = (node) => {
        if (node.type === 'tag' && node.name === 'a') {
            if (this.pageLinkRegExp) {
                let m = this.pageLinkRegExp.exec(node.attribs.href);
                if (m) {
                    let categorySlug = m[1];
                    let postSlug = m[3];
                    node.attribs.href = `/${categorySlug}/${postSlug}/`;
                    delete node.attribs.target;
                    this.preloadPage({ categorySlug, postSlug });
                    return;
                }
            }
            if (this.imageLinkRegExp) {
                let m = this.imageLinkRegExp.exec(node.attribs.href);
                if (m) {
                    if (!node.attribs.target) {
                        node.attribs.target = '_blank';
                    }
                    return;
                }
            }
        }
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
        query: {
            search: '${search}',
        },
        load: (match) => {
            let type = match.params.pageType;
            if (type) {
                match.params.module = require(`pages/${type}-page`);
            }
        }
    },
};

export {
    Route,
    routes,
};
