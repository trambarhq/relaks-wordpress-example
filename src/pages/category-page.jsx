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
        let props = {
            route,
        };
        meanwhile.show(<CategoryPageSync {...props} />);
        props.categories = await wp.fetchList('/wp/v2/categories/');
        meanwhile.show(<CategoryPageSync {...props} />);
        let category = _.find(props.categories, { slug: categorySlug });
        props.posts = await wp.fetchList(`/wp/v2/posts/?categories=${category.id}`);
        return <CategoryPageSync {...props} />;
    }
}

class CategoryPageSync extends PureComponent {
    static displayName = 'CategoryPageSync';

    render() {
        let { route, posts, categories } = this.props;
        let { categorySlug } = route.params;
        let category = _.find(categories, { slug: categorySlug });
        let categoryLabel = _.get(category, 'name', '');
        let trail = [
            { label: 'Categories' },
            { label: categoryLabel },
        ];
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostList route={route} categories={categories} posts={posts} />
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
