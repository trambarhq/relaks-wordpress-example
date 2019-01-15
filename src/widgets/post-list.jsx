import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';
import { Route } from 'routing';

import PostListView from 'widgets/post-list-view';

class PostList extends PureComponent {
    static displayName = 'PostList'

    render() {
        let { route, posts, categories, month, authors } = this.props;
        if (!posts) {
            return null;
        }
        return (
            <div className="posts">
            {
                posts.map((post, i) => {
                    let author = _.find(authors, { id: post.author_id });
                    let category = _.find(categories, { id: post.categories[0] });
                    return <PostListView route={route} month={month} category={category} post={post} author={author} key={i} />
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
        if (posts.length < minimum) {
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
            if (posts.length < maximum) {
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
        categories: PropTypes.arrayOf(PropTypes.object),
        month: PropTypes.instanceOf(Moment),
        route: PropTypes.instanceOf(Route),
        minimum: PropTypes.number,
        maximum: PropTypes.number,
    };
}

export {
    PostList as default,
    PostList,
};
