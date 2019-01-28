import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';
import { Route } from 'routing';

import HTML from 'widgets/html';

class PostListView extends PureComponent {
    static displayName = 'PostListView';

    render() {
        let { route, post } = this.props;
        let title = _.get(post, 'title.rendered', '');
        let excerpt = _.get(post, 'excerpt.rendered', '');
        excerpt = cleanExcerpt(excerpt);
        let url = route.getObjectURL(post);
        let date = _.get(post, 'date_gmt');
        if (date) {
            date = Moment(date).format('LL');
        }
        return (
            <div className="post-list-view">
                <div className="date">{date}</div>
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
        post: PropTypes.object,
        route: PropTypes.instanceOf(Route).isRequired,
    };
}

export {
    PostListView as default,
    PostListView,
};
