// Package: Log
// Logging and error reporting interface.

/*jshint smarttabs: true */
/*global define, console */

define(["jquery"], function($) {
	"use strict";

	// A reference to a global variable holding log messages. This is necessary so we can plug into the React framework.
	var GLOBAL_LOG_ARRAY;
	var GLOBAL_LOG_TYPES;

	var currentlyTracking = {};
	var parentNode = "";

	var init = function(_parentNode, optGlobalRef, optLogTypes) {
		parentNode = _parentNode;
		if (parentNode === "REACT") {
			GLOBAL_LOG_ARRAY = optGlobalRef;
			GLOBAL_LOG_TYPES = optLogTypes;
			var target = $("#logControlsArea");
			for (var i = 0; i < GLOBAL_LOG_TYPES.length; i++) {
				var t = GLOBAL_LOG_TYPES[i];
				var tName = t[0];
				var tTracking = t[1];
				target.append("<input id='box_" + tName + "' type='checkbox' " + (tTracking ? "checked" : "") + " value='" + tName + "'> " + tName + "<br/>")
			};
		}
		$("#logControlsArea input").change(function(e) {
			console.log("e", e, "this", this);
			if (e.target.checked === true) {
				trackOn(e.target.value);
			} else {
				trackOff(e.target.value);
			}
		});
	}

	/* Function: trackOn
	Start showing <Log.log> messages for the given key.

	Paramters:
	category - a string
	*/
	var trackOn = function(category) {
		currentlyTracking[category] = true;
	};

	/* Function: trackOff
	Stop showing <Log.log> messages for the given key.

	Paramters:
	category - a string
	*/
	var trackOff = function(category) {
		currentlyTracking[category] = false;
	};

	var areTracking = function(category) {
		return (currentlyTracking[category] === true);
	};

	/* Function: trackAll
	Start showing <Log.log> messages for all keys.
	*/
	var trackAll = function() {
		for (var i = 0; i < GLOBAL_LOG_TYPES.length; i++) {
			var t = GLOBAL_LOG_TYPES[i];
			trackOn(t[0]);
			$("#box_" + t[0]).prop('checked', true);
		}
	};

	/* Function: trackReset
	Stop tracking <Log.log> messages for all keys.
	*/
	var trackReset = function() {
		currentlyTracking = {};
		for (var i = 0; i < GLOBAL_LOG_TYPES.length; i++) {
			var t = GLOBAL_LOG_TYPES[i];
			t[1] = false;
			trackOff(t[0]);
			$("#box_" + t[0]).prop('checked', false);
		}
	};

	/* Function: log
	Log something to the designated loggy place (console, currently)

	Paramters:
	category - string, specifying this lets you turn on/off logging for certain categories (see <trackOn> and <trackOff>). If you omit this parameter, the message is always displayed.
	message - string, what to display
	*/
	var log = function(category, message, alwaysLog) {
		// console.log('log.js: "' + category + "', msg: " + message);
		if (currentlyTracking[category] === true || alwaysLog) {
			if (parentNode === "REACT") {
				// GLOBAL_LOG_ARRAY.push("<span class=log_" + category + "'>" + message + "</span>");
				// if (GLOBAL_LOG_TYPES.indexOf(category) < 0) {
					// GLOBAL_LOG_TYPES.push([category, true]);
				// }
				$("#logWindow").append("<p class='log_" + category + "'>" + message + "</p>");
			} else {
				var msg = "<div class='logmsg log_" + category + "'>" + message + "</div>";
				$(parentNode).append(msg);
			}
		}
	};

	var error = function(category, message) {
		console.log("ERROR " + category + ": " + message);
		console.log("Additional error info follows:");
		for (var i = 2; i <= arguments.length; i++) {
			console.log(arguments[i]);
		}
		if (parentNode === "REACT") {
			log("error", "ERROR: Additional info on Javascript console.", true);
		}
	}

	var fatalError = function(category, message) {
		error(category, message);
		console.log("Stack trace follows:");
		console.trace();
		throw new Error("Halting execution.");
	}

	return {
		init: init,

		log: log,
		error: error,
		fatalError: fatalError,

		on: trackOn,
		off: trackOff,
		areTracking: areTracking,
		all: trackAll,
		reset: trackReset
	};

});