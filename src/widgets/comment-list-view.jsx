import _ from 'lodash';
import React, { PureComponent } from 'react';

import HTML from 'widgets/html';
import CommentList from 'widgets/comment-list';

class CommentListView extends PureComponent {
    static displayName = 'CommentListView';

    render() {
        let { comment } = this.props;
        let content = _.get(comment, 'content.rendered', '');
        let avatarURL = _.get(comment, 'author_avatar_urls.24');
        let name = _.get(comment, 'author_name');
        return (
            <div className="comment-list-view">
                <div className="commenter">
                    <img className="avatar" src={avatarURL} />
                    <span className="name">{name}:</span>
                </div>
                <HTML text={content} />
                {this.renderReplies()}
            </div>
        );
    }

    renderReplies() {
        let { comment, allComments } = this.props;
        if (!_.some(allComments, { parent: comment.id })) {
            return null;
        }
        return (
            <div className="replies">
                <CommentList allComments={allComments} parentCommentID={comment.id} />
            </div>
        )
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    CommentListView.propTypes = {
        allComments: PropTypes.arrayOf(PropTypes.object),
        comment: PropTypes.object,
    };
}

export {
    CommentListView as default,
    CommentListView,
};
