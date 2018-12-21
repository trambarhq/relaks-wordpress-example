class Wordpress {
    /**
     * Remember the data source
     */
    constructor(dataSource, ssr) {
        this.dataSource = dataSource;
        this.ssr = ssr;
    }

    /**
     * Fetch one object from data source
     *
     * @param  {String} url
     * @param  {Object} options
     *
     * @return {Promise<Object>}
     */
    fetchOne(url, options) {
        return this.dataSource.fetchOne(url, options);
    }

    /**
     * Fetch a list of objects from data source
     *
     * @param  {String} url
     * @param  {Object} options
     *
     * @return {Promise<Array>}
     */
    fetchList(url, options) {
        if (this.ssr === 'seo') {
            options = Object.assign({}, options, { minimum: '100%' });
        }
        return this.dataSource.fetchList(url, options);
    }

    /**
     * Fetch multiple objects from data source
     *
     * @param  {Array<String>} urls
     * @param  {Object} options
     *
     * @return {Promise<Array>}
     */
    fetchMultiple(urls, options) {
        if (this.ssr === 'seo') {
            options = Object.assign({}, options, { minimum: '100%' });
        }
        return this.dataSource.fetchMultiple(urls, options);
    }
}

export {
    Wordpress as default,
    Wordpress,
};
