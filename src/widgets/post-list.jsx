import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';
import { Route } from 'routing';

import PostListView from 'widgets/post-list-view';

class PostList extends PureComponent {
    static displayName = 'PostList'

    render() {
        let { route, posts } = this.props;
        if (!posts) {
            return null;
        }
        return (
            <div className="posts">
            {
                posts.map((post) => {
                    return <PostListView route={route} post={post} key={post.id} />
                })
            }
            </div>
        )
    }

    componentDidMount() {
        document.addEventListener('scroll', this.handleScroll);
        this.componentDidUpdate();
    }

    componentDidUpdate(prevProps, prevState) {
        let { posts, minimum } = this.props;
        if (posts && posts.length < minimum) {
            posts.more();
        }
    }

    componentWillUnmount() {
        document.removeEventListener('scroll', this.handleScroll);
    }

    handleScroll = (evt) => {
        let { posts, maximum } = this.props;
        let { scrollTop, scrollHeight } = document.body.parentNode;
        if (scrollTop > (scrollHeight / 2)) {
            if (posts && posts.length < maximum) {
                posts.more();
            }
        }
    }
}

PostList.defaultProps = {
    minimum: 20,
    maximum: 1000,
};

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PostList.propTypes = {
        route: PropTypes.instanceOf(Route),
        minimum: PropTypes.number,
        maximum: PropTypes.number,
    };
}

export {
    PostList as default,
    PostList,
};
