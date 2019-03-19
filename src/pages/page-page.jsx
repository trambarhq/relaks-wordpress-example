import _ from 'lodash';
import React from 'react';
import Relaks, { useProgress } from 'relaks/hooks';

import HTML from 'widgets/html';
import Breadcrumb from 'widgets/breadcrumb';
import PageView from 'widgets/page-view';
import PageList from 'widgets/page-list';

async function PagePage(props) {
    const { wp, route } = props;
    const { pageSlug } = route.params;
    const [ show ] = useProgress();

    render();
    const page = await wp.fetchPage(pageSlug);
    const parentPages = await wp.fetchParentPages(page);
    render();
    const childPages = await wp.fetchChildPages(page);
    render();

    function render() {
        const trail = [];
        if (parentPages) {
            for (let parentPage of parentPages) {
                const title = _.get(parentPage, 'title.rendered', '');
                const url = route.prefetchObjectURL(parentPage);
                trail.push({ label: <HTML text={title} />, url })
            }
        }
        show(
            <div className="page">
                <Breadcrumb trail={trail} />
                <PageView page={page} transform={route.transformNode} />
                <PageList route={route} pages={childPages} />
            </div>
        );
    }
}

const component = Relaks(PagePage);

export {
    component as default,
    component as PagePage,
};
