import _ from 'lodash';
import React, { PureComponent } from 'react';

import HTML from 'widgets/html';

class PostView extends PureComponent {
    render() {
        let { category, post } = this.props;
        let title = _.get(post, 'title.rendered', '');
        let content = _.get(post, 'content.rendered', '');
        return (
            <div className="page">
                <h1><HTML text={title} /></h1>
                <HTML text={content} />
            </div>
        );

    }
}

export {
    PostView as default,
    PostView,
};
