import _ from 'lodash';
import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

import Breadcrumb from 'widgets/breadcrumb';
import PostList from 'widgets/post-list';

class CategoryPage extends AsyncComponent {
    static displayName = 'CategoryPage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let { categorySlugs } = route.params;
        let props = {
            route,
        };
        meanwhile.show(<CategoryPageSync {...props} />);
        props.categories = await wp.fetchMultiple('/wp/v2/categories/', categorySlugs);
        meanwhile.show(<CategoryPageSync {...props} />);
        let category = _.last(props.categories);
        props.posts = await wp.fetchList(`/wp/v2/posts/?categories=${category.id}`);
        return <CategoryPageSync {...props} />;
    }
}

class CategoryPageSync extends PureComponent {
    static displayName = 'CategoryPageSync';

    render() {
        let { route, posts, categories } = this.props;
        let trail = [ { label: 'Categories' } ];
        let category = _.last(categories);
        for (let c of categories) {
            let label = _.get(c, 'name', '');
            if (c !== category) {
                let url = route.getObjectURL(c);
                trail.push({ label, url });
            } else {
                trail.push({ label });
            }
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

    CategoryPage.propTypes = {
        wp: PropTypes.instanceOf(WordPress),
        route: PropTypes.instanceOf(Route),
    };
    CategoryPageSync.propTypes = {
        category: PropTypes.object,
        posts: PropTypes.arrayOf(PropTypes.object),
        route: PropTypes.instanceOf(Route),
    };
}

export {
    CategoryPage as default,
    CategoryPage,
    CategoryPageSync,
};
