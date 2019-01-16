import React, { PureComponent } from 'react';
import Wordpress from 'wordpress';
import { Route } from 'routing';
import SideNav from 'widgets/side-nav';
import TopNav from 'widgets/top-nav';
import 'style.scss';
import '@fortawesome/fontawesome-free/scss/fontawesome.scss';
import '@fortawesome/fontawesome-free/scss/regular.scss';
import '@fortawesome/fontawesome-free/scss/solid.scss';

class FrontEnd extends PureComponent {
    static displayName = 'FrontEnd';

    constructor(props) {
        super(props);
        let { routeManager, dataSource } = this.props;
        this.state = {
            route: new Route(routeManager),
            wp: new Wordpress(dataSource, props.ssr),
            sideNavCollapsed: true,
            topNavCollapsed: false,
        };
    }

    /**
     * Render the application
     *
     * @return {VNode}
     */
    render() {
        let { route, wp } = this.state;
        let { topNavCollapsed } = this.state;
        let { sideNavCollapsed } = this.state;
        let PageComponent = route.params.module.default;
        let classNames = [];
        if (topNavCollapsed) {
            classNames.push('top-collapsed');
        }
        if (sideNavCollapsed) {
            classNames.push('side-collapsed');
        }
        let key = route.url;
        return (
            <div className={classNames.join(' ')}>
                <SideNav route={route} wp={wp} />
                <TopNav route={route} wp={wp} />
                <div className="page-container">
                    <PageComponent route={route} wp={wp} key={key} />
                </div>
            </div>
        );
    }

    /**
     * Added change handlers when component mounts
     */
    componentDidMount() {
        let { routeManager, dataSource } = this.props;
        routeManager.addEventListener('change', this.handleRouteChange);
        dataSource.addEventListener('change', this.handleDataSourceChange);
        document.addEventListener('scroll', this.handleScroll);

        if (typeof(window) === 'object') {
            let Hammer = require('hammerjs');
            let hammer = new Hammer(document.body);
            hammer.on('swipeleft', this.handleSwipeLeft);
            hammer.on('swiperight', this.handleSwipeRight);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        let { dataSource, ssr } = this.props;
        let { route } = this.state;
        if (prevProps.ssr !== ssr) {
            this.setState({ wp: new Wordpress(dataSource, ssr) });
        }
        if (prevState.route !== route) {
            if (!(prevState.route.history.length < route.history.length)) {
                // not going backward
                document.body.parentElement.scrollTop = 0;
            }
        }
    }

    /**
     * Called when the data source changes
     *
     * @param  {RelaksWordpressDataSourceEvent} evt
     */
    handleDataSourceChange = (evt) => {
        this.setState({ wp: new Wordpress(evt.target) });
    }

    /**
     * Called when the route changes
     *
     * @param  {RelaksRouteManagerEvent} evt
     */
    handleRouteChange = (evt) => {
        this.setState({ route: new Route(evt.target) });
    }

    /**
     * Called when the user scrolls the page contents
     *
     * @param  {Event} evt
     */
    handleScroll = (evt) => {
        let { topNavCollapsed } = this.state;
        let container = document.body;
        let previousPos = this.previousScrollPosition || 0;
        let currentPos = container.scrollTop;
        if (currentPos === 0 && container.parentNode.scrollTop > 0) {
            currentPos = container.parentNode.scrollTop;
        }
        let delta = currentPos - previousPos;
        if (delta > 0) {
            if (!topNavCollapsed) {
                // check to see if we have scroll down efficiently, so that
                // hidden the top nav won't reveal white space
                let pageContainer = document.getElementsByClassName('page-container')[0];
                let page = (pageContainer) ? pageContainer.firstChild : null;
                if (page) {
                    let pageRect = page.getBoundingClientRect();
                    if (pageRect.top <= 40) {
                        this.setState({ topNavCollapsed: true });
                    }
                } else {
                    this.setState({ topNavCollapsed: true });
                }
            }
        } else {
            if (topNavCollapsed) {
                this.setState({ topNavCollapsed: false });
            }
        }
        this.previousScrollPosition = currentPos;
    }

    handleSwipeLeft = (evt) => {
        let { sideNavCollapsed } = this.state;
        if (!sideNavCollapsed) {
            this.setState({ sideNavCollapsed: true });
        }
    }

    handleSwipeRight = (evt) => {
        let { sideNavCollapsed } = this.state;
        if (sideNavCollapsed) {
            this.setState({ sideNavCollapsed: false });
        }
    }
}

export {
    FrontEnd as default,
    FrontEnd
};
