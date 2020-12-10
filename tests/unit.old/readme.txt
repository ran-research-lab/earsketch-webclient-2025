/**
 * Created by anandmahadevan on 11/16/14.
 */

 Basics:

 The test framework we are using is called Jasmine. It is syntactically simple and is tightly integrated with AngularJS.
 Apart from the framework, we are also using a test runner that deploys and executes the test suites on multiple browsers. This tool is called karma.

New additions to the git repository:
 1) webclient/karma.conf.js ---> This is the main configuration file for our entire test framework. The reason this file has made it to the repository is because everytime a new file is created, it needs to be referenced by karma. If not, the test cases dependent on that file will not take effect. It is similar to index.html and please be careful about the order in which you insert new dependencies.
You also need to add new dependencies to all the *.conf.js config file in each test folder.

2) webclient/tests/* —> All the test data, "stringified" source code and test cases reside here. “test_driver_*.js” contains the actual code. The rest of the files are just data files and the objects can referenced from test_driver_*.js. Feel free to organize them as you wish, karma will automatically pick up the changes. You DO NOT need to edit *.conf.js if you make changes to any test script or if you add new data files (with source code and ESTrack data structure objects).

 Instructions for adding scripts to test suite:
1) Open up earsketch on your browser. 
2) Paste any code into the editor as usual.
3) **CHANGE MODE TO HIGH_QUALITY_AUDIO**. Open the Javascript debugger. Once you hit “Run script”, you will see 2 highlighted sections in the console. One is the stringified script which the formatted source code, and the other is the data structure corresponding to the track information. It contains information about all clips on all tracks, effects etc. Here is an example from Unit1

#
#
# script_name:
#
# author:
#
# description:
#
#
#

from earsketch import *

init()
setTempo(120)

synth1 = TECHNO_SYNTHPLUCK_001

#melody
fitMedia(synth1, 1, 1, 2)
fitMedia(synth1, 1, 3, 4)
fitMedia(synth1, 1, 5, 6)
fitMedia(synth1, 1, 7, 8)

finish()

You should observe the following results on the console:
The stringified script is : 
"#\n#\n# script_name:\n#\n# author:\n#\n# description:\n#\n#\n#\n\nfrom earsketch import *\n\ninit()\nsetTempo(120)\n\nsynth1 = TECHNO_SYNTHPLUCK_001\n\n#melody\nfitMedia(synth1, 1, 1, 2)\nfitMedia(synth1, 1, 3, 4)\nfitMedia(synth1, 1, 5, 6)\nfitMedia(synth1, 1, 7, 8)\n\nfinish()" 
 Data structure for this script :  
[
     {
          "audioclips": [],
          "effects": []
     },
     {
          "audioclips": [
               {
                    "bufferkey": "TECHNO_SYNTHPLUCK_001",
                    "belongingtrack": 1,
                    "startLocation": 1,
                    "mediaStartLocation": 1,
                    "mediaEndLocation": 2,
                    "scale": true,
                    "src": null,
                    "isStarted": false,
                    "id": 0,
                    "parentId": null,
                    "noloop": false
               },
               {
                    "bufferkey": "TECHNO_SYNTHPLUCK_001",
                    "belongingtrack": 1,
                    "startLocation": 3,
                    "mediaStartLocation": 1,
                    "mediaEndLocation": 2,
                    "scale": true,
                    "src": null,
                    "isStarted": false,
                    "id": 1,
                    "parentId": null,
                    "noloop": false
               },
               {
                    "bufferkey": "TECHNO_SYNTHPLUCK_001",
                    "belongingtrack": 1,
                    "startLocation": 5,
                    "mediaStartLocation": 1,
                    "mediaEndLocation": 2,
                    "scale": true,
                    "src": null,
                    "isStarted": false,
                    "id": 2,
                    "parentId": null,
                    "noloop": false
               },
               {
                    "bufferkey": "TECHNO_SYNTHPLUCK_001",
                    "belongingtrack": 1,
                    "startLocation": 7,
                    "mediaStartLocation": 1,
                    "mediaEndLocation": 2,
                    "scale": true,
                    "src": null,
                    "isStarted": false,
                    "id": 3,
                    "parentId": null,
                    "noloop": false
               }
          ],
          "effects": []
     }
]

4) The next step is to copy this information into objects in the tests folder. From the console, you can just execute copy(srccode) and the source code would be on your clipboard. Once you’re done with the source code, execute copy(data) on the console to get the audio struct information onto your clipboard.
In this case. Please try to categorize them intelligently and follow a strict nomenclature. For example: Unit_1_1_src , Unit_1_1_data. Look up tests/curriculum/unit01.js for more examples. I strongly recommend using an IDE that supports code folding as some of these data structures can be really long. 
5) Once you have the extracted information, open up test_driver_*.js. You can create more files containing test suites and we will have to as the database grows. But for now, I have created just one. One suite type is for black box testing of our Utility APIs. For example:- ESUtilsTimeToMeasure(). I have written a couple of corner case tests for this API. Other suites are script specific.
All you need to do is add the code with the following template: Replace Unit_1_2 with whatever is appropriate. Another important parameter to adjust is the timeout. Provide higher timeouts for longer scripts. Karma Jasmine can disconnect from the browser client if your timeout is too short and the server is still dispatching some data.

    it("Unit1_2", function (done) {   // This is just the name of the test case
        sourcecode = Unit1_2_src;  // The object to which the extracted source code is assigned.
        test_Data = Unit1_2_data;   // The object to which the extracted data structure is assigned.
        performTest();
        setTimeout(function() {
            done();
        }, 1000);                  // THIS IS IMPORTANT. WE NEED TO ADJUST THE TIMEOUT SINCE SERVER OPERATIONS ARE ASYNCHRONOUS.
    });


Please note that this debug information is not available currently in the production version. Dev build only.

You only need to check in files from the test folder and *.conf.js in case you have added any dependencies. If you want to setup the node js test runner on your machine, talk to me! 

A useful link to wrap and unwrap code - http://www.freeformatter.com/javascript-escape.html#ad-output

--------------------------------------------------------------------------------
Batch processing steps:
  - Open the terminal, just navigate to webclient/tests/
  - ./runtests.command
    Note that this shell script runs all the suites sequentially
You can check the output of each suite in the karma_html folder that is auto generated in each of the test suite folders. This way all the results are not crammed into one reporter.

Each folder has individual shell scripts which will execute only the suite in that folder.
Ex: cd webclient/tests/coursera/
    ./runcourseratests.command

THAT’S IT !!



