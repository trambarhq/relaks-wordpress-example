import _ from 'lodash';
import Moment from 'moment';
import React, { useState } from 'react';
import Relaks, { useProgress } from 'relaks';
import { HTML } from './html.jsx';

async function SideNav(props) {
  const { wp, route } = props;
  const { date } = route.params;
  const [ selectedYear, setSelectedYear ] = useState(() => {
    return _.get(date, 'year', Moment().year());
  });
  const [ show ] = useProgress(50, 50);

  const handleYearClick = (evt) => {
    const year = parseInt(evt.currentTarget.getAttribute('data-year'));
    if (selectedYear !== year) {
      setSelectedYear(year);
    } else {
      setSelectedYear(NaN);
    }
  };
  const handleMoreTagClick = (evt) => {
    tags.more();
  };

  render();
  // get all categories
  const categories = await wp.fetchCategories();
  render ();
  // get top tags
  const tags = await wp.fetchTopTags();
  render ();

  // get the date range of posts and use that to build the list of
  // years and months
  const range = await wp.getPostDateRange();
  const archives = [];
  if (range) {
    // loop through the years
    const lastYear = range.latest.year();
    const firstYear = range.earliest.year();
    for (let y = lastYear; y >= firstYear; y--) {
      const yearEntry = {
        year: y,
        label: Moment(`${y}-01-01`).format('YYYY'),
        months: []
      };
      archives.push(yearEntry);

      // loop through the months
      const lastMonth = (y === lastYear) ? range.latest.month() : 11;
      const firstMonth = (y === firstYear) ? range.earliest.month() : 0;
      for (let m = lastMonth; m >= firstMonth; m--) {
        const start = Moment(new Date(y, m, 1));
        const end = start.clone().endOf('month');
        const monthEntry = {
          year: y,
          month: m + 1,
          label: start.format('MMMM'),
        };
        yearEntry.months.push(monthEntry);
      }
    }
    render();
  }

  const postLists = [];
  if (!wp.ssr) {
    try {
      // load the posts of each month of the selected year
      for (let yearEntry of archives) {
        if (yearEntry.year === selectedYear) {
          for (let monthEntry of yearEntry.months) {
            const posts = await wp.fetchPostsInMonth(monthEntry);
            postLists.push({ monthEntry, posts });
            render();
          }
        }
      }

      // load the posts of each category
      for (let category of categories) {
        if (category.count > 0) {
          const posts = await wp.fetchPostsInCategory(category);
          postLists.push({ category, posts });
          render();
        }
      }

      // load the posts of each tag
      for (let tag of tags) {
        if (tag.count > 0) {
          const posts = await wp.fetchPostsWithTag(tag);
          postLists.push({ tag, posts });
          render();
        }
      }
    } catch (err) {
    }
  }

  function render() {
    show(
      <div className="side-nav">
        {renderCategories()}
        {renderTags()}
        {renderArchives()}
      </div>
    );
  }

  function renderCategories() {
    // only top-level categories
    const subcategories = _.filter(categories, { parent: 0 });
    // don't show categories with no post
    const filtered = _.filter(subcategories, 'count');
    const ordered = _.orderBy(filtered, [ 'name' ], [ 'asc' ]);
    if (_.isEmpty(ordered)) {
      return null;
    }
    return (
      <div>
        <h3>Categories</h3>
        <ul className="categories">
          {ordered.map(renderCategory)}
        </ul>
      </div>
    );
  }

  function renderCategory(category, i) {
    const { categorySlug } = route.params;
    const name = _.get(category, 'name', '');
    const description = _.unescape(_.get(category, 'description', '').replace(/&#039;/g, "'"));
    const url = route.prefetchObjectURL(category);
    const classNames = [];
    if (category.slug === categorySlug) {
      classNames.push('selected');
    } else {
      const postList = _.find(postLists, { category });
      if (hasRecentPost(postList, 1)) {
        classNames.push('highlighted');
      }
    }
    return (
      <li key={i}>
        <a className={classNames.join(' ')} href={url} title={description}><HTML text={name} /></a>
        {renderSubcategories(category)}
      </li>
    );
  }

  function renderTags() {
    // don't show tags with no post
    const activeTags = _.filter(tags, 'count');
    // list tags with more posts first
    const ordered = _.orderBy(activeTags, [ 'count', 'name' ], [ 'desc', 'asc' ]);
    if (_.isEmpty(ordered)) {
      return null;
    }
    return (
      <div>
        <h3>Tags</h3>
        <div className="tags">
          {ordered.map(renderTag)}
          {renderMoreTagButton()}
        </div>
      </div>
    );
  }

  function renderTag(tag, i) {
    const { tagSlug } = route.params;
    const name = _.get(tag, 'name', '');
    const description = _.unescape(_.get(tag, 'description', '').replace(/&#039;/g, "'"));
    const url = route.prefetchObjectURL(tag);
    const classNames = [];
    if (tag.slug === tagSlug) {
      classNames.push('selected');
    } else {
      const postList = _.find(postLists, { tag });
      if (hasRecentPost(postList, 1)) {
        classNames.push('highlighted');
      }
    }
    return (
      <span key={i}>
        <a className={classNames.join(' ')} href={url} title={description} key={i}><HTML text={name} /></a>
        {' '}
      </span>
    );
  }

  function renderMoreTagButton() {
    if (!_.some(tags, 'count')) {
      return null;
    }
    if (!(tags.length < tags.total) || tags.length >= 100) {
      return null;
    }
    return <a className="more" onClick={handleMoreTagClick}>... more</a>;
  }

  function renderSubcategories(category) {
    const subcategories = _.filter(categories, { parent: category.id });
    const filtered = _.filter(subcategories, 'count');
    const ordered = _.orderBy(filtered, [ 'count', 'name' ], [ 'desc', 'asc' ]);
    if (_.isEmpty(ordered)) {
      return null;
    }
    return (
      <ul className="subcategories">
        {ordered.map(renderCategory)}
      </ul>
    );
  }

  function renderArchives() {
    if (_.isEmpty(archives)) {
      return null;
    }
    return (
      <div>
        <h3>Archives</h3>
        <ul className="archives">
          {archives.map(renderYear)}
        </ul>
      </div>
    );
  }

  function renderYear(yearEntry, i) {
    const listClassNames = [ 'months'] ;
    if (yearEntry.year !== selectedYear) {
      listClassNames.push('collapsed');
    }
    return (
      <li key={i}>
        <a className="year" data-year={yearEntry.year} onClick={handleYearClick}>
          {yearEntry.label}
        </a>
        <ul className={listClassNames.join(' ')}>
          {yearEntry.months.map(renderMonth)}
        </ul>
      </li>
    )
  }

  function renderMonth(monthEntry, i) {
    const { date } = route.params;
    const classNames = [];
    let url;
    if (monthEntry.year !== selectedYear) {
      return null;
    }
    if (date && monthEntry.year === date.year && monthEntry.month === date.month) {
      classNames.push('selected');
    }
    const postList = _.find(postLists, { monthEntry });
    if (!postList || !_.isEmpty(postList.posts)) {
      url = route.prefetchArchiveURL(monthEntry);
    } else {
      classNames.push('disabled');
    }
    return (
      <li key={i}>
        <a className={classNames.join(' ')} href={url}>
          {monthEntry.label}
        </a>
      </li>
    );
  }

  function hasRecentPost(postList, daysOld) {
    if (!postList || _.isEmpty(postList.posts)) {
      return false;
    }
    const post = _.first(postList.posts);
    const limit = Moment().subtract(daysOld, 'day');
    const publicationDate = Moment(post.date_gmt);
    return limit < publicationDate;
  }
}

const component = Relaks.memo(SideNav);

export {
  component as SideNav,
};
