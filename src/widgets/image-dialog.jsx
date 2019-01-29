import _ from 'lodash';
import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';

class ImageDialog extends PureComponent {

    render() {
        let { imageURL } = this.props;
        if (!imageURL) {
            return null;
        }
        let container = document.getElementById('overlay');
        let dialog = this.renderDialog();
        return ReactDOM.createPortal(dialog, container);
    }

    renderDialog() {
        let { imageURL } = this.props;
        return (
            <div className="image-dialog">
                <div className="background" onClick={this.handleCloseClick}/>
                <div className="foreground">
                    <div className="box">
                        <div className="close-button" onClick={this.handleCloseClick}>
                            <i className="fa fa-times" />
                        </div>
                        <img className="image" src={imageURL} />
                    </div>
                </div>
            </div>
        );
    }

    handleCloseClick = (evt) => {
        let { onClose } = this.props;
        if (onClose) {
            onClose({
                type: 'close',
                target: this,
            });
        }
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    ImageDialog.propTypes = {
        imageURL: PropTypes.string,
        onClose: PropTypes.func,
    };
}

export {
    ImageDialog as default,
    ImageDialog,
};
