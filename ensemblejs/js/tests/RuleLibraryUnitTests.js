/*global define */
/**
 * This has all of the unit tests for functions that are from RuleLibrary.js
 */

define(["util", "underscore", "util", "ruleLibrary", "socialRecord", "ensemble", "volition", "test", "validate", "text!data/testSocial.json", "text!data/testTriggerRules.json"],
function(util, _, util, ruleLibrary, socialRecord, ensemble, volition, test, validate, testSocial, testTriggerRules) {


	/***************************************************************/
	/* UNIT TESTS */
	/***************************************************************/
/**
	 * Runs all of the unit tests for RuleLibrary.js. to see the results of these tests, simply load
	 * tests.html into a browser.
	 *
	 * @return testResults a string formatted as HTML to be appended to tests.html, storing the results (pass/fail) of each of the unit tests
	 */
	var runTests = function(){
		var testResults = "<span class='unitTestHeader'>***RuleLibrary.js***</span>";
		testResults += testRunRules();
		socialRecord.clearEverything();
		testResults += testGetUniqueBindings();
		socialRecord.clearEverything();
		testResults += testMatchUniqueBindings();
		socialRecord.clearEverything();
		testResults += testDoBinding();
		socialRecord.clearEverything();
		testResults += testRunTriggerRules();
		socialRecord.clearEverything();
		testResults += testCalculateVolition();
		socialRecord.clearEverything();
		testResults += testAddRuleSet();
		socialRecord.clearEverything();
		testResults += testAccessById();
		socialRecord.clearEverything();
		testResults += testEvaluateConditions();
		socialRecord.clearEverything();
		testResults += testRuleToEnglish();
		socialRecord.clearEverything();
		testResults += testArePredicatesEqual();
		socialRecord.clearEverything();
		testResults += testAreRulesEqual();
		socialRecord.clearEverything();
		testResults +=testIsRuleAlreadyInRuleSet();
		socialRecord.clearEverything();
		testResults += testTimeOrderedRules();
		socialRecord.clearEverything();
		testResults += testSortConditionsByOrder();
		socialRecord.clearEverything();
		testResults += testPredicateToEnglish();
		socialRecord.clearEverything();
		testResults += testPredicateDefaults();
		socialRecord.clearEverything();
		testResults += testCalculateVolitionWithParams();
		socialRecord.clearEverything();

		//the above functions assume that rules have the following two things:
		//rule.conditions
		//rule.effects

		return testResults;
	};

	/**
	 * @method testArePredicatesEqual
	 * @memberof RuleLibrary
	 *
	 * @description a unit test to make sure that the testArePredicatesEqual method functions as expected.
	 * There aren't many unit tests in here, but many of the potential edge cases are currently
	 * caught in testAreRulesEqual (as the function 'areRulesEqual' calls 'arePredicatesEqual' quite a bit!)
	 *
	 */
	var testArePredicatesEqual = function(){

		var friendPred = {};
		friendPred.category = "relationship";
		friendPred.type = "friends";
		friendPred.first = "doc";
		friendPred.second = "alice";
		friendPred.value = true;

		var traitPred = {};
		traitPred.category = "trait";
		traitPred.type = "brainy";
		traitPred.first = "doc";
		traitPred.value = true;

		test.start("RuleLibrary", "testArePredicatesEqual");

		var result = ruleLibrary.arePredicatesEqual(friendPred, traitPred);
		test.assert(result, false, "Even though two predicates had different amount of attributes, still returned as true.");


		test.finish();
	};

	/**
	 * @method testAreRulesEqual
	 * @memberof RuleLibrary
	 *
	 * @description A unit test that to make sure that the testAreRulesEqual method functions as expected.
	 *
	 * TODO: As also marked in the block preceeding areRulesEqual, this function currently assumes a standardized
	 * ordering that predicates come into, which in the grand scheme of things might not be what we want to have happen.
	 */
	var testAreRulesEqual = function(){
		test.start("RuleLibrary", "testAreRulesEqual");

		var condPred1 = {};
		condPred1.category = "relationship";
		condPred1.type = "friends";
		condPred1.first = "x";
		condPred1.second = "y";
		condPred1.value = true;

		var condPred2 = {};
		condPred2.category = "trait";
		condPred2.type = "brainy";
		condPred2.first = "x";
		condPred2.value = true;

		var condPred3 = {};
		condPred3.category = "network";
		condPred3.type = "affinity";
		condPred3.first = "x";
		condPred3.second = "y";
		condPred3.operator = ">";
		condPred3.value = 50;

		var condPred4 = {};
		condPred4.category = "network";
		condPred4.type = "trust";
		condPred4.first = "x";
		condPred4.second = "y";
		condPred4.operator = "<";
		condPred4.value = 50;

		var condPred5 = {};
		condPred5.category = "status";
		condPred5.type = "sad";
		condPred5.first = "x";
		condPred5.value = true;

		var effectPred1 = {};
		effectPred1.category = "network";
		effectPred1.type = "affinity";
		effectPred1.first = "x";
		effectPred1.second = "y";
		effectPred1.operator = "+";
		effectPred1.value = 20;

		var effectPred2 = {};
		effectPred2.category = "network";
		effectPred2.type = "trust";
		effectPred2.first  = "x";
		effectPred2.second = "y";
		effectPred2.operator = "+";
		effectPred2.value = 20;

		var effectPred3 = {};
		effectPred3.category = "status";
		effectPred3.type = "sad";
		effectPred3.first  = "x";
		effectPred3.value = true;

		//now let's stuff these guys into conditions and rules!
		var conditions1 = [];
		conditions1.push(util.clone(condPred1));
		conditions1.push(util.clone(condPred2));
		var effects1 = [];
		effects1.push(util.clone(effectPred1));

		//Don't think we need to register these things for these unit tests.

		var rule1 = {};
		rule1.conditions = util.clone(conditions1);
		rule1.effects = util.clone(effects1);

		var rule2 = {};
		rule2 = util.clone(rule1); // for first test, let's make them SUPER equal to each other!

		//TEST 1 -- if rule1 and rule2 are equal, then the function should return true.
		var result = ruleLibrary.areRulesEqual(rule1, rule2);
		test.assert(result, true, "rule1 and rule2 are apparantly not equal, even though rule2 is a direct clone of rule1");
		result = ruleLibrary.areRulesEqual(rule2, rule1); // ordering shouldn't matter
		test.assert(result, true, "rule1 and rule2 are apparantly not equal, even though rule2 is a direct clone of rule1. (Ordering swapped).");


		//TEST 2 -- if rule1 and rule2 have a different number of conditions, then the function should return false
		delete rule2.conditions[0]; // remove one of the conditions to make them different
		result = ruleLibrary.areRulesEqual(rule1, rule2);
		test.assert(result, false, "rule1 and rule2 are apparantly equal, even though rule2 has 1 fewer conditions than rule1");
		result = ruleLibrary.areRulesEqual(rule2, rule1);
		test.assert(result, false, "rule1 and rule2 are apparantly equal, even though rule2 has 1 fewer conditions than rule1 (order sawpped)");

		//TEST 3 -- if rule1 and rule2 have a different number of effects, then the function should return false
		rule2 = util.clone(rule1); // start them off being equal to each other
		rule2.effects.push(effectPred2); // adding an extra effect to rule2.
		result = ruleLibrary.areRulesEqual(rule1, rule2);
		test.assert(result, false, "rule1 and rule2 are apparantly equal, even though rule2 has 1 additional effect than rule1");
		result = ruleLibrary.areRulesEqual(rule2, rule1);
		test.assert(result, false, "rule1 and rule2 are apparantly equal, even though rule2 has 1 additional effect than rule1 (order swapped)");

		//TEST 4 -- rule1 and rule2 have same number of condition predicates, but the contents of the predicates differ.
		var baseRule1 = util.clone(rule1);
		rule2 = util.clone(rule1);
		rule1.conditions.push(condPred3);
		rule2.conditions.push(condPred4);
		result = ruleLibrary.areRulesEqual(rule1, rule2);
		test.assert(result, false, "rule1 and rule2 are apparantly equal. They both have the same number of conditions, but the content of the predicates should have been different");
		result = ruleLibrary.areRulesEqual(rule2, rule1);
		test.assert(result, false, "rule1 and rule2 are apparantly equal. They both have the same number of conditions, but the content of the predicates should have been different (order swapped)");

		//TEST 4.5 -- In Test 4, the content of the predicates differed but had same amount of attributes. What if number of attributes differed?
		rule1 = util.clone(baseRule1); // getting back to basics
		rule2 = util.clone(rule1); // make them equal
		rule1.conditions.push(condPred3); // adding a network predicate with 6 fields (first, second, category, type, value, operator)
		rule2.conditions.push(condPred5); //adding a status predicate with 4 fields (category, type, first, value)
		result = ruleLibrary.areRulesEqual(rule1, rule2);
		test.assert(result, false, "rule1 and rule2 are apparantly equal. Have same number of conditions, but the number of properties in one of them differs.");
		result = ruleLibrary.areRulesEqual(rule2, rule1);
		test.assert(result, false, "rule1 and rule2 are apparantly equal. Have same number of conditions, but the number of properties in one of them differs. (order swapped)");

		//TEST 5 -- rule1 and rule2 have same number of effect predicates, but the contents of the predicates differ.
		rule1 = util.clone(baseRule1);
		rule1.effects[0];
		rule2 = util.clone(rule1); // start them off equal to each other.
		delete rule2.effects[0];
		rule2.effects.push(effectPred2);

		//By this point, rule1 and rule2 both have a network predicate, but the 'type' field is different (one is affinity, one is trust)
		result = ruleLibrary.areRulesEqual(rule1, rule2);
		test.assert(result, false, "rule1 and rule2 are apparantly equal. Have same number of effects, which also have same number of properties, but content of properties should be different");
		result = ruleLibrary.areRulesEqual(rule2, rule1);
		test.assert(result, false, "rule1 and rule2 are apparantly equal. Have same number of effects, which also have same number of properties, but content of properties should be different (order swapped)");

		//TEST 5.5 -- let's make rule1 and rule2 have same number of effect predicates, but number of attributes differ.
		rule1 = util.clone(baseRule1);
		rule2 = util.clone(rule1);
		rule1.effects.push(effectPred2);
		rule2.effects.push(effectPred3);
		result = ruleLibrary.areRulesEqual(rule1, rule2); // rule 1 has an extra network pred with 6 attributes, rule 2 has an extra status pred with 4 attributes
		test.assert(result, false, "rule1 and rule2 are apparantly equal. Have same number of effects, but each of them should have different amount of attributes");
		result = ruleLibrary.areRulesEqual(rule2, rule1);
		test.assert(result, false, "rule1 and rule2 are apparantly equal. Have same number of effects, but each of them should have different amount of attributes (order swapped)");

		//TEST 6 -- weird tests where conditions/effects are undefined.
		rule1 = util.clone(baseRule1);
		rule2 = util.clone(rule1);
		delete rule1.conditions;
		result = ruleLibrary.areRulesEqual(rule1, rule2);
		test.assert(result, false, "rule1 and rule2 are apparantly equal, even though rule1 has no conditions");
		result = ruleLibrary.areRulesEqual(rule2, rule1);
		test.assert(result, false, "rule1 and rule2 are apparantly equal, even though rule1 has no conditions (order swapped)");

		//TEST 6.1 -- same as 6, but with effects.
		rule1 = util.clone(baseRule1);
		rule2 = util.clone(rule1);
		delete rule1.effects;
		result = ruleLibrary.areRulesEqual(rule1, rule2);
		test.assert(result, false, "rule1 and rule2 are apparantly equal, even though rule1 has no effects");
		result = ruleLibrary.areRulesEqual(rule2, rule1);
		test.assert(result, false, "rule1 and rule2 are apparantly equal, even though rule1 has no effects (order swapped)");

		//TEST 6.2 -- what if one of them has neither effects nor conditions (weird rule!)?
		rule1 = util.clone(baseRule1);
		rule2 = util.clone(rule1);
		delete rule1.conditions;
		delete rule1.effects;
		result = ruleLibrary.areRulesEqual(rule1, rule2);
		test.assert(result, false, "rule1 and rule2 are apparantly equal, even though rule 1 has no effects nor conditions");
		result = ruleLibrary.areRulesEqual(rule2, rule1);
		test.assert(result, false, "rule1 and rule2 are apparantly equal, even though rule 1 has no effects nor conditions (order swapped)");

		//TEST 6.3 --what if both of them have no conditions?
		rule1 = util.clone(baseRule1);
		rule2 = util.clone(rule1);
		delete rule1.conditions;
		delete rule2.conditions;
		result = ruleLibrary.areRulesEqual(rule1, rule2); // both of these 'rules' just have the same effect, so yes, should be equal
		test.assert(result, true, "rule1 and rule2 are apparantly not equal. Neither of them have conditions, but both have same effect. Should have been equal");
		result = ruleLibrary.areRulesEqual(rule2, rule1); // both of these 'rules' just have the same effect, so yes, should be equal
		test.assert(result, true, "rule1 and rule2 are apparantly not equal. Neither of them have conditions, but both have same effect. Should have been equal (order swapped)");

		//TEST 6.4 -- the same as 6.3, but with no effects instead of conditions.
		rule1 = util.clone(baseRule1);
		rule2 = util.clone(rule1);
		delete rule1.effects;
		delete rule2.effects;
		result = ruleLibrary.areRulesEqual(rule1, rule2); // both of these rules have the same condition, but no effect, so yes, should be equal
		test.assert(result, true, "rule1 and rule2 are apparantly not equal, enither of them have effects, but both have same conditions. Should have been equal");
		result = ruleLibrary.areRulesEqual(rule2, rule1); // both of these rules have the same condition, but no effect, so yes, should be equal
		test.assert(result, true, "rule1 and rule2 are apparantly not equal, enither of them have effects, but both have same conditions. Should have been equal (order swapped)");

		//TEST 6.5 -- what if neither of these rules have neither condtions nor effects. likely to never happen, but, uh, you know, whatever!
		rule1 = util.clone(baseRule1);
		rule2 = util.clone(rule1);
		delete rule1.conditions;
		delete rule1.effects;
		delete rule2.conditions;
		delete rule2.effects;
		result = ruleLibrary.areRulesEqual(rule1, rule2); // neither of these rules have anything. should be equal.
		test.assert(result, true, "rule1 and rule2 are apparantly not equal, even though both of them have no condtions and no effects");
		result = ruleLibrary.areRulesEqual(rule2, rule1); // neither of these rules have anything. should be equal.
		test.assert(result, true, "rule1 and rule2 are apparantly not equal, even though both of them have no condtions and no effects (order swapped)");


		test.finish();
	};

	/**
	 * @method testIsRuleAlreadyInRuleSet
	 * @memberof RuleLibrary
	 *
	 * @description A unit test to verify that the function "isRuleAlreadyInRuleSet(key, rule)" is behaving appropriately.
	 */

	var testIsRuleAlreadyInRuleSet = function(){
		test.start("RuleLibrary", "isRuleAlreadyInRuleSet");

		ruleLibrary.clearRuleLibrary(); // start off with a clean slate.

		var condPred1 = {};
		condPred1.category = "trait";
		condPred1.type = "brainy";
		condPred1.first = "x";
		condPred1.value = true;

		var effectPred1 = {};
		effectPred1.category = "relationship";
		effectPred1.type = "friends";
		effectPred1.first = "x";
		effectPred1.second = "y";
		effectPred1.value = true;

		var conditions1 = [];
		conditions1.push(util.clone(condPred1));
		var effects1 = [];
		effects1.push(util.clone(effectPred1));
		var rule1 = {};
		rule1.conditions = util.clone(conditions1);
		rule1.effects = util.clone(effects1);

		var ruleSet = [];
		ruleSet.push(util.clone(rule1));

		var condPred2 = util.clone(condPred1);
		condPred2.value = false; // make it a little different
		var effectPred2 = util.clone(effectPred1);
		effectPred2.value = false; //make it a little different.
		var conditions2 = [];
		conditions2.push(condPred2);
		var effects2 = [];
		effects2.push(effectPred2);

		var rule2 = {};
		rule2.conditions = util.clone(conditions2);
		rule2.effects = util.clone(effects2);


		//TEST 1 -- if the ruleSet is empty, the rule Should NOT be in the rule set already!
		var result = ruleLibrary.isRuleAlreadyInRuleSet("triggerRules", rule1);
		test.assert(result, false, "apparanlty rule1 was already in the rule set, even though the rule set should be empty");

		//TEST 2 -- If the ruleSet goes from empty to having something in it, then we check to see if our rule is already in
		//it, then the rule SHOULD be in the rule set already.
		ruleLibrary.addRuleSet("triggerRules", ruleSet);
		result = ruleLibrary.isRuleAlreadyInRuleSet("triggerRules", rule1);
		test.assert(result, true, "apparantly rule1 was NOT already in the rule set, even though it should have been");

		//TEST 3 -- Looking for a rule that exists in a DIFFERENT rule set, but not this one, should return false
		result = ruleLibrary.isRuleAlreadyInRuleSet("volitionRules", rule1);
		test.assert(result, false, "rule1 is in triggerRules but not volitionRules. Should not have found anything in voliitonRules but apparantly it did");

		//TEST 4 -- Looking at just a 'different rule' that isn't in a (non-empty) rule set should return false.
		result = ruleLibrary.isRuleAlreadyInRuleSet("triggerRules", rule2);
		test.assert(result, false, "rule2 is apparantly in triggerRules, even though it shouldn't be");

		ruleLibrary.addRuleSet("triggerRules", ruleSet);


		//test.assert(true, false, 'test');

		test.finish();
		ruleLibrary.clearRuleLibrary(); // clean up after ourselves.
	};

	/**
	 * Unit test for the various properties of the testRunRules function. Returns a string which will ultimately be
	 * appended to tests.html -- to see the results of these tests, simply load tests.html into a browser.
	 * var runRules = function (ruleSet, cast, onMatchFunction) {
	 *
	 * @return returnString a string containing html detailing how many of the unit tests inside of this function passed and failed
	 */
	var testRunRules = function(){

		test.start("RuleLibrary", "testRunRules");

		test.finish();

		/*
		var result = "Passed";
		var numTests = 0;
		var numPassed = numTests;

		var spanClass = "test" + result;
		var returnString = "<span class=" + spanClass + ">testRunRules -- " + numPassed + "/" + numTests + " tests passed </span>";
		return returnString;
		*/
	};

	/**
	 * Unit test for the various properties of the testRuleToEnglish function. Returns a string which will ultimately be
	 * appended to tests.html -- to see the results of these tests, simply load tests.html into a browser.
	 * var ruleToEnglish = function(rule){
	 *
	 * @return returnString a string containing html detailing how many of the unit tests inside of this function passed and failed
	 */
	var testRuleToEnglish = function(){
		//first, let's make a simple rule!'
		//This would be an example TRIGGER rule
		//(if the elements of the conditions hold, then we make the effect true)
		var triggerConditionOne = {}; //X and Y must be friends
		triggerConditionOne.category = "relationship";
		triggerConditionOne.type = "friends";
		triggerConditionOne.first = "x";
		triggerConditionOne.second = "y";
		triggerConditionOne.value = true;
		triggerConditionOne.defaultValue = false;
		triggerConditionOne.isBoolean = true;
		triggerConditionOne.directionType = "reciprocal";
		socialRecord.registerDirection(triggerConditionOne);
		socialRecord.registerIsBoolean(triggerConditionOne);
		socialRecord.registerDefault(triggerConditionOne);

		var triggerConditionTwo = {}; //X and Z must not be friends
		triggerConditionTwo.category = "relationship";
		triggerConditionTwo.type = "friends";
		triggerConditionTwo.first = "x";
		triggerConditionTwo.second = "z";
		triggerConditionTwo.value = false;

		var triggerEffectOne = {};
		triggerEffectOne.category = "relationship";
		triggerEffectOne.type = "involved with";
		triggerEffectOne.first = "x";
		triggerEffectOne.second = "y";
		triggerEffectOne.intentType = true;

		var triggerConditions = [];
		triggerConditions.push(triggerConditionOne);
		triggerConditions.push(triggerConditionTwo);
		var triggerEffects = [];
		triggerEffects.push(triggerEffectOne);
		var triggerRule = {};
		triggerRule.conditions = triggerConditions;
		triggerRule.effects = triggerEffects;

		test.start("RuleLibrary", "testRuleToEnglish");
		var stringOfPred = ruleLibrary.ruleToEnglish(triggerRule);
		//TEST 1 -- Trigger Rule test
		//test.assert(stringOfPred, "If the following are true: x is friends with y, and x is not enemies with z, " +
		//"then the following takes place: x is going to start being involved with y",
		//	"Trigger Rule to English failed");

		//TEST 2 -- Volition Rule test
		var volitionEffectOne = util.clone(triggerEffectOne);
		volitionEffectOne.weight = 15;
		var volitionRule = {};
		var volitionConditionOne ={};
		volitionConditionOne.category = "network";
		volitionConditionOne.type = "affinity";
		volitionConditionOne.first = "x";
		volitionConditionOne.second = "y";
		volitionConditionOne.isBoolean = false;
		volitionConditionOne.defaultValue = 50;
		volitionConditionOne.directionType = "directed";
		socialRecord.registerDirection(volitionConditionOne);
		socialRecord.registerIsBoolean(volitionConditionOne);
		socialRecord.registerDefault(volitionConditionOne);


		var volitionConditions = util.clone(triggerConditions);
		var volitionEffects = [];
		volitionEffects.push(volitionEffectOne);
		volitionRule.conditions = volitionConditions;
		volitionRule.effects = volitionEffects;
		stringOfPred = ruleLibrary.ruleToEnglish(volitionRule);
		//console.log(ruleLibrary.ruleToEnglish(volitionRule));


		//Ok, great! we've got our rule! Now let's just run it through our function that we worked so hard on!
		//console.log(ruleToEnglish(triggerRule));


		test.finish();
	};

	/**
	 * Unit test for the various properties of the doBinding function. Returns a string which will ultimately be
	 * appended to tests.html -- to see the results of these tests, simply load tests.html into a browser.
	 * var doBinding = function (characters, predicates) {
	 *
	 * @return returnString a string containing html detailing how many of the unit tests inside of this function passed and failed
	 */
	var testDoBinding = function(){
		//doBinding needs two things -- a dictionary of characters and an array of predicates.
		//The predicates will have variables in their 'first' and 'second' slots (e.g. x, y, z)
		//The characters will be a dictionary keyed on certain variables (e.g. characters[x] === "doc")
		ensemble.loadBaseBlueprints(testSocial);
		var characters = {};
		characters["x"] = "doc";
		characters["y"] = "vanessa";
		characters["z"] = "reggie";

		// x and y are friends
		var predicateOne = validate.triggerEffect({
			"category": "relationship",
			"type": "friends",
			"first": "x",
			"second": "y",
			"value": true
		}, "testDoBinding setting predicateOne");

		//x and z are friends
		var predicateTwo = validate.triggerEffect({
			"category": "relationship",
			"type": "friends",
			"first": "x",
			"second": "z",
			"value": true
		}, "testDoBinding setting predicateTwo");

		//x has the trait hardy
		var predicateThree = validate.triggerEffect({
			"category": "trait",
			"type": "lucky",
			"first": "x",
			"value": true
		}, "testDoBinding setting predicateThree");

		var predicates = [];
		predicates.push(predicateOne);
		predicates.push(predicateTwo);
		predicates.push(predicateThree);

		var filledPredicates = ruleLibrary.doBinding(characters, predicates);

		test.start("RuleLibrary", "testDoBinding");

		//TEST 1 -- length of filled predicates should be same length as number of predicates passed in
		test.assert(filledPredicates.length, predicates.length, "the filled predicates length is not equal to the original predicate array length");

		//TEST 2 -- The values that the first predicate gets filled in with should be correct!
		test.assert(filledPredicates[0].first, "doc", "Filled Predicates[0].first was incorrect.");
		test.assert(filledPredicates[0].second, "vanessa", "Filled Predicates[0].second was incorrect");

		//TEST 2.5 -- The values that the second predicate fets filled in with should be correct!
		test.assert(filledPredicates[1].first, "doc", "filledPredicates[1].first was incorrect");
		test.assert(filledPredicates[1].second, "reggie", "filledPredicates[2].second was incorrect");

		//TEST 3 -- a predicate that doesn't have a 'second' defined should STILL not have a second defined after going through this function'
		test.assert(filledPredicates[2].second, undefined, "filledPredicates[2] should be undefined, but somehow it got filled in when it shouldn't have ");

		test.finish();
	};

	/**
	 * Unit test for the various properties of the getUniqueBindings function. Returns a string which will ultimately be
	 * appended to tests.html -- to see the results of these tests, simply load tests.html into a browser.
	 * var getUniqueBindings = function (ruleConditions) {
	 *
	 * @return returnString a string containing html detailing how many of the unit tests inside of this function passed and failed
	 */
	var testGetUniqueBindings = function(){
		test.start("RuleLibrary", "testGetUniqueBindings");
		ensemble.loadBaseBlueprints(testSocial);
		//It takes as input an array of 'rule conditions', so lets give it just that!

		//X and Y must be friends
		var conditionOne = validate.triggerEffect({
			"category": "relationship",
			"type": "friends",
			"first": "x",
			"second": "y",
			"value": true
		}, "testGetUniqueBindings setting conditionOne");

		//X and Y must not be friends
		var conditionTwo = validate.triggerEffect({
			"category": "relationship",
			"type": "friends",
			"first": "x",
			"second": "y",
			"value": false
		}, "testGetUniqueBindings setting conditionTwo");

		//X and Z must be friends
		var conditionThree = validate.triggerEffect({
			"category": "relationship",
			"type": "friends",
			"first": "x",
			"second": "z",
			"value": true
		}, "testGetUniqueBindings setting conditionThree");

		// Y and Z must not be friends
		var conditionFour = validate.triggerEffect({
			"category": "relationship",
			"type": "friends",
			"first": "y",
			"second": "z",
			"value": false
		}, "testGetUniqueBindings setting conditionFour");


		//Ok, now we've got all these lovely conditions. Let's stick them in an array!
		var conditions = [];
		conditions.push(conditionOne);
		conditions.push(conditionTwo);
		conditions.push(conditionThree);
		conditions.push(conditionFour);

		//And now lets get our unique bindings!
		var uniqueBindings = ruleLibrary.getUniqueBindings(conditions);

		//And now we should be able to do all of our tests!

		//TEST ONE -- the length of the uniqueBindings should be equal to the number of roles that we have (3 here)
		test.assert(_.size(uniqueBindings), 3, "length of uniqueBindings was not euql to the number of roles that we have");

		//TEST TWO -- the specific keys in the uniqueBindings should be equal to what is specified above
		//-->Specifically, x, y, and z in this case
		test.assertNEQ(uniqueBindings["x"], undefined, "uniqueBindings of x should have been inserted into the dictionary but it wasn't");
		test.assertNEQ(uniqueBindings["y"], undefined, "uniqueBindings of y should have been inserted into the dictionary but it wasn't");
		test.assertNEQ(uniqueBindings["z"], undefined, "uniqueBindings of z should have been inserted into the dictionary but it wasn't");


		test.finish();
	};

	/**
	 * Unit test for the various properties of the matchUniqueBindings function. Returns a string which will ultimately be
	 * appended to tests.html -- to see the results of these tests, simply load tests.html into a browser.
	 * var matchUniqueBindings = function (uniqueBindings, availableCastMembers, processResult, rule) {
	 *
	 * @return returnString a string containing html detailing how many of the unit tests inside of this function passed and failed
	 */
	var testMatchUniqueBindings = function(){
		ensemble.loadBaseBlueprints(testSocial);
		//Ok, first it needs a unique bindings thing, which comes from rule conditions.
		//X and Y must be friends
		var conditionOne = validate.triggerCondition({
			"category": "directedStatus",
			"type": "attracted to",
			"first": "x",
			"second": "y",
			"value": true
		}, "testMatchUniqueBindings setting conditionOne");

		//X and Z must not be friends. If X is NOT friends with multiple people, it will make
		//the rule fire multiple times.
		var conditionTwo = validate.triggerCondition({
			"category": "relationship",
			"type": "friends",
			"first": "x",
			"second": "z",
			"value": true
		}, "testMatchUniqueBindings setting conditionTwo");


		var effectOne = validate.triggerEffect({
			"category": "relationship",
			"type": "involved with",
			"first": "x",
			"second": "y",
			"value": true
		}, "testMatchUniqueBindings setting effectOne");

		var conditions = [];
		conditions.push(conditionOne);
		conditions.push(conditionTwo);
		var effects = [];
		effects.push(effectOne);
		var rule = {};
		rule.conditions = conditions;
		rule.effects = effects;

		//and because we've tested this already, we're pretty sure it works!
		var uniqueBindings = ruleLibrary.getUniqueBindings(conditions);

		//We also need the 'available cast members' This I believe is as simple as an array of strings
		var cast = ["doc", "reggie", "vanessa", "clara"];
		var numTimesProcessed = 0;

		//Ah, and because we want this to be true, let's conveniently add some things to the socialRecord
		var socialRecordEntryOne = util.clone(conditionOne);
		socialRecordEntryOne.first = "doc";
		socialRecordEntryOne.second = "reggie";
		var socialRecordEntryTwo = util.clone(conditionTwo);
		socialRecordEntryTwo.first = "doc";
		socialRecordEntryTwo.second = "vanessa";
		socialRecord.set(socialRecordEntryOne);
		socialRecord.set(socialRecordEntryTwo);

		//useful variables that get updated when we go inside of processResult
		var result;
		var boundEffect;

		//a simple 'process' function that gets called if a match over the bound characters is found
		//i.e. if the condition evaluates to true.
		var processResult = function(effect){
			result = true;
			boundEffect = effect;
			numTimesProcessed += 1;
		};

		//This function doesn't return anything...
		//the work gets done in the 'fake' function I passed in. Well, whatever for now.

		test.start("RuleLibrary", "testMatchUniqueBindings");

		//TEST 1 -- Does match unique bindings successfully get into 'processResult' if the stuff does
		//in fact exist in the socialRecord.
		var unaffectedCharacters = []; //used for ignoring offstage/eliminated characters.
		var params = {}; //TODO: phase out.
		ruleLibrary.matchUniqueBindings(uniqueBindings, cast, processResult, rule, params, unaffectedCharacters);
		test.assert(result, true, "In match unique bindings, even though it was true in the socialRecord, we failed to match the unique bindings in the test.");

		//TEST 1.5 -- is the returned effect full of the stuff that we dreamed it would be?
		test.assert(boundEffect.category, "relationship", "The category of the effect somehow got altered through matchUniqueBindings");
		test.assert(boundEffect.type, "involved with", "The type of the effect somehow got altered through matchUniqueBindings");
		test.assert(boundEffect.first, "doc", "The wrong person got matched to the 'first' binding");
		test.assert(boundEffect.second, "reggie", "The wrong person got matched to the 'second' binding");

		//TEST 2 -- what happens when the stuff does NOT exist in the socialRecord?
		socialRecord.clearEverything();
		socialRecord.set(socialRecordEntryOne); // here we are only setting one of our two things!
		ruleLibrary.matchUniqueBindings(uniqueBindings, cast, processResult, rule, params, unaffectedCharacters);
		test.assert(numTimesProcessed, 1, "Hm, we apparantly processed the wrong amount; supposed to have only done it once.");

		//TEST 3 -- There had been an issue when people defined LATER in the cast needed to do things with people
		//defined EARLIER in the cast. Let's deal with that.
		socialRecord.clearEverything();
		numTimesProcessed = 0; //reset this as well for our new test.
		var claraOne = {};
		claraOne.category = "directedStatus";
		claraOne.type = "attracted to";
		claraOne.first = "clara";
		claraOne.second = "doc";
		claraOne.value = true;

		var claraTwo = {};
		claraTwo.category = "relationship";
		claraTwo.type = "friends";
		claraTwo.first = "clara";
		claraTwo.second = "reggie";
		claraTwo.value = true;

		socialRecord.set(claraOne);
		socialRecord.set(claraTwo);

		ruleLibrary.matchUniqueBindings(uniqueBindings, cast, processResult, rule, params, unaffectedCharacters);
		test.assert(numTimesProcessed, 1, "Test 3 -- numTimesProcessed doesn't check out");
		test.assert(boundEffect.category, "relationship", "test 3 category is incorrect");
		test.assert(boundEffect.type, "involved with", "test 3 type is incorrect");
		test.assert(boundEffect.first, "clara", "test 3 first is incorrect");
		test.assert(boundEffect.second, "doc", "test 3 second is incorrect");
		test.assert(boundEffect.value, true, "test 3 value is incorrect");

		//TEST 4 -- What happens when we want to find MULTIPLE matches (i.e. we want to call process result multiple times?)
		var claraThree = {};
		numTimesProcessed = 0;
		claraThree.category = "relationship";
		claraThree.type = "friends";
		claraThree.first = "clara";
		claraThree.second = "vanessa";
		claraThree.value = true;

		socialRecord.set(claraThree);
		ruleLibrary.matchUniqueBindings(uniqueBindings, cast, processResult, rule, params, unaffectedCharacters);
		test.assert(numTimesProcessed, 2, "Test 4 -- numTimesProcessed didn't check out when should have been run multiple times");

		test.finish();
	};



	/**
	 * Unit test for the various properties of the runTriggerRules function. Returns a string which will ultimately be
	 * appended to tests.html -- to see the results of these tests, simply load tests.html into a browser.
	 * var runTriggerRules = function (cast, currentTimeStep) {
	 *
	 * @return returnString a string containing html detailing how many of the unit tests inside of this function passed and failed
	 */
	var testRunTriggerRules = function(){

		test.start("RuleLibrary", "testRunTriggerRules");

		//first, let's add the trigger rules
		//we'll use the ones living in testTriggerRules.json for now
		//ensemble.addRules(JSON.parse(testTriggerRules));
		var triggerRuleData = JSON.parse(testTriggerRules);
		ruleLibrary.addRuleSet("triggerRules", triggerRuleData.rules);


		//Let's define the cast...
		var cast = ["doc", "reggie", "vanessa", "clara"];

		//Ok, theoretically I now have all of the trigger rules built in!
		//great! Now I guess there is nothing left to do but... run them?
		//sure! But first, let's put some things in the socialRecord to make some of them true, you know?
		//How about the 'if your sweetie is injured you worry about them' trigger rule? That seems like a nice one...
		var socialRecordEntryOne = {};
		socialRecordEntryOne.category = "status";
		socialRecordEntryOne.type = "injured";
		socialRecordEntryOne.first = "doc";
		socialRecordEntryOne.value = true;
		socialRecordEntryOne.defaultValue = false;
		socialRecordEntryOne.isBoolean = true;
		socialRecordEntryOne.directionType = "undirected";
		socialRecord.registerDirection(socialRecordEntryOne);
		socialRecord.registerIsBoolean(socialRecordEntryOne);
		socialRecord.registerDefault(socialRecordEntryOne);
		delete socialRecordEntryOne.isBoolean;
		delete socialRecordEntryOne.defaultValue;
		delete socialRecordEntryOne.directionType;

		var socialRecordEntryTwo = {};
		socialRecordEntryTwo.category = "relationship";
		socialRecordEntryTwo.type = "involved with";
		socialRecordEntryTwo.second = "doc";
		socialRecordEntryTwo.first = "reggie";
		socialRecordEntryTwo.value = true;
		socialRecordEntryTwo.defaultValue = false;
		socialRecordEntryTwo.isBoolean = true;
		socialRecordEntryTwo.directionType = "reciprocal";
		socialRecord.registerDirection(socialRecordEntryTwo);
		socialRecord.registerIsBoolean(socialRecordEntryTwo);
		socialRecord.registerDefault(socialRecordEntryTwo);
		delete socialRecordEntryTwo.isBoolean;
		delete socialRecordEntryTwo.defaultValue;
		delete socialRecordEntryTwo.directionType;

		//Let's also make Clara lonely
		var socialRecordEntryThree = {};
		socialRecordEntryThree.category = "status";
		socialRecordEntryThree.type = "lonely";
		socialRecordEntryThree.first = "clara";
		socialRecordEntryThree.value = true;

		socialRecord.set(socialRecordEntryOne);
		socialRecord.set(socialRecordEntryTwo);
		socialRecord.set(socialRecordEntryThree);

		//Ok, so doc is injured, and doc and reggie are in a relationship
		//Sounds to me like reggie should TOTALLY BE CONCERNED!
		ruleLibrary.runTriggerRules(cast);

		//TEST 0 (sanity check)
		// ----> Check to see that the things that we directly added are in fact being added
		var getResults = socialRecord.get(socialRecordEntryOne, 0, 0);
		test.assert(getResults.length, 1, "oh oh. the first predicate that we pushed on there doesn't seem to be there");

		//TEST 0.5
		getResults = socialRecord.get(socialRecordEntryTwo, 0, 0);
		test.assert(getResults.length, 1, "Oh oh, the second predicate that we pushed on there doesn't seem to be there");

		//TEST 0.75
		var tempSearchPred = util.clone(socialRecordEntryTwo);
		tempSearchPred.first = "doc";
		tempSearchPred.second = "reggie";
		getResults = socialRecord.get(tempSearchPred, 0, 0);
		test.assert(getResults.length, 1, "Oh oh, the recipricol predicate that we would hope would be there doesn't seem to be there");

		//TEST 1 (Actual trigger rule test)
		//-->Does Reggie have the status worried because his sweetie is injured?
		var concernedPred = {};
		concernedPred.category = "directedStatus";
		concernedPred.type = "worried about";
		concernedPred.first = "reggie";
		concernedPred.second = "doc";
		concernedPred.value = true;
		concernedPred.defaultValue = false;
		concernedPred.isBoolean = true;
		concernedPred.directionType = "directed";
		socialRecord.registerDirection(concernedPred);
		socialRecord.registerIsBoolean(concernedPred);
		socialRecord.registerDefault(concernedPred);
		delete concernedPred.isBoolean;
		delete concernedPred.defaultValue;
		delete concernedPred.directionType;

		getResults = socialRecord.get(concernedPred, 0, 0);

		test.assert(getResults.length, 1, "Bummer. Reggie doesn't seem to be concerned about doc, even though the trigger rule should have fired");

		//TEST 2 (Verify that a trigger which DOESN'T have its conditions true get 'called' and inserted into the socialRecord anyway )
		//-->So, Clara should still be lonely!
		getResults = socialRecord.get(socialRecordEntryThree, 0, 0);
		test.assert(getResults.length, 1, "Hmm, Clara appears to no longer be lonely, even though she sitll has no friends");

		//TEST 3
		//-->And just for fun, now lets give Clara ONE friend at the next time step, and see what happens.
		//-->HINT -- she should still be lonely!
		var friendPredicateOne = {};
		friendPredicateOne.category = "relationship";
		friendPredicateOne.type = "friends";
		friendPredicateOne.first = "clara";
		friendPredicateOne.second = "vanessa";
		friendPredicateOne.value = true;
		socialRecord.set(friendPredicateOne);
		ruleLibrary.runTriggerRules(cast);
		getResults = socialRecord.get(socialRecordEntryThree, 0, 0);
		test.assert(getResults.length, 1, "Hmm, Clara appears to no longer be lonely, but she only has ONE friend. You are supposed to be lonely unless you have 2.");

		//TEST 4
		//OK, and NOW let's give Clara on additional friend, which should make the trigger rule start to fire
		//Which, consequently, should make Clara no longer lonely!
		var friendPredicateTwo = {};
		friendPredicateTwo.category = "relationship";
		friendPredicateTwo.type = "friends";
		friendPredicateTwo.first = "clara";
		friendPredicateTwo.second = "doc";
		friendPredicateTwo.value = true;
		socialRecord.setupNextTimeStep();
		socialRecord.set(friendPredicateTwo);
		var trigResult = ruleLibrary.runTriggerRules(cast);

		var lonelyPredicate = {};
		lonelyPredicate.category = "status";
		lonelyPredicate.type = "lonely";
		lonelyPredicate.first = "clara";
		lonelyPredicate.value = true;

		var notLonelyPredicate = {};
		notLonelyPredicate.category = "status";
		notLonelyPredicate.type = "lonely";
		notLonelyPredicate.first = "clara";
		notLonelyPredicate.value = false;

		getResults = socialRecord.get(lonelyPredicate, 0, 0);
		test.assert(getResults.length, 0, "Hmm, Clara is STILL lonely, even though now she has two friends!");
		getResults = socialRecord.get(notLonelyPredicate, 0, 0);
		test.assert(getResults.length, 1, "Hmm, the predicate 'not lonely' for Clara is apparantly not in the socialRecord");

		//TEST 5
		//Testing the 'socialRecord' trigger rule as it currently exists in the testTriggerRules.json file.
		socialRecord.clearHistory();
		var involvedWithPred = {};
		involvedWithPred.category = "relationship";
		involvedWithPred.type = "involved with";
		involvedWithPred.first = "doc";
		involvedWithPred.second = "reggie";
		involvedWithPred.value = true;

		var traitPred = {};
		traitPred.category = "trait";
		traitPred.type = "jealous";
		traitPred.first = "doc";
		traitPred.value = true;

		var socialRecordLabelPred = validate.triggerCondition({
			"category": "socialRecordLabel",
			"type": "romantic advance",
			"first": "clara",
			"second": "reggie"
		});

		var hatePredicate = {};
		hatePredicate.category = "directedStatus";
		hatePredicate.type = "hates";
		hatePredicate.first = "doc";
		hatePredicate.second = "clara";
		hatePredicate.value = true;

		//Starting state: Reggie and Doc are dating, Doc is jealous
		//Turn one: Clara does a romAdvance towards Reggie.

		socialRecord.set(involvedWithPred);
		socialRecord.set(traitPred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(socialRecordLabelPred);

		getResults = socialRecord.get(hatePredicate);
		test.assert(getResults.length, 0, "Doc hates Clara; this is weird, because the conditions for his hate are met, but the trigger rules haven't been run yet'");

		ruleLibrary.runTriggerRules(cast);

		getResults = socialRecord.get(hatePredicate, 0, 0);
		test.assert(getResults.length, 1, "Doc doesn't hate clara, even though she made a romantic advance on his sweetie and he is jealous");


		//Another test, here we have some time pass after the socialRecord window passes, and so we
		//don't want the thing to fire in this instance!

		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.set(socialRecordLabelPred);
		socialRecord.set(traitPred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(involvedWithPred);
		ruleLibrary.runTriggerRules(cast);
		getResults = socialRecord.get(hatePredicate, 0, 0);
		test.assert(getResults.length, 0, "Doc hates clara. This seems to be a little surprising, however, because the socialRecordLabel in the socialRecord should be outside of the window specified in the trigger rule's condition");

		//console.log(socialRecord.socialRecordHistoryToString(1));

		// Should work even if value has to rely on default.
		socialRecord.clearHistory();
		delete socialRecordEntryOne.value;
		socialRecord.set(socialRecordEntryOne);
		//console.log(socialRecord.socialRecordHistoryToString());
		socialRecordEntryOne.value = true;
		test.assert(socialRecord.get(socialRecordEntryOne, 0, 0).length, 1, "Setting a predicate should work even if it has to rely on default value.");

		//TEST 6 (Let's say) -- do trigger rules work with characters that are offstage/eliminated as expected.
		//I'm going to make a clean slate of everything past this point, including making my own trigger rules.
		var basicTriggerRule = {
				"name": "Two people who are injured automatically start dating.",
				"conditions": [
					{
						"category": "status",
						"type": "injured",
						"first": "x"
					},
					{
						"category": "status",
						"type": "injured",
						"first": "y"
					},
				],
				"effects": [
					{
						"category": "relationship",
						"type": "involved with",
						"first": "x",
						"second": "y",
						"value": true
					},
				]
			};
		var basicTriggerRules = [];
		basicTriggerRules.push(basicTriggerRule);
		var injuredPred1 = {
			"category": "status",
			"type": "injured",
			"first": "alex"
		};
		var injuredPred2 = {
			"category": "status",
			"type": "injured",
			"first": "brick"
		};
		var newInvolvedWithPred = {
			"category": "relationship",
			"type" : "involved with",
			"first": "alex",
			"second": "brick"
		};
		var newCast = ["alex", "brick", "clyde"];

		//6.0 -- Base Case
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		ruleLibrary.clearRuleLibrary();
		ruleLibrary.addRuleSet("triggerRules", basicTriggerRules);
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(newInvolvedWithPred);
		test.assert(result.length, 1, "Base Case for Test 6 -- do new trigger rules work");

		//6.1 Ok, now let's say that we have a third character that is offstage -- nothing should be affected!
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		socialRecord.putCharacterOffstage("clyde"); // someone totally not involved.
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(newInvolvedWithPred);
		test.assert(result.length, 1, "Putting a character who is not involved should change nothing.");

		//6.2 Alright, now let's say the 'responder' of the trigger rule effect is offstage. shouldn't make a difference!
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		socialRecord.putCharacterOffstage("brick");
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(newInvolvedWithPred);
		test.assert(result.length, 1, "Putting the 'responder' of the trigger effect offstage should change nothing.");

		//6.3 Just the initiator is offstage.
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		socialRecord.putCharacterOffstage("alex");
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(newInvolvedWithPred);
		test.assert(result.length, 1, "Putting the 'initiator' of the trigger effect offstage should change nothing.");

		//6.4 Both the initiator and the responder of the trigger rule are off stage.
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		socialRecord.putCharacterOffstage("alex");
		socialRecord.putCharacterOffstage("brick");
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(newInvolvedWithPred);
		test.assert(result.length, 1, "Putting both the 'initiator and responder' of the trigger effect offstage should change nothing.");

		//7 -- This test is going to be for the case where there is one predicate in the effects that involves an 'offstage person' and another predicate in the effects that doesn't.
		var advancedTriggerRule = {
				"name": "Two people who are injured automatically start dating.",
				"conditions": [
					{
						"category": "status",
						"type": "injured",
						"first": "x"
					},
					{
						"category": "status",
						"type": "injured",
						"first": "y"
					},
					{
						"category": "status",
						"type": "happy",
						"first": "z",
						"turnsAgoBetween": [0, 5]
					},
				],
				"effects": [
					{
						"category": "relationship",
						"type": "involved with",
						"first": "x",
						"second": "y",
						"value": true
					},
					{
						"category": "relationship",
						"type": "involved with",
						"first": "x",
						"second": "z",
						"value": true
					},
				]
			};
		var happyPred = {
			"category": "status",
			"type": "happy",
			"first": "clyde"
		};
		var involvedWithPred1 = {
			"category": "relationship",
			"type": "involved with",
			"first": "alex",
			"second": "brick",
			"value": true
		};
		var involvedWithPred2 = {
			"category": "relationship",
			"type": "involved with",
			"first": "alex",
			"second": "clyde",
			"value": true
		};
		var advancedTriggerRules = [];
		advancedTriggerRules.push(advancedTriggerRule);


		//TEST 7.0 -- base case (does the 'advanced trigger rule' even work.)
		ensemble.loadBaseBlueprints(testSocial);
		ruleLibrary.clearRuleLibrary();
		ruleLibrary.addRuleSet("triggerRules", advancedTriggerRules);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		ensemble.set(happyPred); // the advanced trigger rule should now fire.
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(involvedWithPred1);
		test.assert(result.length, 1, "7.0 Base Case, alex/brick involved with.");
		result = ensemble.get(involvedWithPred2);
		test.assert(result.length, 1, "7.0 Base Case, alex/cylde involved with.");

		//TEST 7.1 -- Clyde will be offstage -- EVERYTHING should still behave exactly as before.
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		ensemble.set(happyPred); // the advanced trigger rule should now fire.
		socialRecord.putCharacterOffstage("clyde");
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(involvedWithPred1);
		test.assert(result.length, 1, "Even with a character offstage, onstage characters should still get new statuses from triggers");
		result = ensemble.get(involvedWithPred2);
		test.assert(result.length, 1, "Even if offstage, a character should still get new statuses from trigger effects.");

		//TEST 8 -- Same as Test 6, but dealing with Eliminating characters instead of putting them offstage.
		//8.0 -- Base Case
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		ruleLibrary.clearRuleLibrary();
		ruleLibrary.addRuleSet("triggerRules", basicTriggerRules);
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(newInvolvedWithPred);
		test.assert(result.length, 1, "Base Case for Test 8 -- do new trigger rules work");

		//8.1 Ok, now let's say that we have a third character that is eliminated -- nothing should be affected!
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		socialRecord.eliminateCharacter("clyde"); // someone totally not involved.
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(newInvolvedWithPred);
		test.assert(result.length, 1, "Eliminating a character who is not involved should change nothing.");

		//8.2 Alright, now let's say the 'responder' of the trigger rule effect is eliminated. RULE SHOULD NOT FIRE
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		socialRecord.eliminateCharacter("brick");
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(newInvolvedWithPred);
		test.assert(result.length, 0, "Eliminating the 'responder' of the trigger effect should make rule not fire.");

		//8.3 Eliminating the initiator
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		socialRecord.eliminateCharacter("alex");
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(newInvolvedWithPred);
		test.assert(result.length, 0, "Eliminating the 'initiator' of the trigger effect offstage should make the rule not fire.");

		//8.4 Both the initiator and the responder of the trigger rule are eliminated.
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		socialRecord.eliminateCharacter("alex");
		socialRecord.eliminateCharacter("brick");
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(newInvolvedWithPred);
		test.assert(result.length, 0, "Eliminating both the 'initiator and responder' of the trigger effect should make the rule not fire.");

		//TEST 9 -- Same as Test 7, but with eliminating a character!
		//base case (does the 'advanced trigger rule' even work.)
		ensemble.loadBaseBlueprints(testSocial);
		ruleLibrary.clearRuleLibrary();
		ruleLibrary.addRuleSet("triggerRules", advancedTriggerRules);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		ensemble.set(happyPred); // the advanced trigger rule should now fire.
		ruleLibrary.runTriggerRules(newCast);
		result = ensemble.get(involvedWithPred1);
		test.assert(result.length, 1, "9.0 Base Case, alex/brick involved with.");
		result = ensemble.get(involvedWithPred2);
		test.assert(result.length, 1, "9.0 Base Case, alex/cylde involved with.");

		//TEST 9.1 -- Clyde will be eliminated -- 
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.set(injuredPred1);
		ensemble.set(injuredPred2);
		ensemble.set(happyPred); // the advanced trigger rule should now fire.
		socialRecord.setupNextTimeStep(1); // to dance around clyde's role getting completely wiped along with the current timestep.
		socialRecord.eliminateCharacter("clyde");
		ruleLibrary.runTriggerRules(newCast); // even with clyde eliminated, conditions should still hold true, but HE should not receive a new status
		result = ensemble.get(involvedWithPred1);
		test.assert(result.length, 1, "Even with a character eliminated who is involved in trigger conditions, onstage characters should still get new social state from triggers");
		result = ensemble.get(involvedWithPred2);
		test.assert(result.length, 0, "When eliminated, a character should NOT get new statuses from trigger effects (even if there are other 'good' predicates in the effects");

		test.finish();
	};

	/**
	 * Unit test for the various properties of the runTriggerRules function. Returns a string which will ultimately be
	 * appended to tests.html -- to see the results of these tests, simply load tests.html into a browser.
	 * var runTriggerRules = function (cast, currentTimeStep) {
	 *
	 * @return returnString a string containing html detailing how many of the unit tests inside of this function passed and failed
	 */
	var testEvaluateConditions = function(){


		var statusPredicate = {};  //what we are storing in the socialRecord. the value true is definitely stored here.
		statusPredicate.category = "status";
		statusPredicate.type = "injured";
		statusPredicate.first = "doc";
		statusPredicate.value = true;
		statusPredicate.direction = "undirected";
		statusPredicate.isBoolean = true;
		statusPredicate.defaultValue = false;
		socialRecord.registerDirection(statusPredicate);
		socialRecord.registerIsBoolean(statusPredicate);
		socialRecord.registerDefault(statusPredicate);
		delete statusPredicate.isBoolean;
		delete statusPredicate.defaultValue;
		delete statusPredicate.direction;

		var conditions = [];
		var searchPredicate1 = {}; // chck to see if doc is injured -- note that we are explicitly leaving off value: true
		searchPredicate1.category = "status";
		searchPredicate1.type = "injured";
		searchPredicate1.first = "doc";

		var searchPredicate2 = util.clone(searchPredicate1);
		searchPredicate2.value = true;

		var searchPredicate3 = util.clone(searchPredicate1);
		searchPredicate3.value = false;

		var searchPredicate4 = util.clone(searchPredicate2);
		searchPredicate4.type = "happy";

		var searchPredicate5 = util.clone(searchPredicate4);
		searchPredicate5.value = false;

		conditions.push(searchPredicate1);

		//First, let's clear out the socialRecord HISTORY (not the registering we just did!) just to be safe, and then
		//add a status to it.
		socialRecord.clearHistory();
		socialRecord.set(statusPredicate);

		test.start("RuleLibrary", "testEvaluateConditions");

		//TEST 1 -- leaving the value off of a status predicate being evaluated should be interpreted to mean we want that status to be true.
		var evaluationResult = ruleLibrary.evaluateConditions(conditions);
		test.assert(evaluationResult, true, "Leaving the 'value' off of a status predicate inside of a condition should default to true");

		//TEST 1.5 -- including a value of 'true' on a status predicate in a condition should return true if that status does in fact exist in the database!
		conditions = [];
		conditions.push(searchPredicate2);
		evaluationResult = ruleLibrary.evaluateConditions(conditions);
		test.assert(evaluationResult, true, "NOT Leaving the 'value' off of a status predicate inside of a condition shouldn't make it NOT be able to find a match, assuming a match exists to be found.");

		//TEST 2 -- Looking for a status with a 'false' value specified should return false if the status is in fact true
		//-->Should be a 'no duh' case, but due to the special 'default value' of status from TEST 1, want to double check.
		conditions = [];
		conditions.push(searchPredicate3);
		evaluationResult = ruleLibrary.evaluateConditions(conditions);
		test.assert(evaluationResult, false, "The searched for status SHOULDN'T have existed in the socialRecord -- false was specified");

		//TEST 3 -- Looking for a status type that doesn't exist in the socialRecord should return false
		conditions = [];
		conditions.push(searchPredicate4);
		evaluationResult = ruleLibrary.evaluateConditions(conditions);
		test.assert(evaluationResult, false, "The searched for status SHOULDN'T have existed in the socialRecord -- nothing about 'happy', true or false, should be in there.");

		//TEST 4 -- Looking for a status that DOESN'T exist in the socialRecord, whose value matches the DEFAULT value, should return true
		//--->Even if the default value is false
		conditions = [];
		conditions.push(searchPredicate5);
		evaluationResult = ruleLibrary.evaluateConditions(conditions);
		test.assert(evaluationResult, true, "The searched for status SHOULDN'T have existed in the socialRecord -- nothing about 'happy', true or false, should be in there. BUT since the default value of happy is false, we should have returned true anyway!");

		//TEST 5 -- Test to see if ordered conditions work
		socialRecord.clearHistory();
		statusPredicate = {};  //what we are storing in the socialRecord. the value true is definitely stored here.
		statusPredicate.category = "network";
		statusPredicate.type = "friend";
		statusPredicate.first = "doc";
		statusPredicate.second = "bob";
		statusPredicate.value = 10;
		statusPredicate.direction = "undirected";
		statusPredicate.isBoolean = false;
		statusPredicate.defaultValue = 10;
		socialRecord.registerDirection(statusPredicate);
		socialRecord.registerIsBoolean(statusPredicate);
		socialRecord.registerDefault(statusPredicate);
		delete statusPredicate.isBoolean;
		delete statusPredicate.defaultValue;
		delete statusPredicate.direction;
		socialRecord.set(statusPredicate);

		statusPredicate.value = 20;
		socialRecord.setupNextTimeStep();
		socialRecord.setupNextTimeStep();
		socialRecord.set(statusPredicate);

		conditions = [];
		// I think this unit test is failing because of something to do with the turnsAgoBetween being in the same window across two orders. But trying to make them non-overlapping doesn't work either. :/
		conditions.push(
			{
				"category": "network",
				"type": "friend",
				"first": "doc",
				"second": "bob",
				"operator": ">",
				"value": 10,
				"turnsAgoBetween": ["NOW", 5], // NOTE that this order is required here; normally the reverse order would also work, but we're skipping preprocessing.
				"order": 1			// we're doing this out of order to make sure it works!
			}
		);
		conditions.push
		(
			{
				"category": "network",
				"type": "friend",
				"first": "doc",
				"second": "bob",
				"operator": ">",
				"value": 0,
				"turnsAgoBetween": ["NOW", 5],
				"order": 0
			}
		);

		evaluationResult = ruleLibrary.evaluateConditions(conditions);
		test.assert(evaluationResult, true, "ruleLibrary.evaluateCondition - The search for an (out of order) ordered condition was not successful.");

		test.finish();

	};


	/**
	 * Unit test for the various properties of the testCalculateVolition function. Returns a string which will ultimately be
	 * appended to tests.html -- to see the results of these tests, simply load tests.html into a browser.
	 * var runTriggerRules = function (cast, currentTimeStep) {
	 *
	 * @return returnString a string containing html detailing how many of the unit tests inside of this function passed and failed
	 */
	var testCalculateVolition = function(){
		var cast = ["Simon", "Monica", "Vanessa"];
		var rules = [
			{
				"name": "Attraction makes people want to start dating.",
				"conditions": [
					{
						"category": "directedStatus",
						"type": "attracted to",
						"first": "x",
						"second": "y"
					}
				],
				"effects": [
					{
						"category": "relationship",
						"type": "involved with",
						"first": "x",
						"second": "y",
						"weight": 5,
						"intentType": true
					}
				]

			},

			{
				"name": "Injured people are less interested in romance.",
				"conditions": [
					{
						"category": "status",
						"type": "injured",
						"first": "x"
					}
				],
				"effects": [
					{
						"category": "relationship",
						"type": "involved with",
						"first": "x",
						"second": "y",
						"weight": -5,
						"intentType": true
					}
				]
			},
		{
				"name": "If I hate you, I'm more inclined to be mean to you..",
				"conditions": [
					{
						"category": "directedStatus",
						"type": "hates",
						"first": "x",
						"second": "y",
						"value" : true,
					}
				],
				"effects": [
					{
						"category": "network",
						"type": "affinity",
						"first": "x",
						"second": "y",
						"weight": 5,
						"intentType": false
					}
				]
			},
		];

		var predicate = {};
		predicate.category = "directedStatus";
		predicate.type = "attracted to";
		predicate.first = "Simon";
		predicate.second = "Monica";
		predicate.value = true;
		predicate.labels = [];
		predicate.directionType = "directed";
		predicate.isBoolean = true;
		predicate.defaultValue = false;
		socialRecord.registerDefault(predicate);
		socialRecord.registerIsBoolean(predicate);
		socialRecord.registerDirection(predicate);
		delete socialRecord.directionType;
		delete socialRecord.isBoolean;
		delete socialRecord.defaultValue;

		var angryAtPredicate = {}; // now that the same rule can't be entered into a library multiple times, need a separate predicate for a new rule.
		angryAtPredicate = util.clone(predicate);
		angryAtPredicate.type = "hates";


		socialRecord.set(predicate);
		socialRecord.set(angryAtPredicate);

		//Register relationships...
		var relationshipBlueprint = {};
		relationshipBlueprint.category = "relationship";
		relationshipBlueprint.defaultValue = false;
		relationshipBlueprint.directionType = "reciprocal";
		relationshipBlueprint.isBoolean = true;

		socialRecord.registerDefault(relationshipBlueprint);
		socialRecord.registerIsBoolean(relationshipBlueprint);
		socialRecord.registerDirection(relationshipBlueprint);

		//Register Statuses...
		var statusBlueprint = {};
		statusBlueprint.category = "status";
		statusBlueprint.defaultValue = false;
		statusBlueprint.directionType = "undirected";
		statusBlueprint.isBoolean = true;

		socialRecord.registerDefault(statusBlueprint);
		socialRecord.registerIsBoolean(statusBlueprint);
		socialRecord.registerDirection(statusBlueprint);

		ruleLibrary.addRuleSet("volitionRules", rules);
		test.start("RuleLibrary", "testCalculateVolition");
		var volitionTest = ruleLibrary.calculateVolition(cast);



		//TEST 1 test to see if adjustWeight in calculateVolitions did not set a new volition properly
		test.assert(volitionTest.getFirst("Simon", "Monica").weight, 5, "adjustWeight in calculateVolitions did not set a new volition properly.");

		rules.push({
				"name": "Hating someone makes people want to start dating. (weird, huh?)",
				"conditions": [
					{
						"category": "directedStatus",
						"type": "hates",
						"first": "x",
						"second": "y"
					}
				],
				"effects": [
					{
						"category": "relationship",
						"type": "involved with",
						"first": "x",
						"second": "y",
						"weight": 5,
						"intentType": true
					}
				]

		});

		//TEST 2 test to see if adjustWeight in calculateVolitions did not update an existing volition properly
		ruleLibrary.clearRuleLibrary(); // Let's first clear out everything from the rule set, and start afresh.
		ruleLibrary.addRuleSet("volitionRules", rules);
		volitionTest = ruleLibrary.calculateVolition(cast);
		test.assert(volitionTest.getFirst("Simon", "Monica").weight, 10, "adjustWeight in calculateVolitions did not update an existing volition properly.");

		//TEST 3 test to see what the the other volitions are are!
		var intent = volitionTest.getNext("Simon", "Monica");
		test.assert(intent.category, "network", "secondary intent between Simon and Monica was wrong.");
		test.assert(intent.type, "affinity", "secondary type between Simon and Monica was wrong.");
		test.assert(intent.intentType, false, "secondary intentType between Simon and Monica was wrong.");
		test.assert(intent.weight, 5, "secondary weight between Simon and Monica was wrong.");

		/*
		 * //Useful for looping through intents if necessary.
		while (intent !== undefined) {
			console.log("ok, ah, I wonder what an intent looks like? " + intent);
			arrayOfIntents.push(intent);
			intent = volitionTest.getNext("Simon","Monica");
			console.log(volitionTest.dump());
		}
		*/
	
		//TEST 4
		//TESTING VOLITION CALCULATIONS WITH OFFSTAGE CHARACTERS
		//Clear everything out, make a new cast for this.
		socialRecord.clearEverything();
		ruleLibrary.clearRuleLibrary(); // Let's first clear out everything from the rule set, and start afresh.
		ruleLibrary.addRuleSet("volitionRules", rules);
		ensemble.loadBaseBlueprints(testSocial);
		cast = ["alvin", "simon", "dave"];
		var hatesPred = {
			"category" : "directedStatus",
			"type"  : "hates",
			"first" : "alvin",
			"second": "simon"
		};

		//TEST 4.0 WITH AN EMPTY socialRecord run the volition tests
		volitionTest = ruleLibrary.calculateVolition(cast);
		var result = volitionTest.getFirst("alvin", "simon");
		test.assert(result, undefined, "Base case -- with no social state, no rules should fire");

		//TEST 4.1 -- Let's actually put something in the socialRecord.
		socialRecord.set(hatesPred);
		volitionTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assertNEQ(result, undefined, "At least one volition should have existed with a bit of social state...");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "simon");
		test.assert(result.length, 2, "Two volition rules should have fired in this case.");

		//TEST 4.2 -- put offstage a character, but don't recalculate volitions.
		socialRecord.putCharacterOffstage("simon");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "simon");
		test.assert(result.length, 2, "Putting a character offstage should not remove previously calculated volitions, but apparantly it did.");

		//tEST 4.3 -- Recalculating volitions with an eliminated character
		volitionTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assert(result, undefined, "Calculating volitions with a character who is offstage should result in no volitions towards them");

		//TEST 4.4 -- making the character NOT off stage, but not re-calculating the volitions should still be undefined.
		socialRecord.putCharacterOnstage("simon");
		result = volitionTest.getFirst("alvin", "simon");
		test.assert(result, undefined, "Putting an offstage character back on stage shouldn't make volitions work suddenly");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "simon");
		test.assert(result.length, 0, "Putting an offstage character back on stage shouldn't work with getAllVolitionsByKeyFromTo either.");

		//TEST 4.5 -- But then if we RE-calculate the volitions with the character back on stage, volitions should work just fine again.
		volitionTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assertNEQ(result, undefined, "Calculating volitions involving a character who was offstage, but then put back on stage, should work just fine.");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "simon");
		test.assert(result.length, 2, "Calculating volitions with a character who was offstage but then put onstage (getAllVolitionsByKeyFromTo).");

		//TEST 4.6 -- putting another character offstage shouldn't impact anything.
		socialRecord.putCharacterOffstage("dave");
		volitionTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assertNEQ(result, undefined, "Putting a different person off stage shouldn't affect the volitions of those onstage.");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "simon");
		test.assert(result.length, 2, "Putting a different person off stage shouldn't affect the volitions of those onstage.");

		//TEST 4.7 -- Putting someone offstage removes your volitions towards that person, but not towards another person.
		var injuredPred = {
			"category" : "status",
			"type"	: "injured",
			"first" : "alvin"
		};
		//Setting up the baselines (making sure that it is behaving as we would expect when all characters are onstage...)
		socialRecord.set(injuredPred); // alvin is now less interested in romance with both simon and dave.
		socialRecord.putCharacterOnstage("dave");
		volitionsTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assertNEQ(result, undefined, "Base case for 4.7 (alvin, simon, getFirst)");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "simon");
		test.assert(result.length, 2, "Base case for 4.7 (alvin, simon, getAll...)");
		result = volitionTest.getFirst("alvin", "dave");
		test.assertNEQ(result, undefined, "Base case for 4.7 (alvin, dave, getFirst)");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "dave");
		test.assert(result.length, 1, "Base case for 4.7 (alvin, dave, getAll...");

		//And now if we take one of these characters offstage, the remaining onstage characters should be unchanged.
		socialRecord.putCharacterOffstage("dave");
		volitionsTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assertNEQ(result, undefined, "Putting a different person offstage when we might have volitions for them shouldn't affect the remaining people on stage (getFirst)");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "simon");
		test.assert(result.length, 2, "Putting a different person offstage when we might have volitions for them shouldn't affect the remaining people on stage (getAll)");
		result = volitionTest.getFirst("alvin", "dave");
		test.assert(result, undefined, "Now that Dave is offstage, we shouldn't have any volitions for him (getFirst)");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "dave");
		test.assert(result.length, 0, "Now that Dave is offstage, we shouldn't have any volitions for him (getAll)");

		//TEST 4.8 -- Making sure that if the 'initiator' of the volition is offstage then you still get nothing.
		socialRecord.putCharacterOffstage("alvin");
		volitionsTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assert(result, undefined, "Having the initiator and a random person offstage should yield no volitions (getFirst)");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "simon");
		test.assert(result.length, 0, "Having the initiator and a random person offstage should yield no volitions (getAll)");
		
		//TEST 4.9 -- Both the initiator and the responder of a volition being offstage should definitely result in no volitions happening!
		result = volitionTest.getFirst("alvin", "dave");
		test.assert(result, undefined, "Two people offstage should yield no volitions  (getFirst)");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "dave");
		test.assert(result.length, 0, "Two people offstage should yield no volitions (getAll)");


		//TEST 5 -- Same as Test 4, but with 'eliminate character' instead of putCharacterOffstage
		//Test 5 setup.
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.setupNextTimeStep(0);
		ruleLibrary.clearRuleLibrary(); // Let's first clear out everything from the rule set, and start afresh.
		ruleLibrary.addRuleSet("volitionRules", rules);
		ensemble.set(hatesPred);

		cast = ["alvin", "simon", "dave"];

		//TEST 5.1 -- eliminate a character, but don't recalculate volitions.
		result = ruleLibrary.calculateVolition(cast);
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "simon");
		socialRecord.eliminateCharacter("simon");
		test.assert(result.length, 2, "Eliminating should not remove previously calculated volitions, but apparantly it did.");

		//tEST 5.2 -- Recalculating volitions with an eliminated character
		volitionTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assert(result, undefined, "Calculating volitions with a character who is eliminated should result in no volitions towards them");

		//TEST 5.3 -- Eliminating a different character shouldn't impact anything.
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.setupNextTimeStep(0);
		ensemble.set(hatesPred);
		socialRecord.eliminateCharacter("dave");
		volitionTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assertNEQ(result, undefined, "Eliminating a different character shouldn't affect the volitions of those that remain (getFirst).");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "simon");
		test.assert(result.length, 2, "Eliminating a different person shouldn't affect the volitions of those that remain (getAll).");

		//TEST 5.4 -- Eliminating someone removes your volitions towards that person, but not towards another person.
		//Setting up the baselines (making sure that it is behaving as we would expect when all characters are onstage...)
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.setupNextTimeStep(0);
		ensemble.set(hatesPred);
		ensemble.set(injuredPred); // alvin is now less interested in romance with both simon and dave.
		
		//And now if we take one of these characters offstage, the remaining onstage characters should be unchanged.
		socialRecord.eliminateCharacter("dave");
		volitionsTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assertNEQ(result, undefined, "Eliminating a different character when we might have volitions for them shouldn't affect the remaining people (getFirst)");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "simon");
		test.assert(result.length, 2, "Eliminating a different person when we might have volitions for them shouldn't affect the remaining people(getAll)");
		result = volitionTest.getFirst("alvin", "dave");
		test.assert(result, undefined, "Now that Dave is eliminated, we shouldn't have any volitions for him (getFirst)");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "dave");
		test.assert(result.length, 0, "Now that Dave is eliminated, we shouldn't have any volitions for him (getAll)");

		//TEST 5.5 -- Making sure that if the 'initiator' of the volition is eliminated then you still get nothing.
		socialRecord.eliminateCharacter("alvin");
		volitionsTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assert(result, undefined, "Having the initiator and a random person both eliminated should yield no volitions (getFirst)");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "simon");
		test.assert(result.length, 0, "Having the initiator and a random person both eliminated should yield no volitions (getAll)");
		
		//TEST 5.6 -- Both the initiator and the responder of a volition being eliminated should definitely result in no volitions happening!
		result = volitionTest.getFirst("alvin", "dave");
		test.assert(result, undefined, "Two eliminated people should yield no volitions  (getFirst)");
		result = volition.getAllVolitionsByKeyFromTo("main", "alvin", "dave");
		test.assert(result.length, 0, "Two eliminated people should yield no volitions (getAll)");

		//TEST 6 -- the case where you have a volition with two effects, but ONE of them involves a 'bad' character.		
		rules.push({
				"name": "Being comrades with someone while someone else is happy makes you more likely to be involved with your comrade, and more likely to like the happy person less(just go with it)",
				"conditions": [
					{
						"category": "relationship",
						"type": "comrades",
						"first": "x",
						"second": "y"
					},
					{
						"category": "status",
						"type": "happy",
						"first": "z",
						"turnsAgoBetween": ['NOW', 'START']
					}
				],
				"effects": [
					{
						"category": "relationship",
						"type": "involved with",
						"first": "x",
						"second": "y",
						"weight": 5,
						"intentType": true
					},
					{
						"category": "network",
						"type": "affinity",
						"first": "x",
						"second": "z",
						"weight": 5,
						"intentType": false
					}
				]

		});
		var happyPredicate = {
			"category" : "status",
			"type"  : "happy",
			"first" : "dave"
		};
		var comradePredicate = {
			"category" : "relationship",
			"type"  : "comrades",
			"first" : "alvin",
			"second": "simon"
		};
		//6.1 -- let's clear everything out and test the base case.

		ensemble.loadBaseBlueprints(testSocial);
		ruleLibrary.clearRuleLibrary(); // Let's first clear out everything from the rule set, and start afresh.
		ruleLibrary.addRuleSet("volitionRules", rules);
		ensemble.set(happyPredicate);
		ensemble.set(comradePredicate);
		volitionsTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assertNEQ(result, undefined, "6 Basecase -- Alvin has a volition to interact with Simon.");
		result = volitionTest.getFirst("alvin", "dave");
		test.assertNEQ(result, undefined, "6 Basecase -- Alvin has a volition to interact with Dave.");

		//6.2 -- now if we put dave offstage and recalculate volition, alvin SHOULD want to interact with simon, but not with dave.
		socialRecord.putCharacterOffstage("dave");
		volitionsTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assertNEQ(result, undefined, "(offstage) Trigger rules with multiple effects should still have good effects allowed to pass through");
		result = volitionTest.getFirst("alvin", "dave");
		test.assert(result, undefined, "(offstage) Trigger rules with multiple effects should still NOT allow bad effects to go through.");

		//7 -- Same as 6, but with eliminating a character.
		//we have to do a little bit of a workaround to capture this functionality, since eliminating the character removes them from the current timestep.
		//Need to bust out some windows!
		ensemble.loadBaseBlueprints(testSocial);
		ruleLibrary.clearRuleLibrary(); // Let's first clear out everything from the rule set, and start afresh.
		ruleLibrary.addRuleSet("volitionRules", rules);
		ensemble.set(happyPredicate);
		ensemble.set(comradePredicate);
		socialRecord.setupNextTimeStep(1);
		socialRecord.eliminateCharacter("dave");
		volitionsTest = ruleLibrary.calculateVolition(cast);
		result = volitionTest.getFirst("alvin", "simon");
		test.assertNEQ(result, undefined, "(onstage) Trigger rules with multiple effects should still have good effects allowed to pass through");
		result = volitionTest.getFirst("alvin", "dave");
		test.assert(result, undefined, "(onstage) Trigger rules with multiple effects should still NOT allow bad effects to go through.");


		test.finish();
	};

	/**
	 * Unit test for the various properties of the addRuleSet function. Returns a string which will ultimately be
	 * appended to tests.html -- to see the results of these tests, simply load tests.html into a browser.
	 * var getUniqueBindings = function (ruleConditions) {
	 *
	 * @return returnString a string containing html detailing how many of the unit tests inside of this function passed and failed
	 */
	var testAddRuleSet = function(){
		test.start("RuleLibrary", "testAddRuleSet");

		//First we need to make a rule. It'll be a simple one, with one condition and one effect'
		ruleLibrary.clearRuleLibrary(); // make sure we are starting off with a clean slate.
		var rule = {};
		var conditionPred = {};
		var effectPred = {};

		conditionPred.category = "relationship";
		conditionPred.type = "friends";
		conditionPred.first = "x";
		conditionPred.second = "y";
		conditionPred.value = true;
		conditionPred.isBoolean = true;
		conditionPred.defaultValue = false;
		conditionPred.directonType = "reciprocal";

		socialRecord.registerDefault(conditionPred);
		socialRecord.registerDirection(conditionPred);
		socialRecord.registerIsBoolean(conditionPred);

		delete conditionPred.isBoolean;
		delete conditionPred.defaultValue;
		delete conditionPred.directionType;

		effectPred.category = "network";
		effectPred.type = "buddy";
		effectPred.first = "x";
		effectPred.second = "y";
		effectPred.value = 75;

		effectPred.defaultValue = 50;
		effectPred.directionType = "directed";
		effectPred.isBoolean = false;

		socialRecord.registerDefault(effectPred);
		socialRecord.registerDirection(effectPred);
		socialRecord.registerIsBoolean(effectPred);

		delete effectPred.isBoolean;
		delete effectPred.defaultValue;
		delete effectPred.directionType;

		var conditions1 = [];
		conditions1.push(util.clone(conditionPred));
		var effects1 = [];
		effects1.push(util.clone(effectPred));

		rule.conditions = util.clone(conditions1);
		rule.effects = util.clone(effects1);

		var rule2 = util.clone(rule);
		//let's change a teeny thing about rule2 to distinguish it from rule
		rule2.conditions[0].value = false;

		var rule3 = util.clone(rule2);
		rule3.conditions[0].type = "involved with";

		//Now let's make a set of rules (perhaps just cloning our one rule twice for now)'
		var set = [];
		set.push(util.clone(rule));
		set.push(util.clone(rule2));
		var set2 = [];
		set2.push(util.clone(rule3));

		ruleLibrary.addRuleSet("triggerRules", set);

		//TEST 1 -- the size of the 'type' of rule set we just added should match the number of rules we added to that set.
		test.assert(_.size(ruleLibrary.getTriggerRules()), set.length, "Size of rule library was incorrect");

		//TEST 2 -- the contents of the set should match that which we just pushed in
		//--->This is checking the condition
		test.assert(ruleLibrary.getTriggerRules()[0].conditions[0].category, "relationship", "category of first trigger rule's condition was incorrect");

		//test.assert(ruleLibrary["triggerRules"][0].conditions[0].category, "relationship", "category of first trigger rule's condition was incorrect");
		test.assert(ruleLibrary.getTriggerRules()[0].conditions[0].type, "friends", "type of first trigger rule's condition was incorrect");
		test.assert(ruleLibrary.getTriggerRules()[0].conditions[0].first, "x", "first of first trigger rule' condition' was incorrect");
		test.assert(ruleLibrary.getTriggerRules()[0].conditions[0].second, "y", "second of first trigger rule's condition was incorrect");

		//TEST 2 .5-- the contents of the set should match that which we just pushed in
		//--->This is checking the effect
		test.assert(ruleLibrary.getTriggerRules()[0].effects[0].category, "network", "category of first trigger rule's effect was incorrect");
		test.assert(ruleLibrary.getTriggerRules()[0].effects[0].type, "buddy", "type of first trigger rule's effect was incorrect");
		test.assert(ruleLibrary.getTriggerRules()[0].effects[0].first, "x", "first of first trigger rule's effect was incorrect");
		test.assert(ruleLibrary.getTriggerRules()[0].effects[0].second, "y", "second of first trigger rule's effect was incorrect");

		//TEST 3 -- Testing the 'additive' nature of these rule sets!
		ruleLibrary.clearRuleLibrary(); // Start afresh.
		ruleLibrary.addRuleSet("triggerRules", set);
		ruleLibrary.addRuleSet("triggerRules", set2); // due to additive nature, total length should now be three!
		test.assert(_.size(ruleLibrary.getTriggerRules()), 3, "Size of rule library was incorrect -- problem with additive nature");


		//TEST 5 -- adding 'duplicate rules' to DIFFERENT keys in the ruleLibrary (e.g. triggerRules and volitionRules) are NOT actually duplicate at all.
		ruleLibrary.clearRuleLibrary();
		ruleLibrary.addRuleSet("triggerRules", set);
		ruleLibrary.addRuleSet("volitionRules", set2); // set and set2 share a rule, but there shouldn't be a conflict.
		test.assert(_.size(ruleLibrary.getTriggerRules()), 2, "size of ruleLibrary[triggerRules] was incorrect -- the 'duplicate rule' was in a different key, should have been no conflict ");
		test.assert(_.size(ruleLibrary.getTriggerRules()), 2, "size of ruleLibrary[volitionRules] was incorrect -- the 'duplicate rule' was in a differnet key, should have been no conflict");

		ruleLibrary.clearRuleLibrary(); // clean up after ourselves.

		test.finish();

	};

	var testAccessById = function() {

		test.start("RuleLibrary", "testAccessById");

		util.resetIterator("rules");
		ruleLibrary.clearRuleLibrary();
		ensemble.loadBaseBlueprints(testSocial);
		ensemble.addRules(testTriggerRules);
		var rule1 = ruleLibrary.getRuleById("triggerRules_1");
		console.log("!?!?", rule1);
		test.assert(rule1.conditions[0].type, "involved with", "The first trigger rule's first condition wasn't of the expected type after retrieving by ID.");
		test.assert(rule1.effects.length, 1, "The first trigger rule should have one effect.");

		var rule2 = ruleLibrary.getRuleById("triggerRules_2");
		test.assert(rule2.effects[0].type, "worried about", "The 2nd trigger rule's first effect wasn't of the expected type after retrieving by ID.");

		var ruleNone = ruleLibrary.getRuleById("triggerRules_invalid");
		test.assert(ruleNone, false, "An attempt to get an rule by ID when the ID is invalid should return false.");

		ruleNone = ruleLibrary.getRuleById("noSuchRuleSet_1");
		test.assert(ruleNone, false, "An attempt to get an rule by ID when the ruleset is invalid should return false.");

		var alteredRule = {
			"name": "...",
			"conditions": [
				{
					"category": "relationship",
					"type": "comrades",
					"first": "x",
					"second": "y"
				}
			],
			"effects": [
				{
					"category": "directedStatus",
					"type": "hates",
					"first": "x",
					"second": "z",
					"value": true
				},
				{
					"category": "relationship",
					"type": "friends",
					"first": "x",
					"second": "z",
					"value": true
				}
			]
		};

		var setResult = ruleLibrary.setRuleById("triggerRules_1", alteredRule);
		test.assert(setResult, true, "Successfully adding a rule should return true.");
		rule1 = ruleLibrary.getRuleById("triggerRules_1");
		test.assert(rule1.conditions[0].type, "comrades", "A rule updated by ID should correctly show changes to conditions.");
		test.assert(rule1.effects.length, 2, "A rule updated by ID should correctly show an updated length of effects.");
		rule2 = ruleLibrary.getRuleById("triggerRules_2");
		test.assert(rule2.effects[0].type, "worried about", "Updating one rule by ID shouldn't have any effect on others.");
		test.assert(rule2.effects.length, 1, "Updating one rule by ID shouldn't have any impact on the length of another's effects.");

		test.finish()
	}

