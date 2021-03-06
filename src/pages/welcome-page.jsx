import React from 'react';
import { useProgress } from 'relaks';

import { PostList } from '../widgets/post-list.jsx';

export default async function WelcomePage(props) {
  const { wp, route } = props;
  const [ show ] = useProgress();

  render();
  const posts = await wp.fetchPosts();
  render();
  const medias = await wp.fetchFeaturedMedias(posts, 10);
  render();

  function render() {
    show(
      <div className="page">
        <PostList route={route} posts={posts} medias={medias} minimum={40} />
      </div>
    );
  }
}
