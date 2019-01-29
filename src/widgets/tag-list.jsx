import _ from 'lodash';
import React, { PureComponent } from 'react';

class TagList extends PureComponent {
    static displayName = 'TagList';

    render() {
        let { tags } = this.props;
        if (_.isEmpty(tags)) {
            return null;
        }
        return (
            <div className="tag-list">
                <b>Tags: </b>
                {
                    tags.map((tag, i) => {
                        return this.renderTag(tag, i);
                    })
                }
            </div>
        );
    }

    renderTag(tag, i) {
        let { route } = this.props;
        let name = _.get(tag, 'name', '');
        let url = route.prefetchObjectURL(tag);
        return (
            <span key={i}>
                <a href={url}>{name}</a>
                {' '}
            </span>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    TagList.propTypes = {
        tags: PropTypes.arrayOf(PropTypes.object),
    };
}

export {
    TagList as default,
    TagList,
};
