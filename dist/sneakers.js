/*
 *  sneakers.js - v1.0.0
 *  jQuery plugin that simulates a tty typing and decryption effect.
 *  https://github.com/mar10/sneakers.js
 *
 *  Made by Martin Wendt
 *  Under MIT License
 */
/*******************************************************************************
 * sneakers.js plugin.
 *
 * jQuery plugin that simulates a tty typing and decryption effect as seen in
 * the 1992 movie 'Sneakers'.
 *
 * @see https://github.com/mar10/sneakers.js
 *
 * Copyright (c) 2016, Martin Wendt (http://wwWendt.de). Licensed MIT.
 */
;( function( $, window, document, undefined ) {

	"use strict";

	var validChars = "!\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~",
		// + "☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼" +
		// + "│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌"
		validCharsLen = validChars.length;

	/* Generate an 'encrypted' replacement for c, unless c is whitespace.*/
	function _randomChar(c) {
		return /\s/.test(c) ? c : validChars[Math.floor(validCharsLen * Math.random())];
	}

	/* 'Encrypt' a string. */
	function _encode(s) {
		var res = "";
		for( var i=0, l=s.length; i<l; i++ ) {
			res += _randomChar(s[i]);
		}
		return res;
	}

	// Create the options defaults
	var pluginName = "sneakers",
		defaults = {
			typeMs: 5,        // milliseconds per character (0: show immediately)
			decodeMs: 50,     // milliseconds per update (0: no decryption simulation)
			maxDecode: 1000,  // decode the rest after max. n update cycles
			stopEps: 0.05,    // decode the rest if less than 5% are encrypted
			lockSize: false,  // lock current element size before removing content
			// Events:
			start: $.noop,    // Current text was replaced by encrypted text 
			type: $.noop,     // 'Encrypted' text has been typed to screen
			done: $.noop      // Decrypted text is completely displayed
		};

	// The actual plugin constructor
	function Plugin ( element, options ) {
		this.element = element;
		this.$element = $(element);
		this.settings = $.extend( {}, defaults, options );
		this._defaults = defaults;
		this._name = pluginName;
		this.originalText = null;
		this.currentText = null;
		this.init();
	}

	// Avoid Plugin.prototype conflicts
	$.extend( Plugin.prototype, {
		init: function() {
			var self = this;

			this.encode();
			this.settings.start.call(this.element);
			this.type(this.currentText, 0).done(function() {
				self.settings.type.call(self.element);
				self.decrypt(self.settings.maxDecode).done(function() {
					self.settings.done.call(self.element);
				});
			});
		},
		/* Move original text into element data and set 'decrypted' text instead. */
		encode: function() {
			var $el = this.$element,
				opts = this.settings;

			this.originalText = $el.text();
			// Init with encrypted text unless decryption simulation is off
			if( opts.decodeMs > 0 ) {
				this.currentText = _encode(this.originalText);
			} else {
				this.currentText = this.originalText;
			}
			// Set current dimension as inline style, so the element keeps its
			// size when content is removed for typing simulation
			if( this.settings.lockSize ) {
				$el.css({
					height: $el.css("height"),
					width: $el.css("width")
				});
			}
			// Clear text unless typing simulation is off
			$el.text(opts.typeMs ? "" : this.currentText);
			// Show element (in case it was hidden before)
			$el.show();
		},
		/* Type text to console, character-by-character. */
		type: function(s, i, _dfd, _prevStamp) {
			var delta, nchar,
				now = Date.now(),
				dfd = _dfd || new $.Deferred(),
				self = this;

			if( this.settings.typeMs && i < s.length ) {
				// Main 'performance' issue seems to be that setTimeout doesn't 
				// allow less than ~10ms intervals.
				// We try to compensate by printing multiple characters at once
				nchar = 1;
				if( _prevStamp ) {
					delta = now - _prevStamp;
					nchar = Math.floor(delta / this.settings.typeMs);
					// console.log(_prevStamp + ", delta=" + delta + "ms: nchar=" + nchar);
				}
				this.$element.append(s.substr(i, nchar));
				// Schedule next keystroke
				setTimeout(function(){
					self.type.call(self, s, i+nchar, dfd, now);
				}, this.settings.typeMs);
			} else {
				// All characters typed (or typing simulation is off)
				this.$element.text(s);
				dfd.resolve();				
			}
			return _dfd ? null : dfd.promise();
		},
		/* Change current text until every character is 'decrypted'. */
		decrypt: function(loopCount, _dfd) {
			var c, i,
				dfd = _dfd || new $.Deferred(),
				self = this,
				encryptedCount = 0,
				ot = this.originalText,
				ct = this.currentText,
				len = ct.length,
				s = "";

			if ( loopCount > 0 ) {
				// Replace each character with a new random value, but leave
				// already decrypted characters intact
				for( i=0; i<len; i++) {
					c = ct[i];
					if( c === ot[i] ) {
						s += c;
					} else {
						encryptedCount += 1;
						s += _randomChar(c);
					}
				}
				if ( encryptedCount / len < this.settings.stopEps) {
					// Resolve all if (nearly) everything is decrypted
					this.currentText = ot;
					encryptedCount = 0;
				} else {
					this.currentText = s;
				}
			} else {
				// Resolve all if loop count exceeded
				this.currentText = ot;
			}
			// Print the current text version
			this.$element.text(this.currentText);

			if( encryptedCount > 0 ) {
				// Schedule next decryption iteration
				setTimeout(function(){
					self.decrypt.call(self, loopCount-1, dfd);
				}, this.settings.decodeMs);
			} else {
				dfd.resolve();				
			}
			return _dfd ? null : dfd.promise();
		}
	} );

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[ pluginName ] = function( options ) {
		return this.each( function() {
			if ( !$.data( this, "plugin_" + pluginName ) ) {
				$.data( this, "plugin_" +
					pluginName, new Plugin( this, options ) );
			}
		} );
	};

} )( jQuery, window, document );
