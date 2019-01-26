import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

import Breadcrumb from 'widgets/breadcrumb';
import PostView from 'widgets/post-view';
import CommentSection from 'widgets/comment-section';

class PostPage extends AsyncComponent {
    static displayName = 'AchivePostPage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let { postSlug } = route.params;
        let props = {
            route,
        };
        meanwhile.show(<PostPageSync {...props} />);
        props.post = await wp.fetchOne('/wp/v2/posts/', postSlug);
        meanwhile.show(<PostPageSync {...props} />);
        let allCategories = await wp.fetchList('/wp/v2/categories/', { minimum: '100%' });
        props.categories = findMatchingCategories(allCategories, props.post.categories, route.history);
        meanwhile.show(<PostPageSync {...props} />);
        props.author = await wp.fetchOne('/wp/v2/users/', props.post.author);
        if (!wp.ssr) {
            meanwhile.show(<PostPageSync {...props} />);
            props.comments = await wp.fetchList(`/wp/v2/comments/?post=${props.post.id}`);
        }
        return <PostPageSync {...props} />;
    }
}

class PostPageSync extends PureComponent {
    static displayName = 'PostPageSync';

    render() {
        let { route, categories, post, author, comments } = this.props;
        let trail = [ { label: 'Categories' } ];
        for (let c of categories) {
            let label = _.get(c, 'name', '');
            let url = route.getObjectURL(c);
            trail.push({ label, url });
        }
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostView post={post} author={author} transform={route.transformLink} />
                <CommentSection comments={comments} />
            </div>
        );
    }
}

function includeCategory(list, id, allCategories) {
    let category = _.find(allCategories, { id })
    if (category) {
        if (!_.includes(list, category)) {
            list.push(category);
        }
        // add parent category as well
        includeCategory(list, category.parent, allCategories);
    }
}

function findMatchingCategories(allCategories, ids, history) {
    let applicable = [];
    for (let id of ids) {
        includeCategory(applicable, id, allCategories);
    }

    let historyIndex = (c) => {
        return _.findLastIndex(history, (route) => {
            if (route.params.categorySlugs) {
                return _.includes(route.params.categorySlugs, c.slug);
            }
        });
    };
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
    // how deep it is, and alphabetically
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

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PostPage.propTypes = {
        wp: PropTypes.instanceOf(WordPress),
        route: PropTypes.instanceOf(Route),
    };
    PostPageSync.propTypes = {
        categories: PropTypes.arrayOf(PropTypes.object),
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
