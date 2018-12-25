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
     * @param  {Number|String} id
     * @param  {Object} options
     *
     * @return {Promise<Object>}
     */
    fetchOne(url, id, options) {
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
    fetchList(url, options) {
        if (this.ssr === 'seo') {
            options = Object.assign({}, options, { minimum: '100%' });
        }
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
    fetchMultiple(url, ids, options) {
        if (this.ssr === 'seo') {
            options = Object.assign({}, options, { minimum: '100%' });
        }
        return this.dataSource.fetchMultiple(url, ids, options);
    }
}

export {
    Wordpress as default,
    Wordpress,
};
