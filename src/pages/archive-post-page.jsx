import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

import Breadcrumb from 'widgets/breadcrumb';
import PostView from 'widgets/post-view';

class ArchivePostPage extends AsyncComponent {
    static displayName = 'AchivePostPage';

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let { monthSlug, categorySlug, postSlug } = route.params;
        let props = {
            route,
            month: Moment(monthSlug),
        };
        meanwhile.show(<ArchivePostPageSync {...props} />);
        if (categorySlug) {
            props.category = await wp.fetchOne('/wp/v2/categories/', categorySlug);
            meanwhile.show(<ArchivePostPageSync {...props} />);
        }
        props.post = await wp.fetchOne('/wp/v2/posts/', postSlug);
        return <ArchivePostPageSync {...props} />;
    }
}

class ArchivePostPageSync extends PureComponent {
    static displayName = 'ArchivePostPageSync';

    render() {
        let { route, month, category, post } = this.props;
        let { monthSlug, categorySlug } = route.params;
        let monthLabel = month.format('MMMM YYYY');
        let monthURL = route.find([ monthSlug ]);
        let trail = [ { label: 'Archive' } ];
        if (categorySlug) {
            let categoryLabel = _.get(category, 'name', '');
            let categoryURL = route.find([ monthSlug, categorySlug ]);
            trail.push({ label: monthLabel, url: monthURL });
            trail.push({ label: categoryLabel, url: categoryURL });
            console.log(categoryURL)
        } else {
            trail.push({ label: monthLabel, url: monthURL });
        }
        return (
            <div className="page">
                <Breadcrumb trail={trail} />
                <PostView category={category} post={post} />
            </div>
        );
    }
}

export {
    ArchivePostPage as default,
    ArchivePostPage,
    ArchivePostPageSync,
};
