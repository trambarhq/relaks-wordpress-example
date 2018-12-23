import _ from 'lodash';
import React, { PureComponent } from 'react';

import PostListView from 'widgets/post-list-view';

class PostList extends PureComponent {
    static displayName = 'PostList'

    render() {
        let { posts, authors } = this.props;
        if (!posts) {
            return null;
        }
        return (
            <div className="posts">
            {
                posts.map((post) => {
                    let author = _.find(authors, { id: post.author_id });
                    return <PostListView post={post} author={author} />
                })
            }
            </div>
        )
    }
}

export {
    PostList as default,
    PostList,
};
