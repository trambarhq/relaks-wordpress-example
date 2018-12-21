import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';

class TopBarSync extends PureComponent {
    static displayName = 'TopNavSync';

    render() {
        return (
            <div className="top-nav">
                {this.renderTitleBar()}
                {this.renderPageLinkBar()}
                {this.renderSearchBar()}
            </div>
        );
    }

    renderTitleBar() {
        return (
            <div className="title-bar">
                <div className="title">
                    <i className="fa fa-home" />
                    <span className="site-name">Romanes eunt domus</span>
                </div>
            </div>
        );
    }

    renderPageLinkBar() {
        return (
            <div className="page-bar">
                <div className="button">
                    Hello
                </div>
                <div className="button">
                    World
                </div>
            </div>
        );
    }

    renderSearchBar() {
        return (
            <div className="search-bar">
                <span className="input-container">
                    <input type="text" value="Hello" />
                    <i className="fa fa-search" />
                </span>
            </div>
        );
    }
}

export {
    TopBarSync as default,
    TopBarSync,
};
