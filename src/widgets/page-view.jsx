import _ from 'lodash';
import React, { PureComponent } from 'react';

class PageView extends PureComponent {
    static displayName = 'PageView';

    render() {
        let { page } = this.props;
        let title = _.get(page, 'title.rendered', '');
        let content = _.get(page, 'content.rendered', '');
        return (
            <div className="page">
                <h1><HTML text={title} /></h1>
                <div className="content"><HTML text={content} /></div>
            </div>
        );
    }
}
