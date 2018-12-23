import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';

import PostList from 'widgets/post-list';

class CategoryPage extends AsyncComponent {
    static displayName = 'CategoryPage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let slug = route.params.slugs[0];
        let props = {
            route,
        };
        meanwhile.show(<CategoryPageSync {...props} />);
        props.category = await wp.fetchOne({ url: '/wp/v2/categories/', slug });
        meanwhile.show(<CategoryPageSync {...props} />);
        props.posts = await wp.fetchList(`/wp/v2/posts/?categories[]=${props.category.id}`);
        return <CategoryPageSync {...props} />;
    }
}

class CategoryPageSync extends PureComponent {
    static displayName = 'CategoryPageSync';

    render() {
        let { route, posts, category } = this.props;
        let title = _.get(category, 'name');
        return (
            <div className="page">
                <h4>
                    <span>Categories > </span>
                    <span>{title}</span>
                </h4>
                <PostList route={route} category={category} posts={posts} />
            </div>
        );
    }
}

export {
    CategoryPage as default,
    CategoryPage,
    CategoryPageSync,
};
