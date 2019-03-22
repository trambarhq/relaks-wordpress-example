import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';

import HTML from 'widgets/html';
import ImageDialog from 'widgets/image-dialog';

class PostView extends PureComponent {
    static displayName = 'PostView';

    constructor(props) {
        super(props);
        this.state = {
            imageURL: null,
        };
    }

    render() {
        let { post, author, transform } = this.props;
        let title = _.get(post, 'title.rendered') || 'Untitled';
        let content = _.get(post, 'content.rendered', '');
        let date = _.get(post, 'date_gmt');
        let name = _.get(author, 'name', '\u00a0');
        if (date) {
            date = Moment(date).format('LL');
        }
        return (
            <div className="post">
                <div className="meta">
                    <div className="date">{date}</div>
                    <div className="author">{name}</div>
                </div>
                <h1><HTML text={title} /></h1>
                <div className="content" onClick={this.handleClick}>
                    <HTML text={content} transform={transform} />
                </div>
                {this.renderImageDialog()}
            </div>
        );
    }

    renderImageDialog() {
        let { imageURL } = this.state;
        return <ImageDialog imageURL={imageURL} onClose={this.handleDialogClose} />;
    }

    handleClick = (evt) => {
        let target = evt.target;
        let container = evt.currentTarget;
        if (target.tagName === 'IMG') {
            let link;
            for (let p = target; p && p !== container; p = p.parentNode) {
                if (p.tagName === 'A') {
                    link = p;
                    break;
                }
            }
            if (link) {
                let imageURL = link.href;
                this.setState({ imageURL });
                evt.preventDefault();
            }
        }
    }

    handleDialogClose = (evt) => {
        this.setState({ imageURL: null });
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PostView.propTypes = {
        post: PropTypes.object,
        author: PropTypes.object,
        transform: PropTypes.func,
    };
}

export {
    PostView as default,
    PostView,
};
