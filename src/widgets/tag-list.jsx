import _ from 'lodash';
import React from 'react';

function TagList(props) {
  const { route, tags } = props;
  if (_.isEmpty(tags)) {
    return null;
  }
  return (
    <div className="tag-list">
      <b>Tags: </b> {tags.map(renderTag)}
    </div>
  );

  function renderTag(tag, i) {
    const name = _.get(tag, 'name', '');
    const url = route.prefetchObjectURL(tag);
    return (
      <span key={i}>
        <a href={url}>{name}</a>
        {' '}
      </span>
    );
  }
}

export {
  TagList,
};
