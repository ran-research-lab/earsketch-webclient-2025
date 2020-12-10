let url = 'https://earsketch-dev.lmc.gatech.edu/earsketch2/#?sharing=9tVfam4TKiwsnffYYq8IoQ';
let scriptName = 'shareTest.py';

describe('Sharing (view only)', function () {
	describe('URL sharing', function () {
		it('should open share URL when not logged in', function () {
			browser.get(url);

			// a tab for the script should be open
      expect($('#coder').element(by.cssContainingText('.nav-item', scriptName)).isDisplayed()).toBeTruthy();
		});

		it('should let me login and view the script', function () {
	    element(by.model('username')).sendKeys('earsketch2');
	    element(by.model('password')).sendKeys('earsketch2');
	    $('#not-logged-in .icon-arrow-right').click();

			// the tab should be still open
      expect($('#coder').element(by.cssContainingText('.nav-item', scriptName)).isDisplayed()).toBeTruthy();
	    // closeTabByScriptName(scriptName);
		});

		it('should retain the script without duplicates after reopening the share URL while logged in', function () {
			browser.get(url);

	    expect($('#logged-in').getText()).toBe('earsketch2');

			// the tab should be still open
      expect($('#coder').element(by.cssContainingText('.nav-item', scriptName)).isDisplayed()).toBeTruthy();
		});
	});

	describe('opening the share URL while logged in as the original author', function () {
		beforeAll(function () {
			// log out
			$('#logged-in').click().then(function () {
				$('[ng-click="logout()"]').click();
			});

			// log back in as the owner
	    element(by.model('username')).sendKeys('earsketch');
	    element(by.model('password')).sendKeys('earsketch');
	    $('#not-logged-in .icon-arrow-right').click();
		});

		it('should open the URL but give a warning', function () {
			// not logged in?
			browser.get(url);
		});
	});
});

afterAll(function () {
  browser.explore();
});