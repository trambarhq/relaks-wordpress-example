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

    async setParameters(evt) {
        let params = await this.getParameters(evt.path, evt.query);
        params.module = require(`pages/${params.pageType}-page`);
        _.assign(evt.params, params);
    }

    async getParameters(path, query) {
        // get the site URL and see what the page's URL would be if it
        // were on WordPress itself
        let siteURL = await this.getSiteURL();
        let link = _.trimEnd(siteURL + path, '/');

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
        let page = _.find(allPages, { link });
        if (page) {
            return { pageType: 'page', pageSlug: page.slug, siteURL };
        }

        // see if it's pointing to a category
        let allCategories = await this.dataSource.fetchList('/wp/v2/categories/', { minimum: '100%' });
        let category = _.find(allCategories, { link });
        if (category) {
            return { pageType: 'category', categorySlug: category.slug, siteURL };
        }

        // see if it's pointing to a tag
        let allTags = await this.dataSource.fetchList('/wp/v2/tags/', { minimum: '100%' });
        let tag = _.find(allTags, { link });
        if (tag) {
            return { pageType: 'tag', tagSlug: tag.slug, siteURL };
        }

        // see if it's pointing to a post
        let postSlug = _.last(_.filter(_.split(path, '/')));
        let post = await this.dataSource.fetchOne('/wp/v2/posts/', postSlug);
        if (post) {
            return { pageType: 'post', postSlug, siteURL };
        }

        // go to the welcome page if we can't find a match
        return { pageType: 'welcome', siteURL };
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
