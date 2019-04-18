import _ from 'lodash';
import React from 'react';

import { CommentList } from 'widgets/comment-list';

function CommentSection(props) {
    const { comments } = props;
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

export {
    CommentSection,
};
