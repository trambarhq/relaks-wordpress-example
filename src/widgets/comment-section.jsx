import _ from 'lodash';
import React, { PureComponent } from 'react';

import CommentList from 'widgets/comment-list';

class CommentSection extends PureComponent {
    static displayName = 'CommentSection';

    render() {
        let { comments } = this.props;
        if (_.isEmpty(comments)) {
            return null;
        }
        return (
            <div className="comment-section">
                <h3>Comments</h3>
                <CommentList allComments={comments} parentCommentID={0} />
            </div>
        );
    }

    componentDidMount() {
        this.componentDidUpdate();
    }

    componentDidUpdate(prevProps, prevState) {
        let { allComments } = this.props;
        if (allComments) {
            allComments.more();
        }
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    CommentSection.propTypes = {
        comments: PropTypes.arrayOf(PropTypes.object),
    };
}

export {
    CommentSection as default,
    CommentSection,
};
