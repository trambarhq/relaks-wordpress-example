import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';

class MediaView extends PureComponent {
    static displayName = 'MediaView';

    render() {
        let { media, size } = this.props;
        let info = _.get(media, [ 'media_details', 'sizes', size ]);
        if (!info) {
            return;
        }
        let props = {
            src: info.source_url,
            width: info.width,
            height: info.height,
        };
        return <img {...props} />;
    }
}

MediaView.defaultProps = {
    size: 'thumbnail',
};

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    MediaView.propTypes = {
        media: PropTypes.object,
        size: PropTypes.string,
    };
}

export {
    MediaView as default,
    MediaView,
};
