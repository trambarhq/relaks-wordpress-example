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
        let { monthSlug, categorySlug, postSlug } = route.params;
        let props = {
            route,
        };
        if (monthSlug) {
            props.month = Moment(monthSlug);
        }
        meanwhile.show(<PostPageSync {...props} />);
        if (categorySlug) {
            props.category = await wp.fetchOne('/wp/v2/categories/', categorySlug);
            meanwhile.show(<PostPageSync {...props} />);
        }
        props.post = await wp.fetchOne('/wp/v2/posts/', postSlug);
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
        let { route, month, category, post, author, comments } = this.props;
        let { monthSlug, categorySlug } = route.params;
        let trail = [];
        if (monthSlug) {
            let monthLabel = month.format('MMMM YYYY');
            let monthURL = route.find([ monthSlug ]);
            trail.push({ label: 'Archive' });
            trail.push({ label: monthLabel, url: monthURL });
        }
        if (categorySlug) {
            let categoryLabel = _.get(category, 'name', '');
            let categoryURL;
            if (monthSlug) {
                categoryURL = route.find([ monthSlug, categorySlug ]);
            } else {
                trail.push({ label: 'Categories' });
                categoryURL = route.find([ categorySlug ]);
            }
            trail.push({ label: categoryLabel, url: categoryURL });
        }
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostView category={category} post={post} author={author} transform={route.transformLink} />
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
        category: PropTypes.object,
        post: PropTypes.object,
        author: PropTypes.object,
        comments: PropTypes.arrayOf(PropTypes.object),
        month: PropTypes.instanceOf(Moment),
        route: PropTypes.instanceOf(Route),
    };
}

export {
    PostPage as default,
    PostPage,
    PostPageSync,
};
