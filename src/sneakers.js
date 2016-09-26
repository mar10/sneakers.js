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

	// Create the defaults once
	var pluginName = "sneakers",
		defaults = {
			typeMs: 5,        // milliseconds per character (0: show immediately)
			decodeMs: 50,     // milliseconds per update
			maxDecode: 1000,  // decode the rest after max. updates
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
		this.init();
	}

	// Avoid Plugin.prototype conflicts
	$.extend( Plugin.prototype, {
		init: function() {
			var self = this;
			// console.time("type");
			// console.time("decrypt");
			this.encode();
			self.settings.start.call(self.element);
			this.type(this.currentText, 0).done(function(){
				// console.timeEnd("type");
				self.settings.type.call(self.element);
				self.decrypt(self.settings.maxDecode).done(function(){
					self.settings.done.call(self.element);
				});
			});
		},
		/* Move original text into element data. */
		encode: function() {
			var $el = this.$element;

			this.originalText = $el.text();
			this.currentText = _encode(this.originalText);
			if( this.settings.lockSize ) {
				$el.css({
					height: $el.css("height"),
					width: $el.css("width")
				});
			}
			$el
				// .text("")
				.text(this.settings.typeMs ? "" : this.currentText)
				.show();
		},
		/* Type text to console, character-by-character. */
		type: function(s, i, _dfd, _prevStamp) {
			var delta, nchar,
				now = Date.now(),
				dfd = _dfd || new $.Deferred(),
				self = this;

			if( this.settings.typeMs && i < s.length ) {
				// Main 'performance' issue seems to be that setTimeout doesn't 
				// allow less than 10ms intervals (Safari)
				// We try to compensate by printing multiple characters at once
				nchar = 1;
				if( _prevStamp ) {
					delta = now - _prevStamp;
					nchar = Math.floor(delta / this.settings.typeMs);
					// console.log(_prevStamp + ", delta=" + delta + "ms: nchar=" + nchar);
				}
				this.$element.append(s.substr(i, nchar));
				// this.element.innerHTML += s[i];
				setTimeout(function(){
					self.type.call(self, s, i+nchar, dfd, now);
				}, this.settings.typeMs);
			} else {
				this.$element.text(s);
				dfd.resolve();				
			}
			return _dfd ? null : dfd.promise();
		},
		/* Change current text until every character is 'decoded'. */
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
			
			// this.element.innerHTML = this.currentText;
			this.$element.text(this.currentText);

			if( encryptedCount > 0 ) {
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
