import _ from 'lodash';
import Moment from 'moment';
import React from 'react';

import { HTML } from './html.jsx';

export function PageView(props) {
  const { page, transform } = props;
  const title = _.get(page, 'title.rendered', '');
  const content = _.get(page, 'content.rendered', '');
  const modified = _.get(page, 'modified_gmt');
  const date = (modified) ? Moment(modified).format('LL') : '';

  return (
    <div className="page">
      <div className="meta">
        <div className="date">{date}</div>
      </div>
      <h1><HTML text={title} /></h1>
      <div className="content">
        <HTML text={content} transform={transform}/>
      </div>
    </div>
  );
}
