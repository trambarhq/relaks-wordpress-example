import _ from 'lodash';
import React from 'react';

import { HTML } from './html.jsx';

export function PageListView(props) {
  const { route, page } = props;
  const title = _.get(page, 'title.rendered', '');
  const url = route.prefetchObjectURL(page);
  return (
    <div className="page-list-view">
      <a href={url}><HTML text={title} /></a>
    </div>
  );
}
