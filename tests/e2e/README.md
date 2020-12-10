# Running tests
To run it locally, install the node package to your global environment first:

```bash
npm install -g protractor
```

Before running the test, run the Selenium server with:

```bash
webdriver-manager update
webdriver-manager start
```

Then, to run the tests:

```bash
protractor e2e.conf.js
```

Protractor instance runs at `http://localhost:4444/wd/hub`. Pausing / debugging is currently broken with Node v8 (https://github.com/angular/protractor/issues/4307), so you may need to switch the Node version to, e.g., v7.10.1 using `nvm`. For Protractor to work on Safari, you may need to enable the option `Menu > Develop > Allow Remote Automation`.


# Adding more tests

The official page is the best resource for getting started with Protractor. http://www.protractortest.org/#/

In writing Protractor tests, we combine DOM element "locators" (`element(by...)`, `$(css)`, `element.all(by...).get(n)`, `$$()`, etc.), locator actions (`click()`, `sendKeys()`, etc.), locator values (`isDisplayed()`, `getText().then(cb)`), and test assertions (`expect(elem.condition()).toBe()`). The fastest way of identifying the locators is using the "select an element" function in the browser inspector. 

While assertion tests are preferable, we can also use `browser.sleep(ms)` to check the real-time response of visuals / sounds. 

We can also pause the entire tests and experiment in the protractor REPL by inserting `browser.explore()`.

Adding "x" prefix to a `describe` or `it` will cause it to skip the tests.

`beforeAll` and `beforeEach` directives can be used for initializing the test conditions.


# These have been ported to e2e tests.

SOUND BROWSER:
- Preview a sound file.
- Paste a sound constant.
- View sound tags.
- Paginate through sounds.
- Search sounds.
- Record sound inline.
- Select favorites and unfavorites, make sure they persist across sessions.
- Delete uploaded sounds.

SCRIPTS BROWSER:
- Open script by clicking name.
- Open script by clicking open from context menu.
- Rename script.
- (Soft-)Delete and undelete script.

SCRIPT SHARING (VIEW-ONLY SCRIPT):
- Open Share URL when not logged in.
- Open Share URL when not logged in, then log in.
- Open Share URL when logged in as another user.
- Open the same Share URL again, the script should reopen and not duplicated.

API BROWSER:
- Search API.
- Expand using eye icon.

DAW:
- Play, pause, rewind.
- Change volume.
- Toggle metronome.
- Zoom horizontal and vertical.

CURRICULUM:
- Paste curriculum example.
- Paginate through curriculum.
- View slides.
- Search curriculum.

GENERAL:
- Log in.

LAYOUT:
- Hide/show/resize each UI pane using both the icons and dragging. (Dragging would not toggle show/hide anymore.)

