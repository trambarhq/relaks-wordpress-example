import React, { PureComponent } from 'react';
import ReactHtmlParser from 'react-html-parser';

class HTML extends PureComponent {
    render() {
        let { text, transform } = this.props;
        let options = { transform };
        return ReactHtmlParser(text, options);
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');
    HTML.propTypes = {
        text: PropTypes.string,
        transform: PropTypes.func,
    };
}

export {
    HTML as default,
    HTML,
};
