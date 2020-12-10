app.directive('soundbrowser', ['audioContext', 'audioLibrary', 'userProject', 'esconsole', 'userNotification', 'localStorage', 'reporter', 'recommender', '$timeout', '$window', '$q', '$location', function (audioContext, audioLibrary, userProject, esconsole, userNotification, localStorage, reporter, recommender, $timeout, $window, $q, $location) {
    return {
        templateUrl: 'templates/sound-browser.html',
        transclude: true,
        controller: ['$rootScope', '$scope', '$http', '$log', '$location', '$anchorScroll', '$uibModal', '$confirm', function ($rootScope, $scope,  $http, $log, $location, $anchorScroll, $uibModal, $confirm) {
            var showLoginMessage = false; // used upon completing populateSound when user is already logged in from the previous session
            $scope.$on('showLoginMessage', function () {
                showLoginMessage = true;
            });

            var showRenameMessage = false;
            var showDeleteMessage = false;

            $scope.sounds = [];
            $scope.filteredSounds = [];
            $scope.orderedSounds = [];

            // split sound lists for ordering
            $scope.recSounds = [];
            $scope.specialSounds = [];
            $scope.defaultUserSounds = [];

            // track active script for recommendation generation
            $scope.activeScript = false;

            // folders for scroll/pagination
            $scope.folderList = [];
            $scope.folderVisibility = {};

            $scope.recommendedSounds = [];
            $scope.recommenderInput = [];
            $scope.recLabels = [
                'Others Like You Use These Sounds',
                'Sounds That Fit Your Script',
                'Discover Different Kinds of Sounds',
                'Are You Feeling Lucky?'
            ];

            $scope.recDescriptions = {
                'Others Like You Use These Sounds':'Recommendations of similar and commonly used sounds with the ones in your script',
                'Sounds That Fit Your Script':'Recommendations of sounds that sound similar but are rarely used with the ones in your script', 
                'Discover Different Kinds of Sounds':'Recommendations of sounds that sound different but are commonly used with the ones in your script',
                'Are You Feeling Lucky?':'Recommendations of sounds that are different and rarely used with the ones in your script'
            };


            var compModeFromURL = $location.absUrl().includes('competition');
            if (compModeFromURL || FLAGS.SHOW_AMAZON_SOUNDS) {
                $scope.showAmazon = true;
            }

            $scope.instruments = [];
            $scope.filteredInstruments;

            $scope.genres = [];
            $scope.filteredGenres;

            $scope.artists = [];
            $scope.filteredArtists;
            $scope.defaultArtistNames = ["MAKEBEAT", "RICHARD DEVINE", "YOUNG GURU", "MILKNSIZZ"];

            $scope.allSpecialArtists = ["PHARRELL", "COMMON", "CIARA"];
            $scope.specialArtistNames = [];
            if (compModeFromURL || FLAGS.SHOW_AMAZON_SOUNDS) {
                 $scope.specialArtistNames.push("CIARA");
            }
            if (FLAGS.SHOW_COMMON) {
                $scope.specialArtistNames.push("COMMON");
            }
            if (FLAGS.SHOW_PHARRELL) {
                $scope.specialArtistNames.push("PHARRELL");
            }

            // TEMPORARY FOR AMAZON CONTEST TESTING
            $rootScope.$on('showAmazonSounds', function () {
                $scope.showAmazon = true;
                if ($scope.specialArtistNames.indexOf("CIARA") === -1) {
                    $scope.specialArtistNames.push("CIARA");
                }
            });

            // if (userProject.getUsername()) {
            //     $scope.defaultArtistNames.push(userProject.getUsername().toUpperCase());
            // }

            $scope.soundIsChangeable = function (artistName) {

                return $scope.defaultArtistNames.concat($scope.allSpecialArtists).indexOf(artistName) === -1;
            };

            $scope.soundsLoaded = false;
            $scope.showOnlyFavorites = false;

            $scope.filters = {
                artist: [],
                genre: [],
                instrument: [],
                search: [],
                favorite: []
            };

            /**
             * This contains the raw string for single or multiple search terms separated by spaces.
             * @type {string}
             */
            $scope.searchTerm = '';

            $scope.currentlyPlaying;
            $scope.previouslyPlaying;

            var myBuffer = {};
            var firstPreview = 1;
            var previousSource = [];

            $scope.currentPage = 1; //current page
            $scope.maxSize = 4; //pagination max size

            var entryLimit = localStorage.get("sbEntryLimit");
            $scope.entryLimit = entryLimit ? entryLimit : 10; //max rows for data table
            $scope.entryLimitInput = entryLimit ? entryLimit : 10;

            /* init pagination with $scope.sounds */
            $scope.noOfPages = Math.ceil($scope.sounds.length/$scope.entryLimit);

            $scope.setPage = function (pageNo) {
                $scope.currentPage = pageNo;
            };

            $scope.pageChanged = function () {
                $location.hash('top');
                $anchorScroll();
            };

            $scope.$on('refreshSounds', function () {
                $scope.populateSounds($scope.username, true);
            });

            $scope.$on('unloadUserSounds', function () {
                $scope.populateSounds('', '');
                $scope.showOnlyFavorites = false;
            });

            $scope.numTabsOpen = 0;
            $scope.$on('setNumTabsOpen', function (event, tabsLength) {
                $scope.numTabsOpen = tabsLength;
            });

            // respond to changes in active script for recommendation generation.
            $scope.$on('recommenderScript', function (event, script) {
                $scope.recommenderInput = [];
                if (script) {
                    $scope.activeScript = true;
                    $scope.recommenderInput = recommender.addRecInput($scope.recommenderInput, script);
                }
                else {
                    $scope.activeScript = false;
                }
                $scope.updateRecommendations();
            });

            $scope.$on('compiled', function (event, result) {
                // generate list of input samples from compiled script (includes loops, etc).
                $scope.recommenderInput = [];

                for (var idx = 1; idx < result.tracks.length - 1; idx ++) {
                    for (var iidx = 0; iidx < result.tracks[idx].clips.length; iidx++) {
                        var sound = result.tracks[idx].clips[iidx];
                        // exclude makebeat, custom, and already recommended sounds
                        if (sound.filekey.slice(0,3) !== 'OS_' && !$scope.recommenderInput.includes(sound.filekey) && $scope.defaultArtistNames.includes(sound.artist)) {
                            $scope.recommenderInput.push(sound.filekey);
                        }
                    }
                }
                $scope.updateRecommendations();
            });

            $scope.updateRecommendations = function() {

                // empty recommendation list
                $scope.recommendedSounds = [];

                // if no recommendations can be found in a current active script
                if ($scope.recommenderInput.length === 0 && $scope.activeScript) {
                    if ($scope.filteredScriptsList) {
                        // search through at most 5 previous scripts to add to recommender input
                        var lim = Math.min(5, $scope.filteredScriptsList.length);
                        for (var idx = 0; idx < lim; idx++) {
                            $scope.recommenderInput = recommender.addRecInput($scope.recommenderInput, $scope.filteredScriptsList[idx]);
                        }
                    }
                }

                // others like you use these sounds
                $scope.recommendedSounds = recommender.recommend($scope.recommendedSounds, $scope.recommenderInput, 1, 1);

                // sounds that fit your script
                $scope.recommendedSounds = recommender.recommend($scope.recommendedSounds, $scope.recommenderInput, -1, 1);

                // discover different kinds of sounds
                $scope.recommendedSounds = recommender.recommend($scope.recommendedSounds, $scope.recommenderInput, 1, -1);

                // i'm feeling lucky TODO: add random
                $scope.recommendedSounds = recommender.recommend($scope.recommendedSounds, $scope.recommenderInput, -1, -1);

                $scope.applyAllFilters();
            };

            $scope.$on('clearRecommender', function (event) {
                $scope.recommenderInput = [];
                $scope.recommendedSounds = [];
                $scope.applyAllFilters();
            });


            $scope.$on('updateNumPages', function () {
                $scope.updateNumPages(false);
            });

            $scope.updateNumPages = function (setPage) {

                var windowHeight = document.getElementById("soundbrowserbody").offsetHeight;
                $scope.entryLimit = Math.floor(windowHeight/22.0);

                $scope.noOfPages = Math.ceil($scope.folderList.length/$scope.entryLimit);
                if (setPage) {
                    $scope.setPage(1);
                }
                localStorage.set('sbEntryLimit', $scope.entryLimit);
            };

            $scope.updateFilters = function (filterName, item) {
                if (item) {
                    var pos = $scope.filters[filterName].indexOf(item);
                    if (pos === -1) {
                        $scope.filters[filterName].push(item);
                    } else {
                        $scope.filters[filterName].splice(pos, 1);
                    }
                } else if (filterName === 'search') {
                    if ($scope.searchTerm.length > 0) {
                        $scope.filters.search = $scope.searchTerm.split(' ').filter(function (item) {
                            return item !== '';
                        }).map(function (item) {
                            return item.toUpperCase();
                        });
                    } else {
                        $scope.filters.search = [];
                    }
                }

                $scope.applyAllFilters();
                $scope.filterSoundBrowserFilterChoices(filterName);
                $scope.updateNumPages(true);
            };

            $scope.applyAllFilters = function () {

                var noFilter = ['artist', 'genre', 'instrument', 'favorite'].every(function (name) {
                    return $scope.filters[name].length === 0;
                });

                if (noFilter && $scope.filters.search.length === 0) {
                    $scope.filteredSounds = $scope.sounds.slice(0);
                } else {
                    $scope.filteredSounds = [];

                    // Check each sound
                    ($scope.sounds || []).forEach(function (sound) {
                        // types of tags
                        var matches = ['artist', 'genre', 'instrument', 'favorite'].every(function (property) {
                            if ($scope.filters[property].length === 0) {
                                return true;
                            } else {
                                return $scope.filters[property].some(function (tag) {
                                    return sound[property] !== undefined && sound[property].toString().includes(tag);
                                });
                            }
                        });

                        if (matches) {
                            if ($scope.filters.search.length === 0) {
                                $scope.filteredSounds.push(sound);
                            } else {
                                if ($scope.filters.search.every(function (term) {
                                    return sound.file_key.indexOf(term) > -1;
                                })) {
                                    $scope.filteredSounds.push(sound);
                                }
                            }
                        }
                    });
                }

                $scope.applyRecommendations();
                $scope.updateFolderHierarchy();
                $scope.updateFolderList();
            };

            $scope.applyRecommendations = function() {

                if ($scope.sounds.length > 0) {

                    $scope.recSounds = [];

                    for (var idx = 0; idx < $scope.recommendedSounds.length; idx++) {
                        // apply one of four recommendation labels for the differenct categories
                        var folderLabel = Math.floor(idx / ($scope.recommendedSounds.length) * $scope.recLabels.length);

                        //duplicate sound with same name as recommendation
                        var keyIdx = $scope.sounds.findIndex(function (sound) {
                            return sound.file_key === $scope.recommendedSounds[idx];
                        });

                        var keyMapCopy = Object.assign({}, $scope.sounds[keyIdx]);

                        if (keyMapCopy) {
                            // give this copy a new recommendation folder and index
                            keyMapCopy.folder = $scope.recLabels[folderLabel];

                            $scope.recSounds.push(keyMapCopy);
                        }
                    }
                }
            };

            $scope.updateFolderHierarchy = function () {

                $scope.specialSounds = [];
                $scope.defaultUserSounds = [];

                for (var idx = 0; idx < $scope.filteredSounds.length; idx++) {
                    var sound = $scope.filteredSounds[idx];
                    // exclude recommended sounds
                    if ($scope.recSounds.indexOf(sound) === -1) {
                        if ($scope.specialArtistNames.indexOf(sound.artist) !== -1){
                            $scope.specialSounds.push(sound);
                        }
                        else {
                            $scope.defaultUserSounds.push(sound);
                        }
                    }
                }   

                var specialSoundsOrdered = [];
                // re-order special artists to match defined list
                for (var idx = 0; idx < $scope.allSpecialArtists.length; idx++) {
                    var artist = $scope.allSpecialArtists[idx];
                    if ($scope.specialArtistNames.indexOf(artist) !== -1) {
                        for(var iidx = 0; iidx < $scope.specialSounds.length; iidx++) {
                            var sound = $scope.specialSounds[iidx];
                            if (sound.artist === artist) {
                                specialSoundsOrdered.push(sound);
                            }
                        }
                    }
                }
                $scope.specialSounds = specialSoundsOrdered.slice();

                $scope.orderedSounds = $scope.recSounds.concat($scope.specialSounds.concat($scope.defaultUserSounds));
            }

            $scope.updateFolderList = function () {
                $scope.folderList = [];

                if ($scope.orderedSounds.length > 0) {
                    for (var idx = 0; idx < $scope.orderedSounds.length; idx++) {
                        // add each (unique) folder in the list of ordered sounds.
                        if ($scope.folderList.indexOf($scope.orderedSounds[idx].folder) === -1) {
                                $scope.folderList.push($scope.orderedSounds[idx].folder);
                        }
                    }
                }
            };

            $scope.updateFolderVisibility = function (folder) {
                // show visible sounds only
                var newvis = !$scope.folderVisibility[folder];
                $scope.folderVisibility[folder] = newvis;
            };

            $scope.filterSoundBrowserFilterChoices = function (filterName) {
                if (filterName !== 'instrument') {
                    //Filter instruments list based on existing filtered artists in genres
                    $scope.filteredInstruments = [];
                    $scope.instruments = [];
                    $scope.filteredSounds.forEach(function (item) {
                        if (!$scope.instruments.includes(item.instrument)) {
                            $scope.instruments.push(item.instrument);
                            $scope.filteredInstruments.push(item);
                        }
                    });
                }

                $scope.filteredInstruments && $scope.filteredInstruments.sort((a,b) => {
                    if (a.instrument > b.instrument) return 1;
                    else if (a.instrument < b.instrument) return -1;
                    else return 0;
                });

                if (filterName !== 'artist') {
                    //Filter artists list based on existing filtered genres and instruments
                    $scope.filteredArtists = [];
                    $scope.artists = [];
                    $scope.filteredSounds.forEach(function (item) {
                        if (!$scope.artists.includes(item.artist)) {
                            if (item.artist !== 'CIARA' || compModeFromURL || FLAGS.SHOW_AMAZON_SOUNDS || FLAGS.SHOW_COMMON) {
                                $scope.artists.push(item.artist);
                                $scope.filteredArtists.push(item);
                            }
                        }
                    });
                }

                $scope.filteredArtists && $scope.filteredArtists.sort((a,b) => {
                    if (a.artist > b.artist) return 1;
                    else if (a.artist < b.artist) return -1;
                    else return 0;
                });

                if (filterName !== 'genre') {
                    //Filter instruments list based on existing filtered artists and instruments
                    $scope.filteredGenres = [];
                    $scope.genres = [];
                    $scope.filteredSounds.forEach(function (item) {
                        if (!$scope.genres.includes(item.genre)) {
                            $scope.genres.push(item.genre);
                            $scope.filteredGenres.push(item);
                        }
                    });
                }

                $scope.filteredGenres && $scope.filteredGenres.sort((a,b) => {
                    if (a.genre > b.genre) return 1;
                    else if (a.genre < b.genre) return -1;
                    else return 0;
                })
            };

            $scope.selectAll = function (filterName) {
                $scope.filters[filterName] = [];

                // TODO: maybe slow
                $scope.sounds.forEach(function (item) {
                    if ($scope.filters[filterName].indexOf(item[filterName]) === -1) {
                        $scope.filters[filterName].push(item[filterName]);
                    }
                });

                $scope.updateFilters(filterName);
            };

            $scope.clearAll = function (filterName) {
                if (typeof(filterName) === 'undefined') {
                    ['artist', 'genre', 'instrument'].forEach(function (v) {
                        $scope.clearAll(v);
                    });
                    $scope.searchTerm = '';
                    return null;
                }
                $scope.filters[filterName] = [];

                //Reset filteredSounds array
                $scope.filteredSounds = $scope.sounds.slice(0);

                $scope.filterSoundBrowserFilterChoices(filterName);

                $scope.updateFilters('search');
                $scope.updateNumPages(true);
            };

            function init(keepFilter) {
                $scope.sounds = [];

                if (!keepFilter) {
                    $scope.clearAll();

                    for (var name in $scope.filters) {
                        if ($scope.filters.hasOwnProperty(name)) {
                            $scope.filters[name] = [];
                        }
                    }
                }

                $scope.currentlyPlaying = null;
            }

            $scope.renameSound = function (sound) {
                var modal = $uibModal.open({
                    templateUrl: 'templates/rename-sound.html',
                    controller: 'renameSoundController',
                    size: 'sm',
                    resolve: {
                        sound: function () { return sound; }
                    }
                });

                modal.result.then(function () {
                    showRenameMessage = true;
                    $scope.populateSounds($scope.username, true);
                }, function () {
                    // dismissed
                });
            };

            $scope.deleteSound = function (sound) {
                $confirm({text: "Do you really want to delete sound " + sound.file_key + "?",
                    ok: "Delete"}).then(function () {
                    userProject.deleteAudio(sound.file_key).then(function () {
                        showDeleteMessage = true;
                        audioLibrary.clearAudioTagCache();
                        $scope.populateSounds($scope.username, true);
                    });
                });
            };

            /**
             * Setup scope variables for folder / recommendation handling, and modify the individual audio tags in sounds. Depends on the result of getDefault/UserTagsMetadata.
             * @param audioTags
             */
            var setupFoldersAndProps = function (audioTags) {

                audioTags = audioTags.filter( function(tag) {
                    // take all audioTags that aren't special artists, or are included in the available special artists.
                    return $scope.allSpecialArtists.indexOf(tag.artist) === -1 || $scope.specialArtistNames.indexOf(tag.artist) !== -1;
                });

                // A unique list of folder names.
                var folders = Array.from(new Set(audioTags.map(function (tag) { return tag.folder; })));

                // Set up the lists managing the folder visibility, etc.
                folders.forEach(function (v,i) {
                    $scope.folderVisibility[v] = false;
                });

                // Copy and modify the audio tag properties.
                $scope.sounds = audioTags.map(function (tag) {

                    if (!$scope.defaultArtistNames.includes(tag.artist) && tag.instrument === 'NONE') {
                        tag.instrument = 'FREESOUND';
                    }

                    if (['MAKEBEAT','NONE'].includes(tag.genregroup)) {
                        tag.genregroup = 'UNDEFINED';
                        tag.genre = 'UNDEFINED';
                    }
                    return tag;
                });

                // Fill the instrument filter items.
                var instruments = Array.from(new Set(audioTags.map(function (tag) { return tag.instrument; })));
                $scope.instruments = $scope.instruments.concat(instruments);

                // Populate recommendation folder names.
                for (var idx = 0; idx < $scope.recLabels.length; idx++) {
                    $scope.folderVisibility[$scope.recLabels[idx]] = false;
                }
            };

            var resetAndApplyFilters = function () {
                // Apply natural sort for names (e.g., RD_RNB_MOOGLEAD_10 and RD_RNB_MOOGLEAD_9).
                $scope.sounds.sort(function (a, b) {
                    return a.file_key.localeCompare(b.file_key, undefined, {numeric: true, sensitivity: 'base'});
                });

                $scope.filteredSounds = $scope.sounds.slice();
                $scope.filterSoundBrowserFilterChoices('');

                $scope.applyAllFilters();
                $scope.updateNumPages(true);
            };

            var updateFavoriteProps = function (favorites) {
                $scope.sounds.forEach(function (sound) {
                    sound.favorite = favorites.includes(sound.file_key);
                });
            };

            /* Populate the sound-browser items */
            $scope.populateSounds = function (username, keepFilter) {
                init(keepFilter);

                $scope.sounds = [];

                var getAudioTags = username ? function () {
                    return $q.all([
                        audioLibrary.getDefaultTagsMetadata(),
                        audioLibrary.getUserTagsMetadata(username)
                    ]).then(function (result) {
                        return result[0].concat(result[1]);
                    });
                } : audioLibrary.getDefaultTagsMetadata;

                return getAudioTags().then(function (audioTags) {
                    setupFoldersAndProps(audioTags);

                    if (username) {
                        return userProject.getFavorites().then(updateFavoriteProps);
                    }
                }).then(function () {
                    resetAndApplyFilters();
                    reporter.loadTime();
                    esconsole('***WS Loading Custom Sounds OK...', ["info", 'init']);
                    esconsole('Reported load time from this point.', ['info','init']);

                    $scope.soundsLoaded = true;
                    $scope.$emit('soundsLoaded');

                    angular.element('#screen').fadeOut(100, function () {
                        if (userProject.isLogged() && showLoginMessage) {
                            userNotification.show(ESMessages.general.loginsuccess, 'normal', 0.5);
                            showLoginMessage = false;
                        }
                        if (showRenameMessage) {
                            showRenameMessage = false;
                        }
                        if (showDeleteMessage) {
                            userNotification.show(ESMessages.general.sounddeleted, 'normal', 2);
                            showDeleteMessage = false;
                        }
                        if (userProject.errorLoadingSharedScript) {
                            userNotification.show(ESMessages.user.badsharelink, 'failure1', 3);
                            userProject.errorLoadingSharedScript = false;
                        }
                    });
                });
            };

            $scope.populateSounds($scope.username).then(function () {
                $rootScope.$broadcast('reloadRecommendations');
            });

            //Emit call to ideController for upload sound Modal
            $scope.uploadModal = function () {
                $scope.$emit('uploadModal');
            };

            var fetchSounds = function (file_key, tempo) {
                var request = new XMLHttpRequest();
                request = new XMLHttpRequest();
                // console.log('From Browser ... '+JSAudioList[NAME[num]].location);

                var urlquery = URL_DOMAIN + '/services/audio/getunstretchedsample' +'?key=' + file_key;
                esconsole('Calling PHP Loading with query '+urlquery, 'debug');

                request.open("GET",urlquery,true);
                request.timeout = 10000;
                request.responseType = 'arraybuffer';


                request.onload = function () {
                    audioContext.decodeAudioData(request.response, function (buffer) {
                        esconsole('calling load from sound browser', 'debug');
                        myBuffer =  buffer;
                        //if ( $('#playButton'+num).val() !== "Preview")
                        playSound(file_key);
                    });
                };

                request.send();
            };

            function bufferSound(event) {
                var request = event.target;
                audioContext.decodeAudioData(request.response, function onSuccess(decodedBuffer) {
                    // Decoding was successful, do something useful with the audio buffer

                    myBuffer = decodedBuffer;
                }, function onFailure() {
                    alert("Decoding the audio buffer failed");
                });

            }

            $scope.previewTempo = '';

            $scope.play = function () {
                var key = this.sound.file_key;

                var tempo = this.sound.tempo;
                var prevTempo = parseFloat($scope.previewTempo);
                if (!isNaN(prevTempo)) {
                    if (prevTempo < 60) {
                        tempo = 60;
                        $scope.previewTempo = '60';
                    } else if (prevTempo > 360) {
                        tempo = 360;
                        $scope.previewTempo = '360';
                    } else {
                        tempo = prevTempo;
                    }
                }

                fetchSounds(key, tempo);

                $scope.stop();
                $scope.previouslyPlaying = $scope.currentlyPlaying;

                //Update currently playing sound
                $scope.currentlyPlaying = this.sound;

                this.sound.playing = true;
                //this.sound.wasLastPlayed = true;

                // if ($scope.recommendedSounds.includes(key)) {
                //     reporter.recommendationPreviewed(key, this.sound.folder);
                // }

                esconsole('Previewing ' + key, ['DEBUG']);
            };

            $scope.stop = function () {
                stopPlayback();
            };

            $scope.showFavorites  = function () {
                return userProject.isLogged();
            };

            $scope.hasFavorites = function () {
                // return $scope.sounds.filter(function (s) {return s.favorite === "true"}).length > 0;
                var favs = $scope.sounds.filter(function (s) {return s.favorite});
                var nonRecFavs = favs.filter(function (s) {return !$scope.recommendedSounds.includes(s.file_key)});
                return nonRecFavs.length > 0;
            };

            $scope.toggleFavourites = function (sound) {
                sound.favorite = !sound.favorite;

                if (sound.favorite) {
                    userProject.markFavoriteClip(sound.file_key,sound.tags);
                    // if ($scope.recommendedSounds.includes(sound.file_key)) {
                    //     reporter.recommendationFavorited(key, sound.folder);
                    // }
                } else {
                    userProject.unmarkFavoriteClip(sound.file_key,sound.tags).then(function () {
                        if ($scope.hasFavorites()) {
                            $scope.applyAllFilters();
                        } else if ($scope.showOnlyFavorites) {
                            $scope.showOnlyFavorites = false;
                            $scope.updateFilters('favorite', 'true');
                        }
                    });
                }
            };

            function stopPlayback() {
                try{ previousSource.noteOff(0); }
                catch (err) { esconsole('sound browser playback already stopped', 'debug'); }
                try{previousSource.stop(0);}
                catch (err) {}
            }

            function playSound(file_key) {
                var source = audioContext.createBufferSource();
                source.buffer = myBuffer;
                // check for stopped playback

                source.loop = false;
                source.connect(audioContext.destination);
                if (firstPreview !== 1) {
                    $scope.stop();
                }

                $scope.currentlyPlaying.playing = true;
                $scope.currentlyPlaying.wasLastPlayed = true;

                if ($scope.previouslyPlaying) {
                    $scope.previouslyPlaying.wasLastPlayed = false;
                }

                $scope.$apply();

                // End play callback
                function endedHandler() {
                    // Check whether previously playing track is still running
                    if ($scope.previouslyPlaying) {
                        $scope.previouslyPlaying.playing = false;
                        //$scope.previouslyPlaying = null;
                    }
                    // Otherwise stop currently playing track
                    if ($scope.currentlyPlaying) {
                        $scope.currentlyPlaying.playing = false;
                        //$scope.currentlyPlaying = null;
                    }

                    // Force UI to update
                    $scope.$apply();
                }
                source.onended = endedHandler;

                source.start(0);
                previousSource = source;

                firstPreview = 0;
            }

            $scope.pasteName = function () {
                var key = this.sound.file_key;
                esconsole(key, 'debug');
                esconsole(angular.element(document.getElementById('devctrl')).scope().pasteCode(key), 'debug');

                // if ($scope.recommendedSounds.includes(key)) {
                //     reporter.recommendationPasted(key, this.sound.folder);
                // }
                // update recommendations
                $scope.recommenderInput.push(key);
                $scope.updateRecommendations();

            };

            $scope.onSoundPreview = function (sound) {
                // if ($scope.recommendedSounds.includes(sound.file_key)) {
                //     reporter.recommendationPreviewed(key, sound.folder);
                // }
            };

            $scope.tooltipPlacement = function (sound, folder, firstOnPage) {
                var val = 'top';
                var spaces = 0;
                var startIndex = parseInt(firstOnPage) + 1;
                var endIndex = parseInt($scope.folderList.indexOf(folder));

                for (var idx = startIndex; idx < endIndex; idx++) {
                    spaces += 1;
                    if ($scope.folderVisibility[$scope.folderList[idx]]) {
                        spaces += $scope.orderedSounds.filter(function (sound) { return sound.folder == $scope.folderList[idx] }).length;
                    }
                }

                spaces += $scope.orderedSounds.filter(function (sound) { return sound.folder == folder }).indexOf(sound);

                // current sound must be preceded by at least 10 (folders + visible sounds)
                if (spaces < 11) {
                    val = 'bottom';
                }

                return val;
            };

            $scope.fontSize = {
                'font-size': '10pt'
            };

            $scope.lineHeight = {
                'line-height': '30px'
            };

            angular.element($window).bind('resize');

            function updateFontSize(size) {
                $scope.fontSize['font-size'] = (size-4).toString() + 'pt';

                if (size <= 14) {
                    $scope.lineHeight = {
                        'line-height': '30px'
                    };
                } else {
                    $scope.lineHeight = {
                        'line-height': '1.8'
                    };
                }
            }

            // $scope.$on('fontSizeChanged', function (event, size) {
            //     updateFontSize(size);
            // });

            updateFontSize(14);
        }]
    };
}]);

