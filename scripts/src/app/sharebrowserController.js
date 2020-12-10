app.directive('sharebrowser', function() {

    return {
        require: 'ideController',
        templateUrl: 'templates/share-browser.html',
        controller: ['$rootScope', '$scope', '$uibModal', '$location', 'userProject', '$confirm', 'collaboration', 'tabs', function($rootScope, $scope, $uibModal, $location, userProject, $confirm, collaboration, tabs) {
            $scope.sharedScriptsList = userProject.sharedScripts;
            $scope.shareLink = location.origin + location.pathname + '#?sharing=';
            $scope.shareLink += userProject.shareid ? userProject.shareid : '';
            $scope.sharescriptssearch = '';

            $scope.order = '-modified';
            $scope.filteredSharedScripts = $scope.sharedScriptsList;
            $scope.sharedScriptFilters = {
                owner: [],
                fileType: []
            };

            $scope.loadedSharedScript = tabs.loadedSharedScript;
            $scope.isSharedScriptLoaded = tabs.sharedScriptLoaded;
            $scope.tabService = tabs; // TODO: rename to tabs when its ready

            $scope.updateSharedScriptFilters = function (filterName, item) {
                if (item) {
                    var pos = $scope.sharedScriptFilters[filterName].indexOf(item);
                    if (pos === -1) {
                        $scope.sharedScriptFilters[filterName].push(item);
                    } else {
                        $scope.sharedScriptFilters[filterName].splice(pos, 1);
                    }
                }

                applyAllScriptFilters();
            };

            function applyAllScriptFilters() {
                // $scope.currentTime = Date.now();

                var noFilter = ['owner', 'fileType'].every(function (name) {
                    return $scope.sharedScriptFilters[name].length === 0;
                });

                if (noFilter) {
                    $scope.filteredSharedScripts = $scope.sharedScriptsList;
                } else {
                    $scope.filteredSharedScripts = {};

                    // Check each script
                    angular.forEach($scope.sharedScriptsList, function (script) {
                        var matches = ['owner', 'fileType'].every(function (property) {
                            if ($scope.sharedScriptFilters[property].length === 0) {
                                return true;
                            } else {
                                return $scope.sharedScriptFilters[property].some(function (tag) {
                                    switch (property) {
                                        case 'fileType':
                                            return typeof(script['name']) !== 'undefined' && script['name'].endsWith(tag);
                                            break;
                                        case 'owner':
                                            return script['username'].indexOf(tag) > -1;
                                            break;
                                    }
                                });
                            }
                        });

                        if (matches) {
                            $scope.filteredSharedScripts[script.shareid] = script;
                        }
                    });
                }
            }

            $scope.toggleFileTypeForShared = function (fileType) {
                $scope.clearSharedScriptsFilter('fileType');
                $scope.updateSharedScriptFilters('fileType', fileType);
            };

            $scope.clearSharedScriptsFilter = function (filterName) {
                if (typeof(filterName) === 'undefined') {
                    ['owner', 'fileType'].forEach(function (v) {
                        $scope.clearSharedScriptsFilter(v);
                    });
                    $scope.sharescriptssearch = '';
                    return null;
                }
                $scope.sharedScriptFilters[filterName] = [];
                applyAllScriptFilters();
            };

            $scope.clearSharedScriptsFilter();

            $scope.isSharedScriptsListEmpty = function () {
                return Object.keys($scope.sharedScriptsList).length <= 0;
            };

            $scope.loadSharedScript = function (script){
                tabs.loadSharedScript(script);
                $scope.shareLink = location.origin + location.pathname + '#?sharing=' + script.shareid;
            };

            function unloadSharedScript() {
                tabs.unloadSharedScript();
                $scope.shareLink = '';
            }

            $scope.deleteSharedScript = function (script) {
                if (script.collaborative) {
                    $confirm({text: 'Do you want to leave the collaboration on "' + script.name + '"?', ok: 'Leave'}).then(function () {
                        collaboration.leaveCollaboration(script.shareid, userProject.getUsername());
                        if (script.shareid === collaboration.scriptID && collaboration.active) {
                            collaboration.closeScript(script.shareid);
                            userProject.closeSharedScript(script.shareid);
                        }
                        unloadSharedScript();

                        // TODO: close the tab if open -- is there tabs-data service besides tabController?
                        // $scope.tabs.forEach(function (openScript, i) {
                        //     if (openScript.shareid === script.shareid) {
                        //         $scope.closeTab(i);
                        //     }
                        // });
                    })
                } else {
                    $confirm({text: "Are you sure you want to delete the shared script '"+script.name+"'?", ok: "Delete"}).then(function () {
                        userProject.deleteSharedScript(script.shareid);
                        // $scope.isSharedScriptLoaded = false;
                        tabs.sharedScriptLoaded = false;
                    });
                }
            }
        }]
    }
});

// TODO: kind of duplicate to the filterScripts filter
/**
 * Filter scripts and return an array of object values for ng-repeat.
 */
app.filter('filterSharedScripts', function () {
    return function (obj, filteredScripts) {
        var result = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof(filteredScripts[key]) !== 'undefined') {
                    result.push(obj[key]);
                }
            }
        }
        return result;
    }
});

/**
 * Converts Date String to UTC Date Object.
 */
app.filter('dateUTCFormat', function () {
    return function (dateString) {
        // dateString can be in integer format when opening a share link without logging in.
        if (dateString !== undefined && isNaN(dateString)) {
            var date = dateString, //safari doesn't understand this date format so we split it using regex
                values = date.split(/[^0-9]/),
                year = parseInt(values[0], 10),
                month = parseInt(values[1], 10) - 1, // Month is zero based, so subtract 1
                day = parseInt(values[2], 10),
                hours = parseInt(values[3], 10),
                minutes = parseInt(values[4], 10),
                seconds = parseInt(values[5], 10);

            return new Date(year, month, day, hours, minutes, seconds); // result
        }
    }
});
