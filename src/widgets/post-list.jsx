import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';
import { Route } from 'routing';

import PostListView from 'widgets/post-list-view';

class PostList extends PureComponent {
    static displayName = 'PostList'

    render() {
        let { route, posts, medias } = this.props;
        if (!posts) {
            return null;
        }
        return (
            <div className="posts">
            {
                posts.map((post) => {
                    let media = _.find(medias, { id: post.featured_media });
                    return <PostListView route={route} post={post} media={media} key={post.id} />
                })
            }
            </div>
        );
    }

    componentDidMount() {
        document.addEventListener('scroll', this.handleScroll);
        this.componentDidUpdate();
    }

    componentDidUpdate(prevProps, prevState) {
        let { posts, minimum, maximum } = this.props;
        if (posts && posts.length < minimum) {
            posts.more();
        } else {
            // load more records if we're still near the bottom
            let { scrollTop, scrollHeight } = document.body.parentNode;
            if (scrollTop > scrollHeight * 0.75) {
                if (posts && posts.length < maximum) {
                    posts.more();
                }
            }
        }
    }

    componentWillUnmount() {
        document.removeEventListener('scroll', this.handleScroll);
    }

    handleScroll = (evt) => {
        let { posts, maximum } = this.props;
        let { scrollTop, scrollHeight } = document.body.parentNode;
        if (scrollTop > scrollHeight * 0.5) {
            if (posts && posts.length < maximum) {
                posts.more();
            }
        }
    }
}

PostList.defaultProps = {
    minimum: 20,
    maximum: 500,
};

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PostList.propTypes = {
        posts: PropTypes.arrayOf(PropTypes.object),
        medias: PropTypes.arrayOf(PropTypes.object),
        route: PropTypes.instanceOf(Route),
        minimum: PropTypes.number,
        maximum: PropTypes.number,
    };
}

export {
    PostList as default,
    PostList,
};
