// Logging functionality of web analytics
// Currently using google analytics
// author: cameron
// To use: call one of the public functions in an event handler in the application
EarSketch.namespace("Earsketch.analytics");

// Keeping this global to work nicely with GA
if (true) {
//if (window.location.hostname === 'earsketch.gatech.edu') { // only track the live site

    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', 'UA-33307046-2']);
    _gaq.push(['_trackPageview']);

    (function () {
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'stats.g.doubleclick.net/dc.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);
    })();
}

EarSketch.analytics = (function () {

    var isInitialized = false;

    function publicInit() {

        esconsole("initialization web analytics logger...", ["debug", 'init']);

        // Grab ID from google analytics utma cookie
        var gaIdInfo = privateReadCookie("__utma");
        var id = "(not set)";
        if (gaIdInfo) { // may not be available
            id = gaIdInfo.split(".")[1];
        }
        _gaq.push(["_setCustomVar", 5, "UnknownVisitorID", id, 1]);

        isInitialized = true;

    }

    // Add click events
    function publicLogButtonClickEvent(uniqueDescription) {
        if (isInitialized) { // do nothing if not initialized
            _gaq.push(['_trackEvent', 'userAction', 'buttonClick', uniqueDescription]);
        }
    }

    // Add client server events
    function publicLogClientServerCommEvent(uniqueDescription) {
        if (isInitialized) { // do nothing if not initialized
            _gaq.push(['_trackEvent', 'systemAction', 'clientServerComm', uniqueDescription]);
        }
    }

    // Add client host events
    function publicLogClientHostCommEvent(uniqueDescription) {
        if (isInitialized) { // do nothing if not initialized
            _gaq.push(['_trackEvent', 'systemAction', 'clientHostComm', uniqueDescription]);
        }
    }

    // Add username for logged in users
    function publicLogEarSketchUserName(username) { // should only be called once on login success
        if (isInitialized) { // do nothing if not initialized
            _gaq.push(["_setCustomVar", 4, "EarSketchUsername", username, 1]);
        }
    }

    // Read cookie by name to get user ID for unknown google analytics visitor - source: quirksmode
    function privateReadCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');

        var readValue = null;

        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) {
                readValue = c.substring(nameEQ.length, c.length);
            }
        }
        return readValue;
    }

    return {
        init: publicInit,
        logButtonClickEvent: publicLogButtonClickEvent,
        logClientServerCommEvent: publicLogClientServerCommEvent,
        logClientHostCommEvent: publicLogClientHostCommEvent,
        logEarSketchUsername: publicLogEarSketchUserName,
    }

})();

