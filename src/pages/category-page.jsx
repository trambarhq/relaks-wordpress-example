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
        let { categorySlug } = route.params;
        let props = { route };
        meanwhile.show(<CategoryPageSync {...props} />);
        props.category = await wp.fetchCategory(categorySlug);
        props.parentCategories = await wp.fetchParentCategories(props.category);
        meanwhile.show(<CategoryPageSync {...props} />);
        props.posts = await wp.fetchPostsInCategory(props.category);
        return <CategoryPageSync {...props} />;
    }
}

class CategoryPageSync extends PureComponent {
    static displayName = 'CategoryPageSync';

    render() {
        let { route, posts, category, parentCategories } = this.props;
        let trail = [ { label: 'Categories' } ];
        let categoryLabel = _.get(category, 'name', '');
        if (parentCategories) {
            for (let parentCategory of parentCategories) {
                let label = _.get(parentCategory, 'name', '');
                let url = route.prefetchObjectURL(parentCategory);
                trail.push({ label, url });
            }
            trail.push({ label: categoryLabel });
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
        parentCategories: PropTypes.arrayOf(PropTypes.object),
        posts: PropTypes.arrayOf(PropTypes.object),
        route: PropTypes.instanceOf(Route),
    };
}

export {
    CategoryPage as default,
    CategoryPage,
    CategoryPageSync,
};
