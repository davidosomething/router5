'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _routeNode = require('route-node');

var _routeNode2 = _interopRequireDefault(_routeNode);

var nameToIDs = function nameToIDs(name) {
    return name.split('.').reduce(function (ids, name) {
        ids.push(ids.length ? ids[ids.length - 1] + '.' + name : name);
        return ids;
    }, []);
};

var makeState = function makeState(name, params, path) {
    return { name: name, params: params, path: path };
};

var Router5 = (function () {
    function Router5(routes) {
        var opts = arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, Router5);

        this.started = false;
        this.callbacks = {};
        this.lastStateAttempt = null;
        this.lastKnownState = null;
        this.rootNode = routes instanceof _routeNode2['default'] ? routes : new _routeNode2['default']('', '', routes);
        this.activeComponents = {};
        this.options = opts;

        return this;
    }

    _createClass(Router5, [{
        key: 'setOption',
        value: function setOption(opt, val) {
            this.options[opt] = val;
            return this;
        }
    }, {
        key: 'add',
        value: function add(routes) {
            this.rootNode.add(routes);
            return this;
        }
    }, {
        key: 'addNode',
        value: function addNode(name, params) {
            this.rootNode.addNode(name, params);
            return this;
        }
    }, {
        key: 'onPopState',
        value: function onPopState(evt) {
            // Do nothing if no state or if last know state is poped state (it should never happen)
            var state = evt.state || this.matchPath(this.getWindowPath());
            if (!state) return;
            if (this.lastKnownState && this.areStatesEqual(state, this.lastKnownState)) return;

            var canTransition = this._transition(state, this.lastKnownState);
        }
    }, {
        key: 'start',
        value: function start() {
            if (this.started) return this;
            this.started = true;

            // Try to match starting path name
            var startPath = this.getWindowPath();
            var startState = this.matchPath(startPath);

            if (startState) {
                this.lastKnownState = startState;
                window.history.replaceState(this.lastKnownState, '', this.options.useHash ? '#' + startPath : startPath);
            } else if (this.options.defaultRoute) {
                this.navigate(this.options.defaultRoute, this.options.defaultParams, { replace: true });
            }
            // Listen to popstate
            window.addEventListener('popstate', this.onPopState.bind(this));
            return this;
        }
    }, {
        key: 'stop',
        value: function stop() {
            if (!this.started) return this;
            this.started = false;

            window.removeEventListener('popstate', this.onPopState.bind(this));
            return this;
        }
    }, {
        key: '_invokeCallbacks',
        value: function _invokeCallbacks(name, newState, oldState) {
            var _this = this;

            if (!this.callbacks[name]) return;
            this.callbacks[name].forEach(function (cb) {
                cb.call(_this, newState, oldState);
            });
        }
    }, {
        key: '_transition',
        value: function _transition(toState, fromState) {
            var _this2 = this;

            if (!fromState) {
                this.lastKnownState = toState;
                this._invokeCallbacks('', toState, fromState);
                return true;
            }

            var i = undefined;
            var cannotDeactivate = false;
            var fromStateIds = nameToIDs(fromState.name);
            var toStateIds = nameToIDs(toState.name);
            var maxI = Math.min(fromStateIds.length, toStateIds.length);

            for (i = 0; i < maxI; i += 1) {
                if (fromStateIds[i] !== toStateIds[i]) break;
            }

            cannotDeactivate = fromStateIds.slice(i).reverse().map(function (id) {
                return _this2.activeComponents[id];
            }).filter(function (comp) {
                return comp && comp.canDeactivate;
            }).some(function (comp) {
                return !comp.canDeactivate(toState, fromState);
            });

            if (!cannotDeactivate) {
                this.lastKnownState = toState;
                if (i > 0) this._invokeCallbacks(fromStateIds[i - 1], toState, fromState);
                this._invokeCallbacks('=' + toState.name, toState, fromState);
                this._invokeCallbacks('', toState, fromState);
            }

            return !cannotDeactivate;
        }
    }, {
        key: 'getState',
        value: function getState() {
            return this.lastKnownState
            // return window.history.state
            ;
        }
    }, {
        key: 'getWindowPath',
        value: function getWindowPath() {
            return this.options.useHash ? window.location.hash.replace(/^#/, '') : window.location.pathname;
        }
    }, {
        key: 'areStatesEqual',
        value: function areStatesEqual(state1, state2) {
            return state1.name === state2.name && Object.keys(state1.params).length === Object.keys(state2.params).length && Object.keys(state1.params).every(function (p) {
                return state1.params[p] === state2.params[p];
            });
        }
    }, {
        key: 'registerComponent',
        value: function registerComponent(name, component) {
            if (this.activeComponents[name]) console.warn('A component was alread registered for route node ' + name + '.');
            this.activeComponents[name] = component;
        }
    }, {
        key: 'deregisterComponent',
        value: function deregisterComponent(name) {
            delete this.activeComponents[name];
        }
    }, {
        key: 'addNodeListener',
        value: function addNodeListener(name, cb) {
            if (name) {
                var segments = this.rootNode.getSegmentsByName(name);
                if (!segments) console.warn('No route found for ' + name + ', listener could be never called!');
            }
            if (!this.callbacks[name]) this.callbacks[name] = [];
            this.callbacks[name].push(cb);
        }
    }, {
        key: 'removeNodeListener',
        value: function removeNodeListener(name, cb) {
            if (!this.callbacks[name]) return;
            this.callbacks[name] = this.callbacks[name].filter(function (callback) {
                return callback !== cb;
            });
        }
    }, {
        key: 'addListener',
        value: function addListener(cb) {
            this.addNodeListener('', cb);
        }
    }, {
        key: 'removeListener',
        value: function removeListener(cb) {
            this.removeNodeListener('', cb);
        }
    }, {
        key: 'addRouteListener',
        value: function addRouteListener(name, cb) {
            this.addNodeListener('=' + name, cb);
        }
    }, {
        key: 'removeRouteListener',
        value: function removeRouteListener(name, cb) {
            this.removeNodeListener('=' + name, cb);
        }
    }, {
        key: 'buildPath',
        value: function buildPath(route, params) {
            return (this.options.useHash ? '#' : '') + this.rootNode.buildPath(route, params);
        }
    }, {
        key: 'matchPath',
        value: function matchPath(path) {
            var match = this.rootNode.matchPath(path);
            return match ? makeState(match.name, match.params, path) : null;
        }
    }, {
        key: 'navigate',
        value: function navigate(name) {
            var params = arguments[1] === undefined ? {} : arguments[1];
            var opts = arguments[2] === undefined ? {} : arguments[2];

            if (!this.started) return;

            var path = this.rootNode.buildPath(name, params);

            if (!path) throw new Error('Could not find route "' + name + '"');

            this.lastStateAttempt = makeState(name, params, path);
            var sameStates = this.lastKnownState ? this.areStatesEqual(this.lastKnownState, this.lastStateAttempt) : false;

            // Do not proceed further if states are the same and no reload
            // (no desactivation and no callbacks)
            if (sameStates && !opts.reload) return;

            // Transition and amend history
            var canTransition = this._transition(this.lastStateAttempt, this.lastKnownState);

            if (canTransition && !sameStates) {
                window.history[opts.replace ? 'replaceState' : 'pushState'](this.lastStateAttempt, '', this.options.useHash ? '#' + path : path);
            }
        }
    }]);

    return Router5;
})();

exports['default'] = Router5;
module.exports = exports['default'];