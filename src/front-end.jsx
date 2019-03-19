import React, { useState, useEffect, useMemo } from 'react';
import Wordpress from 'wordpress';
import { Route } from 'routing';
import 'style.scss';
import '@fortawesome/fontawesome-free/scss/fontawesome.scss';
import '@fortawesome/fontawesome-free/scss/regular.scss';
import '@fortawesome/fontawesome-free/scss/solid.scss';

import SideNav from 'widgets/side-nav';
import TopNav from 'widgets/top-nav';
import ErrorBoundary from 'widgets/error-boundary';

function FrontEnd(props) {
    const { routeManager, dataSource, ssr } = props;
    const [ routeChange, setRouteChange ] = useState();
    const [ wpChange, setWPChange ] = useState();
    const route = useMemo(() => {
        return new Route(routeManager, dataSource);
    }, [ routeManager, dataSource, routeChange ]);
    const wp = useMemo(() => {
        return new Wordpress(dataSource, ssr);
    }, [ dataSource, ssr, wpChange ]);
    const [ sideNavCollapsed, collapseSideNav ] = useState(true);
    const [ topNavCollapsed, collapseTopNav ] = useState(false);

    useEffect(() => {
        routeManager.addEventListener('change', setRouteChange);
        dataSource.addEventListener('change', setWPChange);

        return () => {
            routeManager.addEventListener('change', setRouteChange);
            dataSource.addEventListener('change', setWPChange);
        };
    });
    useEffect(() => {
        let previousPos = getScrollPos();
        const handleScroll = (evt) => {
            const currentPos = getScrollPos();
            const delta = currentPos - previousPos;
            if (delta > 0) {
                if (!topNavCollapsed) {
                    // check to see if we have scroll down efficiently, so that
                    // hidden the top nav won't reveal white space
                    const pageContainer = document.getElementsByClassName('page-container')[0];
                    const page = (pageContainer) ? pageContainer.firstChild : null;
                    if (page) {
                        const pageRect = page.getBoundingClientRect();
                        if (pageRect.top <= 40) {
                            collapseTopNav(true);
                        }
                    } else {
                        collapseTopNav(true);
                    }
                }
            } else if (delta < -10) {
                if (topNavCollapsed) {
                    collapseTopNav(false);
                }
            }
            previousPos = currentPos;
        };
        document.addEventListener('scroll', handleScroll);

        return () => { 
            document.removeEventListener('scroll', handleScroll);
        };
    });
    useEffect(() => {
        if (typeof(window) === 'object') {
            const handleSwipeLeft = (evt) => {
                if (!sideNavCollapsed) {
                    collapseSideNav(true);
                }
            };
            const handleSwipeRight = (evt) => {
                if (sideNavCollapsed) {
                    collapseSideNav(false);
                }
            };

            const Hammer = require('hammerjs');
            const hammer = new Hammer(document.body, { cssProps: { userSelect: 'auto' } });
            hammer.on('swipeleft', handleSwipeLeft);
            hammer.on('swiperight', handleSwipeRight);

            return () => {

            };
        }        
    });

    const PageComponent = route.params.module.default;
    const classNames = [];
    if (topNavCollapsed) {
        classNames.push('top-collapsed');
    }
    if (sideNavCollapsed) {
        classNames.push('side-collapsed');
    }
    const key = route.url;
    return (
        <div className={classNames.join(' ')}>
            <ErrorBoundary>
                <SideNav route={route} wp={wp} />
                <TopNav route={route} wp={wp} />
                <div className="page-container">
                    <PageComponent route={route} wp={wp} key={key} />
                </div>
            </ErrorBoundary>
            <div id="overlay" />
        </div>
    );

    function getScrollPos() {
        let pos = document.body.scrollTop;
        if (pos === 0 && document.body.parentNode.scrollTop > 0) {
            pos = document.body.parentNode.scrollTop;
        }
        return pos;
    }

    function resetScrollPos() {
        if (document.body.parentElement.scrollTop > 0) {
            document.body.parentElement.scrollTop = 0;
        } else if (document.body.scrollTop > 0) {
            document.body.scrollTop = 0;
        }
    }
}

export {
    FrontEnd as default,
    FrontEnd
};

if (process.env.NODE_ENV !== 'production') {
    require('./props');
}
