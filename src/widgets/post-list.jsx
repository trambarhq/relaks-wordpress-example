import _ from 'lodash';
import Moment from 'moment';
import React, { useEffect } from 'react';

import { PostListView } from './post-list-view.jsx';

function PostList(props) {
  const { route, posts, medias, minimum, maximum } = props;

  useEffect(() => {
    if (posts && posts.more) {
      const loadMore = (fraction) => {
        if (posts.length < minimum) {
          posts.more();
        } else if (posts.length < maximum) {
          const { scrollTop, scrollHeight } = document.body.parentNode;
          if (scrollTop > scrollHeight * fraction) {
            posts.more();
          }
        }
      };
      const handleScroll = (evt) => {
        loadMore(0.5);
      };
      loadMore(0.75);
      document.addEventListener('scroll', handleScroll);
      return () => {
        document.removeEventListener('scroll', handleScroll);
      };
    }
  }, [ posts ]);

  if (!posts) {
    return null;
  }
  return (
    <div className="posts">
      {posts.map(renderPost)}
    </div>
  );

  function renderPost(post, i) {
    let media = _.find(medias, { id: post.featured_media });
    return <PostListView route={route} post={post} media={media} key={post.id} />
  }
}

PostList.defaultProps = {
  minimum: 20,
  maximum: 500,
};

export {
  PostList,
};
