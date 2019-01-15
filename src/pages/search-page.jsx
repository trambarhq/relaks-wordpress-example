import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

import Breadcrumb from 'widgets/breadcrumb';
import PostList from 'widgets/post-list';

class SearchPage extends AsyncComponent {
    static displayName = 'SearchPage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let { search } = route.params;
        let props = {
            route,
        };
        meanwhile.show(<SearchPageSync {...props} />);
        props.categories = await wp.fetchList('/wp/v2/categories/');
        if (search) {
            let url = `/wp/v2/posts/?search=${encodeURIComponent(search)}'`;
            props.posts = await wp.fetchList(url);
        } else {
            props.posts = null;
        }
        return <SearchPageSync {...props} />;
    }
}

class SearchPageSync extends PureComponent {
    static displayName = 'SearchPageSync';

    render() {
        let { route, categories, posts } = this.props;
        let { search } = route.params;
        let trail = [ { label: 'Search' } ];
        if (posts) {
            let count = posts.total;
            let s = (count === 1) ? '' : 's';
            let msg = `${count} matching article${s}`;
            trail.push({ label: msg });
        } else if (search) {
            trail.push({ label: '...' });
        }
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostList categories={categories} route={route} posts={posts} minimum={40} />
            </div>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    SearchPage.propTypes = {
        wp: PropTypes.instanceOf(WordPress),
        route: PropTypes.instanceOf(Route),
    };
    SearchPageSync.propTypes = {
        categories: PropTypes.arrayOf(PropTypes.object),
        posts: PropTypes.arrayOf(PropTypes.object),
        route: PropTypes.instanceOf(Route),
    };
}

export {
    SearchPage as default,
    SearchPage,
    SearchPageSync,
};
