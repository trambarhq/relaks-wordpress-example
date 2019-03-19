import _ from 'lodash';
import React from 'react';
import Relaks, { useProgress } from 'relaks/hooks';

import Breadcrumb from 'widgets/breadcrumb';
import PostList from 'widgets/post-list';

async function TagPage(props) {
    const { wp, route } = props;
    const { tagSlug } = route.params;
    const [ show ] = useProgress();

    render();
    const tag = await wp.fetchTag(tagSlug);
    render();
    const posts = await wp.fetchPostsWithTag(tag);
    render();

    function render() {
        const tagLabel = _.get(tag, 'name', '');
        const trail = [ { label: 'Tags' }, { label: tagLabel } ];
        show(
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostList route={route} posts={posts} minimum={40} />
            </div>
        );
    }
}

const component = Relaks(TagPage);

export {
    component as default,
    component as TagPage,
};
