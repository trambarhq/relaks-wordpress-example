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
        props.pages = await wp.fetchList('/wp/v2/pages/', { minimum: '100%' });
        return <TopNavSync {...props} />;
    }
}

class TopNavSync extends PureComponent {
    static displayName = 'TopNavSync';

    constructor(props) {
        super(props);
        let { route } = props;
        let { search } = route.params;
        this.searchTimeout = 0;
        this.state = { search };
    }

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
        let url = route.getRootURL();
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
        pages = _.filter(pages, { parent: 0 });
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
        let url = route.prefetchObjectURL(page);
        return (
            <div className="button" key={i}>
                <a href={url}>{title}</a>
            </div>
        );
    }

    renderSearchBar() {
        let { route } = this.props;
        let { search } = this.state;
        return (
            <div className="search-bar">
                <span className="input-container">
                    <input type="text" value={search || ''} onChange={this.handleSearchChange} />
                    <i className="fa fa-search" />
                </span>
            </div>
        );
    }

    performSearch = (evt) => {
        let { search } = this.state;
        let { route } = this.props;
        let url = route.getSearchURL(search);
        let options = {
            replace: (route.params.pageType === 'search')
        };
        route.change(url);
    }

    componentDidUpdate(prevProps, prevState) {
        let { route } = this.props;
        if (prevProps.route !== route) {
            let { search } = route.params;
            this.setState({ search });
        }
    }

    componentWillUnmount() {
        clearTimeout(this.searchTimeout);
    }

    handleSearchChange = (evt) => {
        let search = evt.target.value;
        this.setState({ search });
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(this.performSearch, 500);
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
