import _ from 'lodash';
import React, { PureComponent } from 'react';
import { Route } from 'routing';

import HTML from 'widgets/html';

class PageListView extends PureComponent {
    static displayName = 'PageListView';

    render() {
        let { route, parentPages, page } = this.props;
        let title = _.get(page, 'title.rendered', '');
        let parentSlugs = _.map(parentPages, 'slug');
        let slugs = _.concat(parentSlugs, page.slug);
        let url = route.find(slugs);
        return (
            <div className="page-list-view">
                <a href={url}><HTML text={title} /></a>
            </div>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PageListView.propTypes = {
        page: PropTypes.object,
        parentPages: PropTypes.arrayOf(PropTypes.object),
        route: PropTypes.instanceOf(Route).isRequired,
    };
}

export {
    PageListView as default,
    PageListView,
};
