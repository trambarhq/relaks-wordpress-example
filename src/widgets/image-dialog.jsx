import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';

function ImageDialog(props) {
    const { imageURL, onClose } = props;
    const target = { func: ImageDialog, props };
    if (!imageURL) {
        return null;
    }

    const handleCloseClick = (evt) => {
        if (onClose) {
            onClose({
                type: 'close',
                target,
            });
        }
    };

    const container = document.getElementById('overlay');
    const dialog = renderDialog();
    return ReactDOM.createPortal(dialog, container);

    function renderDialog() {
        return (
            <div className="image-dialog">
                <div className="background" onClick={handleCloseClick}/>
                <div className="foreground">
                    <div className="box">
                        <div className="close-button" onClick={handleCloseClick}>
                            <i className="fa fa-times" />
                        </div>
                        <img className="image" src={imageURL} />
                    </div>
                </div>
            </div>
        );
    }
}

export {
    ImageDialog,
};
