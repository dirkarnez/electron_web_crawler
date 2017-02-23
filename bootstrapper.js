// install babel hooks in the main process
require('babel-register')({
	presets: ["stage-1"],
	plugins: ["transform-decorators-legacy"] 
});
require('./main.js');
