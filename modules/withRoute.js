import { Component, createElement, PropTypes } from 'react';

const ifNot = (condition, errorMessage) => {
    if (!condition) throw new Error(errorMessage);
};

function withRoute(BaseComponent) {
    class ComponentWithRoute extends Component {
        constructor(props, context) {
            super(props, context);
            this.router = context.router;
            this.state = {
                previousRoute: null,
                route: this.router.getState()
            };
        }

        componentDidMount() {
            ifNot(
                this.router.registeredPlugins.LISTENERS,
                '[react-router5] missing plugin router5-listeners'
            );

            this.listener = (toState, fromState) => this.setState({ previousRoute: fromState, route: toState });
            this.router.addListener(this.nodeListener);
        }

        componentWillUnmout() {
            this.router.removeListener(this.listener);
        }

        render() {
            ifNot(
                !this.props.router && !this.props.route && !this.props.previousRoute,
                '[react-router5] prop names `router`, `route` and `previousRoute` are reserved.'
            );

            return createElement(BaseComponent, { ...this.props, ...this.state, router: this.router });
        }
    }

    ComponentWithRoute.contextTypes = {
        router: PropTypes.object.isRequired
    };

    return ComponentWithRoute;
}

export default withRoute;
