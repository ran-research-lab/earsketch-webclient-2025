var numInstances = 10;

exports.config = {
	seleniumAddress: 'http://localhost:4444/wd/hub',
	capabilities: {
      browserName: 'chrome',
	    chromeOptions: {
	    	args: [
	    	// '--headless', 
	    	'use-fake-device-for-media-stream',
	    	'use-fake-ui-for-media-stream'],
    	},
    	maxInstances: numInstances,
    	count: numInstances
	},
	specs: ['e2e_stress.spec.js'],
	jasmineNodeOpts: {
		showColors: true,
  	defaultTimeoutInterval: 10 * 60 * 1000 // default 25000
	},
  allScriptsTimeout: 2147483647
};
