import React from 'react';
import Relaks, { useProgress } from 'relaks/hooks';

import PostList from 'widgets/post-list';

async function WelcomePage(props) {
    const { wp, route } = props;
    const [ show ] = useProgress();

    render();
    const posts = await wp.fetchPosts();
    render();
    const medias = await wp.fetchFeaturedMedias(posts, 10);
    render();

    function render() {
        show(
            <div className="page">
                <PostList route={route} posts={posts} medias={medias} minimum={40} />
            </div>
        );
    }
}

const component = Relaks(WelcomePage);

export {
    component as default,
    component as WelcomePage,
};
