import _ from 'lodash';
import React, { PureComponent } from 'react';

import HTML from 'widgets/html';

class PostListView extends PureComponent {
    static displayName = 'PostListView';

    render() {
        let { post, author } = this.props;
        let title = _.get(post, 'title.rendered', '');
        let excerpt = _.get(post, 'excerpt.rendered', '');
        excerpt = cleanExcerpt(excerpt);
        return (
            <div className="post-list-view">
                <h2><HTML text={title} /></h2>
                <p><HTML text={excerpt} /></p>
            </div>
        );
    }
}

function cleanExcerpt(excerpt) {
    let index = excerpt.indexOf('<p class="link-more">');
    if (index !== -1) {
        excerpt = excerpt.substr(0, index);
    }
    return excerpt;
}

export {
    PostListView as default,
    PostListView,
};
