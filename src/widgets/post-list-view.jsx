import _ from 'lodash';
import React, { PureComponent } from 'react';

import HTML from 'widgets/html';

class PostListView extends PureComponent {
    static displayName = 'PostListView';

    render() {
        let { route, category, post, author, month } = this.props;
        let title = _.get(post, 'title.rendered', '');
        let excerpt = _.get(post, 'excerpt.rendered', '');
        excerpt = cleanExcerpt(excerpt);
        let slugs = [ post.slug ];
        if (category) {
            slugs.unshift(category.slug);
        }
        if (month) {
            slugs.unshift(month.format('YYYY-MM'));
        }
        let url = route.find(slugs);
        return (
            <div className="post-list-view">
                <h3>
                    <a href={url}><HTML text={title} /></a>
                </h3>
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
