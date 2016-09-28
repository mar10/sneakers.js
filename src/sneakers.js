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
			typeSpeedMs: 4,          // milliseconds per 'keystroke' (0: no typing simulation)
			jumbleDurationMs: 2000,  // duration of jumble phase [ms] (0: no jumble phase)
			jumbleSpeedMs: 35,       // milliseconds per jumble update
			decodeDurationMs: 5000,  // duration of decoding phase [ms] (0: no decryption simulation)
			decodeSpeedMs: 100,      // milliseconds per update
			stopEps: 0.01,           // decode the rest if less than 1% are encrypted
			lockSize: false,         // lock current element size before removing content
			// Events:
			start: $.noop,           // Current text was replaced by encrypted text 
			type: $.noop,            // 'Encrypted' text has been typed to screen
			done: $.noop             // Decrypted text is completely displayed
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
		this.decodeStart = null;
		this.init();
	}

	// Avoid Plugin.prototype conflicts
	$.extend( Plugin.prototype, {
		init: function() {
			var self = this;

			// Prepare encoded text and trigger `start` event
			this.encode();
			this.settings.start.call(this.element);

			// 'Type' simulation and trigger `type` event
			this.type(this.currentText, 0).done(function() {
				self.settings.type.call(self.element);
				console.time("decode");
				// Jumble and decrypt phase
				self.decodeStart = Date.now();
				self.decrypt().done(function() {
					// Trigger `done` event
					console.timeEnd("decode");
					self.settings.done.call(self.element);
				});
			});
		},
		/* Move original text into buffer and set 'decrypted' text instead. */
		encode: function() {
			var $el = this.$element,
				opts = this.settings;

			this.originalText = $el.text();
			// Init with encrypted text unless decryption simulation is off
			if( opts.jumbleDurationMs || opts.decodeDurationMs ) {
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
			$el.text(opts.typeSpeedMs ? "" : this.currentText);
			// Show element (in case it was hidden before)
			$el.show();
		},
		/* Type text to console, character-by-character. */
		type: function(s, i, _dfd, _prevStamp) {
			var delta, nchar,
				opts = this.settings,
				now = Date.now(),
				dfd = _dfd || new $.Deferred(),
				self = this;

			if( opts.typeSpeedMs && i < s.length ) {
				// Main 'performance' issue seems to be that setTimeout doesn't 
				// allow less than ~10ms intervals.
				// We try to compensate by printing multiple characters at once
				nchar = 1;
				if( _prevStamp ) {
					delta = now - _prevStamp;
					nchar = Math.floor(delta / opts.typeSpeedMs);
				}
				this.$element.append(s.substr(i, nchar));
				// Schedule next keystroke
				setTimeout(function(){
					self.type.call(self, s, i+nchar, dfd, now);
				}, opts.typeSpeedMs);
			} else {
				// All characters typed (or typing simulation is off)
				this.$element.text(s);
				dfd.resolve();				
			}
			return _dfd ? null : dfd.promise();
		},
		/* Change current text until every character is 'decrypted'.
		 * This is done in two phases: 'jumble' and 'decode':
		 */
		decrypt: function(_dfd) {
			var c, i,
				opts = this.settings,
				now = Date.now(),
				elapsed = now - this.decodeStart,
				jumblePhase = elapsed < opts.jumbleDurationMs,
				decriptionRate = opts.decodeDurationMs ? (elapsed - opts.jumbleDurationMs) / opts.decodeDurationMs : 0,
				dfd = _dfd || new $.Deferred(),
				self = this,
				numEncrypted = 0,
				ot = this.originalText,
				ct = this.currentText,
				len = ct.length,
				s = "";

			if ( (jumblePhase && opts.jumbleDurationMs > 0) || (!jumblePhase && opts.decodeDurationMs > 0) ) {
				// Replace each character with a new random value
				for( i=0; i<len; i++) {
					c = ct[i];
					if( jumblePhase ) {
						numEncrypted++;
						c = _randomChar(c);
					} else if( c !== ot[i] ) {
						// decryption phase: keep solved characters unchanged.
						// we also increase the probability of a match, so it
						// becomes more likely to finish in the requested time
						if( Math.random() > decriptionRate ) {
							numEncrypted++;
							c = _randomChar(c);
						} else {
							c = ot[i];
						}
					}
					s += c;
				}
				if ( numEncrypted / len < opts.stopEps) {
					// Resolve all if (nearly) everything is decrypted
					this.currentText = ot;
					numEncrypted = 0;
				} else {
					this.currentText = s;
				}
			} else {
				// Resolve all if loop count exceeded
				this.currentText = ot;
			}
			// Print the current text version
			this.$element.text(this.currentText);

			if( numEncrypted > 0 ) {
				// Schedule next decryption iteration
				setTimeout(function(){
					self.decrypt.call(self, dfd);
				}, jumblePhase ? opts.jumbleSpeedMs : opts.decodeSpeedMs);
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
