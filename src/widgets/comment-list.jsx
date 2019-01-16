import _ from 'lodash';
import React, { PureComponent } from 'react';

import CommentListView from 'widgets/comment-list-view';

class CommentList extends PureComponent {
    static displayName = 'CommentList'

    render() {
        let { allComments, parentCommentID } = this.props;
        let comments = _.filter(allComments, { parent: parentCommentID });
        return (
            <div className="comments">
            {
                _.map(comments, (comment) => {
                    return <CommentListView comment={comment} allComments={allComments} key={comment.id} />;
                })
            }
            </div>
        )
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    CommentList.propTypes = {
        allComments: PropTypes.arrayOf(PropTypes.object),
        parentCommentID: PropTypes.number,
    };
}

export {
    CommentList as default,
    CommentList,
};
