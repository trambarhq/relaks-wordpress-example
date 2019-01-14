import React, { PureComponent } from 'react';
import ReactHtmlParser from 'react-html-parser';

class HTML extends PureComponent {
    render() {
        let { text } = this.props;
        return ReactHtmlParser(text);
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');
    HTML.propTypes = {
        text: PropTypes.string,
    };
}

export {
    HTML as default,
    HTML,
};
