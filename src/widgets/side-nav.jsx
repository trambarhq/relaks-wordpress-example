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
        props.categories = await wp.fetchList('/wp/v2/categories/', { minimum: '100%' });
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
                        date: {
                            year: start.year(),
                            month: start.month() + 1,
                        },
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
        }

        props.tags = await wp.fetchList('/wp/v2/tags/', { minimum: '100%' });
        meanwhile.show(<SideNavSync {...props} />);

        // load the posts of each category
        try {
            for (let category of props.categories) {
                if (category.count > 0) {
                    let url = `/wp/v2/posts/?categories=${category.id}`;
                    await wp.fetchList(url);
                }
            }
        } catch (err) {
        }

        // load the posts of each tag
        try {
            for (let tag of props.tags) {
                if (tag.count > 0) {
                    let url = `/wp/v2/posts/?tags=${tag.id}`;
                    await wp.fetchList(url);
                }
            }
        } catch (err) {
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
                {this.renderTags()}
            </div>
        )
    }

    renderCategories() {
        let { categories } = this.props;
        // only top-level categories
        categories = _.filter(categories, { parent: 0 });
        // don't show categories with no post
        categories = _.filter(categories, 'count');
        // list categories with more posts first
        categories = _.orderBy(categories, [ 'count', 'name' ], [ 'desc', 'asc' ]);
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
        let { route } = this.props;
        let { categorySlug } = route.params;
        let name = _.get(category, 'name', '');
        let description = _.get(category, 'description', '');
        let url = route.getObjectURL(category);
        let className;
        if (category.slug === categorySlug) {
            className = 'selected';
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
                </div>
            </div>
        );
    }

    renderTag(tag, i) {
        let { route } = this.props;
        let { tagSlug } = route.params;
        let name = _.get(tag, 'name', '');
        let description = _.get(tag, 'description', '');
        let url = route.getObjectURL(tag);
        let className;
        if (tag.slug === tagSlug) {
            className = 'selected';
        }
        return (
            <span key={i}>
                <a className={className} href={url} title={description} key={i}>{name}</a>
                {' '}
            </span>
        );
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

    renderArchive() {
        let { archive } = this.props;
        if (!archive) {
            return null;
        }
        return (
            <div>
                <h3>Archives</h3>
                <ul className="archive">
                {
                    archive.map((entry, i) => {
                        return this.renderYear(entry, i);
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
                <span data-year={yearEntry.year} onClick={this.handleYearClick}>
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
        let { date } = route.params;
        let url = route.getArchiveURL(monthEntry.date);
        if (_.isEmpty(monthEntry.posts) && !_.isUndefined(monthEntry.posts)) {
            url = undefined;
        }
        let className;
        if (_.isEqual(monthEntry.date, date)) {
            className = 'selected';
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
