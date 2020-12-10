/**
 * @fileOverview Custom API browser element with a view controller. (Angular directive)
 * @module apibrowserController
 */
app.directive('apibrowser', function () {
    return {
        templateUrl: 'templates/api-browser.html',
        transclude: true,

        controller: ['$scope', '$http', '$sce', '$location', '$rootScope', '$anchorScroll', '$timeout', 'esconsole', 'localStorage',
          function ($scope, $http, $sce, $location, $rootScope, $anchorScroll, $timeout, esconsole, localStorage) {
            /**
             * Holds the JSON dictionary for the user API.
             * @name apiList
             */
            $scope.apiList = {};
            $scope.highlight = '';

            /**
             * Current language ("python" or "javascript") read from the localStorage.
             * @name currentLanguage
             */
            $scope.currentLanguage = localStorage.get('language', 'python');

            $scope.$on('language', function (event, arg) {
                $scope.currentLanguage = arg;
            });

            // scroll to and highlight the specific API function given in
            // /#?api=functionName
            // in the current URL
            $scope.$on('$locationChangeSuccess', function() {
                if ($location.search()['api']) {
                    $timeout(function() {
                        $scope.openSidebarTab('apibrowser');
                        $scope.highlight = $location.search()['api'];
                        // if you don't clear the path, angular leaves a slash
                        // in front of the hash
                        $location.path('');
                        $location.search('');
                        // TODO: in newer versions of angular, you can specify
                        // the hash as a parameter to $aschorScroll
                        $location.hash('api-'+$scope.highlight);
                        $anchorScroll();
                        angular.forEach($scope.apiList, function(value, key) {
                            if (key == $scope.highlight) {
                                value.details = true;
                            }
                        });
                    });
                }
            }, true);

            /**
             * @name paste
             * @function
             * @param name {string}
             * @param obj
             */
            $scope.paste = function(name, obj) {
                var args = [];
                for (var param in obj.parameters) {
                    args.push(param);
                    if (obj.parameters[param].hasOwnProperty('default')) {
                        args[args.length-1] = args[args.length-1].concat('=' + obj.parameters[param].default);
                    }
                }
                args = args.join(', ');

                esconsole(angular.element(document.getElementById('devctrl')).scope().pasteCode(name + '(' + args + ')'), 'debug');
            };

            /**
             * Workaround for ng-repeat auto-sorting the object properties.
             * @name getKeys
             * @function
             * @param obj
             * @returns {Array}
             */
            $scope.getKeys = function (obj) {
                if (typeof(obj) !== 'undefined') {
                    return Object.keys(obj);
                }
            };

            /**
             * Returns the number of items of a JSON object.
             * @name countNumProperties
             * @function
             * @param obj
             * @returns {number}
             */
            $scope.countNumProperties = function (obj) {
                return Object.keys(obj).length;
            };

            /**
             * Checks if the handed object is an array structure or not.
             * @name isArray
             * @function
             * @param obj
             * @returns {boolean}
             */
            $scope.isArray = function (obj) {
                return Array.isArray(obj);
            };

            $scope.apiList = ESApiDoc;

            $scope.checkLangSpecific = function (name) {
                if ($scope.apiList[name].hasOwnProperty('meta')) {
                    return $scope.apiList[name].meta.language === $scope.currentLanguage;
                } else {
                    return true;
                }
            };

            /**
             * Holds the current search term.
             * @name search
             * @type {string}
             */
            $scope.apisearch = "";

            /**
             * @name toHtml
             * @function
             * @param str {string}
             * @returns {*}
             */
            $scope.toHtml = function (str) {
                return $sce.trustAsHtml(str);
            };

            $scope.readURL = function() {};
        }]
    };
});

app.directive('highlight', function () {
    return {
        scope: {},
        link: function (scope, element) {
            scope.$$postDigest(function () {
                hljs.highlightBlock(element[0]);
            });
        }
    }
});
