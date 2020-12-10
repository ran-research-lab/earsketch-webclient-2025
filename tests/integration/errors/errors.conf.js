/**
 * Karma config file for testing compiler integration
 *
 * @module Tests.Integration.Compiler
 * @author Creston Bunch
 */

module.exports = function(config) {
    var sourcePreprocessors = [];

    config.set({
        basePath: '../../../',
        frameworks: ['jasmine'],

        files: [
            {pattern: 'scripts/vendor/angular/angular.min.js', included:true},
            {pattern: 'scripts/vendor/angular/angular-mocks.js', included:true},
            {pattern: 'node_modules/ng-midway-tester/src/ngMidwayTester.js', included:true},
            {pattern: 'scripts/vendor/skulpt/skulpt.min.js', included:true},
            {pattern: 'scripts/vendor/skulpt/skulpt-stdlib.js', included:true},
            {pattern: 'scripts/vendor/js-interpreter/acorn.js', included:true},
            {pattern: 'scripts/vendor/js-interpreter/interpreter.js', included:true},
            {pattern: 'scripts/src/app/app.js', included: true},
            {pattern: 'scripts/src/data/messages.js', included: true},
            {pattern: 'scripts/src/model/esutils.js', included: true},
            {pattern: 'scripts/src/model/applyeffects.js', included: true},
            {pattern: 'scripts/src/api/passthrough.js', included: true},
            {pattern: 'scripts/src/api/earsketch.js.js', included: true},
            {pattern: 'scripts/src/api/earsketch.py.js', served: true},
            {pattern: 'scripts/src/app/services/audiocontext.js', included: true},
            {pattern: 'scripts/src/app/services/audiolibrary.js', included: true},
            {pattern: 'scripts/src/app/services/pitchshifter.js', included: true},
            {pattern: 'scripts/src/app/services/userconsole.js', included: true},
            {pattern: 'scripts/src/app/services/esconsole.js', included: true},
            {pattern: 'scripts/src/app/services/compiler.js', included: true},
            {pattern: 'scripts/src/app/services/renderer.js', included: true},

            //{pattern: 'tests/audiofiles.js', included:true}
            {pattern: 'tests/integration/helpers.js', included:true},
            {pattern: 'tests/integration/errors/*.spec.js', included:true},
        ],

        preprocessors: {
            'index.js': sourcePreprocessors
        },

        plugins: [
            'karma-chrome-launcher',
            'karma-safari-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-html-reporter'
        ],

        reporters: ['progress','html'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO,
        client: {
            captureConsole: false // set to true to show log messages
        },
        browsers: ['Chrome','Firefox','Safari'],
        singleRun: true
    });
};
