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
        let { pageSlug } = route.params;
        let props = { route };
        let pages = await wp.fetchList(`/wp/v2/pages/`, { minimum: '100%' });
        props.page = _.find(pages, { slug: pageSlug });
        props.parentPages = [];
        let parentID = props.page.parent;
        while (parentID) {
            let parentPage = _.find(pages, { id: parentID });
            if (!parentPage) {
                break;
            }
            props.parentPages.push(parentPage);
            parentID = parentPage.parent;
        }
        props.childPages = _.find(pages, { parent: props.page.id });
        return <PagePageSync {...props} />;
    }
}

class PagePageSync extends PureComponent {
    static displayName = 'PagePageSync';

    render() {
        let { route, page, parentPages, childPages, transform } = this.props;
        let trail = [];
        for (let parentPage of parentPages) {
            let title = _.get(parentPage, 'title.rendered', '');
            let url = route.getObjectURL(parentPage);
            trail.push({ label: <HTML text={title} />, url })
        }
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PageView page={page} transform={route.transformNode} />
                <PageList route={route} pages={childPages} />
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
