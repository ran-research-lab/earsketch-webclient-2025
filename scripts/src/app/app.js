/**
 * This is the Angular app.
 *
 * @module EarSketchApp
 */
//test
// get SITE_BASE_URL: snippet copied from main.js initialization. app.js (this file) is loaded before that.
(function () {
    var lmcProdHost = 'https://earsketch.gatech.edu';
    var lmcDevHost = 'https://earsketch-dev.lmc.gatech.edu';
    var wssOrigin = window.location.origin.replace("https", "wss");

    if (typeof(require) === 'undefined') {
        // set URLS to dev values when require.js is not used (i.e., unit tests)
        URL_LOADAUDIO = lmcDevHost + '/EarSketchWS/services/audio/getaudiosample';
        URL_DOMAIN = lmcDevHost + '/EarSketchWS';
        URL_WEBSOCKET = wssOrigin + '/websocket';
    } else {
        var parser = document.createElement("a");
        parser.href = require.s.head.baseURI;
        var siteUrl;

        if (typeof(parser.origin) !== 'undefined') {
            siteUrl = parser.origin + parser.pathname;
        } else {
            siteUrl = parser.href; // with Edge browser, parser.origin is empty
        }

        if (siteUrl.includes('earsketch.gatech.edu')) {
            // set URLs to production values
            URL_LOADAUDIO = lmcProdHost + '/EarSketchWS/services/audio/getaudiosample';
            URL_DOMAIN = lmcProdHost + '/EarSketchWS';
            URL_WEBSOCKET = wssOrigin + '/websocket';

            URL_SEARCHFREESOUND = lmcProdHost + '/EarSketchWS/services/audio/searchfreesound';
            URL_SAVEFREESOUND = lmcProdHost + '/EarSketchWS/services/files/uploadfromfreesound';
        } else {
            console.log('Using the DEV server resources.');
            wssOrigin = lmcDevHost.replace("https", "wss");

            // set URLs to dev values
            URL_LOADAUDIO = lmcDevHost + '/EarSketchWS/services/audio/getaudiosample';
            URL_SEARCHFREESOUND = lmcDevHost + '/EarSketchWS/services/audio/searchfreesound';
            URL_SAVEFREESOUND = lmcDevHost + '/EarSketchWS/services/files/uploadfromfreesound';
            URL_DOMAIN = lmcDevHost + '/EarSketchWS';
            URL_WEBSOCKET = wssOrigin + '/websocket';

            // set URLs to local values
            // URL_LOADAUDIO = 'http://localhost:8080/EarSketchWS/services/audio/getaudiosample';
            // URL_DOMAIN = 'http://localhost:8080';
            // URL_WEBSOCKET = 'ws://localhost:8080';
        }
    }
})();

REPORT_LOG = []; // tracks log messages for sending error reports

var app = angular.module('EarSketchApp',['ui.router','ui.bootstrap','ui.layout','ui.utils','ngAnimate','ngFileUpload','angular-clipboard','angular-confirm','rzModule','ui.scroll','ui.scroll.grid']);

// Error handler override.
app.factory('$exceptionHandler', ['esconsole', '$injector', function(esconsole, $injector) {
    return function(exception, cause) {
        console.log(exception);
        esconsole(exception, ['ERROR','ANGULAR']);
        var reporter = $injector.get('reporter');

        // ensures we don't report Skulpt errors to GA
        if (exception.args === undefined) {
            reporter.exception(exception.toString());
        }
    };
}]);

app.run(['$window', 'ESUtils', function ($window, ESUtils) {

    // Returns the version of Internet Explorer or a -1
    // (indicating the use of another browser).
    function getInternetExplorerVersion() {
        var rv = -1; // Return value assumes failure.
        if ($window.navigator.appName == 'Microsoft Internet Explorer') {
            var ua = $window.navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null)
                rv = parseFloat(RegExp.$1);
        }
        return rv;
    }

    function checkIE() {
        var ver = getInternetExplorerVersion();
        if (ver > -1) //If any IE version
        {
            $window.location.replace('sorry.html');
        }
    }

    //Minimum version for chrome and firefox
    function checkMinVersion() {
        var chromeMin = 24;
        var ffMin = 25;

        var M = ESUtils.whichBrowser().split(' ');

        if ((M[0] == "Chrome" && M[1] < chromeMin) || (M[0] == "Firefox" && M[1] < ffMin)) {
            alert("It appears you are using version " + M[1] + " of " + M[0] + ". Please upgrade your browser so that EarSketch functions properly.");
            return false;
        }
        return true;
    }

    function mobileCheck() {
        if (ESUtils.isMobileBrowser()) {
            alert("It appears you are using a mobile browser. EarSketch is not equipped for mobile use.");
        }
    }

    mobileCheck();
    checkIE();
    checkMinVersion();
}]);

/**
 * Angular template cache buster. Uses the BUILD_NUM from main.js
 */
app.config(["$provide", function($provide) {
    return $provide.decorator("$http", ["$delegate", function($delegate) {
        var get = $delegate.get;
        $delegate.get = function(url, config) {
            // ignore Angular Bootstrap UI templates
            // also unit tests won't like release numbers added
            if (!~url.indexOf('template/') &&
                !~url.indexOf('rzSliderTpl.html') &&
                !~url.indexOf('tocPopoverTemplate.html') &&
                !~url.indexOf('sound-browser-tooltip.html') &&
                !~url.indexOf('mySlideTemplate.html') &&
                typeof(BUILD_NUM) !== 'undefined') {
                var parser = document.createElement("a");
                parser.href = url;
                if (!parser.search) {
                    parser.search = "?release=" + BUILD_NUM;
                } else {
                    parser.search += "&release=" + BUILD_NUM;
                }
                url = parser.href;
            }
            return get(url, config);
        };
        return $delegate;
    }]);
}]);


app.directive('rightClickMenu', ['$parse', function ($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.rightClickMenu);
        element.bind('contextmenu', function (event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event});
            });
        });
    };
}]);

// app.config(function($provide, $uibTooltipProvider) {
//    $uibTooltipProvider.setTriggers({
//        'none': 'outsideClick'
//    });
// });
