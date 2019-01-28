import _ from 'lodash';
import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

import Breadcrumb from 'widgets/breadcrumb';
import PostList from 'widgets/post-list';

class TagPage extends AsyncComponent {
    static displayName = 'TagPage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let { tagSlug } = route.params;
        let props = { route };
        props.tag = await wp.fetchOne('/wp/v2/tags/', tagSlug);
        meanwhile.show(<TagPageSync {...props} />);
        props.posts = await wp.fetchList(`/wp/v2/posts/?tags=${props.tag.id}`);
        return <TagPageSync {...props} />;
    }
}

class TagPageSync extends PureComponent {
    static displayName = 'TagPageSync';

    render() {
        let { route, posts, tag } = this.props;
        let tagLabel = _.get(tag, 'name', '');
        let trail = [ { label: 'Tags' }, { label: tagLabel } ];
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

    TagPage.propTypes = {
        wp: PropTypes.instanceOf(WordPress),
        route: PropTypes.instanceOf(Route),
    };
    TagPageSync.propTypes = {
        tag: PropTypes.object,
        posts: PropTypes.arrayOf(PropTypes.object),
        route: PropTypes.instanceOf(Route),
    };
}

export {
    TagPage as default,
    TagPage,
    TagPageSync,
};
