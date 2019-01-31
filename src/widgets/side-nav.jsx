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
        let { date } = route.params;
        let selectedYear = _.get(date, 'year', Moment().year());
        this.state = { selectedYear };
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

        // get all categories
        props.categories = await wp.fetchCategories();
        meanwhile.show(<SideNavSync {...props} />);

        // get top tags
        props.tags = await wp.fetchTopTags();
        meanwhile.show(<SideNavSync {...props} />);

        // get the date range of posts and use that to build the list of
        // years and months
        let range = await wp.getPostDateRange();
        props.archives = [];
        if (range) {
            // loop through the years
            let lastYear = range.latest.year();
            let firstYear = range.earliest.year();
            for (let y = lastYear; y >= firstYear; y--) {
                let yearEntry = {
                    year: y,
                    label: Moment(`${y}-01-01`).format('YYYY'),
                    months: []
                };
                props.archives.push(yearEntry);

                // loop through the months
                let lastMonth = (y === lastYear) ? range.latest.month() : 11;
                let firstMonth = (y === firstYear) ? range.earliest.month() : 0;
                for (let m = lastMonth; m >= firstMonth; m--) {
                    let start = Moment(new Date(y, m, 1));
                    let end = start.clone().endOf('month');
                    let monthEntry = {
                        year: y,
                        month: m + 1,
                        label: start.format('MMMM'),
                    };
                    yearEntry.months.push(monthEntry);
                }
            }
            meanwhile.show(<SideNavSync {...props} />);
        }

        if (!wp.ssr) {
            props.postLists = [];
            try {
                // load the posts of each month of the selected year
                for (let yearEntry of props.archives) {
                    if (yearEntry.year === selectedYear) {
                        for (let monthEntry of yearEntry.months) {
                            let posts = await wp.fetchPostsInMonth(monthEntry);
                            props.postLists = _.concat(props.postLists, { monthEntry, posts });
                            meanwhile.show(<SideNavSync {...props} />);
                        }
                    }
                }

                // load the posts of each category
                for (let category of props.categories) {
                    if (category.count > 0) {
                        let posts = await wp.fetchPostsInCategory(category);
                        props.postLists = _.concat(props.postLists, { category, posts });
                        meanwhile.show(<SideNavSync {...props} />);
                    }
                }

                // load the posts of each tag
                for (let tag of props.tags) {
                    if (tag.count > 0) {
                        let posts = await wp.fetchPostsWithTag(tag);
                        props.postLists = _.concat(props.postLists, { tag, posts });
                        meanwhile.show(<SideNavSync {...props} />);
                    }
                }
            } catch (err) {
            }
        }
        return <SideNavSync {...props} />;
    }

    handleYearSelect = (evt) => {
        let { selectedYear } = this.state;
        if (selectedYear !== evt.year) {
            selectedYear = evt.year;
        } else {
            selectedYear = NaN;
        }
        this.setState({ selectedYear });
    }
}

class SideNavSync extends PureComponent {
    static displayName = 'SideNavSync';

    render() {
        return (
            <div className="side-nav">
                {this.renderCategories()}
                {this.renderTags()}
                {this.renderArchives()}
            </div>
        )
    }

    renderCategories() {
        let { categories } = this.props;
        // only top-level categories
        categories = _.filter(categories, { parent: 0 });
        // don't show categories with no post
        categories = _.filter(categories, 'count');
        categories = _.orderBy(categories, [ 'name' ], [ 'asc' ]);
        if (_.isEmpty(categories)) {
            return null;
        }
        return (
            <div>
                <h3>Categories</h3>
                <ul className="categories">
                {
                    categories.map((category, i) => {
                        return this.renderCategory(category, i);
                    })
                }
                </ul>
            </div>
        );
    }

    renderCategory(category, i) {
        let { route, postLists } = this.props;
        let { categorySlug } = route.params;
        let name = _.get(category, 'name', '');
        let description = _.get(category, 'description', '');
        let url = route.prefetchObjectURL(category);
        let className;
        if (category.slug === categorySlug) {
            className = 'selected';
        } else {
            let postList = _.find(postLists, { category });
            if (hasRecentPost(postList, 1)) {
                className = 'highlighted';
            }
        }
        return (
            <li key={i}>
                <a className={className} href={url} title={description}>{name}</a>
                {this.renderSubcategories(category)}
            </li>
        );
    }

