/**
 * Created by anandmahadevan on 4/12/15.
 */
/**
 * Created by anandmahadevan on 4/12/15.
 */
// Karma configuration
// Generated on Wed Oct 29 2014 20:57:22 GMT-0400 (EDT)

module.exports = function(config) {
    var sourcePreprocessors = 'coverage';
    function isDebug(argument) {
        return argument === '--debug';
    }
    if (process.argv.some(isDebug)) {
        sourcePreprocessors = [];
    }

    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '../../',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser
        files: [
            {pattern: 'index.html', included:true},
            {pattern: 'scripts/src/mobile.js', included:true},
//          {pattern: 'scripts/require.js', included:true},
//          {pattern: 'scripts/main.js', included:true},
            {pattern: 'scripts/vendor/codemirror/codemirror.js', included:true},
            {pattern: 'scripts/vendor/codemirror/matchbrackets.js', included:true},
            {pattern: 'scripts/vendor/codemirror/python.js', included:true},
            {pattern: 'scripts/vendor/codemirror/javascript.js', included:true},
            {pattern: 'scripts/vendor/codemirror/show-hint.js', included:true},
            {pattern: 'scripts/vendor/codemirror/python-hint.js', included:true},
            {pattern: 'scripts/vendor/codemirror/javascript-hint.js', included:true},
            {pattern: 'scripts/vendor/codemirror/comment.js', included:true},
            {pattern: 'scripts/lib/dsp.js', included:true},
            {pattern: 'scripts/lib/cookies.js', included:true},

            // Skulpt
            {pattern: 'scripts/vendor/skulpt/skulpt.min.js', included:true},
            {pattern: 'scripts/vendor/skulpt/skulpt-stdlib.js', included:true},

            // Passthrough files
            {pattern: 'scripts/src/model/ES_passthrough.js', included:true},
            {pattern: 'scripts/src/model/js_lib.js', included:true},
            {pattern: 'scripts/src/model/py_lib.js', served:true},

            //jQuery
            {pattern: 'scripts/vendor/jquery/jquery.js', included:true},
            {pattern: 'scripts/vendor/jquery/jquery-ui.js', included:true},
            {pattern: 'scripts/vendor/jquery/jquery.layout-latest.js', included:true},
//          {pattern: 'scripts/collapse.js', included:true},

            //Pitchshift
            {pattern: 'scripts/lib/earsketch-dsp.js', included:true},
            {pattern: 'scripts/lib/earsketch-appdsp.js', included:true},

            //Angular Libraries
            {pattern: 'scripts/vendor/angular/angular.min.js', included:true},
            {pattern: 'scripts/vendor/angular/angular-resource.min.js', included:true},
            {pattern: 'scripts/vendor/angular/angular-ui-router.min.js', included:true},
            {pattern: 'scripts/vendor/angular/angular-mocks.js', included:true},
            {pattern: 'scripts/vendor/bootstrap/ui-bootstrap-tpls-0.10.0.min.js', included:true},
            {pattern: 'scripts/vendor/angular/angular-ui-utils.min.js', included:true},

            //JS module services
            {pattern: 'scripts/src/model/modules.js', included:true},
            {pattern: 'scripts/src/model/interpreter.js', included:true},
            {pattern: 'scripts/src/model/audiofile.js', included:true},

            // ES Audio files
            {pattern: 'scripts/src/model/esutils.js', included:true},
            {pattern: 'scripts/src/model/esaudio.js', included:true},
            {pattern: 'scripts/src/model/dawservice.js', included:true},
            {pattern: 'scripts/src/model/applyeffects.js', included:true},
            {pattern: 'scripts/src/model/analysis.js', included:true},

            //Error messages
            {pattern: 'scripts/src/data/messages.js', included:true},

            //Angular earsketch files
            {pattern: 'scripts/src/app/app.js', included:true},
            {pattern: 'scripts/src/app/mainController.js', included:true},
            {pattern: 'scripts/src/app/ideController.js', included:true},
            {pattern: 'scripts/src/app/dawController.js', included:true},
            {pattern: 'scripts/src/model/user.js', included:true},
            {pattern: 'scripts/src/app/uploadController.js', included:true},
            // Earsketch WS API
            {pattern: 'scripts/src/model/wsapi.js', included:true},

            //Sound browser
            {pattern: 'scripts/sb.js', included:true},

            //Bootstrap
            {pattern: 'scripts/vendor/bootstrap/bootstrap.min.js', included:true},

            //D3 visuals
            {pattern: 'scripts/vendor/d3.js', included:true},
            //Node mailer
//          {pattern: 'node_modules/nodemailer/**/*.js', included:true},
//          {pattern: 'node_modules/nodemailer/src/nodemailer.js', included:true},
            //Require JS
//          {pattern: 'node_modules/requirejs/require.js', included:true},

//          {pattern: '/Users/anandmahadevan/node_modules/underscore/underscore.js', included:true},



            // Jasmine test files
            {pattern: 'tests/coursera/*.js', included:true},
//          'scripts/main.js'
        ],


        // list of files to exclude
        exclude: [
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'index.js': sourcePreprocessors
        },

        plugins: [
            // these plugins will be require() by Karma
            'karma-chrome-launcher',
            'karma-safari-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-html-reporter'
        ],

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress','html'],
//    htmlReporter: {outputFile: 'tests/result.html'},


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO ,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],

        browserDisconnectTimeout: 60000,
        browserNoActivityTimeout: 60000,
        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });
};


