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
        let { pageSlugs } = route.params;
        let props = {
            route,
        };
        meanwhile.show(<PagePageSync {...props} />);
        props.pages = await wp.fetchMultiple('/wp/v2/pages/', pageSlugs);
        meanwhile.show(<PagePageSync {...props} />);
        let page = _.last(props.pages);
        props.childPages = await wp.fetchList(`/wp/v2/pages/?parent=${page.id}`, { minimum: '100%' });
        return <PagePageSync {...props} />;
    }
}

class PagePageSync extends PureComponent {
    static displayName = 'PagePageSync';

    render() {
        let { route, pages, childPages, transform } = this.props;
        let page = _.last(pages);
        let trail = [];
        for (let p of pages) {
            if (p !== page) {
                let title = _.get(page, 'title.rendered', '');
                let url = route.getObjectURL(p);
                trail.push({ label: <HTML text={title} />, url })
            }
        }
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PageView page={page} transform={route.transformLink} />
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
