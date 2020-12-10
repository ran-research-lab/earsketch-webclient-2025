/**
 * Karma config file for unit testing
 *
 * @module Tests.Unit
 * @author Creston Bunch
 */

module.exports = function(config) {
    var sourcePreprocessors = [];

    config.set({
        basePath: '../../',
        frameworks: ['jasmine'],

        files: [
            {pattern: 'scripts/vendor/bower_components/angular/angular.js', included:true},
            {pattern: 'scripts/vendor/bower_components/angular-mocks/angular-mocks.js', included:true},
            {pattern: 'scripts/src/app/app.js', included: true},
            {pattern: 'scripts/src/data/messages.js', included: true},
            {pattern: 'scripts/src/model/esutils.js', included: true},
            {pattern: 'scripts/src/app/services/audiocontext.js', included: true},
            {pattern: 'scripts/src/app/services/audiolibrary.js', included: true},
            {pattern: 'scripts/src/app/services/pitchshifter.js', included: true},
            {pattern: 'scripts/src/app/services/userconsole.js', included: true},
            {pattern: 'scripts/src/app/services/esconsole.js', included: true},
            {pattern: 'scripts/src/app/services/compiler.js', included: true},
            {pattern: 'scripts/src/app/services/renderer.js', included: true},
            {pattern: 'scripts/src/app/services/reporter.js', included: true},
            {pattern: 'scripts/src/app/services/reader.js', included: true},
            {pattern: 'scripts/src/app/services/userNotification.js', included: true},
            {pattern: 'scripts/src/app/services/localStorage.js', included: true},

            {pattern: 'scripts/src/api/angular-wrappers.js', included: true},
            {pattern: 'scripts/src/api/passthrough.js', included: true},

            {pattern: 'tests/unit/hello.js', included:true},
            {pattern: 'tests/unit/*.spec.js', included:true}
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

        captureTimeout: 20000,
        browserDisconnectTimeout: 240000,
        browserDisconnectTolerance: 3,
        browserNoActivityTimeout: 120000,

        reporters: ['progress','html'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO,
        client: {
            captureConsole: true // set to true to show log messages
        },
        browsers: ['Chrome','Firefox','Safari'],
        singleRun: true
    });
};
