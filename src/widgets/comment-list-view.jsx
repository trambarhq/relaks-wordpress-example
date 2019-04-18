import _ from 'lodash';
import React from 'react';

import { HTML } from 'widgets/html';
import { CommentList } from 'widgets/comment-list';

function CommentListView(props) {
    const { comment, allComments } = props;
    const content = _.get(comment, 'content.rendered', '');
    const avatarURL = _.get(comment, 'author_avatar_urls.24');
    const name = _.get(comment, 'author_name');

    return (
        <div className="comment-list-view">
            <div className="commenter">
                <img className="avatar" src={avatarURL} />
                <span className="name">{name}:</span>
            </div>
            <HTML text={content} />
            {renderReplies()}
        </div>
    );

    function renderReplies() {
        if (!_.some(allComments, { parent: comment.id })) {
            return null;
        }
        return (
            <div className="replies">
                <CommentList allComments={allComments} parentCommentID={comment.id} />
            </div>
        );
    }
}

export {
    CommentListView,
};
