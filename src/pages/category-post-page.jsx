import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';

class CategoryPostPage extends AsyncComponent {
    static displayName = 'CategoryPostPage';

    async renderAsync(meanwhile) {
        return <div>Category > Story</div>;
    }
}

export {
    CategoryPostPage as default,
    CategoryPostPage,
};
