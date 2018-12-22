import _ from 'lodash';
import Moment from 'moment';
import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import { Route } from 'routing';
import WordPress from 'wordpress';

class SideNav extends AsyncComponent {
    static displayName = 'SideNav';

    constructor(props) {
        super(props);
        let { route } = this.props;
        let selectedYear;
        if (route.params.month) {
            selectedYear = parseInt(route.params.month.substr(0, 4));
        } else {
            selectedYear = Moment().year();
        }
        this.state = {
            selectedYear
        };
    }

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let { selectedYear } = this.state;
        let props = {
            route,
            selectedYear,
            onYearSelect: this.handleYearSelect,
        };
        meanwhile.delay(50, 50);
        meanwhile.show(<SideNavSync {...props} />);
        props.categories = await wp.fetchList('/wp/v2/categories/');
        meanwhile.show(<SideNavSync {...props} />);

        // get the latest post and the earliest post
        let latestPosts =  await wp.fetchList('/wp/v2/posts/');
        let latestPost = _.first(latestPosts);
        let earliestPosts = await wp.fetchList(`/wp/v2/posts/?order=asc&per_page=1`)
        let earliestPost = _.first(earliestPosts);

        // build the archive tree
        props.archive = [];
        if (latestPost && earliestPost) {
            let lastMonthEnd = Moment(latestPost.date_gmt).endOf('month');
            let firstMonthStart = Moment(earliestPost.date_gmt).startOf('month');
            let currentYearEntry;
            // loop from the last month to the first
            let e = lastMonthEnd.clone();
            let s = e.clone().startOf('month');
            while (s >= firstMonthStart) {
                let year = s.year();
                let month = s.month() + 1;
                if (!currentYearEntry || currentYearEntry.year !== year) {
                    // start a new year
                    currentYearEntry = {
                        year,
                        label: s.format('YYYY'),
                        months: []
                    };
                    props.archive.push(currentYearEntry);
                }
                let monthEntry = {
                    month,
                    label: s.format('MMMM'),
                    slug: s.format('YYYY-MM'),
                    post: undefined,
                    start: s.clone(),
                    end: e.clone(),
                 };
                currentYearEntry.months.push(monthEntry);

                e.subtract(1, 'month');
                s.subtract(1, 'month');
            }
            meanwhile.show(<SideNavSync {...props} />);

            // load the posts of the selected year
            for (let yearEntry of props.archive) {
                if (yearEntry.year === selectedYear) {
                    for (let monthEntry of yearEntry.months) {
                        let before = monthEntry.end.toISOString();
                        let after = monthEntry.start.toISOString();
                        let url = `/wp/v2/posts/?before=${before}&after=${after}`;
                        monthEntry.posts = await wp.fetchList(url);

                        // force prop change
                        props.archive = _.clone(props.archive);
                        meanwhile.show(<SideNavSync {...props} />);
                    }
                }
            }
        }
        return <SideNavSync {...props} />;
    }

    handleYearSelect = (evt) => {
        this.setState({ selectedYear: evt.year });
    }
}

class SideNavSync extends PureComponent {
    static displayName = 'SideNavSync';

    render() {
        return (
            <div className="side-nav">
                {this.renderCategories()}
                {this.renderArchive()}
            </div>
        )
    }

    renderCategories() {
        let { categories } = this.props;
        if (!categories) {
            return null;
        }
        // don't show categories with no post
        categories = _.filter(categories, 'count');
        // list category with more posts first
        categories = _.orderBy(categories, [ 'count', 'name' ], [ 'desc', 'asc' ]);
        return (
            <ul className="categories">
            {
                categories.map((category, i) => {
                    return this.renderCategory(category, i);
                })
            }
            </ul>
        )
    }

    renderCategory(category, i) {
        let name = _.get(category, 'name', '');
        let description = _.get(category, 'description', '');
        let slug = _.get(category, 'slug', '');
        let url = '';
        return (
            <li key={i}>
                <a href={url} title={description}>{name}</a>
            </li>
        );
    }

    renderArchive() {
        let { archive } = this.props;
        if (!archive) {
            return null;
        }
        return (
            <ul className="archive">
            {
                archive.map((entry, i) => {
                    return this.renderYear(entry, i);
                })
            }
            </ul>
        );
    }

    renderYear(yearEntry, i) {
        let { selectedYear } = this.props;
        let labelClass = 'year';
        let listClass = 'months';
        if (yearEntry.year === selectedYear) {
            labelClass += ' selected';
        } else {
            listClass += ' collapsed';
        }
        return (
            <li key={i}>
                <span className={labelClass} data-year={yearEntry.year} onClick={this.handleYearClick}>
                    {yearEntry.label}
                </span>
                <ul className={listClass}>
                {
                    yearEntry.months.map((entry, i) => {
                        return this.renderMonth(entry, i);
                    })
                }
                </ul>
            </li>
        )
    }

    renderMonth(monthEntry, i) {
        let url;
        if (!_.isEmpty(monthEntry.posts) || _.isUndefined(monthEntry.posts)) {
            url = '#';
        }
        return (
            <li key={i}>
                <a href={url}>{monthEntry.label}</a>
            </li>
        );
    }

    handleYearClick = (evt) => {
        let { onYearSelect } = this.props;
        let year = parseInt(evt.currentTarget.getAttribute('data-year'));
        if (onYearSelect) {
            onYearSelect({
                type: 'yearselect',
                target: this,
                year,
            });
        }
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    SideNav.propTypes = {
        wp: PropTypes.instanceOf(WordPress).isRequired,
        route: PropTypes.instanceOf(Route).isRequired,
    };
    SideNavSync.propTypes = {
        categories: PropTypes.arrayOf(PropTypes.object),
        archive: PropTypes.arrayOf(PropTypes.object),
        selectedYear: PropTypes.number,
        route: PropTypes.instanceOf(Route),
        onYearSelect: PropTypes.func,
    };
}

export {
    SideNav as default,
    SideNav,
    SideNavSync,
};
