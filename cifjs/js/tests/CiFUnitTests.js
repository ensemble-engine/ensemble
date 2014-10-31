/*global define */
/**
 * This has all of the unit tests for functions that are from CiF.js
 */

define(["util", "underscore", "ruleLibrary", "sfdb", "cif", "actionLibrary", "test", "text!data/testSocial.json", "text!data/testVolitionRules.json", "text!data/testActionsGrammar8.json", "text!data/testActionsGrammar9.json"],
function(util, _, ruleLibrary, sfdb, cif, actionLibrary, test, testSocial, testVolitionRules, testActionsGrammar8, testActionsGrammar9) {


	/***************************************************************/
	/* UNIT TESTS */
	/***************************************************************/

	var runTests = function() {
		testLoadSocialStructure();
		testAddRules();
		testCharacters();
	};

	var testLoadSocialStructure = function() {
		var data = {
			"schema": [
				{
					"class": "network",
					"isBoolean": false,
					"defaultValue": 50,
					"directionType": "directed",
					"types": ["affinity", "trust"],
					"allowIntent": true
				},
				{
					"class": "relationship",
					"isBoolean": true,
					"defaultValue": false,
					"directionType": "reciprocal",
					"types": ["friends", "involved with"],
					"allowIntent": true
				}
			]
		};
		test.start("CiF", "loadSocialStructure");
		var structure = cif.loadSocialStructure(data);
		test.assert(_.keys(structure).length, 2, "structure should have had two keys");
		test.assert(_.keys(structure.network).length, 2, "network should have had two keys");
		test.assertNEQ(structure.network, undefined , "structure should have key network");
		test.assertNEQ(structure.relationship, undefined, "structure should have key relationship");
		test.assertNEQ(structure.network.affinity, undefined, "structure.network should have key affinity");

		// Try some bad blueprints, make sure they fail.
		var didFail = false;
		var shouldFail = false;
		var testB = util.clone(data);
		try {
			var bad1 = util.clone(testB);
			delete bad1.schema[0].isBoolean;
			shouldFail = loadSocialStructure(bad1);
		} catch(e) {
			didFail = true;
		}
		test.assert(didFail, true, "newFactory was passed a blueprint without isBoolean but didn't crash.");

		didFail = false;
		try {
			var bad2 = util.clone(testB);
			delete bad2.schema[0].defaultValue;
			shouldFail = loadSocialStructure(bad2);
		} catch(e) {
			didFail = true;
		}
		test.assert(didFail, true, "newFactory was passed a numeric blueprint without a defaultValue but didn't crash.");

		didFail = false;
		try {
			var bad3 = util.clone(testB);
			bad3.schema[0].directionType = "nonsense";
			shouldFail = loadSocialStructure(bad3);
		} catch(e) {
			didFail = true;
		}
		test.assert(didFail, true, "newFactory was passed a  blueprint with an invalid directionType but didn't crash.");

		didFail = false;
		try {
			var bad4 = util.clone(testB);
			bad4.schema[0].invalidKey = false;
			shouldFail = loadSocialStructure(bad4);
		} catch(e) {
			didFail = true;
		}
		test.assert(didFail, true, "newFactory was passed a  blueprint with an unexpected key but didn't crash.");

		didFail = false;
		try {
			var bad5 = util.clone(testB);
			bad5.schema[1].types = "shouldBeArray";
			shouldFail = loadSocialStructure(bad5);
		} catch(e) {
			didFail = true;
		}
		test.assert(didFail, true, "newFactory was passed a  blueprint with a non-array 'types' but didn't crash.");

		test.finish();

	};
	
	/**
	 *@method testAddRules
	 *@private
	 *@memberof CiF
	 *@description A suite of unit tests verifying the functionality of testAddRules
	 */
	var testAddRules = function(){
		cif.loadBaseBlueprints(testSocial);
		test.start("CiF", "testAddRules");
		
		//Let's make a quickie JSON thing
		var triggerData = '{' +
		'"fileName" : "testAddRules (method)",' + 
		'"type": "trigger",' +
		'"rules": [' +
			'{' +
				'"name": "If I am jealous and someone hits on my sweetie, I hate them.",' +
				'"conditions": [' +
					'{' +
						'"class": "relationship",' +
						'"type": "involved with",' +
						'"first": "x",' +
						'"second": "y"' +
					'},{' +
						'"class": "trait",' +
						'"type": "jealous",' +
						'"first": "x"' +
					'},{' +
						'"class": "SFDBLabel",' +
						'"type": "romanticAdvance",' +
						'"first": "z",' +
						'"second": "y",' +
						'"turnsAgoBetween": ["NOW", "NOW"]' +
					'}' +
				'],' +
				'"effects": [' +
					'{' +
						'"class": "directedStatus",' +
						'"type": "attracted to",' +
						'"first": "x",' +
						'"second": "z",' +
						'"value": true' +
					'}' +
				']' +
			'}'+
		']}';
		
		var volitionData = '{' +
		'"fileName" : "testAddRules (method)",' + 
		'"type": "volition",' +
		'"rules": [' +
			'{' +
				'"name": "If I am jealous and someone hits on my sweetie, I want to lower affinity with them.",' +
				'"conditions": [' +
					'{' +
						'"class": "relationship",' +
						'"type": "involved with",' +
						'"first": "x",' +
						'"second": "y"' +
					'},{' +
						'"class": "trait",' +
						'"type": "jealous",' +
						'"first": "x"' +
					'},{' +
						'"class": "SFDBLabel",' +
						'"type": "romanticAdvance",' +
						'"first": "z",' +
						'"second": "y",' +
						'"turnsAgoBetween": ["NOW", "NOW"]' +
					'}' +
				'],' +
				'"effects": [' +
					'{' +
						'"class": "network",' +
						'"type": "affinity",' +
						'"first": "x",' +
						'"second": "z",' +
						'"weight": 5,' +
						'"intentDirection" : false' +
					'}' +
				']' +
			'}'+
		']}';
		
		var userSpecifiedData = '{' +
		'"fileName" : "testAddRules (method)",' + 
		'"type": "FOOBAR",' +
		'"rules": [' +
			'{' +
				'"name": "If I am jealous and someone hits on my sweetie, I want to lower affinity with them.",' +
				'"conditions": [' +
					'{' +
						'"class": "relationship",' +
						'"type": "involved with",' +
						'"first": "x",' +
						'"second": "y"' +
					'},{' +
						'"class": "trait",' +
						'"type": "jealous",' +
						'"first": "x"' +
					'},{' +
						'"class": "SFDBLabel",' +
						'"type": "romanticAdvance",' +
						'"first": "z",' +
						'"second": "y",' +
						'"turnsAgoBetween": ["NOW", "NOW"]' +
					'}' +
				'],' +
				'"effects": [' +
					'{' +
						'"class": "network",' +
						'"type": "affinity",' +
						'"first": "x",' +
						'"second": "z",' +
						'"weight": 5,' +
						'"intentDirection" : false' +
					'}' +
				']' +
			'}'+
		']}';
		
		
		
		//TEST 1 -- verify that our ruleLibrary trigger rules starts off empty, and then we can successfully add something to it!
		var triggerRules = ruleLibrary.getTriggerRules();
		test.assert(triggerRules.length, 0, "Apparantly ruleLibrary had a trigger in it already. Wanted to start off with it being empty");
		cif.addRules(triggerData);
		triggerRules = ruleLibrary.getTriggerRules();
		test.assert(triggerRules.length, 1, "Trigger rule did not get successfully parsed in, sadly");
		
		//TEST 2 -- It should be smart enough to NOT add the same rule twice.
		
		cif.addRules(triggerData);
		triggerRules = ruleLibrary.getTriggerRules();
		test.assert(triggerRules.length, 1, "Trigger rules should have remained the same length since we were adding a duplicate.");

		//TEST 3 -- same as TEST 1, but for volition rules
		var volitionRules = ruleLibrary.getVolitionRules();
		test.assert(volitionRules.length, 0, "apparantly ruleLibrary had a volition rule in it already. Wanted to start off with it being empty");
		cif.addRules(volitionData);
		volitionRules = ruleLibrary.getVolitionRules();
		test.assert(volitionRules.length, 1, "Volition rule did not get successfully parsed in, sadly");
		
	
		//TEST 4 -- same as TEST 2, but for volition rules
		cif.addRules(volitionData);
		volitionRules = ruleLibrary.getVolitionRules();
		test.assert(volitionRules.length, 1, "Trigger rules should have remained the same length since we were adding a duplicate.");

		//TEST 5 -- Eh, what happens when we do a user specified set of rules (i.e. NOT trigger nor volition).
		cif.addRules(userSpecifiedData);
		volitionRules = ruleLibrary.getVolitionRules();
		triggerRules = ruleLibrary.getTriggerRules();
		test.assert(volitionRules.length, 1, "adding the crazy user specified field affected volition rules in a way that it shouldn't have");
		test.assert(triggerRules.length, 1, "adding the crazy user specified field affected trigger rules in a way that it hsouldn't have");
		
		
		test.finish();
	};

	var testCharacters = function() {
		var testChars = {
			"cast": {
				"bob": {
					"name": "Bob"
				},
				"lechuck": {
					"name": "Le Chuck",
					"job": "pirate"
				},
				"anonymous": {
				}
			}
		}
		test.start("CiF", "testCharacters");
		var chars = cif.addCharacters(testChars);
		test.assert(chars.length, 3, "addCharacters should return an array of length 3 with the names of each character.");
		test.assert(chars.indexOf("lechuck") >= 0, true, "Each character in the given object should be present in the array returned from addCharacters.");
		var newChars = cif.getCharacters();
		test.assert(newChars.length, 3, "getCharacters should return an array of length 3, just as is returned when we first add the characters.");
		test.assert(cif.getCharData("lechuck", "name"), "Le Chuck", "getCharData for name should return the appropriate printed name.")
		test.assert(cif.getCharName("lechuck"), "Le Chuck", "getCharName should return the printed name for a character.");
		test.assert(cif.getCharName("anonymous"), "anonymous", "getCharName should return the key if no printed name is defined.")
		test.assert(cif.getCharData("lechuck", "job"), "pirate", "getCharData should be able to return arbitrary metadata.")
		test.assert(cif.getCharData("bob", "job"), undefined, "getCharData should return undefined if a piece of metadata can't be found.");
		test.assert(cif.getCharData("unknownChar", "job"), undefined, "getCharData should return undefined if given an invalid character.");

		test.finish();

	};
	

	/***************************************************************/
	/* INTERFACE */
	/***************************************************************/

	var cifUnitTestInterface = {
		runTests: runTests
	};

	return cifUnitTestInterface;

});