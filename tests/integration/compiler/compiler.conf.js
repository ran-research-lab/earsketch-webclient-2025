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
            {pattern: 'scripts/lib/dsp.js', included: true},
            {pattern: 'scripts/lib/earsketch-dsp.js', included: true},
            {pattern: 'scripts/lib/earsketch-appdsp.js', included: true},
            {pattern: 'scripts/src/model/analysis.js', included: true},
            {pattern: 'scripts/src/model/applyeffects.js', included: true},
            {pattern: 'scripts/src/api/angular-wrappers.js', included: true},
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
            {pattern: 'scripts/src/app/services/userProject.js', included: true},
            {pattern: 'scripts/src/app/services/localStorage.js', included: true},
            {pattern: 'scripts/src/app/services/colorTheme.js', included: true},
            {pattern: 'scripts/src/app/services/reporter.js', included: true},
            {pattern: 'scripts/src/app/services/reader.js', included: true},
            {pattern: 'scripts/src/app/services/autograder.js', included: true},
            {pattern: 'scripts/src/app/services/userNotification.js', included: true},
            {pattern: 'scripts/src/app/services/websocket.js', included: true},
            {pattern: 'scripts/src/app/services/collaboration.js', included: true},
            {pattern: 'scripts/src/app/services/tabs.js', included: true},

            {pattern: 'tests/integration/settings.js', included:true},
            {pattern: 'tests/integration/helpers.js', included:true},
            {pattern: 'tests/integration/compiler/*.spec.js', included:true},
            {pattern: 'tests/integration/compiler/*.scripts.js', included:true},
            {pattern: 'tests/integration/compiler/*.results.js', included:true}
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

        // attempts for bypassing the security warning in FF -- not really working
        // browsers: ['Firefox_custom'],
        // customLaunchers: {
        //     Firefox_custom: {
        //         base: 'Firefox',
        //         prefs: {
        //             // 'security.use_mozillapkix_verification': false,
        //             // 'security.fileuri.strict_origin_policy': false,
        //             // 'security.tls.insecure_fallback_hosts': 'earsketch.gatech.edu',
        //             // 'security.ssl3.dhe_rsa_aes': false,
        //             // 'security.ssl3.dhe_rsa_des_ede3_sha': false,
        //             // 'security.ssl3.dhe_rsa_aes_128_sha': false,
        //             // 'security.ssl3.dhe_rsa_aes_256_sha': false,
        //             // 'security.mixed_content.block_active_content': false,
        //             // 'security.pki.sha1_enforcement_level': 0,
        //             // 'security.tls.insecure_fallback_hosts.use_static_list': true,
        //             // 'security.tls.version.fallback-limit': 1,
        //             // 'browser.xul.error_pages.enabled': true
        //             //'browser.ssl_override_behavior': 1,
        //             //'security.ssl.enable_ocsp_stapling': false,
        //             // 'security.warn_entering_secure': false,
        //             // 'security.tls.version.max': 0,
        //             // 'security.tls.version.min': 0
        //         }
        //     }
        // },
        singleRun: true,
        proxyValidateSSL: false
    });
};