/**
	 * Unit tests checking to see if a 'time ordered' function is working as intended/expected.
	 * Classic example: The Knight in Shining Armor: If you mean to me first, and then someone else was mean to you, I'm going to now like you more.
	 */
	var testTimeOrderedRules = function(){
		//alert("hi!");
		//ruleLibrary.clearRuleLibrary();
		var cast = ["doc", "clara", "reggie"];
		var triggerRules = {
			"type": "trigger",
			"rules": [
			{
				"name": "If your affinity with someone is at least 70, and then your affinity is at least 80, you become attracted to them",
				"conditions": [
					{
						"category": "network",
						"type": "affinity",
						"operator": ">",
						"first": "me",
						"second": "destinedToLove",
						"value": 70,
						"order": 0,
						"turnsAgoBetween": [5, "NOW"]
						
					},
					{
						"category": "network",
						"type": "affinity",
						"operator": ">",
						"first": "me",
						"second": "destinedToLove",
						"value": 80,
						"order": 1,
						"turnsAgoBetween": [5, "NOW"]
						
					}
				],
				"effects": [
					{
						"category": "directedStatus",
						"type": "attracted to",
						"first": "me",
						"second": "destinedToLove"
					}
				]

			},
			{
				"name": "Someone who hates you first, and then someone else hates them, makes you attracted to them. I dunno you pity them or something.",
				"conditions": [
					{
						"category": "directedStatus",
						"type": "hates",
						"first": "destinedToLove",
						"second": "me",
						"order": 0,
						"turnsAgoBetween": [5, "NOW"]
						
					},
					{
						"category": "directedStatus",
						"type": "hates",
						"first": "shmuck",
						"second": "destinedToLove",
						"order": 1,
						"turnsAgoBetween": [5, "NOW"]
						
					}
				],
				"effects": [
					{
						"category": "directedStatus",
						"type": "attracted to",
						"first": "me",
						"second": "destinedToLove"
					}
				]

			},
			{
				"name": "Someone who expressed interest in you first, and then rejected someone else expressing interest in them, makes you attracted to them.",
				"conditions": [
					{
						"category": "socialRecordLabel",
						"type": "romanticAdvance",
						"first": "destinedToLove",
						"second": "me",
						"order": 0,
						"turnsAgoBetween": [5, "NOW"]
						
					},
					{
						"category": "socialRecordLabel",
						"type": "romanticFailure",
						"first": "shmuck",
						"second": "destinedToLove",
						"order": 1,
						"turnsAgoBetween": [5, "NOW"]
						
					}
				],
				"effects": [
					{
						"category": "directedStatus",
						"type": "attracted to",
						"first": "me",
						"second": "destinedToLove"
					}
				]

			},
			{
				"name": "If you are not involved with someone, and then you are involved with someone, you become attracted to them",
				"conditions": [
					{
						"category": "relationship",
						"type": "involved with",
						"first": "destinedToLove",
						"second": "me",
						"value": false,
						"order": 0,
						"turnsAgoBetween": [5, "NOW"]
						
					},
					{
						"category": "relationship",
						"type": "involved with",
						"value": true,
						"first": "destinedToLove",
						"second": "me",
						"order": 1,
						"turnsAgoBetween": [5, "NOW"]
						
					}
				],
				"effects": [
					{
						"category": "directedStatus",
						"type": "attracted to",
						"first": "me",
						"second": "destinedToLove"
					}
				]

			}
		]};
		ensemble.loadBaseBlueprints(testSocial);

		//Add our trigger rule to the ruleset!
		ensemble.addRules(triggerRules);
		var romanticAdvancePred = {
						"category": "socialRecordLabel",
						"type": "romanticAdvance",
						"first": "doc",
						"second": "clara",
						"value": true
		};
		var romanticFailPred = {
						"category": "socialRecordLabel",
						"type": "romanticFailure",
						"first": "reggie",
						"second": "doc",
						"value": true
		};
		var attractedToPred = {
						"category": "directedStatus",
						"type": "attracted to",
						"first": "clara",
						"second": "doc",
						"value": true
		};
		var randomPredicate = {
			"category": "trait",
			"type": "lucky",
			"first": "reggie"
		};
		var involvedWithPred = {
			"category": "relationship",
			"type": "involved with",
			"first": "clara",
			"second": "doc",
			"value": true
		};
		var affinityPredicate = {
			"category": "network",
			"type": "affinity",
			"first": "clara",
			"second": "doc",
			"value": 75
		};
		
		var hatesFirstPredicate = {
			"category": "directedStatus",
			"type": "hates",
			"first": "doc",
			"second": "clara",
			"value": true
		};
		var hatesSecondPredicate = {
			"category": "directedStatus",
			"type": "hates",
			"first": "reggie",
			"second": "doc",
			"value": true
		};
		
		var tempSocialRecord;
		var result;
		var tempTriggerRules;
		test.start("RuleLibrary", "testTimeOrderedRules");
		
		//TEST 0 -- Before running the trigger rules, the socialRecord should only have the two entries that we manually inserted.
		socialRecord.set(hatesFirstPredicate);
		socialRecord.setupNextTimeStep()
		socialRecord.set(hatesSecondPredicate);
		tempSocialRecord = socialRecord.getSocialRecordCopyAtTimestep(0);
		test.assert(tempSocialRecord.length, 1, "We inserted 1 thing at timestep 0, but it has a non-1 length" );
		tempSocialRecord = socialRecord.getSocialRecordCopyAtTimestep(1);
		test.assert(tempSocialRecord.length, 2, "We inserted 1 thing at timestep 1; combined with carry over from step 0 should be 2 length" );
		
		ruleLibrary.runTriggerRules(cast);

		tempSocialRecord = socialRecord.getSocialRecordCopyAtTimestep(0);
		test.assert(tempSocialRecord.length, 1, "There should still only be 1 entry at timestep 0. Value ommitted." );
		tempSocialRecord = socialRecord.getSocialRecordCopyAtTimestep(1);
		test.assert(tempSocialRecord.length, 3, "After running the trigger rules, there should now be three entries at timestep 1. Value ommitted." );

		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.set(hatesFirstPredicate);
		socialRecord.setupNextTimeStep();
		socialRecord.set(hatesSecondPredicate);

		//TEST 0.5 -- we had been running into some issues with specifying 'value' in trigger rules, let's just do a sanity check that it works when value is specified.
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[1].effects[0].value = true;
		ruleLibrary.clearRuleLibrary();
		ensemble.addRules(tempTriggerRules);
		ruleLibrary.runTriggerRules(cast);

		tempSocialRecord = socialRecord.getSocialRecordCopyAtTimestep(0);
		test.assert(tempSocialRecord.length, 1, "There should STILL only be 1 entry at timestep 0, even after modifying the value of the trigger's effects." );
		tempSocialRecord = socialRecord.getSocialRecordCopyAtTimestep(1);
		test.assert(tempSocialRecord.length, 3, "After running the trigger rules, there should now be three entries at timestep 1, trigger's effect specified to have value true." );
		
		//TEST 1 -- Trigger rules that use the order property should add things to the socialRecord, assuming that all conditions are true.
		//"Things entered in the right order should work"
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.set(hatesFirstPredicate);
		socialRecord.setupNextTimeStep();
		socialRecord.set(hatesSecondPredicate);
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		ensemble.addRules(tempTriggerRules);
		ruleLibrary.runTriggerRules(cast, 1);
		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 1, "Base Functionality: We wanted clara to be attracted to doc (from directedstatuses) but she wasn't for some weird reason.");

		//TEST 1.5 -- Works for socialRecordLabels, too!
		//"Things entered in the right order should work"
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.set(romanticAdvancePred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticFailPred);
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		ensemble.addRules(tempTriggerRules);
		ruleLibrary.runTriggerRules(cast, 1);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 1, "Base Functionality: We wanted clara to be attracted to doc (from socialRecordLabels) but she wasn't for some weird reason.");

		//TEST 2 -- Order-based trigger rules should not fire if the events happened in the wrong order.
		//"Things entered in the wrong order should not work"
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.set(hatesSecondPredicate);
		socialRecord.setupNextTimeStep();
		socialRecord.set(hatesFirstPredicate);
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		ensemble.addRules(tempTriggerRules);
		ruleLibrary.runTriggerRules(cast, 1);
		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 0, "Events were entered into socialRecord in wrong order, but rule fired anyway.");

		//TEST 3 -- Order-based trigger rules should not fire if events that were meant to happen at two separate times happened on the same timestep.
		//Note--works better for socialRecordLabels since they don't get cloned!
		//"Things happening on the same time step that SHOULD happen on different time steps should not work"
		//BEN: Pick up here! Looks like we are seeing some of that socialRecord Cloning issues that Aaron was notcing?

		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.set(romanticAdvancePred); // The 'right' thing happened first
		socialRecord.set(romanticFailPred); // And the right thing happeend second... -- only seems to happen when both of these guys are timestep 0!?!

		socialRecord.setupNextTimeStep();
		socialRecord.set(randomPredicate);

		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		ensemble.addRules(tempTriggerRules);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 0, "Events were entered into the socialRecord at the same time step, but rule fired anyway");

		//TEST 4 -- And if two things happened at the same time but were entered into the socialRecord in the 'wrong order' it should also totally note fire.
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.set(hatesSecondPredicate); // And the wrong thing happeend second...
		socialRecord.set(hatesFirstPredicate); // The 'wrong' thing happened first
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		ensemble.addRules(tempTriggerRules);
		ruleLibrary.runTriggerRules(cast);
		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 0, "Events were entered into the socialRecord at the same time step in the WRONG ORDER even, but rule fired anyway");


		//TEST 4 -- Order based trigger rules should not fire if nothing even remotely looking like the events fired.
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.set(randomPredicate); // Totally random thing here...
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		ensemble.addRules(tempTriggerRules);
		ruleLibrary.runTriggerRules(cast);
		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 0, "Something completely unrelatead in socialRecord, but rule fired anyway");
		
		//TEST 5 -- A test for the 'same thing' being edited 
		//(e.g. first affinity is 70, second affinity is 80) should work.
		var tempAffinityPred = util.clone(affinityPredicate);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		tempAffinityPred.value = 75;
		socialRecord.set(tempAffinityPred); // affinity is at 75.
		tempAffinityPred.value = 85;
		socialRecord.setupNextTimeStep();
		socialRecord.set(tempAffinityPred); // affinity is now at 85.
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		ensemble.addRules(tempTriggerRules);
		ruleLibrary.runTriggerRules(cast);
		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 1, "An ordered rule that has two predicates that depend on a single numeric value failed to fire.");

		//TEST 6 -- Similarly, boolean edits should work as well (e.g. step 1, not dating, step 2, dating).
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.setupNextTimeStep();
		socialRecord.set(involvedWithPred); // involved with false at time 0, true at 1
		var results = ruleLibrary.runTriggerRules(cast);
		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 1, "An ordered rule that has two predicates that depend on a single boolean value failed to fire.");

		//TEST 6.5 ok, we're gonna do a similar thing, but we're going to explicitly say that the value was false for the first relationship.
		//This is because there used to be a bug with TEST 6, but it has since been fixed. Both 6 and 6.5 should work great now.
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		var tempInvolvedWithPred = util.clone(involvedWithPred);
		tempInvolvedWithPred.value = false;
		socialRecord.set(tempInvolvedWithPred);
		tempInvolvedWithPred.value = true;
		socialRecord.setupNextTimeStep();
		socialRecord.set(tempInvolvedWithPred);
		ruleLibrary.runTriggerRules(cast);
		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 1, "Ordered rule that has two predicates that depend on boolean numeric value failed when turnsAgoBetween was DEFINED and the 'false' part of it was explicitly put into the socialRecord");


		//TEST 7 Events entered into the socialRecord in the correct order with turnsAgoBetween defined in a window where they didn't happen (should be false)
		//Kind of only really makes sense to do this with socialRecordLabel predicates (or non-cloned predicates)
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.set(romanticAdvancePred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticFailPred);
		socialRecord.setupNextTimeStep(10);
		socialRecord.set(randomPredicate); // we're now at timestep 10, far away from the window.
		ruleLibrary.runTriggerRules(cast);
		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 0, "socialRecord events happend OUTSIDE of the window, but rule fired anyway..");

		//TEST 7.5 -- pretty much the same as 7.5, but what if everything took place on the 'same' time step.
		///really shouldn't be a problem at all, but we're being thorough
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.set(romanticAdvancePred);
		socialRecord.set(romanticFailPred);
		socialRecord.setupNextTimeStep(10)
		socialRecord.set(randomPredicate);
		ruleLibrary.runTriggerRules(cast);
		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 0, "relevant socialRecord events happened at SAME timestep, but that happened way outstide the window, so it shoudl fail.");
	
		//TEST 7.6 -- OK OK, and just because I'm paranoid: Things outside of the window entered in the wrong order.
		///really shouldn't be a problem at all, but we're being thorough
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.set(romanticFailPred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticAdvancePred);
		socialRecord.setupNextTimeStep(10);
		socialRecord.set(randomPredicate);
		ruleLibrary.runTriggerRules(cast);
		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 0, "relevant socialRecord events happened at SAME timestep, but that happened way outstide the window, so it shoudl fail.");

		//TEST 8 -- The order should still work, even if it doesn't begin at 0
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[2].conditions[0].order = 1;
		tempTriggerRules.rules[2].conditions[1].order = 2;
		ensemble.addRules(tempTriggerRules);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		socialRecord.set(romanticAdvancePred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticFailPred);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 1, "socialRecord trigger rule had order set to 1 and 2 (not starting at 0); everything correct but rule failed to fire.");

		//TEST 8.5 -- Normal ordering issues will still flag a rule as false, even if order doesn't begin at 0
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[2].conditions[0].order = 1;
		tempTriggerRules.rules[2].conditions[1].order = 2;
		ensemble.addRules(tempTriggerRules);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		
		socialRecord.set(romanticFailPred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticAdvancePred);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 0, "socialRecord trigger rule had order set to 1 and 2 (not starting at 0), but socialRecord events happened in wrong order; rule shouldn't have fired.");

		//TEST 9 -- "Skipping" numbers in the ordering should be totally fine
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[2].conditions[0].order = 0;
		tempTriggerRules.rules[2].conditions[1].order = 2;
		ensemble.addRules(tempTriggerRules);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		
		socialRecord.set(romanticAdvancePred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticFailPred);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 1, "socialRecord trigger rule had order set to 0 and 2 (skipped 1), but socialRecord events are ordered correctly");
		
		//TEST 9.5 -- Normal ordering issues will still flag a rule as false, even if order has numbers that skip
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[2].conditions[0].order = 0;
		tempTriggerRules.rules[2].conditions[1].order = 2;
		ensemble.addRules(tempTriggerRules);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		
		socialRecord.set(romanticFailPred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticAdvancePred);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 0, "socialRecord trigger rule had order set to 0 and 2 (skipped 1), but socialRecord events happened in wrong order; rule shouldn't have fired.");

		//TEST 10 -- If there are condition predicates with the same order specified, and the events happened at the same time in the socialRecord, that should be fine. 
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[2].conditions[0].order = 0;
		tempTriggerRules.rules[2].conditions[1].order = 0;
		ensemble.addRules(tempTriggerRules);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		
		socialRecord.set(romanticAdvancePred);
		socialRecord.set(romanticFailPred);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 1, "two predicates in condition had same order specified, and socialRecord events happened at same time.");

		//TEST 10.2 -- If there are two condition predicates  with the same order specified, and the events happened at DIFFERENT times in the socialRecord (but still in the window, that should be fine. 
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[2].conditions[0].order = 0;
		tempTriggerRules.rules[2].conditions[1].order = 0;
		ensemble.addRules(tempTriggerRules);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		
		socialRecord.set(romanticAdvancePred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticFailPred);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 1, "two predicates in condition had same order specified, and socialRecord events happened at different times (but within the window).");

		//TEST 10.3 -- If there are two condition predicates  with the same order specified, and the events happened at DIFFERENT times in the socialRecord (but still in the window, that should be fine. 
		ruleLibrary.clearRuleLibrary();
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[2].conditions[0].order = 0;
		tempTriggerRules.rules[2].conditions[1].order = 0;
		ensemble.addRules(tempTriggerRules);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		
		socialRecord.set(romanticAdvancePred);
		socialRecord.setupNextTimeStep(6)
		socialRecord.set(romanticFailPred);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 0, "two predicates in condition had same order specified, and socialRecord events happened at different times (but OUTSIDE the window).");

		//check edge cases of weird order issues,
		// i.e. pred1 and pred2 are order 0, pred1 @ 0, pred2 @ 4, pred3 (higher order) @ 3 should FAIL).
		// TEST 10.5 -- What about a case where we are dealing with 3 orders, but the socialRecord events are in the wrong order.
		ruleLibrary.clearRuleLibrary();
		var extraCondition = {
						"category": "directedStatus",
						"type": "hates",
						"first": "destinedToLove",
						"second": "me",
						"order": 0,
						"turnsAgoBetween": [5, "NOW"]
		};
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[2].conditions[0].order = 1;
		tempTriggerRules.rules[2].conditions[1].order = 2;
		tempTriggerRules.rules[2].conditions.push(util.clone(extraCondition));
		ensemble.addRules(tempTriggerRules);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		
		//it WANTS: hates, romAdvance, romFail
		//it GETS: hates, romFail, romAdvance
		//Thus it should fail.
		socialRecord.set(hatesFirstPredicate);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticFailPred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticAdvancePred);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 0, "three predicates in condition. All have differnet orders. socialRecord events happened at wrong times.");

		// TEST 10.6 -- What about a case where we are dealing with 3 orders, but the socialRecord events are in the wrong order.
		ruleLibrary.clearRuleLibrary();
		extraCondition = {
						"category": "directedStatus",
						"type": "hates",
						"first": "destinedToLove",
						"second": "me",
						"order": 0,
						"turnsAgoBetween": [5, "NOW"]
		};
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[2].conditions[0].order = 0;
		tempTriggerRules.rules[2].conditions[1].order = 2;
		tempTriggerRules.rules[2].conditions.push(util.clone(extraCondition));
		ensemble.addRules(tempTriggerRules);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		
		//it WANTS: (hates, romAdvance), romFail (i.e. hates and romAdvance BEFORE romFail)
		//it GETS: hates, romFail, romAdvance
		//Thus it should fail.
		socialRecord.set(hatesFirstPredicate);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticFailPred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticAdvancePred);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 0, "three predicates in condition. Two have same order. socialRecord events happened at wrong times.");

		//TEST 10.7 -- Three things, two with same order, 1 with higher order, but things in socialRecord in correct order.
		ruleLibrary.clearRuleLibrary();
		extraCondition = {
						"category": "directedStatus",
						"type": "hates",
						"first": "destinedToLove",
						"second": "me",
						"order": 0,
						"turnsAgoBetween": [5, "NOW"]
		};
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[2].conditions[0].order = 0;
		tempTriggerRules.rules[2].conditions[1].order = 1;
		tempTriggerRules.rules[2].conditions.push(util.clone(extraCondition));
		ensemble.addRules(tempTriggerRules);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		
		//it WANTS: (hates, romAdvance), romFail (i.e. hates and romAdvance BEFORE romFail)
		//it GETS: hates, romAdvance, romFail
		//Thus it should succeed.
		socialRecord.set(hatesFirstPredicate);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticAdvancePred);
		socialRecord.setupNextTimeStep();
		socialRecord.set(romanticFailPred);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 1, "three predicates in condition. Two have same order. socialRecord events happened at right times.");

		// TEST 11 -- Using multiple predicates to ensure a numeric is within a very particular range.
		ruleLibrary.clearRuleLibrary();
		extraCondition = {
						"category": "network",
						"type": "affinity",
						"first": "me",
						"second": "destinedToLove",
						"operator": "<",
						"value": 80,
						"order": 0,
						"turnsAgoBetween": [5, "NOW"]
		};
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[0].conditions[0].order = 0;
		tempTriggerRules.rules[0].conditions[1].order = 1;
		tempTriggerRules.rules[0].conditions.push(util.clone(extraCondition));
		ensemble.addRules(tempTriggerRules);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		
		tempAffinityPred = util.clone(affinityPredicate);
		tempAffinityPred.value = 75;
		socialRecord.set(tempAffinityPred);
		tempAffinityPred.value = 85;
		socialRecord.setupNextTimeStep();
		socialRecord.set(tempAffinityPred);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 1, "three predicates in condition. Two have same order. two are in place to 'enforce' a range first. socialRecord events happened at right times.");

		// TEST 11.5 -- Using multiple predicates to ensure a numeric is within a very particular range -- three different orders.
		ruleLibrary.clearRuleLibrary();
		extraCondition = {
						"category": "network",
						"type": "affinity",
						"first": "me",
						"second": "destinedToLove",
						"operator": "<",
						"value": 80,
						"order": 0,
						"turnsAgoBetween": [5, "NOW"]
		};
		tempTriggerRules = util.clone(triggerRules);
		tempTriggerRules.rules[0].conditions[0].order = 1;
		tempTriggerRules.rules[0].conditions[1].order = 2;
		tempTriggerRules.rules[0].conditions.push(util.clone(extraCondition));
		ensemble.addRules(tempTriggerRules);
		socialRecord.clearEverything();
		ensemble.loadBaseBlueprints(testSocial);
		
		tempAffinityPred = util.clone(affinityPredicate);
		tempAffinityPred.value = 75;
		socialRecord.set(tempAffinityPred);
		tempAffinityPred.value = 85;
		socialRecord.setupNextTimeStep(2);
		socialRecord.set(tempAffinityPred);
		ruleLibrary.runTriggerRules(cast);

		result = socialRecord.get(attractedToPred, 0, 0);
		test.assert(result.length, 1, "three predicates in condition. All have different orders. two are in place to 'enforce' a range first. socialRecord events happened at right times.");


		test.finish();
	};

	var testSortConditionsByOrder = function(){
		var triggerRules = [
			{
				"name": "Someone who expressed interest in you first, and then rejected someone else expressing interest in them, makes you attracted to them.",
				"conditions": [
					{
						"category": "socialRecordLabel",
						"type": "romanticAdvance",
						"first": "destinedToLove",
						"second": "me",
						"order": 0
						
					},
					{
						"category": "socialRecordLabel",
						"type": "romanticFailure",
						"first": "shmuck",
						"second": "destinedToLove",
						"order": 1
						
					},
					{
						"category": "socialRecordLabel",
						"type": "romanticFailure",
						"first": "shmuck",
						"second": "whatever",
						"order": 2
						
					}
				],
				"effects": [
					{
						"category": "directedStatus",
						"type": "attracted to",
						"first": "me",
						"second": "destinedToLove"
					}
				]

			}
		];

		var conditions = triggerRules[0].conditions;
		var sortedConditions = ruleLibrary.sortConditionsByOrder(conditions);

		test.start("RuleLibrary", "testSortConditionsByOrder");

		//TEST 0 -- Sorting an array that is already sorted shouldn't change the order of anything.
		test.assert(sortedConditions.length, 3, "sorting already-sorted conditions somehow changed the length");
		test.assert(sortedConditions[0].order, 0, "sorting already-sorted conditions made the first entry that was already sorted now-unsorted.");
		test.assert(sortedConditions[1].order, 1, "sorting already-sorted conditons made the second entry that was already sorted now unsorted");

		//TEST 1 -- Sorting an array that only has predicates with order defined (but those are out of order) will make them sorted! 
		//Changing the order from 0, 1, 2 -----> 1,2,0
		conditions[0].order = 1;
		conditions[1].order = 2;
		conditions[2].order = 0;
		sortedConditions = ruleLibrary.sortConditionsByOrder(conditions);
		test.assert(sortedConditions.length, 3, "sorting NOT-sorted conditions somehow changed the length");
		test.assert(sortedConditions[0].order, 0, "sorting NOT-sorted conditions -- index 0 not sorted correctly.");
		test.assert(sortedConditions[1].order, 1, "sorting NOT-sorted conditons -- index 1 not sorted correctly");
		test.assert(sortedConditions[2].order, 2, "sorting NOT-sorted conditons -- index 2 not sorted correctly");

		//TEST 2 -- Sorting an array that doesn't have any any predicates with order defined should not change anything.
		conditions[0].order = undefined;
		conditions[1].order = undefined;
		conditions[2].order = undefined;
		sortedConditions = ruleLibrary.sortConditionsByOrder(conditions);
		test.assert(sortedConditions.length, 3, "sorting conditions with undefined orders somehow changed the length");
		test.assert(sortedConditions[0].second, "me", "When order is undefined, the first index got moved out of place somehow");
		test.assert(sortedConditions[1].second, "destinedToLove", "When order is undefined, the second index got moved out of place somehow");
		test.assert(sortedConditions[2].second, "whatever", "When order is undefined, the third index got moved out of place somehow");


		//TEST 3 -- What if some conditions have order defined, and others don't?
		conditions[0].order = 1;
		conditions[1].order = undefined;
		conditions[2].order = 0;
		sortedConditions = ruleLibrary.sortConditionsByOrder(conditions);
		test.assert(sortedConditions[0].order, undefined, "The one with order undefined should now be first but it wasn't");
		test.assert(sortedConditions[1].order, 0, "When order and unordered are mixed, the 2nd entry didn't get sorted.");
		test.assert(sortedConditions[2].order, 1, "When order and unordered are mixed, the 3rd entry didn't get sorted.");

		//TEST 4 -- What if the conditions don't follow each other directly numericaly?
		conditions[0].order = 10;
		conditions[1].order = 5;
		conditions[2].order = 7;
		sortedConditions = ruleLibrary.sortConditionsByOrder(conditions);
		test.assert(sortedConditions[0].order, 5, "When order numbers aren't directy following each other, 1st entry was wrong.");
		test.assert(sortedConditions[1].order, 7, "When order numbers aren't directy following each other, 2nd entry was wrong.");
		test.assert(sortedConditions[2].order, 10, "When order numbers aren't directy following each other, 3rd entry was wrong.");

		//TEST 5 -- What if conditions don't follow each other numerically, AND some things are undefined?
		conditions[0].order = 8;
		conditions[1].order = undefined;
		conditions[2].order = 4;
		sortedConditions = ruleLibrary.sortConditionsByOrder(conditions);
		test.assert(sortedConditions[0].order, undefined, "When orders don't directly follow each other, And one thing is undefined, 1st entry was wrong.");
		test.assert(sortedConditions[1].order, 4, "When orders don't directly follow each other, And one thing is undefined, 2nd entry was wrong.");
		test.assert(sortedConditions[2].order, 8, "When orders don't directly follow each other, And one thing is undefined, 1st entry was wrong.");

		test.finish();
	};

	var testPredicateToEnglish = function() {
		test.start("RuleLibrary", "testPredicateToEnglish");
		ensemble.loadBaseBlueprints(testSocial);

		test.assert(ruleLibrary.predicateToEnglish({
			"category": "relationship",
			"type": "involved with",
			"first": "bob",
			"second": "al"
		}).text, "bob is involved with al", "Directed/reciprocal boolean.");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "network",
			"type": "affinity",
			"first": "bob",
			"second": "al",
			"value": "75"
		}).text, "bob has exactly 75 affinity for al", "Directed/reciprocal numeric.");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "status",
			"type": "happy",
			"first": "bob"
		}).text, "bob is happy", "Undirected boolean.");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "status",
			"type": "happy",
			"first": "bob",
			"value": false
		}).text, "bob is not happy", "Undirected boolean (negated).");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "attribute",
			"type": "strength",
			"first": "bob",
			"value": "12"
		}).text, "bob has exactly 12 strength", "Undirected numeric.");

		test.assert(ruleLibrary.predicateToEnglish({
			"category": "attribute",
			"type": "strength",
			"first": "bob",
			"value": "12",
			"operator": "="
		}).text, "bob has exactly 12 strength", "Undirected numeric, equal.");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "attribute",
			"type": "strength",
			"first": "bob",
			"value": "12",
			"operator": ">"
		}).text, "bob has more than 12 strength", "Undirected numeric, >.");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "network",
			"type": "affinity",
			"first": "bob",
			"second": "carl",
			"value": "50",
			"operator": "<"
		}).text, "bob has less than 50 affinity for carl", "Directed numeric, <.");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "attribute",
			"type": "strength",
			"first": "bob",
			"value": "4",
			"operator": "+"
		}).text, "bob has 4 more strength", "Undirected numeric, +.");

		test.assert(ruleLibrary.predicateToEnglish({
			"category": "relationship",
			"type": "involved with",
			"first": "bob",
			"second": "al",
			"weight": "5",
			"intentType": true
		}).text, "bob has more volition ( +5 ) to become involved with al", "Directed/reciprocal boolean, positive intent.");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "relationship",
			"type": "involved with",
			"first": "bob",
			"second": "al",
			"weight": "-5",
			"intentType": false
		}).text, "bob has less volition ( -5 ) to stop being involved with al", "Directed/reciprocal boolean, negative intent");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "network",
			"type": "affinity",
			"first": "bob",
			"second": "al",
			"weight": "7",
			"intentType": true
		}).text, "bob has more volition ( +7 ) to increase affinity for al", "Directed/reciprocal numeric, positive intent.");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "network",
			"type": "affinity",
			"first": "bob",
			"second": "al",
			"weight": "7",
			"intentType": false
		}).text, "bob has more volition ( +7 ) to decrease affinity for al", "Directed/reciprocal numeric, negative intent.");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "status",
			"type": "lonely",
			"first": "bob",
			"weight": "2",
			"intentType": true
		}).text, "bob has more volition ( +2 ) to become lonely", "Undirected boolean, positive intent.");

		test.assert(ruleLibrary.predicateToEnglish({
			"category": "socialRecordLabel",
			"type": "romanticFailure",
			"first": "bob",
			"second": "al",
			"value": true
		}).text, "bob did something romanticFailure to al", "cloneEachTimeStep false.");

		// Past tense!
		// We assume predicateToEnglish will only be called with correctly preloaded predicates, where turnsAgoBetween has been auto-sorted low to high (i.e. smaller number always first).
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "status",
			"type": "happy",
			"first": "bob",
			"value": true,
			"turnsAgoBetween": [0, 0]
		}).text, "bob is happy", "turnsAgoBetween 0-->0");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "status",
			"type": "happy",
			"first": "bob",
			"value": true,
			"turnsAgoBetween": ["NOW", "NOW"]
		}).text, "bob is happy", "turnsAgoBetween NOW-->NOW");		
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "status",
			"type": "happy",
			"first": "bob",
			"value": true,
			"turnsAgoBetween": ["NOW", 1]
		}).text, "bob has been happy sometime between 0 and 1 turns ago", "turnsAgoBetween NOW-->1");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "status",
			"type": "happy",
			"first": "bob",
			"value": true,
			"turnsAgoBetween": ["NOW", 3]
		}).text, "bob has been happy sometime between 0 and 3 turns ago", "turnsAgoBetween NOW-->3");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "status",
			"type": "happy",
			"first": "bob",
			"value": true,
			"turnsAgoBetween": [1, 4]
		}).text, "bob was happy sometime between 1 and 4 turns ago", "turnsAgoBetween 1-->4");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "status",
			"type": "happy",
			"first": "bob",
			"value": true,
			"turnsAgoBetween": [5, "START"]
		}).text, "bob was happy sometime up until 5 turns ago [ 5 , START ]", "turnsAgoBetween 5-->START");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "status",
			"type": "happy",
			"first": "bob",
			"value": true,
			"turnsAgoBetween": ["NOW", "START"]
		}).text, "bob has been happy at any point [ 0 , START ]", "turnsAgoBetween NOW-->START");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "status",
			"type": "happy",
			"first": "bob",
			"value": true,
			"turnsAgoBetween": ["START", "START"]
		}).text, "bob was happy at the very beginning [ START , START ]", "turnsAgoBetween NOW-->START");

		test.assert(ruleLibrary.predicateToEnglish({
			"category": "status",
			"type": "happy",
			"first": "bob",
			"value": false,
			"turnsAgoBetween": ["NOW", 1]
		}).text, "bob has been not happy sometime between 0 and 1 turns ago", "turnsAgoBetween with false NOW-->1");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "network",
			"type": "affinity",
			"first": "bob",
			"second": "carl",
			"value": "50",
			"operator": "<",
			"turnsAgoBetween": ["NOW", "START"]
		}).text, "bob has had less than 50 affinity for carl at any point [ 0 , START ]", "turns ago between with directed numeric.");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "network",
			"type": "affinity",
			"first": "bob",
			"second": "carl",
			"value": "50",
			"operator": "<",
			"turnsAgoBetween": [5, 10]
		}).text, "bob had less than 50 affinity for carl sometime between 5 and 10 turns ago", "turns ago between in past with directed numeric.");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "socialRecordLabel",
			"type": "romanticFailure",
			"first": "bob",
			"second": "al",
			"value": true,
			"turnsAgoBetween": [2, 4]
		}).text, "bob did something romanticFailure to al sometime between 2 and 4 turns ago", "socialRecordlabel turnsAgoBetween, 2-->4");
		test.assert(ruleLibrary.predicateToEnglish({
			"category": "socialRecordLabel",
			"type": "romanticFailure",
			"first": "bob",
			"second": "al",
			"value": false,
			"turnsAgoBetween": [2, "START"]
		}).text, "bob did not do something romanticFailure to al sometime up until 2 turns ago [ 2 , START ]", "socialRecordlabel turnsAgoBetween, 2-->4");

		test.finish();
	};

	var testPredicateDefaults = function(){
		test.start("RuleLibrary", "testPredicateDefaults");
		//We're going to test "Innocent Until Proven GuiltY"
		//This means that we have a boolean thing that 'defaults' to true.
		var defaultTruePred = {};
		defaultTruePred.category = "defaultTrueTrait";
		defaultTruePred.type = "innocent";
		defaultTruePred.defaultValue = true;
		defaultTruePred.isBoolean = true;
		socialRecord.registerIsBoolean(defaultTruePred);
		socialRecord.registerDefault(defaultTruePred);

		var defaultFalsePred = {};
		defaultFalsePred.category = "defaultFalseTrait";
		defaultFalsePred.type = "guilty";
		defaultFalsePred.defaultValue = false;
		defaultFalsePred.isBoolean = true;
		socialRecord.registerIsBoolean(defaultFalsePred);
		socialRecord.registerDefault(defaultFalsePred);

		var searchPredicate = {};
		searchPredicate.first = "doc";
		searchPredicate.category = "defaultTrueTrait";
		searchPredicate.type = "innocent";
		searchPredicate.value = true;

		var searchPredicate2 = {};
		searchPredicate2.first = "doc";
		searchPredicate2.category = "defaultFalseTrait";
		searchPredicate2.type = "guilty";

		var results;

		results = ensemble.get(searchPredicate);

		//"INNOCENT UNTIL PROVEN GULTY TEST" -- default value if not in socialRecord is true.
		//TEST 0 -- The search predicate has value speensembleied as true -- should return true.
		test.assert(results.length, 1, "The default value of Innocent is true. Searching for true should have returned true, even though it wasn't specified in the socialRecord.");
		
		//"INNOCENT UNTIL PROVEN GULTY TEST" -- default value if not in socialRecord is true.
		//TEST 0.5 -- The search predicate has the vlaue specified as false -- should return false.
		searchPredicate.value = false;
		results = ensemble.get(searchPredicate);
		test.assert(results.length, 0, "The default value of innocent is true. Searching for true should have returned false");

		//"INNOCENT UNTIL PROVEN GULTY TEST" -- default value if not in socialRecord is true.
		//TEST 1 -- The search predicate doesn't HAVE a value specified. Should return TRUE
		//Becuase this assumes that people who don't specify a value are actually always searching for true.
		//TODO: Double super check that this IS in fact the kind of behavior that we want.
		searchPredicate.value = undefined;
		results = ensemble.get(searchPredicate);
		test.assert(results.length, 1, "TROUBLE ONE The default value of innocent is true. Searching without value specified should have returned true");

		//TEST 2 -- Default value if not in socialRecord is false. Search predicate value is true, should return false.
		searchPredicate2.value = true;
		results = ensemble.get(searchPredicate2);
		test.assert(results.length, 0, "The default value of guilty is false. Searching for value true should return false.");

		//TEST 2.1 -- Default value if not in socialRecord is false. Search predicate value is false. Should return true.
		searchPredicate2.value = false;
		results = ensemble.get(searchPredicate2);
		test.assert(results.length, 1, "The default value of guilty is false. Searching for value false should return true");

		//TEST 2.2 -- Default value if not in socialRecord is false. Search predicate value is undefined. Should return false
		//TODO: CONFIRM THAt THIS IS THE FUNCTIONALITY WE WANT: Assume that if value in search predicate is not specified, we are searching for true.
		searchPredicate2.value = undefined;
		results = ensemble.get(searchPredicate2);
		test.assert(results.length, 0, "The default value of guilty if false. Searching without value specified is the same as searching for true. Should return false");

		test.finish();
	};

	var testCalculateVolitionWithParams = function(){
		test.start("RuleLibrary", "calcVolitionW/Params");
		
		var rules = [
			{
				"name": "Attraction makes people want to start dating.",
				"conditions": [
					{
						"category": "directedStatus",
						"type": "attracted to",
						"first": "x",
						"second": "y",
						"value" : true
					}
				],
				"effects": [
					{
						"category": "relationship",
						"type": "involved with",
						"first": "x",
						"second": "y",
						"weight": 5,
						"intentType": true
					}
				]

			}
			];
		ensemble.loadBaseBlueprints(testSocial);
		ruleLibrary.clearRuleLibrary(); // Let's first clear out everything from the rule set, and start afresh.
		ruleLibrary.addRuleSet("volitionRules", rules);


		//TEST 1 -- specifying timeStep in the params
		//We'll test this by making people attracted to each other time step 0, taking it away time step 1.
		//so when we calculate volition (with no params, there should be one entry at first, and no entries second.
		//Then we'll do it again, setting the timeStep param to be 0 at first (which should return a volition), and then 1 (which shouldn't)


		var attractedTo = {
			"category": "status",
			"type": "injured",
			"first": "brick"
		};
		var attractedToTimestep0 = {
			"category": "directedStatus",
			"type" : "attracted to",
			"first": "alex",
			"second": "brick",
			"value" : true
		};
		var attractedToTimestep1 = {
			"category": "directedStatus",
			"type" : "attracted to",
			"first": "alex",
			"second": "brick",
			"value" : false
		};

		//set up the next time step (going from 0 to 1)
		//socialRecord.setupNextTimeStep();

		var newCast = ["alex", "brick", "clyde"];

		socialRecord.set(attractedToTimestep0);
		var volitionTest = ruleLibrary.calculateVolition(newCast);
		var alexToBrickVolition = volitionTest.getFirst("alex", "brick");
		console.log("ALEX TO BRICK VOLITIOON " , alexToBrickVolition);
		test.assert(alexToBrickVolition.weight, 5, "TEST 1 phase 1 - weight was unexpected.");
		test.assert(alexToBrickVolition.type, "involved with", "TEST 1 phase 1 - type was unexpected.");

		//set up the next time step (going from 0 to 1)
		socialRecord.setupNextTimeStep();

		//TEST 1 PHASE 2
		//add our new predicate (alex is no longer attracted to brick) - no volitionsn should fire.
		socialRecord.set(attractedToTimestep1);
		volitionTest = ruleLibrary.calculateVolition(newCast);
		alexToBrickVolition = volitionTest.getFirst("alex", "brick");
		console.log("ALEX AT STAGE TWO: " , alexToBrickVolition);
		test.assert(alexToBrickVolition, undefined, "TEST 1 phase 2 alex had a volition towards brick, even when they shouldn't have");
		
		var params = {};
		params.timeStep = 0;

		//TEST 1 PHASE 3
		//Now we're going to try the same thing with the same social record, but hopefully only look up to timestep 0!
		volitionTest = ruleLibrary.calculateVolition(newCast, params);
		alexToBrickVolition = volitionTest.getFirst("alex", "brick");
		console.log("ALEX AT STAGE THREE: " , alexToBrickVolition);
		test.assert(alexToBrickVolition.weight, 5, "TEST 1 phase 3 - weight was unexpected.");
		test.assert(alexToBrickVolition.type, "involved with", "TEST 1 phase 3 type was unexpected.");

		//TEST 1 PHASE 4
		//Now, finally we're going to set the params timestep to 1, which should make it undefined again.
		params.timeStep = 1;
		volitionTest = ruleLibrary.calculateVolition(newCast, params);
		alexToBrickVolition = volitionTest.getFirst("alex", "brick");
		console.log("ALEX AT STAGE FOUR: " , alexToBrickVolition);
		test.assert(alexToBrickVolition, undefined, "TEST 1 phase 4 alex had a volition towards brick, even when they shouldn't have");


		test.finish();
	}

	/***************************************************************/
	/* INTERFACE */
	/***************************************************************/

	var ruleLibraryUnitTestInterface = {
		runTests: runTests
	};

	return ruleLibraryUnitTestInterface;

});