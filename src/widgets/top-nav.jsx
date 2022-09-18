import _ from 'lodash';
import React from 'react';
import Relaks, { useProgress, useSaveBuffer, useAutoSave } from 'relaks';

async function TopNav(props) {
  const { wp, route } = props;
  const [ show ] = useProgress();
  const search = useSaveBuffer({
    original: route.params.search || '',
    save: (before, after) => {
    },
    autosave: 500,
  });
  useAutoSave(search, 500, () => {
    const url = route.getSearchURL(search.current);
    const options = {
      replace: (route.params.pageType === 'search')
    };
    route.change(url);
  });

  const handleSearchChange = (evt) => {
    search.set(evt.target.value);
  };

  render();
  const site = await wp.fetchSite();
  render();
  const pages = await wp.fetchPages();
  render();

  function render() {
    show(
      <div className="top-nav">
        {renderTitleBar()}
        {renderPageLinkBar()}
        {renderSearchBar()}
      </div>
    );
  }

  function renderTitleBar() {
    const name = _.get(site, 'name', '');
    const descriptionHTML = _.get(site, 'description', '');
    const description = _.unescape(descriptionHTML.replace(/&#039;/g, "'"));
    const url = route.getRootURL();
    return (
      <div className="title-bar">
        <div className="title" title={description}>
          <a href={url}>
            <i className="fa fa-home" />
            <span className="site-name">{name}</span>
          </a>
        </div>
      </div>
    );
  }

  function renderPageLinkBar() {
    const filtered = _.filter(pages, { parent: 0 });
    const ordered = _.sortBy(filtered, 'menu_order');
    return (
      <div className="page-bar">
        {ordered.map(renderPageLinkButton)}
      </div>
    );
  }

  function renderPageLinkButton(page, i) {
    const title = _.get(page, 'title.rendered');
    const url = route.prefetchObjectURL(page);
    return (
      <div className="button" key={i}>
        <a href={url} title={title}>{title}</a>
      </div>
    );
  }

  function renderSearchBar() {
    return (
      <div className="search-bar">
        <span className="input-container">
          <input type="text" value={search.current} onChange={handleSearchChange} />
          <i className="fa fa-search" />
        </span>
      </div>
    );
  }
}

const component = Relaks.memo(TopNav);

export {
  component as TopNav,
};
