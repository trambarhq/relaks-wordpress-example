import React from 'react';
import { HTML } from './html.jsx';

function Breadcrumb(props) {
  const { trail } = props;
  const children = []
  let key = 0;
  for (let item of trail) {
    children.push(<a key={key++} href={item.url}><HTML text={item.label} /></a>);
    children.push(' > ');
  }
  children.pop();
  return <h4 className="breadcrumb">{children}</h4>;
}

export {
  Breadcrumb,
};
