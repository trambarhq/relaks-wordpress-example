import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';

import PostList from 'widgets/post-list';

class WelcomePage extends AsyncComponent {
    static displayName = 'WelcomePage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let slug = route.params.category;
        let props = {
            route,
        };
        meanwhile.show(<WelcomePageSync {...props} />);
        props.posts = await wp.fetchList('/wp/v2/posts/');
        return <WelcomePageSync {...props} />;
    }
}

class WelcomePageSync extends PureComponent {
    static displayName = 'WelcomePageSync';

    render() {
        let { route, posts } = this.props;
        return <PostList route={route} posts={posts} />;
    }
}

export {
    WelcomePage as default,
    WelcomePage,
};
