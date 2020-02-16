import _ from 'lodash';
import React from 'react';
import Relaks, { useProgress } from 'relaks';

import { Breadcrumb } from '../widgets/breadcrumb.jsx';
import { PostList } from '../widgets/post-list.jsx';

async function TagPage(props) {
  const { wp, route } = props;
  const { tagSlug } = route.params;
  const [ show ] = useProgress();

  render();
  const tag = await wp.fetchTag(tagSlug);
  render();
  const posts = await wp.fetchPostsWithTag(tag);
  render();

  function render() {
    const tagLabel = _.get(tag, 'name', '');
    const trail = [ { label: 'Tags' }, { label: tagLabel } ];
    show(
      <div className="page">
        <Breadcrumb trail={trail} />
        <PostList route={route} posts={posts} minimum={40} />
      </div>
    );
  }
}

const component = Relaks.memo(TagPage);

export {
  component as default,
};
