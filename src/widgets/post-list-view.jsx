import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';
import { Route } from 'routing';

import HTML from 'widgets/html';

class PostListView extends PureComponent {
    static displayName = 'PostListView';

    render() {
        let { route, category, post, month } = this.props;
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
                <div className="excerpt"><HTML text={excerpt} /></div>
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

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PostListView.propTypes = {
        category: PropTypes.object,
        post: PropTypes.object,
        month: PropTypes.instanceOf(Moment),
        route: PropTypes.instanceOf(Route).isRequired,
    };
}

export {
    PostListView as default,
    PostListView,
};
