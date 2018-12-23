import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';

class ArchivePage extends AsyncComponent {
    static displayName = 'ArchivePage';

    async renderAsync(meanwhile) {
        return <div>Archive</div>;
    }
}

export {
    ArchivePage as default,
    ArchivePage,
};
