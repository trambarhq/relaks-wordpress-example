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

    prefetchArchiveURL(date) {
        let url = this.getArchiveURL(date);
        setTimeout(() => { this.loadPageData(url) }, 50);
        return url;
    }

    prefetchObjectURL(object) {
        let url = this.getObjectURL(object);
        setTimeout(() => { this.loadPageData(url) }, 50);
        return url;
    }

    composeURL(urlParts) {
        let context = this.routeManager.context;
        this.routeManager.rewrite('to', urlParts, context);
        let url = this.routeManager.compose(urlParts);
        url = this.routeManager.applyFallback(url);
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
        let site = await wp.fetchSite();
        let siteURL = _.trimEnd(site.url, '/');
        let link = _.trimEnd(siteURL + path, '/');
        let matchLink = (obj) => {
            return _.trimEnd(obj.link, '/') === link;
        };
        let slugs = _.filter(_.split(path, '/'));

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
        if (slugs[0] === 'date' && /^\d+$/.test(slugs[1]) && /^\d+$/.test(slugs[2]) && slugs.length == 3) {
            let date = {
                year: parseInt(slugs[1]),
                month: parseInt(slugs[2]),
            };
            return { pageType: 'archive', date, siteURL };
        } else if (/^\d+$/.test(slugs[0]) && /^\d+$/.test(slugs[1]) && slugs.length == 2) {
            let date = {
                year: parseInt(slugs[0]),
                month: parseInt(slugs[1]),
            };
            return { pageType: 'archive', date, siteURL };
        }

        // see if it's pointing to a post by ID
        if (slugs[0] === 'archives' && /^\d+$/.test(slugs[1])) {
            let postID = parseInt(slugs[1]);
            let post = await wp.fetchPost(postID);
            if (post) {
                return { pageType: 'post', postSlug: post.slug, siteURL };
            }
        }

        // see if it's pointing to a page
        let allPages = await wp.fetchPages();
        let page = _.find(allPages, matchLink);
        if (page) {
            return { pageType: 'page', pageSlug: page.slug, siteURL };
        }

        // see if it's pointing to a category
        let allCategories = await wp.fetchCategories();
        let category = _.find(allCategories, matchLink);
        if (category) {
            return { pageType: 'category', categorySlug: category.slug, siteURL };
        }

        // see if it's pointing to a popular tag
        let topTags = await wp.fetchTopTags();
        let topTag = _.find(topTags, matchLink);
        if (topTag) {
            return { pageType: 'tag', tagSlug: topTag.slug, siteURL };
        }

        // see if it's pointing to a not-so popular tag
        if (slugs[0] === 'tag' && slugs.length === 2) {
            let tag = await wp.fetchTag(slugs[1]);
            if (tag) {
                return { pageType: 'tag', tagSlug: tag.slug, siteURL };
            }
        }

        // see if it's pointing to a post
        let postSlug = _.last(slugs);
        if (/^\d+\-/.test(postSlug)) {
            // delete post ID in front of slug
            postSlug = postSlug.replace(/^\d+\-/, '');
        }
        let post = await wp.fetchPost(postSlug);
        if (post) {
            return { pageType: 'post', postSlug, siteURL };
        }

        // see if it's pointing to a tag when no prefix is used
        let tagSlug = _.last(slugs);
        let tag = await wp.fetchTag(tagSlug);
        if (tag) {
            return { pageType: 'tag', tagSlug: tag.slug, siteURL };
        }
    }

    async loadPageData(url) {
        try {
            let urlParts = this.routeManager.parse(url);
            let context = {};
            this.routeManager.rewrite('from', urlParts, context);
            let params = await this.getParameters(urlParts.path, urlParts.query);
            if (params) {
                let wp = new Wordpress(this.dataSource);
                if (params.postSlug) {
                    await wp.fetchPost(params.postSlug);
                } else if (params.pageSlug) {
                    await wp.fetchPage(params.pageSlug);
                } else if (params.tagSlug) {
                    let tag = await wp.fetchTag(params.tagSlug);
                    await wp.fetchPostsWithTag(tag);
                } else if (params.categorySlug) {
                    let category = await wp.fetchCategory(params.categorySlug);
                    await wp.fetchPostsInCategory(category);
                } else if (params.date) {
                    await wp.fetchPostsInMonth(params.date);
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
                node.attribs.href = _.trim(node.attribs.href);
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
                    if (_.startsWith(node.attribs.href, '/wp-content/')) {
                        node.attribs.href = siteURL + node.attribs.href;
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

let routes = {
    'page': { path: '*' },
};

export {
    Route,
    routes,
};
