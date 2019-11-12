/** @jsx React.DOM */
// Configure require.js and set paths to modules used.

require.config({
	paths: {
		// Note that the file paths omit the ".js" from the filename.

		// domReady is a require.js module that waits until the whole DOM is loaded before executing.
		"domReady": "jslib/domReady"

		// JS libraries
		,"jquery": "jslib/jquery-2.1.0"
		,"text": "jslib/text"	// Lets require load plain text, used by jsx
		,"underscore" : "jslib/underscore-min"
		,"util": "jslib/util"
		,"log": "jslib/log"

		// ensemble
		,"socialRecord": "js/ensemble/socialRecord"
		,"ruleLibrary": "js/ensemble/RuleLibrary"
		,"actionLibrary":"js/ensemble/ActionLibrary"
		,"volition": "js/ensemble/Volition"
		,"validate": "js/ensemble/Validate"
		,"ensemble": "js/ensemble/ensemble"


		// // Testing
		,"test": "js/tests/Tests"
		// Unit Test Files
		,"ensembleUnitTests": "js/tests/ensembleUnitTests"
		,"socialRecordUnitTests": "js/tests/socialRecordUnitTests"
		,"ruleLibraryUnitTests": "js/tests/RuleLibraryUnitTests"
		,"actionLibraryUnitTests": "js/tests/ActionLibraryUnitTests"
		,"volitionUnitTests": "js/tests/VolitionUnitTests" 
		,"validateUnitTests": "js/tests/ValidateUnitTests"

	},

	// Shims let certain libraries that aren't built with the module pattern interface with require.js Basically they tell require.js what global variable the given library will try to export all its functionality to, so require.js can do with that what it will.
	shim : {
		"underscore" : {
			exports : "_"
		}
	}
});



