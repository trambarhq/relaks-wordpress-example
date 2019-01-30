import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';
import { Route } from 'routing';

import HTML from 'widgets/html';
import MediaView from 'widgets/media-view';

class PostListView extends PureComponent {
    static displayName = 'PostListView';

    render() {
        let { route, post, media } = this.props;
        let title = _.get(post, 'title.rendered', '');
        let excerpt = _.get(post, 'excerpt.rendered', '');
        excerpt = cleanExcerpt(excerpt);
        let url = route.prefetchObjectURL(post);
        let date = _.get(post, 'date_gmt');
        if (date) {
            date = Moment(date).format('L');
        }
        if (media) {
            return (
                <div className="post-list-view with-media">
                    <div className="media">
                        <MediaView media={media} />
                    </div>
                    <div className="text">
                        <div className="headline">
                            <h3 className="title">
                                <a href={url}><HTML text={title} /></a>
                            </h3>
                            <div className="date">{date}</div>
                        </div>
                        <div className="excerpt">
                            <HTML text={excerpt} />
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="post-list-view">
                    <div className="headline">
                        <h3 className="title">
                            <a href={url}><HTML text={title} /></a>
                        </h3>
                        <div className="date">{date}</div>
                    </div>
                    <div className="excerpt">
                        <HTML text={excerpt} />
                    </div>
                </div>
            );
        }
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
