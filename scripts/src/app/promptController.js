/**
 * An angular controller for the prompt dialog when a user calls e.g. 
 * readInput()
 *
 * @module PromptController
 * @author Creston Bunch
 */
app.controller("PromptController", ['$scope', '$uibModalInstance', 'msg', 
function($scope, $uibModalInstance, msg) {

    $scope.msg = msg;
    $scope.content = '';

    $scope.enterKeySubmit = function (event) {
        if (event.keyCode === 13) {
            $scope.accept();
        }
    };

    $scope.accept = function() {
        $uibModalInstance.close($scope.content);
    }
}]);