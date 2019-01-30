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
        let props = { route };
        meanwhile.show(<ArchivePageSync {...props} />);
        props.posts = await wp.fetchPostsInMonth(date);
        return <ArchivePageSync {...props} />;
    }
}

class ArchivePageSync extends PureComponent {
    static displayName = 'ArchivePageSync';

    render() {
        let { route, posts } = this.props;
        let { date } = route.params;
        let month = Moment(new Date(date.year, date.month, 1));
        let monthLabel = month.format('MMMM YYYY');
        let trail = [ { label: 'Archives' }, { label: monthLabel } ];
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
