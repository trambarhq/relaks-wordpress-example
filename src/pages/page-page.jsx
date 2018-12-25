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
        let { pageSlug, parentPageSlugs } = route.params;
        let props = {
            route,
        };
        props.page = await wp.fetchOne('/wp/v2/pages/', pageSlug);
        meanwhile.show(<PagePageSync {...props} />);
        props.parentPages = await wp.fetchMultiple('/wp/v2/pages/', parentPageSlugs);
        return <PagePageSync {...props} />;
    }
}

class PagePageSync extends PureComponent {
    static displayName = 'PagePageSync';

    render() {
        let { page } = this.props;
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
        parentPages: PropTypes.arrayOf(PropTypes.object),
        route: PropTypes.instanceOf(Route).isRequired,
    };
}

export {
    PagePage as default,
    PagePage,
    PagePageSync,
};
