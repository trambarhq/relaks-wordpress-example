import _ from 'lodash';
import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

import PostView from 'widgets/post-view';

class CategoryPostPage extends AsyncComponent {
    static displayName = 'CategoryPostPage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let [ categorySlug, postSlug ]  = route.params.slugs;
        let props = {};
        meanwhile.show(<CategoryPostPageSync {...props} />);
        props.category = await wp.fetchOne('/wp/v2/categories/', categorySlug);
        meanwhile.show(<CategoryPostPageSync {...props} />);
        props.post = await wp.fetchOne('/wp/v2/posts/', postSlug);
        return <CategoryPostPageSync {...props} />;
    }
}

class CategoryPostPageSync extends PureComponent {
    static displayName = 'CategoryPostPageSync';

    render() {
        let { category, post } = this.props;
        return <PostView category={category} post={post} />;
    }
}

export {
    CategoryPostPage as default,
    CategoryPostPage,
    CategoryPostPageSync,
};
