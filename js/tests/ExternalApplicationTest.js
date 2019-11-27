/*global define */
/**
 * This has all of the unit tests for functions that are from ActionLibrary.js
 */

define(["ruleLibrary", "actionLibrary", "socialRecord", "ensemble", "test", "volition", "text!data/testVolitionRules.json", "text!data/testSocial.json", "text!data/testActions.json", "text!data/testActionsGrammar.json", "text!data/testActionsGrammar2.json", "text!data/testActionsGrammar3.json", "text!data/testActionsGrammar4.json", "text!data/testActionsGrammar5.json", "text!data/testActionsGrammar6.json", "text!data/testActionsGrammar7.json", "text!data/testActionsGrammar8.json", "text!data/testActionsGrammar9.json", "text!data/testActionsGrammar10.json", "text!data/testActionsGrammar11.json", "text!data/testActionsGrammar12.json", "text!data/testActionsGrammar13.json"],
function(ruleLibrary, actionLibrary, socialRecord, ensemble, test, volition, testVolitionRules, testSocial, testActions, testActionsGrammar, testActionsGrammar2, testActionsGrammar3, testActionsGrammar4, testActionsGrammar5, testActionsGrammar6, testActionsGrammar7, testActionsGrammar8, testActionsGrammar9, testActionsGrammar10, testActionsGrammar11, testActionsGrammar12, testActionsGrammar13) {


	/***************************************************************/
	/* UNIT TESTS */
	/***************************************************************/

	
	var runTests = function() {
		ensemble.reset();
		socialRecord.clearEverything();
		actionLibrary.clearActionLibrary();
		//console.log("&&&&&&& HERE ^^^^^^ YES !!!!!!!!!");
		
		originalTest();
		ensemble.reset();
		socialRecord.clearEverything();
		actionLibrary.clearActionLibrary();

		loversAndRivalsTest();
	};

	var originalTest = function(){
		//document.addEventListener("newMessage", ensembleInitCallback, false);
		document.addEventListener('build', function (e) {
			console.log("** hello?!!?");
			// e.target matches document from above
		}, false);



		var loadResult = ensemble.init();
		console.log(loadResult);

		var rawSchema = ensemble.loadFile("externalApplicationFiles/schema.json");
		var schema = ensemble.loadSocialStructure(rawSchema);

		var rawCast = ensemble.loadFile("externalApplicationFiles/cast.json");
		var cast = ensemble.addCharacters(rawCast);

		var rawRules = ensemble.loadFile("externalApplicationFiles/testTrigger.json");
		console.log(rawRules);
		var ids = ensemble.addRules(rawRules);
		console.log("ids", ids);
		ids = ensemble.addRules(ensemble.loadFile("externalApplicationFiles/samsVolition.json"));
		console.log("ids2", ids);

		var rawActions = ensemble.loadFile("externalApplicationFiles/actions.json");
		var actions = ensemble.addActions(rawActions);

/*
		console.log("schema", schema);
		console.log("cast", cast);
		console.log("actions", actions);
*/

		ensemble.dumpSocialRecord();

		var testPredicate = {
			"category" : "bond",
			"type" : "kinship",
			"first" : "brax",
			"second" : "grunt",
			"value" : 3
		};

		ensemble.set(testPredicate);

		ensemble.dumpSocialRecord();

		var storedVolitions = ensemble.calculateVolition(cast);

		var char1 = "brax";
		var char2 = "grunt";
		var vol = storedVolitions.getFirst(char1, char2);
		//console.log(vol);

		var bestActions = ensemble.getActions(char1, char2, storedVolitions, cast, 2, 1);
		//console.log("Actions: ", bestActions);

		var bestSelfActions = ensemble.getActions(char1, char1, storedVolitions, cast, 2, 1);
		//console.log("Self Actions: ", bestSelfActions);

		for(var i = 0; i < bestSelfActions[0].effects.length; i += 1){
			ensemble.set(bestSelfActions[0].effects[i]);
		}

		ensemble.dumpSocialRecord();

		/*
		var bestAction = ensemble.getAction(char1, char2, storedVolitions, cast);
		console.log("Actions: ", bestAction);
		*/
	};

	var loversAndRivalsTest = function() {
		//console.log("testing loversAndRivals data...");
		var loadResult = ensemble.init();
		//console.log(loadResult);

		var rawSchema = ensemble.loadFile("externalApplicationFiles/dataLoversAndRivals/schema.json");
		//var schema = ensemble.loadSocialStructure(rawSchema);
		var schema = ensemble.loadBaseBlueprints(rawSchema);

		var rawCast = ensemble.loadFile("externalApplicationFiles/dataLoversAndRivals/cast.json");
		var cast = ensemble.addCharacters(rawCast);

		var rawRules = ensemble.loadFile("externalApplicationFiles/dataLoversAndRivals/triggerRules.json");
		//console.log(rawRules);
		var ids = ensemble.addRules(rawRules);
		//console.log("ids", ids);
		ids = ensemble.addRules(ensemble.loadFile("externalApplicationFiles/dataLoversAndRivals/volitionRules.json"));
		//console.log("ids2", ids);

		var rawActions = ensemble.loadFile("externalApplicationFiles/dataLoversAndRivals/actions.json");
		var actions = ensemble.addActions(rawActions);

		var rawHistory = ensemble.loadFile("externalApplicationFiles/dataLoversAndRivals/history.json");
		var history = ensemble.addHistory(rawHistory);

/*
		console.log("schema", schema);
		console.log("cast", cast);
		console.log("actions", actions);
		console.log("history: " , history);
*/

		ensemble.dumpSocialRecord();

		var char1 = "hero";
		var char2 = "love";

		var storedVolitions = ensemble.calculateVolition(cast);
		var possibleActions = ensemble.getActions(char1, char2, storedVolitions, cast, 2, 3);
		var possibleActionsLoveToHero = ensemble.getActions(char2, char1, storedVolitions, cast, 2, 3);
		//console.log("possible actions from hero to love: " , possibleActions);
		//console.log("possible actions from love to hero: " , possibleActionsLoveToHero);

		//now let's set the hero's closeness to love to 10, to test the odd behavior we're experiencing.
		/*
		var newCloseness = {
			"category" : "feeling",
			"type" : "closeness",
			"first" : "hero",
			"second" : "love",
			"value" : 10
		};
		ensemble.set(newCloseness);
		*/

		storedVolitions = ensemble.calculateVolition(cast);
		possibleActions = ensemble.getActions(char1, char2, storedVolitions, cast, 2, 2);

		//console.log("stored volitions: " , storedVolitions.dump());
		var testActions = ensemble.getActions("love", "hero", storedVolitions, cast, 2, 2);
		//console.log("This is what love wants to do towards hero: ", testActions);

		//console.log("new possible actions: " , possibleActions);

		var heroToHeroActions = ensemble.getActions("hero", "hero", storedVolitions, cast, 2, 2);
		//console.log("actions from hero to hero!" , heroToHeroActions);

		ensemble.dumpSocialRecord();
		ensemble.runTriggerRules(cast);
		ensemble.dumpSocialRecord();

		
	};

	var ensembleInitCallback = function(){
		console.log("******* ensemble init callback");
	};

	


	/***************************************************************/
	/* INTERFACE */
	/***************************************************************/

	var actionLibraryUnitTestInterface = {
		runTests: runTests
	};

	return actionLibraryUnitTestInterface;

});