// TODO: still used in the DOM
app.filter('startFrom', function () {
    return function (input, start) {
        if (input) {
            start = +start; //parse to int
            return input.slice(start);
        }
        return [];
    }
});

// TODO: We can remove these unless we want to use as a $filter service in the controller
// app.filter('filterByGenre', function () {
//     return function (items, tags) {
//         var filtered = []; // Put here only items that match
//         if (tags.length === 0)
//             filtered = items;
//         (items || []).forEach(function (item) { // Check each item
//             var matches = tags.some(function (tag) {
//                 return (item.genre.indexOf(tag) > -1);
//             });
//             if (matches) {
//                 filtered.push(item);
//             }
//         });
//         return filtered;
//     };
// });
// app.filter('filterByGenreGroup', function () {
//     return function (items, tags) {
//         var filtered = []; // Put here only items that match
//         if (tags.length === 0)
//             filtered = items;
//         (items || []).forEach(function (item) { // Check each item
//             var matches = tags.some(function (tag) {
//                 return (item.genregroup.indexOf(tag) > -1);
//             });
//             if (matches) {
//                 filtered.push(item);
//             }
//         });
//         return filtered;
//     };
// });
// app.filter('filterForSearchBox', function () {
//     return function (items, entry) {
//         var filtered = [];
//         if (typeof(entry) === 'undefined' || entry.length === 0) {
//             return items;
//         }
//         var tags = entry.split(' ');
//
//         (items || []).forEach(function (item) {
//             var matches = tags.every(function (tag) {
//                 return (item.file_key.indexOf(tag.toUpperCase()) > -1);
//             });
//             if (matches) {
//                 filtered.push(item);
//             }
//         });
//         return filtered;
//     };
// });
// app.filter('filterByArtist', function () {
//     return function (items, tags) {
//         var filtered = []; // Put here only items that match
//         if (tags.length === 0)
//             filtered = items;
//         (items || []).forEach(function (item) { // Check each item
//             var matches = tags.some(function (tag) {
//                 return (item.artist.indexOf(tag) > -1);
//             });
//             if (matches) {
//                 filtered.push(item);
//             }
//         });
//         return filtered;
//     };
// });
// app.filter('filterByInstrument', function () {
//     return function (items, tags) {
//         var filtered = []; // Put here only items that match
//         if (tags.length === 0)
//             filtered = items;
//         (items || []).forEach(function (item) { // Check each item
//             var matches = tags.some(function (tag) {
//                 return (item.instrument.indexOf(tag) > -1);
//             });
//             if (matches) {
//                 filtered.push(item);
//             }
//         });
//         return filtered;
//     };
// });

// TODO: still being used in the DOM
app.filter('bySelected', function () {
    return function (items, args) {
        var res = [];
        var preFilter = args[0];
        var preFiltSelected = args[1];
        var scope = args[2];
        var thisFilt = args[3];
        var thisFiltPreSelected = scope.filters[thisFilt];

        if (preFiltSelected.length === 0) {
            return items;
        }

        items.forEach(function (i) {
            if (preFiltSelected.indexOf(i[preFilter]) > -1 || thisFiltPreSelected.indexOf(i[thisFilt]) > -1) {
                res.push(i);
            }
        });
        return res;
    }
});

app.directive('resizeDiv', ['$window', '$rootScope', function ($window, $rootScope) {

    return {
        link: link
    };

    function link(scope, element, attrs) {
        angular.element($window).bind('resize', function () {
            $rootScope.$broadcast('updateNumPages');
        });
    }
}]);
 
