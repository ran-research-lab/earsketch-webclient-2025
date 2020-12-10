app.service('tabs', ['esconsole', function (esconsole) {
    this.list = [];

    // TODO: these are not used
    this.openScriptIDs = [];
    this.openSharedScriptIDs = [];

    this.activeTabIndex = -1;
    this.activeTabScript = null;

    this.loadedSharedScript = null;
    this.sharedScriptLoaded = false;

    this.ignoreOnChange = true;

    this.loadSharedScript = function (script) {
        esconsole('loading a shared script', 'tabs');
        this.loadedSharedScript = script;
        this.sharedScriptLoaded = true;
    };

    this.unloadSharedScript = function () {
        esconsole('unloading a shared script', 'tabs');
        this.loadedSharedScript = null;
        this.sharedScriptLoaded = false;
    };

    this.markActiveTabDirty = function () {

    };
}]);