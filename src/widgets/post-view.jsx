import _ from 'lodash';
import Moment from 'moment';
import React, { useState } from 'react';

import HTML from 'widgets/html';
import ImageDialog from 'widgets/image-dialog';

function PostView(props) {
    const { post, author, transform } = props;
    const [ imageURL, setImageURL ] = useState(null);

    const handleClick = (evt) => {
        const target = evt.target;
        const container = evt.currentTarget;
        if (target.tagName === 'IMG') {
            let link;
            for (let p = target; p && p !== container; p = p.parentNode) {
                if (p.tagName === 'A') {
                    link = p;
                    break;
                }
            }
            if (link) {
                setImageURL(link.href);
                evt.preventDefault();
            }
        }
    };
    const handleDialogClose = (evt) => {
        setImageURL(null);
    };

    const title = _.get(post, 'title.rendered', '');
    const content = _.get(post, 'content.rendered', '');
    const name = _.get(author, 'name', '\u00a0');
    const published = _.get(post, 'date_gmt');
    const date = (published) ? Moment(published).format('LL') : '';
    return (
        <div className="post">
            <div className="meta">
                <div className="date">{date}</div>
                <div className="author">{name}</div>
            </div>
            <h1><HTML text={title} /></h1>
            <div className="content" onClick={handleClick}>
                <HTML text={content} transform={transform} />
            </div>
            <ImageDialog imageURL={imageURL} onClose={handleDialogClose} />
        </div>
    );
}

export {
    PostView as default,
    PostView,
};
