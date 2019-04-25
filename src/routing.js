import _ from 'lodash';
import { Wordpress } from './wordpress';
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
        const { year, month } = date;
        return this.composeURL({ path: `/date/${year}/${_.padStart(month, 2, '0')}/` });
    }

    getObjectURL(object) {
        const { siteURL } = this.params;
        const link = object.link;
        if (!_.startsWith(link, siteURL)) {
            throw new Error(`Object URL does not match site URL`);
        }
        const path = link.substr(siteURL.length);
        return this.composeURL({ path });
    }

    prefetchArchiveURL(date) {
        const url = this.getArchiveURL(date);
        setTimeout(() => { this.loadPageData(url) }, 50);
        return url;
    }

    prefetchObjectURL(object) {
        const url = this.getObjectURL(object);
        setTimeout(() => { this.loadPageData(url) }, 50);
        return url;
    }

    composeURL(urlParts) {
        const context = this.routeManager.context;
        this.routeManager.rewrite('to', urlParts, context);
        const url = this.routeManager.compose(urlParts);
        url = this.routeManager.applyFallback(url);
        return url;
    }

    async setParameters(evt, fallbackToRoot) {
        const params = await this.getParameters(evt.path, evt.query);
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
        const wp = new Wordpress(this.dataSource);
        const site = await wp.fetchSite();
        const siteURL = _.trimEnd(site.url, '/');
        const link = _.trimEnd(siteURL + path, '/');
        const matchLink = (obj) => {
            return _.trimEnd(obj.link, '/') === link;
        };
        const slugs = _.filter(_.split(path, '/'));

        // see if it's a search
        const search = query.s;
        if (search) {
            return { pageType: 'search', search, siteURL };
        }

        // see if it's pointing to the root page
        if (path === '/') {
            return { pageType: 'welcome', siteURL };
        }

        // see if it's pointing to an archive
        if (slugs[0] === 'date' && /^\d+$/.test(slugs[1]) && /^\d+$/.test(slugs[2]) && slugs.length == 3) {
            const date = {
                year: parseInt(slugs[1]),
                month: parseInt(slugs[2]),
            };
            return { pageType: 'archive', date, siteURL };
        } else if (/^\d+$/.test(slugs[0]) && /^\d+$/.test(slugs[1]) && slugs.length == 2) {
            const date = {
                year: parseInt(slugs[0]),
                month: parseInt(slugs[1]),
            };
            return { pageType: 'archive', date, siteURL };
        }

        // see if it's pointing to a post by ID
        if (slugs[0] === 'archives' && /^\d+$/.test(slugs[1])) {
            const postID = parseInt(slugs[1]);
            const post = await wp.fetchPost(postID);
            if (post) {
                return { pageType: 'post', postSlug: post.slug, siteURL };
            }
        }

        // see if it's pointing to a page
        const allPages = await wp.fetchPages();
        const page = _.find(allPages, matchLink);
        if (page) {
            return { pageType: 'page', pageSlug: page.slug, siteURL };
        }

        // see if it's pointing to a category
        const allCategories = await wp.fetchCategories();
        const category = _.find(allCategories, matchLink);
        if (category) {
            return { pageType: 'category', categorySlug: category.slug, siteURL };
        }

        // see if it's pointing to a popular tag
        const topTags = await wp.fetchTopTags();
        const topTag = _.find(topTags, matchLink);
        if (topTag) {
            return { pageType: 'tag', tagSlug: topTag.slug, siteURL };
        }

        // see if it's pointing to a not-so popular tag
        if (slugs[0] === 'tag' && slugs.length === 2) {
            const tag = await wp.fetchTag(slugs[1]);
            if (tag) {
                return { pageType: 'tag', tagSlug: tag.slug, siteURL };
            }
        }

        // see if it's pointing to a post
        const postSlug = _.last(slugs);
        if (/^\d+\-/.test(postSlug)) {
            // delete post ID in front of slug
            postSlug = postSlug.replace(/^\d+\-/, '');
        }
        const post = await wp.fetchPost(postSlug);
        if (post) {
            return { pageType: 'post', postSlug, siteURL };
        }

        // see if it's pointing to a tag when no prefix is used
        const tagSlug = _.last(slugs);
        const tag = await wp.fetchTag(tagSlug);
        if (tag) {
            return { pageType: 'tag', tagSlug: tag.slug, siteURL };
        }
    }

    async loadPageData(url) {
        try {
            const urlParts = this.routeManager.parse(url);
            const context = {};
            this.routeManager.rewrite('from', urlParts, context);
            const params = await this.getParameters(urlParts.path, urlParts.query);
            if (params) {
                const wp = new Wordpress(this.dataSource);
                if (params.postSlug) {
                    await wp.fetchPost(params.postSlug);
                } else if (params.pageSlug) {
                    await wp.fetchPage(params.pageSlug);
                } else if (params.tagSlug) {
                    const tag = await wp.fetchTag(params.tagSlug);
                    await wp.fetchPostsWithTag(tag);
                } else if (params.categorySlug) {
                    const category = await wp.fetchCategory(params.categorySlug);
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
            const { siteURL } = this.params;
            const siteURLInsecure = 'http:' + siteURL.substr(6);
            if (node.name === 'a') {
                const url = _.trim(node.attribs.href);
                const target;
                if (url) {
                    if (!_.startsWith(url, '/')) {
                        if (_.startsWith(url, siteURL)) {
                            url = url.substr(siteURL.length);
                        } else if (_.startsWith(url, siteURLInsecure)) {
                            url = url.substr(siteURLInsecure.length);
                        } else {
                            target = '_blank';
                        }
                    }
                    if (_.startsWith(url, '/wp-content/')) {
                        url = siteURL + url;
                    }
                    if (_.startsWith(url, '/')) {
                        // strip off page number
                        url = url.replace(/\/\d+\/?$/, '');
                        url = this.routeManager.applyFallback(url);
                        this.loadPageData(url);
                    }
                    node.attribs.href = url;
                    node.attribs.target = target;
                }
            } else if (node.name === 'img') {
                // prepend image URL with site URL
                const url = _.trim(node.attribs.src);
                if (url && !/^https?:/.test(url)) {
                    url = siteURL + url;
                    node.attribs.src = url;
                }
            }
        } else if (node.type === 'text') {
            // trim off leading newline characters
            node.data = _.trimStart(node.data, '\r\n');
        }
    }
}

const routes = {
    'page': { path: '*' },
};

export {
    Route,
    routes,
};
