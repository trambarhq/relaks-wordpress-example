import React, { PureComponent } from 'react';
import Hammer from 'hammerjs';
import Wordpress from 'wordpress';
import { Route } from 'routing';
import SideNav from 'widgets/side-nav';
import TopNav from 'widgets/top-nav';
import 'font-awesome-webpack';
import 'style.scss';

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
        return (
            <div className={classNames.join(' ')}>
                <SideNav route={route} wp={wp} />
                <TopNav route={route} wp={wp} />
                <div className="page-container">
                    <PageComponent route={route} wp={wp} />
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

        let hammer = new Hammer(document.body);
        hammer.on('swipeleft', this.handleSwipeLeft);
        hammer.on('swiperight', this.handleSwipeRight);
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