    renderTags() {
        let { tags } = this.props;
        // don't show tags with no post
        tags = _.filter(tags, 'count');
        // list tags with more posts first
        tags = _.orderBy(tags, [ 'count', 'name' ], [ 'desc', 'asc' ]);
        if (_.isEmpty(tags)) {
            return null;
        }
        return (
            <div>
                <h3>Tags</h3>
                <div className="tags">
                {
                    tags.map((tag, i) => {
                        return this.renderTag(tag, i);
                    })
                }
                {this.renderMoreTagButton()}
                </div>
            </div>
        );
    }

    renderTag(tag, i) {
        let { route, postLists } = this.props;
        let { tagSlug } = route.params;
        let name = _.get(tag, 'name', '');
        let description = _.get(tag, 'description', '');
        let url = route.prefetchObjectURL(tag);
        let className;
        if (tag.slug === tagSlug) {
            className = 'selected';
        } else {
            let postList = _.find(postLists, { tag });
            if (hasRecentPost(postList, 1)) {
                className = 'highlighted';
            }
        }
        return (
            <span key={i}>
                <a className={className} href={url} title={description} key={i}>{name}</a>
                {' '}
            </span>
        );
    }

    renderMoreTagButton() {
        let { tags } = this.props;
        if (!_.some(tags, 'count')) {
            return null;
        }
        if (!(tags.length < tags.total) || tags.length >= 100) {
            return null;
        }
        return <a className="more" onClick={this.handleMoreTagClick}>... more</a>;
    }

    renderSubcategories(category) {
        let { categories } = this.props;
        let subcategories = _.filter(categories, { parent: category.id });
        subcategories = _.filter(subcategories, 'count');
        subcategories = _.orderBy(subcategories, [ 'count', 'name' ], [ 'desc', 'asc' ]);
        if (_.isEmpty(subcategories)) {
            return null;
        }
        return (
            <ul className="subcategories">
            {
                subcategories.map((subcategory, i) => {
                    return this.renderCategory(subcategory, i);
                })
            }
            </ul>
        );
    }

    renderArchives() {
        let { archives } = this.props;
        if (_.isEmpty(archives)) {
            return null;
        }
        return (
            <div>
                <h3>Archives</h3>
                <ul className="archives">
                {
                    archives.map((yearEntry, i) => {
                        return this.renderYear(yearEntry, i);
                    })
                }
                </ul>
            </div>
        );
    }

    renderYear(yearEntry, i) {
        let { selectedYear } = this.props;
        let listClass = 'months';
        if (yearEntry.year !== selectedYear) {
            listClass += ' collapsed';
        }
        return (
            <li key={i}>
                <a className="year" data-year={yearEntry.year} onClick={this.handleYearClick}>
                    {yearEntry.label}
                </a>
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
        let { route, postLists, selectedYear } = this.props;
        let { date } = route.params;
        let className, url;
        if (monthEntry.year === selectedYear) {
            if (date && monthEntry.month === date.month) {
                className = 'selected';
            }

            let postList = _.find(postLists, { monthEntry });
            if (!postList || !_.isEmpty(postList.posts)) {
                url = route.prefetchArchiveURL(monthEntry);
            } else {
                className = 'disabled';
            }
        }
        return (
            <li key={i}>
                <a className={className} href={url}>{monthEntry.label}</a>
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

    handleMoreTagClick = (evt) => {
        let { tags } = this.props;
        tags.more();
    }
}

function hasRecentPost(postList, daysOld) {
    if (!postList || _.isEmpty(postList.posts)) {
        return false;
    }
    let post = _.first(postList.posts);
    let limit = Moment().subtract(daysOld, 'day');
    let publicationDate = Moment(post.date_gmt);
    return limit < publicationDate;
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    SideNav.propTypes = {
        wp: PropTypes.instanceOf(WordPress).isRequired,
        route: PropTypes.instanceOf(Route).isRequired,
    };
    SideNavSync.propTypes = {
        categories: PropTypes.arrayOf(PropTypes.object),
        tags: PropTypes.arrayOf(PropTypes.object),
        archives: PropTypes.arrayOf(PropTypes.object),
        postLists: PropTypes.arrayOf(PropTypes.object),
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
