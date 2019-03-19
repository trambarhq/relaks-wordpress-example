import React from 'react';

function Breadcrumb(props) {
    const { trail } = props;
    const children = []
    let key = 0;
    for (let item of trail) {
        children.push(<a key={key++} href={item.url}>{item.label}</a>);
        children.push(' > ');
    }
    children.pop();
    return <h4 className="breadcrumb">{children}</h4>;
}

export {
    Breadcrumb as default,
    Breadcrumb,
};
