module.exports = function( config ) {

	config.set( {
		files: [
			"node_modules/jquery/dist/jquery.js",
			// check the minified distribution version:
			"dist/sneakers.min.js",
			"test/setup.js",
			"test/spec/*"
		],
		logLevel: config.LOG_DEBUG,
		// logLevel: config.LOG_INFO,
		frameworks: [ "qunit" ],
		reporters: ['progress']
		// autoWatch: true
	} );
};
