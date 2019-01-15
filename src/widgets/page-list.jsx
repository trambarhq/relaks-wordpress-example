import _ from 'lodash';
import React, { PureComponent } from 'react';
import { Route } from 'routing';

import PageListView from 'widgets/page-list-view';

class PageList extends PureComponent {
    static displayName = 'PageList'

    render() {
        let { route, pages, parentPages } = this.props;
        if (!pages) {
            return null;
        }
        return (
            <ul className="pages">
            {
                pages.map((page) => {
                    return (
                        <li key={page.id}>
                            <PageListView route={route} page={page} parentPages={parentPages} />
                        </li>
                    );
                })
            }
            </ul>
        )
    }

    componentDidMount() {
        this.componentDidUpdate();
    }

    componentDidUpdate(prevProps, prevState) {
        let { pages } = this.props;
        if (pages) {
            pages.more();
        }
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PageList.propTypes = {
        pages: PropTypes.arrayOf(PropTypes.object),
        parentPages: PropTypes.arrayOf(PropTypes.object),
        route: PropTypes.instanceOf(Route).isRequired,
    };
}

export {
    PageList as default,
    PageList,
};
