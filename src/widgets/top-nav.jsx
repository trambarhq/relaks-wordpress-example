import _ from 'lodash';
import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

class TopNav extends AsyncComponent {
    static displayName = 'TopNav';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let props = {
            route,
        };
        meanwhile.show(<TopNavSync {...props} />);
        props.system = await wp.fetchOne('/');
        meanwhile.show(<TopNavSync {...props} />);
        props.pages = await wp.fetchList('/wp/v2/pages/?parent=0', { minimum: '100%' });
        return <TopNavSync {...props} />;
    }
}

class TopNavSync extends PureComponent {
    static displayName = 'TopNavSync';

    render() {
        let { onMouseOver, onMouseOut } = this.props;
        return (
            <div className="top-nav" onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
                {this.renderTitleBar()}
                {this.renderPageLinkBar()}
                {this.renderSearchBar()}
            </div>
        );
    }

    renderTitleBar() {
        let { route, system } = this.props;
        let name = _.get(system, 'name', '');
        let description = _.get(system, 'description', '');
        let url = route.find([]);
        return (
            <div className="title-bar">
                <div className="title" title={description}>
                    <a href={url}>
                        <i className="fa fa-home" />
                        <span className="site-name">{name}</span>
                    </a>
                </div>
            </div>
        );
    }

    renderPageLinkBar() {
        let { pages } = this.props;
        pages = _.sortBy(pages, 'menu_order');
        return (
            <div className="page-bar">
            {
                pages.map((page, i) => {
                    return this.renderPageLinkButton(page, i);
                })
            }
            </div>
        );
    }

    renderPageLinkButton(page, i) {
        let { route } = this.props;
        let title = _.get(page, 'title.rendered');
        let slug = _.get(page, 'slug');
        let url = route.find([ slug ]);
        return (
            <div className="button" key={i}>
                <a href={url}>{title}</a>
            </div>
        );
    }

    renderSearchBar() {
        let { route } = this.props;
        let search = _.get(route.params, 'search', '');
        return (
            <div className="search-bar">
                <span className="input-container">
                    <input type="text" value={search} readOnly />
                    <i className="fa fa-search" />
                </span>
            </div>
        );
    }
}

TopNavSync.defaultProps = {
    system: {},
    pages: [],
    search: '',
};

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    TopNav.propTypes = {
        wp: PropTypes.instanceOf(WordPress).isRequired,
        route: PropTypes.instanceOf(Route).isRequired,
    };
    TopNavSync.propTypes = {
        system: PropTypes.object,
        pages: PropTypes.arrayOf(PropTypes.object),
        route: PropTypes.instanceOf(Route).isRequired,
    };
}

export {
    TopNav as default,
    TopNav,
    TopNavSync,
};
