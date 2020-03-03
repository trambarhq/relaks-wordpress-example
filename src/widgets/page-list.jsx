import _ from 'lodash';
import React, { useEffect } from 'react';
import { Route } from '../routing.js';

import { PageListView } from './page-list-view.jsx';

export function PageList(props) {
  const { route, pages } = props;
  if (!pages) {
    return null;
  }

  useEffect(() => {
    pages.more();
  }, [ pages ]);

  return (
    <ul className="pages">
      {pages.map(renderPage)}
    </ul>
  );

  function renderPage(page, i) {
    return (
      <li key={page.id}>
        <PageListView route={route} page={page} />
      </li>
    );
  }
}
