import _ from 'lodash';
import { RelaksRouteManagerError } from 'relaks-route-manager';

class Route {
    constructor(routeManager, dataSource) {
        this.routeManager = routeManager;
        this.name = routeManager.name;
        this.params = routeManager.params;
        this.history = routeManager.history;
        this.url = routeManager.url;
        this.dataSource = dataSource;
    }

    change(url, options) {
        return this.routeManager.change(url, options);
    }

    getRootURL() {
        return this.composeURL({ path: '/' });
    }

    getSearchURL(search) {
        return this.composeURL({ path: '/', query: { s: search } });
    }

    getArchiveURL(date) {
        let { year, month } = date;
        return this.composeURL({ path: `/date/${year}/${_.padStart(month, 2, '0')}/` });
    }

    getObjectURL(object) {
        let { siteURL } = this.params;
        let url = object.link;
        if (!_.startsWith(url, siteURL)) {
            throw new Error(`Object URL does not match site URL`);
        }
        let path = url.substr(siteURL.length);
        return this.composeURL({ path });
    }

    composeURL(urlParts) {
        let context = _.clone(this.routeManager.context);
        this.routeManager.rewrite('to', urlParts, context);
        let url = this.routeManager.compose(urlParts);
        if (this.routeManager.options.useHashFallback) {
            if (url != undefined) {
                url = '#' + url;
            }
        }
        return url;
    }

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

    async getParameters(path, query, fallbackToRoot) {
        // get the site URL and see what the page's URL would be if it
        // were on WordPress itself
        let siteURL = await this.getSiteURL();
        let link = _.trimEnd(siteURL + path, '/');
        let matchLink = (obj) => {
            return _.trimEnd(obj.link, '/') === link;
        };

        // see if it's a search
        let search = query.s;
        if (search) {
            return { pageType: 'search', search, siteURL };
        }

        // see if it's pointing to the root page
        if (path === '/') {
            return { pageType: 'welcome', siteURL };
        }

        // see if it's pointing to an archive
        let date = findDate(path);
        if (date) {
            return { pageType: 'archive', date, siteURL };
        }

        // see if it's pointing to a post by ID
        let postID = findPostID(path);
        if (postID) {
            let post = await this.dataSource.fetchOne('/wp/v2/posts/', postID);
            if (post) {
                return { pageType: 'post', postSlug: post.slug, siteURL };
            }
        }

        // see if it's pointing to a page
        let allPages = await this.dataSource.fetchList('/wp/v2/pages/', { minimum: '100%' });
        let page = _.find(allPages, matchLink);
        if (page) {
            return { pageType: 'page', pageSlug: page.slug, siteURL };
        }

        // see if it's pointing to a category
        let allCategories = await this.dataSource.fetchList('/wp/v2/categories/', { minimum: '100%' });
        let category = _.find(allCategories, matchLink);
        if (category) {
            return { pageType: 'category', categorySlug: category.slug, siteURL };
        }

        // see if it's pointing to a tag
        let allTags = await this.dataSource.fetchList('/wp/v2/tags/', { minimum: '100%' });
        let tag = _.find(allTags, matchLink);
        if (tag) {
            return { pageType: 'tag', tagSlug: tag.slug, siteURL };
        }

        // see if it's pointing to a post
        let postSlug = _.last(_.filter(_.split(path, '/')));
        let post = await this.dataSource.fetchOne('/wp/v2/posts/', postSlug);
        if (post) {
            return { pageType: 'post', postSlug, siteURL };
        }
    }

    async getSiteURL() {
        let site = await this.dataSource.fetchOne('/');
        return _.trimEnd(site.url, '/');
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

    transformNode = (node) => {
        if (node.type === 'tag') {
            let { siteURL } = this.params;
            if (node.name === 'a') {
            } else if (node.name === 'img') {
                // prepend image URL with site URL
                if (node.attribs.src && !_.startsWith(node.attribs.src, /https?:/)) {
                    node.attribs.src = siteURL + node.attribs.src;
                }
            }
        } else if (node.type === 'text') {
            // trim off leading newline characters
            node.data = _.trimStart(node.data, '\r\n');
        }
    }
}

function findDate(path) {
    if (_.startsWith(path, '/date/')) {
        path = path.substr(5);
    }
    let m = /^\/(\d{4})\/(\d+)\/?/.exec(path);
    if (m) {
        return {
            year: parseInt(m[1]),
            month: parseInt(m[2]),
        };
    }
}

function findPostID(path) {
    if (_.startsWith(path, '/archives/')) {
        let id = parseInt(path.substr(10));
        if (id === id) {
            return id;
        }
    }
}

let routes = {
    'page': { path: '*' },
};

export {
    Route,
    routes,
};
