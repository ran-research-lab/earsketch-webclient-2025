/**
 * Provides services for the autograder.
 *
 * @module autograder
 * @author Creston Bunch
 */
app.factory('autograder', ['$uibModal',
function compilerFactory($uibModal) {

    /**
     * Presents a modal dialog with the script's source and multiple input
     * prompts. Returns the values from the input prompts.
     */
    function prompt(inputs, script, language) {
        var modal = $uibModal.open({
            templateUrl: 'templates/inputs.html',
            controller: 'InputsController',
            resolve: {
                inputs: function() { return inputs; },
                script: function() { return script; },
                language: function() { return language; }
            },
        });

        return modal.result.then(function(inputs) {
            return inputs;
        }).catch(function(err) {
            throw err;
        });
    }

    return {
        'prompt': prompt,
    }

}]);
