import _ from 'lodash';
import React from 'react';

import { CommentListView } from './comment-list-view.jsx';

export function CommentList(props) {
  const { allComments, parentCommentID } = props;
  const comments = _.filter(allComments, { parent: parentCommentID });

  return (
    <div className="comments">
      {comments.map(renderComment)}
    </div>
  );

  function renderComment(comment, i) {
    return <CommentListView comment={comment} allComments={allComments} key={comment.id} />;
  }
}
