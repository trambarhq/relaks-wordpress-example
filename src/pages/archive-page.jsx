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
        let { date } = route.params;
        let month = Moment(`${date.year}-${date.month}`);
        let props = {
            route,
            month,
        };
        meanwhile.show(<ArchivePageSync {...props} />);
        let after = month.toISOString();
        let before = month.clone().endOf('month').toISOString();
        let url = `/wp/v2/posts/?after=${after}&before=${before}`;
        props.posts = await wp.fetchList(url);
        return <ArchivePageSync {...props} />;
    }
}

class ArchivePageSync extends PureComponent {
    static displayName = 'ArchivePageSync';

    render() {
        let { route, posts, month } = this.props;
        let monthLabel = month.format('MMMM YYYY');
        let trail = [ { label: 'Archive' }, { label: monthLabel } ];
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostList route={route} posts={posts} minimum={100} />
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
