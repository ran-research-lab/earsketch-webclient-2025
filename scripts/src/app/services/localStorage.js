app.service('localStorage', ['$window', function ($window) {
    var localStorage = $window.localStorage;

    /**
     * Returns the window.localStorage object.
     * @returns {Storage}
     */
    this.getStorageObj = function () {
        return localStorage;
    };

    /**
     * Returns the string list of currently used keys.
     * @returns {Array}
     */
    this.getKeys = function () {
        var list = [];
        for (var i = 0; i < localStorage.length; i++) {
            list.push(localStorage.key(i));
        }
        return list;
    };

    /**
     * Sets the value for the specified key. If either key or val are missing, it returns null.
     * @param key {string}
     * @param val {string} If a non-string value with toString() method is given, it is converted to string automatically.
     */
    this.set = function (key, val) {
        if (typeof(key) === 'undefined' || typeof(val) === 'undefined') {
            return null;
        } else if (typeof(val.toString) === 'function') {
            val = val.toString();
        }
        localStorage.setItem(key, val);
    };

    /**
     * Returns the stored value for the key. By default, if the key doesn't exist, it returns null -- However, if the optional valueIfNull is given, it returns that value instead.
     * @param key {string}
     * @param [valueIfNull] {string}
     * @returns {string|null}
     */
    this.get = function (key, valueIfNull) {
        if (typeof(key) === 'undefined') {
            return null;
        }
        var value = localStorage.getItem(key);
        return value ? value : (typeof(valueIfNull) !== 'undefined' ? valueIfNull : null);
    };

    /**
     * Checks if the key exists in localStorage.
     * @param key {string}
     * @returns {boolean}
     */
    this.checkKey = function (key) {
        if (typeof(key) === 'undefined') {
            return false;
        }
        return this.getKeys().indexOf(key) > -1;
    };

    /**
     * Removes a stored item by key.
     * @param key {string}
     */
    this.remove = function (key) {
        if (typeof(key) === 'undefined') {
            return null;
        }
        return localStorage.removeItem(key);
    };

    /**
     * Clears localStorage.
     */
    this.clear = function () {
        localStorage.clear();
    };
}]);
