import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

import PostList from 'widgets/post-list';

class WelcomePage extends AsyncComponent {
    static displayName = 'WelcomePage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let props = { route };
        meanwhile.show(<WelcomePageSync {...props} />)
        props.posts = await wp.fetchPosts();
        return <WelcomePageSync {...props} />;
    }
}

class WelcomePageSync extends PureComponent {
    static displayName = 'WelcomePageSync';

    render() {
        let { route, posts } = this.props;
        return (
            <div className="page">
                <PostList route={route} posts={posts} minimum={40} />
            </div>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    WelcomePage.propTypes = {
        wp: PropTypes.instanceOf(WordPress),
        route: PropTypes.instanceOf(Route),
    };
    WelcomePageSync.propTypes = {
        categories: PropTypes.arrayOf(PropTypes.object),
        posts: PropTypes.arrayOf(PropTypes.object),
        route: PropTypes.instanceOf(Route),
    };
}

export {
    WelcomePage as default,
    WelcomePage,
    WelcomePageSync,
};
