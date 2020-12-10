app.directive('curriculumsearch', function() {
    return {
        require: 'curriculumController',
        transclude: true,
        templateUrl: 'templates/curriculum-search.html',

        controller: ['$scope','$http', 'userProject', function($scope, $http, userProject) {
            var documents = ESCurr_SearchDoc;

            var idx = lunr(function () {
                this.ref('id');
                this.field('title');
                this.field('text');

                documents.forEach(function (doc) {
                    this.add(doc);
                }, this);
            });

            $scope.query = '';
            $scope.results = [];
            var prevQuery = '';
            var prevResults = ''; // to reopen the previous search result list when the input box is refocused with mouse

            $scope.$watch('query', function(newVal, oldVal) {
                if (newVal === oldVal) {
                    return null;
                }

                // Highlight search text matches found in the curriculum.
                var myHilitor = new Hilitor("curriculum-atlas");
                myHilitor.setMatchType("left");
                myHilitor.apply($scope.query);

                if (!!$scope.query) {
                    $scope.results = idx.search($scope.query).map(function (res) {
                        var title = documents.find(function (doc) {
                            return doc.id === res.ref;
                        }).title;
                        return {
                            id: res.ref,
                            title: title
                        }
                    });
                } else {
                    $scope.results = [];
                }

                adjustBodyHeight();
            });

            // a little hack to adjust the content body height. should use scope and ng-style instead...
            function adjustBodyHeight() {
                var reducedHeight = $scope.results.length > 7 ? 70 : 100 - $scope.results.length * 4.3;
                angular.element('#curriculum-body').css({'height': reducedHeight.toString() + '%'});
            }

            $scope.closeSearchResults = function () {
                prevQuery = $scope.query;
                prevResults = $scope.results;
                $scope.results = [];

                adjustBodyHeight();
            };

            $scope.recallResults = function () {
                if ($scope.query === prevQuery) {
                    $scope.results = prevResults;
                    adjustBodyHeight();
                }
            };

            $scope.hideSlides = function () {
                $scope.showSlides = false;
            };
        }]
    }
});
