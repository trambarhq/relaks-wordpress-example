import _ from 'lodash';
import React from 'react';
import Relaks, { useProgress } from 'relaks';

import { Breadcrumb } from '../widgets/breadcrumb.jsx';
import { PostList } from '../widgets/post-list.jsx';

async function CategoryPage(props) {
  const { wp, route } = props;
  const { categorySlug } = route.params;
  const [ show ] = useProgress();

  render();
  const category = await wp.fetchCategory(categorySlug);
  const parentCategories = await wp.fetchParentCategories(category);
  render();
  const posts = await wp.fetchPostsInCategory(category);
  render();
  const medias = await wp.fetchFeaturedMedias(posts, 10);
  render();

  function render() {
    const trail = [ { label: 'Categories' } ];
    const categoryLabel = _.get(category, 'name', '');
    if (parentCategories) {
      for (let parentCategory of parentCategories) {
        const label = _.get(parentCategory, 'name', '');
        const url = route.prefetchObjectURL(parentCategory);
        trail.push({ label, url });
      }
      trail.push({ label: categoryLabel });
    }
    show(
      <div className="page">
        <Breadcrumb trail={trail} />
        <PostList route={route} posts={posts} medias={medias} minimum={40} />
      </div>
    );
  }
}

const component = Relaks.memo(CategoryPage);

export {
  component as default,
};
