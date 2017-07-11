module.exports = function( grunt ) {

	grunt.initConfig( {

		// Import package manifest
		pkg: grunt.file.readJSON( "package.json" ),

		// Banner definitions
		meta: {
			banner: "/*\n" +
				" *  <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n" +
				" *  <%= pkg.description %>\n" +
				" *  <%= pkg.homepage %>\n" +
				" *\n" +
				" *  Made by <%= pkg.author.name %>\n" +
				" *  Under <%= pkg.license %> License\n" +
				" */\n"
		},

		// Concat definitions
		concat: {
			options: {
				banner: "<%= meta.banner %>"
			},
			dist: {
				src: [ "src/sneakers.js" ],
				dest: "dist/sneakers.js"
			}
		},

		// Lint definitions
		jshint: {
			files: [ "src/sneakers.js", "test/**/*" ],
			options: {
				jshintrc: ".jshintrc"
			}
		},

		jscs: {
			src: "src/**/*.js",
			options: {
				config: ".jscsrc"
			}
		},

		// Minify definitions
		uglify: {
			dist: {
				src: [ "dist/sneakers.js" ],
				dest: "dist/sneakers.min.js"
			},
			options: {
				banner: "<%= meta.banner %>"
			}
		},

		// CoffeeScript compilation
		// coffee: {
		// 	compile: {
		// 		files: {
		// 			"dist/sneakers.js": "src/sneakers.coffee"
		// 		}
		// 	}
		// },

		// karma test runner
		karma: {
 			continuous: {
                // Keep karma running in the background
				configFile: "karma.conf.js",
                background: true
            },
 			coverage: {
 				// Run test once and write to /coverage/...
				configFile: "karma.conf-with-coverage.js",
				singleRun: true,
				browsers: [ "PhantomJS" ]
            },
			travis: {
				// CI mode: run tests once in PhantomJS browser.
				configFile: "karma.conf.js",
				singleRun: true,
				browsers: [ "PhantomJS" ]
			},
			launch: {
				// No tests (empty file list) but launches captured browsers
				configFile: "karma.conf.js",
				files: [],
				background: true,
				singleRun: false,
				autoWatch: false,
				browsers: [ "PhantomJS", "Safari" ]
			},
			unit: {
				// Run tests on Phantom 
				configFile: "karma.conf.js",
				background: false,
				singleRun: true,
				autoWatch: false,
				// browsers: [ "Safari" ]
				// browsers: [ "PhantomJS" ]
				// If real browsers are used, those must be captured
				// (open http://localhost:9876/):
				// browsers: [ "PhantomJS", "Firefox" ]
				browsers: [ "PhantomJS", "Safari" ]
			}
		},
		// watch for changes to source
		// Better than calling grunt a million times
		// (call 'grunt watch')
		watch: {
			files: [ "src/*", "test/**/*" ],
			tasks: [ "default" ]
		}

	} );

	grunt.loadNpmTasks( "grunt-contrib-concat" );
	grunt.loadNpmTasks( "grunt-contrib-jshint" );
	grunt.loadNpmTasks( "grunt-jscs" );
	grunt.loadNpmTasks( "grunt-contrib-uglify" );
	// grunt.loadNpmTasks( "grunt-contrib-coffee" );
	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-karma" );

	grunt.registerTask( "travis", [ "jshint", "karma:travis" ] );
	grunt.registerTask( "lint", [ "jshint", "jscs" ] );
	grunt.registerTask( "build", [ "concat", "uglify" ] );
	grunt.registerTask( "default", [ "jshint", "build", "karma:unit" ] );
	// grunt.registerTask( "default", [ "jshint", "build", "karma:unit:run" ] );
	grunt.registerTask( "serve", [ "karma:continuous:start", "watch" ] );
	grunt.registerTask( "dev", [ "karma:launch", "watch" ] );
};
