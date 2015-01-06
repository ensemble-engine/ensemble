/*global define */
/**
 * This has all of the unit tests for functions that are from ActionLibrary.js
 */

define(["util", "underscore", "ruleLibrary", "actionLibrary", "sfdb", "cif", "test", "volition", "text!data/testVolitionRules.json", "text!data/testSocial.json", "text!data/testActions.json", "text!data/testActionsGrammar.json", "text!data/testActionsGrammar2.json", "text!data/testActionsGrammar3.json", "text!data/testActionsGrammar4.json", "text!data/testActionsGrammar5.json", "text!data/testActionsGrammar6.json", "text!data/testActionsGrammar7.json", "text!data/testActionsGrammar8.json", "text!data/testActionsGrammar9.json", "text!data/testActionsGrammar10.json", "text!data/testActionsGrammar11.json", "text!data/testActionsGrammar12.json", "text!data/testActionsGrammar13.json"],
function(util, _, ruleLibrary, actionLibrary, sfdb, cif, test, volition, testVolitionRules, testSocial, testActions, testActionsGrammar, testActionsGrammar2, testActionsGrammar3, testActionsGrammar4, testActionsGrammar5, testActionsGrammar6, testActionsGrammar7, testActionsGrammar8, testActionsGrammar9, testActionsGrammar10, testActionsGrammar11, testActionsGrammar12, testActionsGrammar13) {


	/***************************************************************/
	/* UNIT TESTS */
	/***************************************************************/

	
	var runTests = function() {
		cif.reset();
		sfdb.clearEverything();
		actionLibrary.clearActionLibrary();
		console.log("&&&&&&& HERE ^^^^^^ YES !!!!!!!!!");


		//document.addEventListener("newMessage", cifInitCallback, false);
		document.addEventListener('build', function (e) {
			console.log("** hello?!!?");
		  // e.target matches document from above
		}, false);



		var loadResult = cif.init();
		console.log(loadResult);

		var rawSchema = cif.loadFile("externalApplicationFiles/schema.json");
		var schema = cif.loadSocialStructure(rawSchema);

		var rawCast = cif.loadFile("externalApplicationFiles/cast.json");
		var cast = cif.addCharacters(rawCast);

		var rawRules = cif.loadFile("externalApplicationFiles/testTrigger.json");
		console.log(rawRules);
		var ids = cif.addRules(rawRules);
		console.log("ids", ids);
		ids = cif.addRules(cif.loadFile("externalApplicationFiles/samsVolition.json"));
		console.log("ids2", ids);

		var rawActions = cif.loadFile("externalApplicationFiles/actions.json");
		var actions = cif.addActions(rawActions);

		console.log("schema", schema);
		console.log("cast", cast);
		console.log("actions", actions);

		cif.dumpSFDB();

		var testPredicate = {
			"class" : "bond",
			"type" : "kinship",
			"first" : "brax",
			"second" : "grunt",
			"value" : 3
		};

		cif.set(testPredicate);

		cif.dumpSFDB();

		var storedVolitions = cif.calculateVolition(cast);

		var char1 = "brax";
		var char2 = "grunt";
		var vol = storedVolitions.getFirst(char1, char2);
		console.log(vol);

		var bestActions = cif.getActions(char1, char2, storedVolitions, cast, 2, 1);
		console.log("Actions: ", bestActions);

		var bestSelfActions = cif.getActions(char1, char1, storedVolitions, cast, 2, 1);
		console.log("Self Actions: ", bestSelfActions);

		for(var i = 0; i < bestSelfActions[0].effects.length; i += 1){
			cif.set(bestSelfActions[0].effects[i]);
		}

		cif.dumpSFDB();

		/*
		var bestAction = cif.getAction(char1, char2, storedVolitions, cast);
		console.log("Actions: ", bestAction);
		*/


	};

	var cifInitCallback = function(){
		console.log("******* cif init callback");
	};

	


	/***************************************************************/
	/* INTERFACE */
	/***************************************************************/

	var actionLibraryUnitTestInterface = {
		runTests: runTests
	};

	return actionLibraryUnitTestInterface;

});