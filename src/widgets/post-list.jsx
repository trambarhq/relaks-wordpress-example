import _ from 'lodash';
import React, { PureComponent } from 'react';

import PostListView from 'widgets/post-list-view';

class PostList extends PureComponent {
    static displayName = 'PostList'

    render() {
        let { route, posts, category, month, authors } = this.props;
        if (!posts) {
            return null;
        }
        return (
            <div className="posts">
            {
                posts.map((post, i) => {
                    let author = _.find(authors, { id: post.author_id });
                    return <PostListView route={route} month={month} category={category} post={post} author={author} key={i} />
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
