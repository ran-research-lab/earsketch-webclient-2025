app.directive('scriptbrowser', function() {
    return {
        // TODO: move relevant code from ideController to here
        require: 'ideController',
        templateUrl: 'templates/script-browser.html',
        transclude: true,
        controller: ['$rootScope', '$scope', '$http', '$uibModal', '$location', 'userProject', 'exporter', '$confirm', 'reporter', 'collaboration', function($rootScope, $scope, $http, $uibModal, $location, userProject, exporter, $confirm, reporter, collaboration) {
            $scope.username = userProject.getUsername();
            $scope.scriptsList = userProject.scripts;
            $scope.order = '-modified';
            $scope.scriptssearch = '';
            $scope.currentScript = '';
            $scope.scriptVersions = '';
            $scope.currentTime = Date.now();

            $scope.showDeletedScripts = false;

             // TEMPORARY FOR AMAZON CONTEST TESTING
            $scope.showAmazon = FLAGS.SHOW_AMAZON;

            $rootScope.$on('showAmazon', function () {
                $scope.showAmazon = true;
            });


            $scope.filteredScripts = $scope.scriptsList;
            $scope.scriptfilters = {
                owner: [],
                filetype: [],
                soft_delete: []
            };

            $scope.licenses = {};
            userProject.getLicenses().then(function (licenses) {
                angular.forEach(licenses, function (license) {
                    $scope.licenses[license.id] = license;
                })
            });

            //listen to the broadcast message sent by mainController
            $rootScope.$on('scriptsLoaded', function () {
                $scope.username = userProject.getUsername();
            });

            //update filters when scripts are added or deleted
            $scope.$watch('scriptsList', function () {
                $scope.areScriptsPresent = JSON.stringify($scope.scriptsList) !== JSON.stringify({});
                $scope.applyAllScriptFilters();
            }, true);


            $scope.$on('manageScriptFromScriptContextMenu', function(event, scriptBrowserFunction, tab){
                $scope[scriptBrowserFunction](tab);
            });

            $scope.deleteScript = function(script) {
                $confirm({text: "Deleted scripts disappear from Scripts list and can be restored from the list of 'deleted scripts'.", ok: "Delete"}).then(function () {
                    if (script.shareid === collaboration.scriptID && collaboration.active) {
                        collaboration.closeScript(script.shareid);
                    }
                    userProject.deleteScript(script.shareid);
                    reporter.deleteScript();
                });
            };

            $scope.hasDeletedScripts = function() {
                return Object.values($scope.scriptsList).filter(function(s){return !!s.soft_delete}).length > 0;
            };

            $scope.restoreScript = function(script) {

                $confirm({text: "Are you sure you want to restore '"+script.name+"'?", ok: "Yes"}).then(function () {
                    userProject.restoreScript(script).then(function (restoredScript) {
                        userProject.refreshCodeBrowser().then(function() {
                            $scope.showDeletedScripts = false;
                            if (restoredScript) {
                                $scope.selectScript(restoredScript);
                            } else {
                                $scope.selectScript(script);
                            }
                        });

                    });
                });
            };

            $scope.renameScript = function(script) {
                var modal = $uibModal.open({
                    templateUrl: 'templates/rename-script.html',
                    controller: 'renameController',
                    size: 100,
                    resolve: {
                        script: function() { return script; }
                    }
                });

                modal.result.then(function (newScript) {
                    userProject.renameScript(script.shareid, newScript.name);
                    reporter.renameScript();
                }, function() {
                    // dismissed
                });
            };

            $scope.pasteScript = function (script) {
                var source = script.source_code;
                angular.element(
                    document.getElementById('devctrl')
                ).scope().pasteCode(source);
            };

            /**
             * Displays the script history in a modal
             *
             * @param {object} script The script object.
             * @param {bool} allowRevert
             */
            $scope.openHistory = function (script, allowRevert) {
                var modal = $uibModal.open({
                    templateUrl: 'templates/script-versions.html',
                    controller: 'scriptVersionController',
                    size: 'lg',
                    resolve: {
                        script: function() { return script; },
                        allowRevert: allowRevert
                    }
                });
                reporter.openHistory();
            };

            $scope.close = function() {
                $uibModalInstance.close();
            };


            $scope.openShare = function (script) {
                var modal = $uibModal.open({
                    templateUrl: 'templates/share-project-url.html',
                    controller: 'shareController',
                    size: 100,
                    resolve: {
                        url: function() { return location.origin +
                            location.pathname +
                            '#?sharing=' +
                            script.shareid; }
                    }
                });
            };

            $scope.printScript = function (script) {
                exporter.print(script);
            };

            $scope.analyzeScript = function (script) {
                var modal = $uibModal.open({
                    templateUrl: 'templates/script-analysis.html',
                    controller: 'analyzeScriptController',
                    size: 100,
                    resolve: {
                        script: function() { return script; }
                    }
                });
            };

            $scope.shareScript = function (script) {
                var modalInstance = $uibModal.open({
                    templateUrl: 'templates/share-script.html',
                    controller: 'shareScriptController',
                    size: 'lg',
                    resolve: {
                        script: function() { return script; },
                        quality: function() { return $scope.audioQuality; },
                        licenses: function() { return $scope.licenses; }

                    }
                });
            };

            $scope.submitToAWS = function (script) {
                var modalInstance = $uibModal.open({
                    templateUrl: 'templates/submit-script-aws.html',
                    controller: 'submitAWSController',
                    size: 'lg',
                    resolve: {
                        script: function() { return script; },
                        quality: function() { return $scope.audioQuality; },
                        licenses: function() { return $scope.licenses; }

                    }
                });
            };

            $scope.downloadModal = function (script) {
                var modalInstance = $uibModal.open({
                    templateUrl: 'templates/download.html',
                    controller: 'downloadController',
                    resolve: {
                        script: function() { return script; },
                        quality: function() { return $scope.audioQuality; }
                    }
                });
            };


            $scope.updateScriptFilters = function (filterName, item) {
                if (item) {
                    var pos = $scope.scriptfilters[filterName].indexOf(item);
                    if (pos === -1) {
                        $scope.scriptfilters[filterName].push(item);
                    } else {
                        $scope.scriptfilters[filterName].splice(pos, 1);
                    }
                }

                $scope.applyAllScriptFilters();
            };

            $scope.applyAllScriptFilters = function () {
                $scope.currentTime = Date.now();

                var noFilter = ['owner', 'filetype'].every(function (name) {
                    return $scope.scriptfilters[name].length === 0;
                });

                if (noFilter) {
                    $scope.filteredScripts = $scope.scriptsList;
                } else {
                    $scope.filteredScripts = {};

                    // Check each script
                    angular.forEach($scope.scriptsList, function (script) {
                        var matches = ['owner', 'filetype'].every(function (property) {
                            if ($scope.scriptfilters[property].length === 0) {
                                return true;
                            } else {
                                return $scope.scriptfilters[property].some(function (tag) {
                                    switch (property) {
                                        case 'filetype':
                                            return script['name'] !== undefined && script['name'].endsWith(tag);
                                            break;
                                        case 'owner':
                                            if (script['creator'] === undefined) {
                                                return script['username'] === tag;
                                            } else {
                                                return script['creator'].indexOf(tag) > -1;
                                            }
                                    }
                                });
                            }
                        });

                        if (matches) {
                            $scope.filteredScripts[script.shareid] = script;
                        }
                    });
                }
            };

            $scope.toggleFiletype = function (filetype) {
                $scope.clearScriptsFilter('filetype');
                $scope.updateScriptFilters('filetype',filetype);
            };

            $scope.clearScriptsFilter = function (filterName) {
                if (typeof(filterName) === 'undefined') {
                    ['owner', 'filetype', 'soft_delete'].forEach(function (v) {
                        $scope.clearScriptsFilter(v);
                    });
                    $scope.scriptssearch = '';
                    return null;
                }
                $scope.scriptfilters[filterName] = [];

                //Reset filteredSounds array
                $scope.applyAllScriptFilters();
            };

            $scope.clearScriptsFilter();
        }]
    };
});

