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
				console.log("&&&&&&& HERE ^^^^^^ YES !!!!!!!!!")


				var loadResult = cif.init();
				console.log(loadResult);

				var rawSchema = cif.loadFile("schema.json");
				var schema = cif.loadSocialStructure(rawSchema);

				var rawCast = cif.loadFile("cast.json");
				var cast = cif.addCharacters(rawCast);

				var rawRules = cif.loadFile("testTrigger.json");
				console.log(rawRules);
				var ids = cif.addRules(rawRules);
				console.log("ids", ids);
				ids = cif.addRules(cif.loadFile("samsVolition.json"));
				console.log("ids2", ids);

				var rawActions = cif.loadFile("actions.json");
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

				var bestAction = cif.getAction(char1, char2, storedVolitions, cast);
				console.log("Actions: ", bestAction);



	};

	


	/***************************************************************/
	/* INTERFACE */
	/***************************************************************/

	var actionLibraryUnitTestInterface = {
		runTests: runTests
	};

	return actionLibraryUnitTestInterface;

});