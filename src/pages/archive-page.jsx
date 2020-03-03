import Moment from 'moment';
import React from 'react';
import { useProgress } from 'relaks';

import { Breadcrumb } from '../widgets/breadcrumb.jsx';
import { PostList } from '../widgets/post-list.jsx';

export default async function ArchivePage(props) {
  const { wp, route } = props;
  const { date } = route.params;
  const [ show ] = useProgress();

  render();
  const posts = await wp.fetchPostsInMonth(date);
  render();

  function render() {
    const month = Moment(new Date(date.year, date.month - 1, 1));
    const monthLabel = month.format('MMMM YYYY');
    const trail = [ { label: 'Archives' }, { label: monthLabel } ];
    show(
      <div className="page">
        <Breadcrumb trail={trail} />
        <PostList route={route} posts={posts} minimum={100} />
      </div>
    );
  }
}
