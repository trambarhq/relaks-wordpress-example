import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';

import HTML from 'widgets/html';

class PageView extends PureComponent {
    static displayName = 'PageView';

    render() {
        let { page } = this.props;
        let title = _.get(page, 'title.rendered', '');
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
                <div className="content"><HTML text={content} /></div>
            </div>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PageView.propTypes = {
        category: PropTypes.object,
    };
}

export {
    PageView as default,
    PageView,
};
