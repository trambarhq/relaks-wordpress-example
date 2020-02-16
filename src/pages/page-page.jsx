import _ from 'lodash';
import React from 'react';
import Relaks, { useProgress } from 'relaks';

import { HTML } from '../widgets/html.jsx';
import { Breadcrumb } from '../widgets/breadcrumb.jsx';
import { PageView } from '../widgets/page-view.jsx';
import { PageList } from '../widgets/page-list.jsx';

async function PagePage(props) {
  const { wp, route } = props;
  const { pageSlug } = route.params;
  const [ show ] = useProgress();

  render();
  const page = await wp.fetchPage(pageSlug);
  const parentPages = await wp.fetchParentPages(page);
  render();
  const childPages = await wp.fetchChildPages(page);
  render();

  function render() {
    const trail = [];
    if (parentPages) {
      for (let parentPage of parentPages) {
        const title = _.get(parentPage, 'title.rendered', '');
        const url = route.prefetchObjectURL(parentPage);
        trail.push({ label: <HTML text={title} />, url })
      }
    }
    show(
      <div className="page">
        <Breadcrumb trail={trail} />
        <PageView page={page} transform={route.transformNode} />
        <PageList route={route} pages={childPages} />
      </div>
    );
  }
}

const component = Relaks.memo(PagePage);

export {
  component as default,
};
