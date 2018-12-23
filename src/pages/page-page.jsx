import _ from 'lodash';
import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

import HTML from 'widgets/html';

class PagePage extends AsyncComponent {
    static displayName = 'PagePage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let props = {
            route,
        };
        let slugs = route.params.slugs;
        props.pages = await wp.fetchMultiple({ url: '/wp/v2/pages/', slugs });
        return <PagePageSync {...props} />;
    }
}

class PagePageSync extends PureComponent {

    render() {
        let { pages } = this.props;
        let activePage = _.last(pages);
        let title = _.get(page, 'title.rendered', '');
        let content = _.get(page, 'content.rendered', '');
        return (
            <div className="page">
                <h1><HTML text={title} /></h1>
                <HTML text={content} />
            </div>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PagePage.propTypes = {
        wp: PropTypes.instanceOf(WordPress).isRequired,
        route: PropTypes.instanceOf(Route).isRequired,
    };
    PagePageSync.propTypes = {
        page: PropTypes.object,
        route: PropTypes.instanceOf(Route).isRequired,
    };
}

export {
    PagePage as default,
    PagePage,
    PagePageSync,
};