/**
 * Filter scripts and return an array of object values for ng-repeat.
 */
app.filter('filterScripts', function () {
    return function (obj,filteredScripts) {
        var result = [];
        for (var key in obj) {
            if (filteredScripts[key] !== undefined) {
                result.push(obj[key]);
            }
        }
        return result;
    }
});

/**
 * Filter scripts by soft_delete flag and return an array of object values for ng-repeat.
 */
app.filter('filterDeleted', function () {
    return function (obj, showDeletedScripts) {
        var result = [];

        angular.forEach(obj, function (script, key) {
            if (script.soft_delete == undefined && !showDeletedScripts) {
                result.push(obj[key]);
            } else if (script.soft_delete == showDeletedScripts) {
                result.push(obj[key]);
            }
        });

        return result;
    }
});

/**
 * Filter unique for returning a list of object values as an array for ng-repeat.
 */
app.filter('uniqueOwners', function() {
    return function(collection, keyname) {
        var output = [], keys = [];

        angular.forEach(collection, function(item) {
            var key = item[keyname];

            if(key !== undefined && keys.indexOf(key) === -1) {
                keys.push(key);
                output.push(item);
            }
        });

        return output;
    };
});

/**
 * Filter for calculating last modified time unit
 */
app.filter('formatTimer', function () {
    return function (input) {
        var seconds = Math.floor(input / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);

        if (days <= 1) {
            if (seconds <= 0) {
                return 'just now';
            } else if (minutes === 0) {
                // if (seconds === 1) {
                //     return '1 second ago';
                // } else {
                //     return seconds + ' seconds ago';
                // }
                return 'recently';
            } else if (hours === 0) {
                if (minutes === 1) {
                    return '1 minute ago';
                } else {
                    return minutes + ' minutes ago';
                }
            } else if (hours < 24) {
                if (hours === 1) {
                    return '1 hour ago';
                } else {
                    return hours + ' hours ago';
                }
            }
        } else {
            // if (days <= 1) return "today";
            if (days > 1 && days <= 2) {
                return "yesterday";
            } else if (days > 2 && days <= 7) {
                return days + " days ago";
            } else if (days > 7) {
                var weeks = Math.floor(days/7);

                if (weeks === 1) {
                    return "last week";
                } else if (weeks > 1 && weeks <= 4) {
                    return weeks + " weeks ago";
                } else if (weeks > 4) {
                    var months = Math.floor(weeks/4);

                    if (months === 1) {
                        return "last month";
                    } else if (months > 1 && months < 12) {
                        return months + " months ago";
                    } else if (months >= 12) {
                        var years = Math.floor(months/12);
                        if (years <= 1) {
                            return "last year";
                        } else if (years > 1) {
                            return years + " years ago";
                        }
                    }
                }
            }
        }
    }
});
