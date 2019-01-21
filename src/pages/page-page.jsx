import _ from 'lodash';
import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

import HTML from 'widgets/html';
import Breadcrumb from 'widgets/breadcrumb';
import PageView from 'widgets/page-view';
import PageList from 'widgets/page-list';

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
        meanwhile.show(<PagePageSync {...props} />);
        props.childPages = await wp.fetchList(`/wp/v2/pages/?parent=${props.page.id}`, { minimum: '100%' });
        return <PagePageSync {...props} />;
    }
}

class PagePageSync extends PureComponent {
    static displayName = 'PagePageSync';

    render() {
        let { route, page, parentPages, childPages, transform } = this.props;
        let trail = [];
        let parents = [];
        if (parentPages) {
            for (let parentPage of parentPages) {
                parents.push(parentPage);

                let title = _.get(parentPage, 'title.rendered', '');
                let slugs = _.map(parents, 'slug');
                let url = route.find(slugs);
                trail.push({ label: <HTML text={title} />, url })
            }
            parents.push(page);
        }
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PageView page={page} transform={route.transformLink} />
                <PageList route={route} pages={childPages} parentPages={parents} />
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
        childPages: PropTypes.arrayOf(PropTypes.object),
        route: PropTypes.instanceOf(Route).isRequired,
    };
}

export {
    PagePage as default,
    PagePage,
    PagePageSync,
};
