import React, { Component } from 'react';

class ErrorBoundary extends Component {
    static displayName = 'ErrorBoundary';

    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    render() {
        let { children } = this.props;
        let { error } = this.state;
        if (error) {
            return <div className="error-boundary">{error.message}</div>;
        }
        return children || null;
    }

    componentDidCatch(error, info) {
        let { env } = this.props;
        this.setState({ error });
    }
}

export {
    ErrorBoundary as default,
    ErrorBoundary,
};
