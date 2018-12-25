import Moment from 'moment';
import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

import Breadcrumb from 'widgets/breadcrumb';
import PostList from 'widgets/post-list';

class ArchivePage extends AsyncComponent {
    static displayName = 'ArchivePage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let { monthSlug, categorySlug } = route.params;
        let month = Moment(monthSlug);
        let props = {
            route,
            month,
        };
        let after = month.toISOString();
        let before = month.clone().endOf('month').toISOString();
        meanwhile.show(<ArchivePageSync {...props} />);
        if (categorySlug) {
            props.category = await wp.fetchOne(`/wp/v2/categories`, categorySlug);
            meanwhile.show(<ArchivePageSync {...props} />);
            props.posts = await wp.fetchList(`/wp/v2/posts/?after=${after}&before=${before}&categories=${props.category.id}`);
        } else {
            props.posts = await wp.fetchList(`/wp/v2/posts/?after=${after}&before=${before}`);
        }
        return <ArchivePageSync {...props} />;
    }
}

class ArchivePageSync extends PureComponent {
    static displayName = 'ArchivePageSync';

    render() {
        let { route, category, posts, month } = this.props;
        let { monthSlug, categorySlug } = route.params;
        let monthLabel = month.format('MMMM YYYY');
        let monthURL = route.find([ monthSlug ]);
        let trail = [ { label: 'Archive' } ];
        if (categorySlug) {
            let categoryLabel = _.get(category, 'name', '');
            trail.push({ label: monthLabel, url: monthURL });
            trail.push({ label: categoryLabel });
        } else {
            trail.push({ label: monthLabel });
        }
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostList route={route} posts={posts} month={month} category={category} />
            </div>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    ArchivePageSync.propTypes = {
        category: PropTypes.object,
        posts: PropTypes.arrayOf(PropTypes.object),
        month: PropTypes.instanceOf(Moment),
        route: PropTypes.instanceOf(Route),
    };
}

export {
    ArchivePage as default,
    ArchivePage,
    ArchivePageSync,
};
