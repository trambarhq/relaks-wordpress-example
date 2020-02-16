import * as PropTypes from 'prop-types';

import { Route } from './routing.js';
import { Wordpress } from './wordpress.js';

import ArchivePage from './pages/archive-page.jsx';
import CategoryPage from './pages/category-page.jsx';
import PagePage from './pages/page-page.jsx';
import PostPage from './pages/post-page.jsx';
import SearchPage from './pages/search-page.jsx';
import TagPage from './pages/tag-page.jsx';
import WelcomePage from './pages/welcome-page.jsx';

ArchivePage.propTypes = {
  wp: PropTypes.instanceOf(Wordpress).isRequired,
  route: PropTypes.instanceOf(Route).isRequired,
};
CategoryPage.propTypes = {
  wp: PropTypes.instanceOf(Wordpress).isRequired,
  route: PropTypes.instanceOf(Route).isRequired,
};
PagePage.propTypes = {
  wp: PropTypes.instanceOf(Wordpress).isRequired,
  route: PropTypes.instanceOf(Route).isRequired,
};
PostPage.propTypes = {
  wp: PropTypes.instanceOf(Wordpress).isRequired,
  route: PropTypes.instanceOf(Route).isRequired,
};
SearchPage.propTypes = {
  wp: PropTypes.instanceOf(Wordpress).isRequired,
  route: PropTypes.instanceOf(Route).isRequired,
};
TagPage.propTypes = {
  wp: PropTypes.instanceOf(Wordpress).isRequired,
  route: PropTypes.instanceOf(Route).isRequired,
};
WelcomePage.propTypes = {
  wp: PropTypes.instanceOf(Wordpress).isRequired,
  route: PropTypes.instanceOf(Route).isRequired,
};

import { Breadcrumb } from './widgets/breadcrumb.jsx';
import { CommentListView } from './widgets/comment-list-view.jsx';
import { CommentList } from './widgets/comment-list.jsx';
import { CommentSection } from './widgets/comment-section.jsx';
import { HTML } from './widgets/html.jsx';
import { ImageDialog } from './widgets/image-dialog.jsx';
import { MediaView } from './widgets/media-view.jsx';
import { PageListView } from './widgets/page-list-view.jsx';
import { PageList } from './widgets/page-list.jsx';
import { PageView } from './widgets/page-view.jsx';
import { PostListView } from './widgets/post-list-view.jsx';
import { PostList } from './widgets/post-list.jsx';
import { PostView } from './widgets/post-view.jsx';
import { SideNav } from './widgets/side-nav.jsx';
import { TagList } from './widgets/tag-list.jsx';
import { TopNav } from './widgets/top-nav.jsx';

Breadcrumb.propTypes = {
  trail: PropTypes.arrayOf(PropTypes.object),
};
CommentListView.propTypes = {
  allComments: PropTypes.arrayOf(PropTypes.object),
  comment: PropTypes.object,
};
CommentList.propTypes = {
  allComments: PropTypes.arrayOf(PropTypes.object),
  parentCommentID: PropTypes.number,
};
CommentSection.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.object),
};
HTML.propTypes = {
  text: PropTypes.string,
  transform: PropTypes.func,
};
ImageDialog.propTypes = {
  imageURL: PropTypes.string,
  onClose: PropTypes.func,
};
MediaView.propTypes = {
  media: PropTypes.object,
  size: PropTypes.string,
};
PageListView.propTypes = {
  page: PropTypes.object,
  route: PropTypes.instanceOf(Route).isRequired,
};
PageList.propTypes = {
  pages: PropTypes.arrayOf(PropTypes.object),
  route: PropTypes.instanceOf(Route).isRequired,
};
PageView.propTypes = {
  page: PropTypes.object,
  transform: PropTypes.func,
};
PostList.propTypes = {
  posts: PropTypes.arrayOf(PropTypes.object),
  medias: PropTypes.arrayOf(PropTypes.object),
  route: PropTypes.instanceOf(Route),
  minimum: PropTypes.number,
  maximum: PropTypes.number,
};
PostListView.propTypes = {
  post: PropTypes.object,
  route: PropTypes.instanceOf(Route).isRequired,
};
PostView.propTypes = {
  post: PropTypes.object,
  author: PropTypes.object,
  transform: PropTypes.func,
};
SideNav.propTypes = {
  wp: PropTypes.instanceOf(Wordpress).isRequired,
  route: PropTypes.instanceOf(Route).isRequired,
};
TagList.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.object),
};
TopNav.propTypes = {
  wp: PropTypes.instanceOf(Wordpress).isRequired,
  route: PropTypes.instanceOf(Route).isRequired,
};
