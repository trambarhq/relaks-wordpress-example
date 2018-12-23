import React from 'react';

function HTML(props) {
    let text = props.text;
    if (!text) {
        return null;
    }
    if (isHTML(text)) {
        let markup = { __html: text };
        return <span dangerouslySetInnerHTML={markup} />
    } else {
        return text;
    }
}

function isHTML(text) {
    if (text.indexOf('<') !== -1) {
        return true;
    }
    if (text.indexOf('&') !== -1) {
        return true;
    }
    return false;
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
