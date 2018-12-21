import React, { PureComponent } from 'react';
import Wordpress from 'wordpress';
import { Route } from 'routing';
import SideNav from 'widgets/side-nav';
import TopNav from 'widgets/top-nav';
import 'style.scss';

class Application extends PureComponent {
    static displayName = 'Application';

    constructor(props) {
        super(props);
        let { routeManager, dataSource } = this.props;
        this.state = {
            route: new Route(routeManager),
            wp: new Wordpress(dataSource, props.ssr),
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
        let PageComponent = route.params.module.default;
        return (
            <div>
                <SideNav route={route} wp={wp} />
                <TopNav route={route} wp={wp} collapsed={topNavCollapsed} />
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
    }

    /**
     * Remove change handlers when component mounts
     */
    componentWillUnmount() {
        let { routeManager, dataSource } = this.props;
        routeManager.removeEventListener('change', this.handleRouteChange);
        dataSource.removeEventListener('change', this.handleDataSourceChange);
        document.removeEventListener('scroll', this.handleScroll);
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
        let container = document.body.parentElement;
        let previousPos = this.previousScrollPosition || 0;
        let currentPos = container.scrollTop;
        let delta = currentPos - previousPos;
        if (delta > 0) {
            if (!topNavCollapsed && currentPos > 120) {
                this.setState({ topNavCollapsed: true });
            }
        } else {
            if (topNavCollapsed) {
                this.setState({ topNavCollapsed: false });
            }
        }
        this.previousScrollPosition = currentPos;
    }
}

export {
    Application as default,
    Application
};
