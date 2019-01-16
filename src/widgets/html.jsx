import React, { PureComponent } from 'react';
import ReactHtmlParser from 'react-html-parser';

class HTML extends PureComponent {
    render() {
        let { text } = this.props;
        let options = {};
        if (transformFunc) {
            options.transform = transformFunc;
        }
        return ReactHtmlParser(text, options);
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');
    HTML.propTypes = {
        text: PropTypes.string,
    };
}

let transformFunc = null;

function setTransformFunction(f) {
    transformFunc = f;
}

export {
    HTML as default,
    HTML,
    setTransformFunction,
};
