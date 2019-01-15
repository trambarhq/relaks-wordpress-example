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
        props.categories = await wp.fetchList('/wp/v2/categories/');
        meanwhile.show(<ArchivePageSync {...props} />);
        let url = `/wp/v2/posts/?after=${after}&before=${before}`;
        if (categorySlug) {
            let category = _.find(props.categories, { slug: categorySlug });
            url = `/wp/v2/posts/?after=${after}&before=${before}&categories=${category.id}`;
        }
        props.posts = await wp.fetchList(url);
        return <ArchivePageSync {...props} />;
    }
}

class ArchivePageSync extends PureComponent {
    static displayName = 'ArchivePageSync';

    render() {
        let { route, categories, posts, month } = this.props;
        let { monthSlug, categorySlug } = route.params;
        let monthLabel = month.format('MMMM YYYY');
        let monthURL = route.find([ monthSlug ]);
        let trail = [ { label: 'Archive' } ];
        if (categorySlug) {
            let category = _.find(categories, { slug: categorySlug });
            let categoryLabel = _.get(category, 'name', '');
            trail.push({ label: monthLabel, url: monthURL });
            trail.push({ label: categoryLabel });
        } else {
            trail.push({ label: monthLabel });
        }
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostList route={route} posts={posts} month={month} categories={categories} minimum={100} />
            </div>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    ArchivePage.propTypes = {
        wp: PropTypes.instanceOf(WordPress),
        route: PropTypes.instanceOf(Route),
    };
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
