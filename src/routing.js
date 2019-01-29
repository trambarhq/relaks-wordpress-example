import _ from 'lodash';
import Wordpress from './wordpress';
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
        let link = object.link;
        if (!_.startsWith(link, siteURL)) {
            throw new Error(`Object URL does not match site URL`);
        }
        let path = link.substr(siteURL.length);
        return this.composeURL({ path });
    }

    prefetchObjectURL(object) {
        let url = this.getObjectURL(object);
        this.loadPageData(url);
        return url;
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
        let wp = new Wordpress(this.dataSource);
        let site = await wp.fetchOne('/');
        let siteURL = _.trimEnd(site.url, '/');
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
            let post = await wp.fetchOne('/wp/v2/posts/', postID);
            if (post) {
                return { pageType: 'post', postSlug: post.slug, siteURL };
            }
        }

        // see if it's pointing to a page
        let allPages = await wp.fetchList('/wp/v2/pages/', { minimum: '100%' });
        let page = _.find(allPages, matchLink);
        if (page) {
            return { pageType: 'page', pageSlug: page.slug, siteURL };
        }

        // see if it's pointing to a category
        let allCategories = await wp.fetchList('/wp/v2/categories/', { minimum: '100%' });
        let category = _.find(allCategories, matchLink);
        if (category) {
            return { pageType: 'category', categorySlug: category.slug, siteURL };
        }

        // see if it's pointing to a popular tag
        let topTags = await wp.fetchList('/wp/v2/tags/?orderby=count&order=desc');
        let tag = _.find(topTags, matchLink);
        if (tag) {
            return { pageType: 'tag', tagSlug: tag.slug, siteURL };
        }

        // see if it's pointing to a non-so popular tag
        let slugs = _.filter(_.split(path, '/'));
        if (slugs.length >= 2 && _.includes(slugs, 'tag')) {
            let tagSlug = _.last(slugs);
            let tag = await wp.fetchOne('/wp/v2/tags/', tagSlug);
            return { pageType: 'tag', tagSlug: tag.slug, siteURL };
        }

        // see if it's pointing to a post
        let postSlug = _.last(slugs);
        if (/^\d+\-/.test(postSlug)) {
            // delete post ID in front of slug
            postSlug = postSlug.replace(/^\d+\-/, '');
        }
        let post = await wp.fetchOne('/wp/v2/posts/', postSlug);
        if (post) {
            return { pageType: 'post', postSlug, siteURL };
        }
    }

    async loadPageData(url) {
        try {
            let urlParts = this.routeManager.parse(url);
            let params = await this.getParameters(urlParts.path, urlParts.query);
            if (params) {
                let wp = new Wordpress(this.dataSource);
                if (params.postSlug) {
                    await wp.fetchOne('/wp/v2/posts/', params.postSlug);
                } else if (params.pageSlug) {
                    await wp.fetchOne('/wp/v2/pages/', params.pageSlug);
                } else if (params.tagSlug) {
                    let tag = await wp.fetchOne('/wp/v2/tags/', params.tagSlug);
                    await wp.fetchList(`/wp/v2/posts/?tags=${tag.id}`);
                } else if (params.categorySlug) {
                    let category = await wp.fetchOne('/wp/v2/categories/', params.categorySlug);
                    await wp.fetchList(`/wp/v2/posts/?categories=${category.id}`);
                }
            }
        } catch (err) {
            console.log(err);
        }
    }

    transformNode = (node) => {
        if (node.type === 'tag') {
            let { siteURL } = this.params;
            let siteURLInsecure = 'http:' + siteURL.substr(6);
            if (node.name === 'a') {
                if (node.attribs.href) {
                    if (!_.startsWith(node.attribs.href, '/')) {
                        if (_.startsWith(node.attribs.href, siteURL)) {
                            node.attribs.href = node.attribs.href.substr(siteURL.length);
                            delete node.attribs.target;
                        } else if (_.startsWith(node.attribs.href, siteURLInsecure)) {
                            node.attribs.href = node.attribs.href.substr(siteURLInsecure.length);
                            delete node.attribs.target;
                        } else {
                            node.attribs.target = '_blank';
                        }
                    }
                    if (_.startsWith(node.attribs.href, '/')) {
                        // strip off page number
                        node.attribs.href = node.attribs.href.replace(/\/\d+\/?$/, '');
                        this.loadPageData(node.attribs.href);
                    }
                }
            } else if (node.name === 'img') {
                // prepend image URL with site URL
                if (node.attribs.src && !/^https?:/.test(node.attribs.src)) {
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
