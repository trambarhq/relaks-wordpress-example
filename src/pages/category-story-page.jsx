import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';

class CategoryStoryPage extends AsyncComponent {
    static displayName = 'CategoryStoryPage';

    async renderAsync(meanwhile) {
        return <div>Category > Story</div>;
    }
}

export {
    CategoryStoryPage as default,
    CategoryStoryPage,
};
