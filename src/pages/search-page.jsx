import React from 'react';
import Relaks, { useProgress } from 'relaks/hooks';

import Breadcrumb from 'widgets/breadcrumb';
import PostList from 'widgets/post-list';

async function SearchPage(props) {
    const { wp, route } = props;
    const { search } = route.params;
    const [ show ] = useProgress();

    render();
    const posts = await wp.fetchMatchingPosts(search);
    render();

    function render() {
        const trail = [ { label: 'Search' } ];
        if (posts) {
            const count = posts.total;
            if (typeof(count) === 'number') {
                const s = (count === 1) ? '' : 's';
                const msg = `${count} matching article${s}`;
                trail.push({ label: msg });
            }
        } else {
            trail.push({ label: '...' });
        }
        show(
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostList route={route} posts={posts} minimum={40} maximum={1000} />
            </div>
        );
    }
}

const component = Relaks(SearchPage);

export {
    component as default,
    component as SearchPage,
};
