import _ from 'lodash';
import Moment from 'moment';
import React from 'react';

import { HTML } from 'widgets/html';
import { MediaView } from 'widgets/media-view';

function PostListView(props) {
    const { route, post, media } = props;
    const title = _.get(post, 'title.rendered', '');
    const excerptRendered = _.get(post, 'excerpt.rendered', '');
    const excerpt = cleanExcerpt(excerptRendered);
    const url = route.prefetchObjectURL(post);
    const published = _.get(post, 'date_gmt');
    const date = (published) ? Moment(published).format('L') : '';

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

    function cleanExcerpt(excerpt) {
        const index = excerpt.indexOf('<p class="link-more">');
        if (index !== -1) {
            excerpt = excerpt.substr(0, index);
        }
        return excerpt;
    }
}

export {
    PostListView,
};
