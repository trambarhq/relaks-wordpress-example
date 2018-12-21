import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';

class CategoryPage extends AsyncComponent {
    static displayName = 'CategoryPage';

    async renderAsync(meanwhile) {
        return <div>Category</div>;
    }
}

export {
    CategoryPage as default,
    CategoryPage,
};
