/**
 * An angular controller for the inputs dialog for the autograder
 *
 * @module InputsController
 * @author Creston Bunch
 */
app.controller("InputsController", [
'$scope', '$uibModalInstance', 'inputs', 'script', 'language',
function($scope, $uibModalInstance, inputs, script, language) {

    $scope.inputs = inputs;
    $scope.script = script;
    $scope.language = language;
    $scope.values = []
    for (var i = 0; i < inputs.length; i++) {
        $scope.values.push('');
    }

    $scope.accept = function() {
        $uibModalInstance.close($scope.values);
    }
    $scope.reject = function() {
        $uibModalInstance.dismiss('Script could not be autograded.');
    }
}]);
