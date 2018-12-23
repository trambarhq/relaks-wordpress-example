import Moment from 'moment';
import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';

import PostList from 'widgets/post-list';

class ArchivePage extends AsyncComponent {
    static displayName = 'ArchivePage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let month = Moment(route.params.month);
        let props = {
            route,
            month,
        };
        meanwhile.show(<ArchivePageSync {...props} />);
        let after = month.toISOString();
        let before = month.clone().endOf('month').toISOString();
        props.posts = await wp.fetchList(`/wp/v2/posts/?after=${after}&before=${before}`);
        return <ArchivePageSync {...props} />;
    }
}

class ArchivePageSync extends PureComponent {
    static displayName = 'ArchivePageSync';

    render() {
        let { route, posts, month } = this.props;
        let label = month.format('MMMM YYYY');
        return (
            <div className="page">
                <h4>
                    <span>Archive > </span>
                    <span>{label}</span>
                </h4>
                <PostList route={route} posts={posts} />
            </div>
        );
    }
}

export {
    ArchivePage as default,
    ArchivePage,
    ArchivePageSync,
};
