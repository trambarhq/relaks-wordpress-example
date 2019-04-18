import _ from 'lodash';
import Moment from 'moment';
import React from 'react';
import Relaks, { useProgress } from 'relaks';

import { Breadcrumb } from 'widgets/breadcrumb';
import { PostView } from 'widgets/post-view';
import { TagList } from 'widgets/tag-list';
import { CommentSection } from 'widgets/comment-section';

async function PostPage(props) {
    const { wp, route } = props;
    const { postSlug } = route.params;
    const [ show ] = useProgress();

    render();
    const post = await wp.fetchPost(postSlug);
    render();
    const categories = await findCategoryChain(post);
    render();
    const author = await wp.fetchAuthor(post);
    render();
    const tags = await wp.fetchTagsOfPost(post);
    render()
    let comments;
    if (!wp.ssr) {
        comments = await wp.fetchComments(post);
        render();
    }

    function render() {
        const trail = [ { label: 'Categories' } ];
        if (categories) {
            for (let category of categories) {
                const label = _.get(category, 'name', '');
                const url = route.prefetchObjectURL(category);
                trail.push({ label, url });
            }
        }
        show(
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostView post={post} author={author} transform={route.transformNode} />
                <TagList route={route} tags={tags} />
                <CommentSection comments={comments} />
            </div>
        );
    }

    async function findCategoryChain(post) {
        if (!post) return [];
        const allCategories = await wp.fetchCategories();

        // add categories, including their parents as well
        const applicable = [];
        const include = (id) => {
            let category = _.find(allCategories, { id })
            if (category) {
                if (!_.includes(applicable, category)) {
                    applicable.push(category);
                }
                // add parent category as well
                include(category.parent);
            }
        };
        for (let id of post.categories) {
            include(id);
        }

        // see how recently a category was visited
        const historyIndex = (category) => {
            const predicate = { params: { categorySlug: category.slug }};
            return _.findLastIndex(route.history, predicate);
        };
        // see how deep a category is
        const depth = (category) => {
            if (category.parent) {
                const predicate = { id: category.parent };
                const parent = _.find(allCategories, predicate);
                if (parent) {
                    return depth(parent) + 1;
                }
            }
            return 0;
        };

        // order applicable categories based on how recently it was visited,
        // how deep it is, and alphabetically; the first criteria makes our
        // breadcrumb works more sensibly
        const ordered = _.orderBy(applicable, [ historyIndex, depth, 'name' ], [ 'desc', 'desc', 'asc' ]);
        const anchorCategory = _.first(ordered);

        const trail = [];
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

const component = Relaks.memo(PostPage);

export {
    component as default,
    component as PostPage,
};
