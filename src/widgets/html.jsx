import React from 'react';
import ReactHtmlParser from 'react-html-parser';

function HTML(props) {
  const { text, transform } = props;
  const options = { transform };
  // fix unescaped <
  const fixed = text.replace(/<([^>]*)</g, '&lt;$1<');
  if (fixed.indexOf('<') === -1 && fixed.indexOf('&') === -1) {
    return fixed;
  } else {
    return ReactHtmlParser(fixed, options);
  }
}

export {
  HTML,
};
