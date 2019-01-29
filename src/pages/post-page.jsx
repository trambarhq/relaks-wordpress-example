import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

import Breadcrumb from 'widgets/breadcrumb';
import PostView from 'widgets/post-view';
import TagList from 'widgets/tag-list';
import CommentSection from 'widgets/comment-section';

class PostPage extends AsyncComponent {
    static displayName = 'PostPage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let { postSlug } = route.params;
        let props = { route };
        props.post = await wp.fetchOne('/wp/v2/posts/', postSlug);
        meanwhile.show(<PostPageSync {...props} />);
        props.categories = await this.findCategoryChain(props.post.categories);
        meanwhile.show(<PostPageSync {...props} />);
        props.author = await wp.fetchOne('/wp/v2/users/', props.post.author);
        meanwhile.show(<PostPageSync {...props} />);
        props.tags = await wp.fetchMultiple('/wp/v2/tags/', props.post.tags);
        if (!wp.ssr) {
            meanwhile.show(<PostPageSync {...props} />);
            props.comments = await wp.fetchList(`/wp/v2/comments/?post=${props.post.id}`);
        }
        return <PostPageSync {...props} />;
    }

    async findCategoryChain(ids) {
        let { wp, route } = this.props;
        let allCategories = await wp.fetchList('/wp/v2/categories/', { minimum: '100%' });

        // add categories, including their parents as well
        let applicable = [];
        let include = (id) => {
            let category = _.find(allCategories, { id })
            if (category) {
                if (!_.includes(applicable, category)) {
                    applicable.push(category);
                }
                // add parent category as well
                include(category.parent);
            }
        };
        for (let id of ids) {
            include(id);
        }

        // see how recently a category was visited
        let historyIndex = (c) => {

            return _.findLastIndex(route.history, { params: { categorySlug: c.slug }});
        };
        // see how deep a category is
        let depth = (c) => {
            if (c.parent) {
                let parent = _.find(allCategories, { id: c.parent });
                if (parent) {
                    return depth(parent) + 1;
                }
            }
            return 0;
        };

        // order applicable categories based on how recently it was visited,
        // how deep it is, and alphabetically; the first criteria makes our
        // breadcrumb works more sensibly
        applicable = _.orderBy(applicable, [ historyIndex, depth, 'name' ], [ 'desc', 'desc', 'asc' ]);
        let anchorCategory = _.first(applicable);

        let trail = [];
        if (anchorCategory) {
            // add category and its ancestors
            for (let c = anchorCategory; c; c = _.find(applicable, { id: c.parent })) {
                trail.unshift(c);
            }
            // add applicable child categories
            for (let c = anchorCategory; c; c = _.find(applicable, { parent: c.id })) {
                if (c !== anchorCategory) {
                    trail.push(c);
                }
            }
        }
        return trail;
    }
}

class PostPageSync extends PureComponent {
    static displayName = 'PostPageSync';

    render() {
        let { route, categories, post, author, tags, comments } = this.props;
        let trail = [ { label: 'Categories' } ];
        for (let category of categories) {
            let label = _.get(c, 'name', '');
            let url = route.prefetchObjectURL(category);
            trail.push({ label, url });
        }
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostView post={post} author={author} transform={route.transformNode} />
                <TagList route={route} tags={tags} />
                <CommentSection comments={comments} />
            </div>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PostPage.propTypes = {
        wp: PropTypes.instanceOf(WordPress),
        route: PropTypes.instanceOf(Route),
    };
    PostPageSync.propTypes = {
        categories: PropTypes.arrayOf(PropTypes.object),
        tags: PropTypes.arrayOf(PropTypes.object),
        post: PropTypes.object,
        author: PropTypes.object,
        comments: PropTypes.arrayOf(PropTypes.object),
        route: PropTypes.instanceOf(Route),
    };
}

export {
    PostPage as default,
    PostPage,
    PostPageSync,
};
