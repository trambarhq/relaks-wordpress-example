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
        let props = { route };
        meanwhile.show(<SearchPageSync {...props} />);
        props.posts = await fetchMatchingPosts(search);
        return <SearchPageSync {...props} />;
    }
}

class SearchPageSync extends PureComponent {
    static displayName = 'SearchPageSync';

    render() {
        let { route, posts } = this.props;
        let { search } = route.params;
        let trail = [ { label: 'Search' } ];
        if (posts) {
            let count = posts.total;
            if (typeof(count) === 'number') {
                let s = (count === 1) ? '' : 's';
                let msg = `${count} matching article${s}`;
                trail.push({ label: msg });
            }
        } else {
            trail.push({ label: '...' });
        }
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostList route={route} posts={posts} minimum={40} />
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
