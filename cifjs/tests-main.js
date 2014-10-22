/** @jsx React.DOM */
// Configure require.js and set paths to modules used.

require.config({
	paths: {
		// Note that the file paths omit the ".js" from the filename.

		// domReady is a require.js module that waits until the whole DOM is loaded before executing.
		"domReady": "jslib/domReady"

		// JS libraries
		,"jquery": "jslib/jquery-2.1.0"
		,"react": "jslib/react-with-addons"
		,"jsx": "jslib/jsx"
		,"text": "jslib/text"	// Lets require load plain text, used by jsx
		,"JSXTransformer": "jslib/JSXTransformer"
		,"underscore" : "jslib/underscore-min"
		,"inheritance" : "jslib/inheritance"
		,"util": "jslib/util"
		,"log": "jslib/log"

		// CiF
		,"sfdb": "js/CiF/SFDB"
		,"ruleLibrary": "js/CiF/RuleLibrary"
		,"actionLibrary":"js/CiF/ActionLibrary"
		,"volition": "js/CiF/Volition"
		,"validate": "js/CiF/Validate"
		,"cif": "js/CiF/CiF"



		// Dayton
		// ,"game": "js/game/game-main"

		// UI
		// ,"ui": "js/ui"

		// Testing
		,"test": "js/tests/Tests"
		// Unit Test Files
		,"cifUnitTests": "js/tests/CiFUnitTests"
		,"sfdbUnitTests": "js/tests/SFDBUnitTests"
		,"ruleLibraryUnitTests": "js/tests/RuleLibraryUnitTests"
		,"actionLibraryUnitTests": "js/tests/ActionLibraryUnitTests"
		,"volitionUnitTests": "js/tests/VolitionUnitTests" 
		,"validateUnitTests": "js/tests/ValidateUnitTests"

	},

	// Shims let certain libraries that aren't built with the module pattern interface with require.js Basically they tell require.js what global variable the given library will try to export all its functionality to, so require.js can do with that what it will.
	shim : {
		"underscore" : {
			exports : "_"
		},
		"inheritance" : {
			exports : "Inheritance"
		}
	}
});


// Main entry function for Project Yarn

require(["volition", "text!data/testState.json", "sfdb", "ruleLibrary", "actionLibrary", "cif", "cifUnitTests", "sfdbUnitTests", "ruleLibraryUnitTests", "volitionUnitTests", "validateUnitTests", "actionLibraryUnitTests", "domReady!"], function(volition, testState, sfdb, ruleLibrary, actionLibrary, cif, cifUnitTests, sfdbUnitTests, ruleLibraryUnitTests, volitionUnitTests, validateUnitTests, actionLibraryUnitTests){

	console.log("Beginning tests-main.js main function.");
	//try{
		cif.init();
		sfdb.init();

		cifUnitTests.runTests();
		sfdbUnitTests.runTests();
		ruleLibraryUnitTests.runTests();
		volitionUnitTests.runTests();
		validateUnitTests.runTests();
		actionLibraryUnitTests.runTests();

	//}
	//catch(e) {
	//     $("#testResults").append("<div class='testFileHeader' style='color:red;'>Crashed During Testing!!</div>");
	//	 console.log(e);
	//}
	
	/*
	abstractPredicate.runTests();
	sfdb.runTests();
	ruleLibrary.runTests();
	volition.runTests();
	cif.runTests();
*/

	var state = JSON.parse(testState); // from external file, loaded in "define" above

	// var socialState = cif.init();
	// dayton.init(socialState, "mainWindow");
	//game.init(state);
	//var ui = UI.init(state);

});
