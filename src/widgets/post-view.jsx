import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';

import HTML from 'widgets/html';

class PostView extends PureComponent {
    static displayName = 'PostView';

    render() {
        let { category, post, author } = this.props;
        let title = _.get(post, 'title.rendered', '');
        let content = _.get(post, 'content.rendered', '');
        let date = _.get(post, 'date_gmt');
        let name = _.get(author, 'name', '\u00a0');
        if (date) {
            date = Moment(date).format('LL');
        }
        return (
            <div className="post">
                <div className="meta">
                    <div className="date">{date}</div>
                    <div className="author">{name}</div>
                </div>
                <h1><HTML text={title} /></h1>
                <div className="content"><HTML text={content} /></div>
            </div>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PostView.propTypes = {
        category: PropTypes.object,
        post: PropTypes.object,
        author: PropTypes.object,
    };
}

export {
    PostView as default,
    PostView,
};
