import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';

class SideNavSync extends PureComponent {
    static displayName = 'SideNavSync';

    render() {
        return (
            <div className="side-nav">
                Side-Nav
            </div>
        )
    }
}

export {
    SideNavSync as default,
    SideNavSync,
};
