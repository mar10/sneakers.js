module.exports = function( config ) {

	config.set( {
		files: [
			"node_modules/jquery/dist/jquery.js",
			// use the un-minified version:
			"src/sneakers.js",
			"test/setup.js",
			"test/spec/*"
		],
		logLevel: config.LOG_DEBUG,
		// logLevel: config.LOG_INFO,
		frameworks: [ "qunit" ],
		// coverage reporter generates the coverage
		reporters: ['progress', 'coverage'],

		preprocessors: {
			// source files, that you wanna generate coverage for
			// do not include tests or libraries
			// (these files will be instrumented by Istanbul)
			'src/**/*.js': ['coverage']
		},

		// optionally, configure the reporter
		coverageReporter: {
			type : 'html',
			dir : 'coverage/'
		}
	} );
};
