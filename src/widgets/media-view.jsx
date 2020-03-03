import _ from 'lodash';
import Moment from 'moment';
import React from 'react';

export function MediaView(props) {
  const { media, size } = props;
  let info = _.get(media, [ 'media_details', 'sizes', size ]);
  if (!info) {
    info = media;
  }
  return <img src={info.source_url} width={info.width} height={info.height} />;
}

MediaView.defaultProps = {
  size: 'thumbnail',
};
