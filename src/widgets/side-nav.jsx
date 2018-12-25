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
        let { monthSlug } = route.params;
        let selectedYear;
        if (monthSlug) {
            selectedYear = parseInt(monthSlug.substr(0, 4));
        } else {
            selectedYear = Moment().year();
        }
        this.state = {
            selectedYear
        };
    }

    async renderAsync(meanwhile) {
        let { wp, route } = this.props;
        let { monthSlug } = route.params;
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
            let lastPostDate = Moment(latestPost.date_gmt);
            let firstPostDate = Moment(earliestPost.date_gmt);
            // loop through the years
            let lastYear = lastPostDate.year();
            let firstYear = firstPostDate.year();
            for (let y = lastYear; y >= firstYear; y--) {
                let yearEntry = {
                    year: y,
                    label: Moment(`${y}-01-01`).format('YYYY'),
                    months: []
                };
                props.archive.push(yearEntry);

                // loop through the months
                let lastMonth = (y === lastYear) ? lastPostDate.month() : 11;
                let firstMonth = (y === firstYear) ? firstPostDate.month() : 0;
                for (let m = lastMonth; m >= firstMonth; m--) {
                    let start = Moment(new Date(y, m, 1));
                    let end = start.clone().endOf('month');
                    let monthEntry = {
                        month: m + 1,
                        label: start.format('MMMM'),
                        slug: start.format('YYYY-MM'),
                        post: undefined,
                        start,
                        end,
                    };
                    yearEntry.months.push(monthEntry);
                }
            }
            meanwhile.show(<SideNavSync {...props} />);

            // load the posts of the selected year
            for (let yearEntry of props.archive) {
                if (yearEntry.year === selectedYear) {
                    for (let monthEntry of yearEntry.months) {
                        let after = monthEntry.start.toISOString();
                        let before = monthEntry.end.toISOString();
                        monthEntry.posts = await wp.fetchList(`/wp/v2/posts/?after=${after}&before=${before}`);

                        // force prop change
                        props.archive = _.clone(props.archive);
                        meanwhile.show(<SideNavSync {...props} />);
                    }
                }
            }

            // load the posts of each categories
            props.categoryPosts = [];
            for (let category of props.categories) {
                let url;
                if (monthSlug) {
                    let month = Moment(monthSlug);
                    let after = month.toISOString();
                    let before = month.endOf('month').toISOString();
                    url = `/wp/v2/posts/?after=${after}&before=${before}&categories=${category.id}`;
                } else {
                    url = `/wp/v2/posts/?categories=${category.id}`;
                }
                let posts = await wp.fetchList(url);
                props.categoryPosts = _.clone(props.categoryPosts);
                props.categoryPosts.push(posts);
                meanwhile.show(<SideNavSync {...props} />);
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
        let { route, categoryPosts } = this.props;
        let { monthSlug } = route.params;
        let name = _.get(category, 'name', '');
        let description = _.get(category, 'description', '');
        let categorySlug = _.get(category, 'slug', '');
        let slugs = [ categorySlug ];
        if (monthSlug) {
            slugs.unshift(monthSlug);
        }
        let url = route.find(slugs);
        let posts = (categoryPosts) ? categoryPosts[i] : undefined;
        if (_.isEmpty(posts) && !_.isUndefined(posts)) {
            url = undefined;
        }
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
        let { route } = this.props;
        let url = route.find([ monthEntry.slug ]);
        if (_.isEmpty(monthEntry.posts) && !_.isUndefined(monthEntry.posts)) {
            url = undefined;
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
        categoryPosts: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)),
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
