import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';

import HTML from 'widgets/html';

class PageView extends PureComponent {
    static displayName = 'PageView';

    render() {
        let { page, transform } = this.props;
        let title = _.get(page, 'title.rendered') || 'Untitled';
        let content = _.get(page, 'content.rendered', '');
        let date = _.get(page, 'modified_gmt');
        if (date) {
            date = Moment(date).format('LL');
        }
        return (
            <div className="page">
                <div className="meta">
                    <div className="date">{date}</div>
                </div>
                <h1><HTML text={title} /></h1>
                <div className="content">
                    <HTML text={content} transform={transform}/>
                </div>
            </div>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PageView.propTypes = {
        page: PropTypes.object,
        transform: PropTypes.func,
    };
}

export {
    PageView as default,
    PageView,
};
