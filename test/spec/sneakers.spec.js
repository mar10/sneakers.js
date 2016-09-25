( function( $, QUnit ) {

	"use strict";

	var $testCanvas = $( "#testCanvas" );
	var $fixture = null;

	QUnit.module( "sneakers", {
		beforeEach: function() {

			// fixture is the element where your jQuery plugin will act
			$fixture = $( "<div/>" );

			$testCanvas.append( $fixture );
		},
		afterEach: function() {

			// we remove the element to reset our plugin job :)
			$fixture.remove();
		}
	} );

	QUnit.test( "is inside jQuery library", function( assert ) {

		assert.equal( typeof $.fn.sneakers, "function", "has function inside jquery.fn" );
		assert.equal( typeof $fixture.sneakers, "function", "another way to test it" );
	} );

	QUnit.test( "returns jQuery functions after called (chaining)", function( assert ) {
		assert.equal(
			typeof $fixture.sneakers().on,
			"function",
			"'on' function must exist after plugin call" );
	} );

	QUnit.test( "caches plugin instance", function( assert ) {
		$fixture.sneakers();
		assert.ok(
			$fixture.data( "plugin_sneakers" ),
			"has cached it into a jQuery data"
		);
	} );

	QUnit.test( "decrypt only simulation (no typing)", function( assert ) {
		var done  = assert.async(),
			text = "abc";
		
		assert.expect(9);

		$fixture.text(text);

		assert.equal($fixture.text(), text, "text is initialized");

		$fixture.sneakers( {
			typeMs: 0,
			decryptMs: 1,
			start: function(){
				assert.ok(true, "start event is triggered");
				// assert.equal($fixture.text().length, text.length, "start text exists");
				assert.notEqual($fixture.text(), text, "start text is encrypted");
			},
			type: function(){
				assert.ok(true, "type event is triggered");
				assert.equal($fixture.text().length, text.length, "text is typed");
				assert.notEqual($fixture.text(), text, "typed text is encrypted");
			},
			done: function(){
				assert.ok(true, "done event is triggered");
				assert.equal($fixture.text(), text, "Final result ok");
				done();
			}
		} );
	} );

	QUnit.test( "type + decrypt simulation", function( assert ) {
		var done  = assert.async(),
			text = "abc";
		
		assert.expect(8);

		$fixture.text(text);

		assert.equal($fixture.text(), text, "text is initialized");

		$fixture.sneakers( {
			typeMs: 1,
			decryptMs: 1,
			start: function(){
				assert.ok(true, "start event is triggered");
				assert.equal($fixture.text(), "", "text is removed on start");
			},
			type: function(){
				assert.ok(true, "type event is triggered");
				assert.equal($fixture.text().length, text.length, "text is typed");
				assert.notEqual($fixture.text(), text, "typed text is encrypted");
			},
			done: function(){
				assert.ok(true, "done event is triggered");
				assert.equal($fixture.text(), "abc", "Final result ok");
				done();
			}
		} );
	} );
}( jQuery, QUnit ) );
