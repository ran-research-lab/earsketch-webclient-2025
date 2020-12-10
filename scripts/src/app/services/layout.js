/**
 * A model for storing the layout state and communicating between controllers
 */
app.service('layout', ['$rootScope', function ($rootScope) {
    var layout = {
        browser: 0, // 0: all closed, 1: sound, 2: script, 3: share, 4: api
        daw: true,
        canvas: false,
        console: true,
        curriculum: true,
        chat: false
    };

    var browserPrevState = 1;

    function exists(component) {
        return Object.keys(layout).indexOf(component) !== -1;
    }

    this.set = function (component, state, silent) {
        if (exists(component)) {
            if (component === 'browser') {
                if (Number.isInteger(state)) {
                    layout.browser = state;
                }
            } else {
                layout[component] = !!state;
            }

            if (!silent) {
                $rootScope.$emit('layoutChanged', layout);
            }
        }
    };

    this.get = function (component) {
        return exists(component) ? layout[component] : null;
    };

    this.open = function (component, state) {
        if (exists(component)) {
            if (component === 'browser') {
                if (Number.isInteger(state)) {
                    layout.browser = state;
                } else {
                    // maybe not right
                    var prev = browserPrevState;
                    browserPrevState = layout.browser;
                    layout.browser = prev;
                }
            } else {
                layout[component] = true;
            }
            $rootScope.$emit('layoutChanged', layout);
        }
    };

    // this.close = function (component) {
    //     if (exists(component)) {
    //         if (component === 'browser') {
    //             if (Number.isInteger(state)) {
    //                 this.layout.browser = state;
    //             }
    //         } else {
    //             this.layout[component] = !!state;
    //         }
    //         $rootScope.$emit('layoutChanged', null);
    //     }
    // };
    //
    // this.toggle = function (component) {
    //     if (exists(component)) {
    //         if (component === 'browser') {
    //             if (Number.isInteger(state)) {
    //                 this.layout.browser = state;
    //             }
    //         } else {
    //             this.layout[component] = !!state;
    //         }
    //         $rootScope.$emit('layoutChanged', null);
    //     }
    // };

    this.subscribe = function (scope, callback) {
        // esconsole('subscribing a listener to layout change', 'nolog');
        var handler = $rootScope.$on('layoutChanged', callback);
        scope.$on('$destroy', handler);
    };
}]);