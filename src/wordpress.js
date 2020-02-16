import Moment from 'moment';

class Wordpress {
  /**
   * Remember the data source
   */
  constructor(dataSource, ssr) {
    this.dataSource = dataSource;
    this.ssr = ssr;
  }

  /**
   * Fetch information about the site
   *
   * @return {Promise<Object>}
   */
  async fetchSite() {
    return this.fetchOne('/');
  }

  /**
   * Fetch a single post
   *
   * @param  {Number|String}  id
   *
   * @return {Promise<Object>}
   */
  async fetchPost(id) {
    return this.fetchOne('/wp/v2/posts/', id);
  }

  /**
   * Fetch all posts, latest first
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchPosts() {
    return this.fetchList('/wp/v2/posts/');
  }

  /**
   * Fetch posts in a category
   *
   * @param  {Object}  category
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchPostsInCategory(category) {
    if (!category) return [];
    return this.fetchList(`/wp/v2/posts/?categories=${category.id}`);
  }

  /**
   * Fetch posts with tag
   *
   * @param  {Object}  tag
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchPostsWithTag(tag) {
    if (!tag) return [];
    return this.fetchList(`/wp/v2/posts/?tags=${tag.id}`);
  }

  /**
   * Fetch posts published in a given month
   *
   * @param  {Object}  date
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchPostsInMonth(date) {
    if (!date) return[];
    const month = Moment(new Date(date.year, date.month - 1, 1));
    const after = month.toISOString();
    const before = month.clone().endOf('month').toISOString();
    return this.fetchList(`/wp/v2/posts/?after=${after}&before=${before}`);
  }

  /**
   * Fetch posts matching search string
   *
   * @param  {String}  search
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchMatchingPosts(search) {
    const s = encodeURIComponent(_.trim(search));
    if (!s) return [];
    return this.fetchList(`/wp/v2/posts/?search=${s}`);
  }

  /**
   * Get the date of the earlest post and the latest post
   *
   * @return {Promise<Object>}
   */
  async getPostDateRange() {
    const latestPosts =  await this.fetchPosts();
    const latestPost = _.first(latestPosts);
    const earliestPosts = await this.fetchList(`/wp/v2/posts/?order=asc&per_page=1`)
    const earliestPost = _.first(earliestPosts);
    if (latestPost && earliestPost) {
      const latest = Moment(latestPost.date_gmt);
      const earliest = Moment(earliestPost.date_gmt);
      return { latest, earliest };
    }
  }

  /**
   * Fetch a page
   *
   * @param  {Number|String}  id
   *
   * @return {Promise<Object>}
   */
  async fetchPage(id) {
    return this.fetchOne('/wp/v2/pages/', id);
  }

  /**
   * Fetch all pages
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchPages() {
    return this.fetchList('/wp/v2/pages/', { minimum: '100%' });
  }

  /**
   * Fetch a page's parents
   *
   * @param  {Object}  page
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchParentPages(page) {
    if (!page) return [];
    const parentPages = [];
    let parentID = page.parent;
    while (parentID) {
      const parentPage = await this.fetchPage(parentID);
      if (!parentPage) {
        break;
      }
      parentPages.push(parentPage);
      parentID = parentPage.parent;
    }
    return parentPages;
  }

  /**
   * Fetch a page's children
   *
   * @param  {Object}  page
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchChildPages(page) {
    if (!page) return [];
    const pages = await this.fetchPages();
    const childPages = _.filter(pages, { parent: page.id });
    childPages.more = () => {};
    childPages.total = childPages.length;
    return childPages;
  }

  /**
   * Fetch a category
   *
   * @param  {Number|String}  id
   *
   * @return {Promise<Object>}
   */
  async fetchCategory(id) {
    return this.fetchOne(`/wp/v2/categories/`, id);
  }

  /**
   * Fetch all categories
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchCategories() {
    return this.fetchList(`/wp/v2/categories/`, { minimum: '100%' });
  }

  /**
   * Fetch parents of a category
   *
   * @param  {Object}  category
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchParentCategories(category) {
    if (!category) return [];
    const parentCategories = [];
    let parentID = category.parent;
    while (parentID) {
      const parentCategory = await this.fetchCategory(parentID);
      if (!parentCategory) {
        break;
      }
      parentCategories.push(parentCategory);
      parentID = parentCategory.parent;
    }
    return parentCategories;
  }

  /**
   * Fetch a single tag
   *
   * @param  {Number|String}  id
   *
   * @return {Promise<Object>}
   */
  async fetchTag(id) {
    return this.fetchOne(`/wp/v2/tags/`, id);
  }

  /**
   * Fetch tags, popular ones listed first
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchTopTags() {
    return this.fetchList(`/wp/v2/tags/?orderby=count&order=desc`);
  }

  /**
   * Fetch tags attach to a post
   *
   * @param  {Object}  post
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchTagsOfPost(post) {
    if (!post) return [];
    return this.fetchMultiple(`/wp/v2/tags/`, post.tags);
  }

  /**
   * Fetch author of a post or page
   *
   * @param  {Object}  post
   *
   * @return {Promise<Object>}
   */
  async fetchAuthor(post) {
    if (!post) return null;
    return this.fetchOne(`/wp/v2/users/`, post.author);
  }

  /**
   * Fetch comments on a post
   *
   * @param  {Object}  post
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchComments(post) {
    if (!post) return [];
    return this.fetchList(`/wp/v2/comments/?post=${post.id}`);
  }

  /**
   * Fetch featured media of posts
   *
   * @param  {Array<Object>}  ids
   * @param  {Number} count
   *
   * @return {Promise<Array<Object>>}
   */
  async fetchFeaturedMedias(posts, count) {
    const ids = [];
    for (let post of posts) {
      if (post.featured_media) {
        ids.push(post.featured_media);
        if (ids.length >= count) {
          break;
        }
      }
    }
    return this.fetchMultiple(`/wp/v2/media`, ids);
  }

  /**
   * Fetch one object from data source
   *
   * @param  {String} url
   * @param  {Number|String} id
   * @param  {Object} options
   *
   * @return {Promise<Object>}
   */
  async fetchOne(url, id, options) {
    return this.dataSource.fetchOne(url, id, options);
  }

  /**
   * Fetch a list of objects from data source
   *
   * @param  {String} url
   * @param  {Object} options
   *
   * @return {Promise<Array>}
   */
  async fetchList(url, options) {
    return this.dataSource.fetchList(url, options);
  }

  /**
   * Fetch multiple objects from data source
   *
   * @param  {String} url
   * @param  {Array<Number|String>} ids
   * @param  {Object} options
   *
   * @return {Promise<Array>}
   */
  async fetchMultiple(url, ids, options) {
    if (this.ssr === 'seo') {
      options = Object.assign({}, options, { minimum: '100%' });
    }
    return this.dataSource.fetchMultiple(url, ids, options);
  }
}

export {
  Wordpress,
};
