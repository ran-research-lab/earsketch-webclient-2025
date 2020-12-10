app.controller("shareController", ['$scope','$uibModalInstance','url',
  function($scope, $uibModalInstance, url) {
    $scope.url = url;
    $scope.close = function() {
        $uibModalInstance.close();
    }
}]);
