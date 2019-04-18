import _ from 'lodash';
import Moment from 'moment';
import React, { useEffect } from 'react';

import { PostListView } from 'widgets/post-list-view';

function PostList(props) {
    const { route, posts, medias, minimum, maximum } = props;

    useEffect(() => {
        const handleScroll = (evt) => {
            loadMore(0.5);
        };
        document.addEventListener('scroll', handleScroll);

        return () => {
            document.removeEventListener('scroll', handleScroll);
        };
    });
    useEffect(() => {
        if (posts && posts.more && posts.length < minimum) {
            posts.more();
        } else {
            loadMore(0.75);
        }
    }, [ posts ]);

    if (!posts) {
        return null;
    }
    return (
        <div className="posts">
            {posts.map(renderPost)}
        </div>
    );

    function renderPost(post, i) {
        let media = _.find(medias, { id: post.featured_media });
        return <PostListView route={route} post={post} media={media} key={post.id} />
    }

    function loadMore(fraction) {
        const { scrollTop, scrollHeight } = document.body.parentNode;
        if (scrollTop > scrollHeight * fraction) {
            if (posts && posts.more && posts.length < maximum) {
                posts.more();
            }
        }        
    }
}

PostList.defaultProps = {
    minimum: 20,
    maximum: 500,
};

export {
    PostList,
};
