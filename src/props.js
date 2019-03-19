import * as PropTypes from 'prop-types';

import { Route } from 'routing';
import WordPress from 'wordpress';

import ArchivePage from 'pages/archive-page';
import CategoryPage from 'pages/category-page';
import PagePage from 'pages/page-page';
import PostPage from 'pages/post-page';
import SearchPage from 'pages/search-page';
import TagPage from 'pages/tag-page';
import WelcomePage from 'pages/welcome-page';

ArchivePage.propTypes = {
    wp: PropTypes.instanceOf(WordPress).isRequired,
    route: PropTypes.instanceOf(Route).isRequired,
};
CategoryPage.propTypes = {
    wp: PropTypes.instanceOf(WordPress).isRequired,
    route: PropTypes.instanceOf(Route).isRequired,
};
PagePage.propTypes = {
    wp: PropTypes.instanceOf(WordPress).isRequired,
    route: PropTypes.instanceOf(Route).isRequired,
};
PostPage.propTypes = {
    wp: PropTypes.instanceOf(WordPress).isRequired,
    route: PropTypes.instanceOf(Route).isRequired,
};
SearchPage.propTypes = {
    wp: PropTypes.instanceOf(WordPress).isRequired,
    route: PropTypes.instanceOf(Route).isRequired,
};
TagPage.propTypes = {
    wp: PropTypes.instanceOf(WordPress).isRequired,
    route: PropTypes.instanceOf(Route).isRequired,
};
WelcomePage.propTypes = {
    wp: PropTypes.instanceOf(WordPress).isRequired,
    route: PropTypes.instanceOf(Route).isRequired,
};

import Breadcrumb from 'widgets/breadcrumb';
import CommentListView from 'widgets/comment-list-view';
import CommentList from 'widgets/comment-list';
import CommentSection from 'widgets/comment-section';
import HTML from 'widgets/html';
import ImageDialog from 'widgets/image-dialog';
import MediaView from 'widgets/media-view';
import PageListView from 'widgets/page-list-view';
import PageList from 'widgets/page-list';
import PageView from 'widgets/page-view';
import PostListView from 'widgets/post-list-view';
import PostList from 'widgets/post-list';
import PostView from 'widgets/post-view';
import SideNav from 'widgets/side-nav';
import TagList from 'widgets/tag-list';
import TopNav from 'widgets/top-nav';

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
    wp: PropTypes.instanceOf(WordPress).isRequired,
    route: PropTypes.instanceOf(Route).isRequired,
};
TagList.propTypes = {
    tags: PropTypes.arrayOf(PropTypes.object),
};
TopNav.propTypes = {
    wp: PropTypes.instanceOf(WordPress).isRequired,
    route: PropTypes.instanceOf(Route).isRequired,
};
