/**
* This has all of the unit tests that test functions that are from SFDB.js
*/
define(["underscore", "util", "jquery", "cif", "sfdb", "test", "validate", "text!data/testSocial.json"], function(_, util, $, cif, sfdb, test, validate, testSocial) {


/**
 * Run the provided test functions
 *
 * @method runTests
 * @memberof SFDB
 */
	var runTests = function(){
		testSetupNextTimeStep();
		sfdb.clearEverything();
		testSet();
		sfdb.clearEverything();
		testGet();
		sfdb.clearEverything();
		testPutCharacterOffstage();
		sfdb.clearEverything();
		testPutCharacterOnstage();
		sfdb.clearEverything();
		testEliminateCharacter();
	};

/**
 * testSfdbHistoryToString();
 * Test the use of sfdbHistoryToString() Beause this is just a diagnostic thing, it isn't really of the
 * utmost importance that we keep these unit tets up to date. All the same, I think this will prove to be a useful
 * thing to have!
 *
 *
 */
 	// *** We probably don't need a test here since it's just a debugging/utility function.
	// var testSfdbHistoryToString = function(){
	// 	test.start("SFDB", "testSfdbHistoryToString");
	// 	cif.loadBaseBlueprints(testSocial);

	// 	//let's put some things in the sfdb
	// 	var pred1 = validate.triggerEffect({
	// 		"class": "relationship",
	// 		"type": "friends",
	// 		"value": true,
	// 		"first": "clara",
	// 		"second": "doc"
	// 	}, "testSfdbHistoryToString setting pred1");

	// 	set(pred1, 0);

	// 	var sfdbContents = sfdbHistoryToString(0);

	// 	var expectedContent = "" +
	// 	"******SFDB At Time 0********\n" +
	// 	"<PREDICATE 0>\n" +
	// 	"class: relationship\n" +
	// 	"type: friends\n" +
	// 	"first: clara\n" +
	// 	"second: doc\n" +
	// 	"value: true\n" +
	// 	"---------------------------\n" +
	// 	"<PREDICATE 1>\n" +
	// 	"class: relationship\n" +
	// 	"type: friends\n" +
	// 	"first: doc\n" +
	// 	"second: clara\n" +
	// 	"value: true\n" +
	// 	"---------------------------\n" +
	// 	"Total Length: 2\n" +
	// 	"******************************";

	// 	//TEST 1 -- Make sure that a relationship predicate is handled appropriately when we print it to a string.
	// 	test.assert(sfdbContents, expectedContent, "actual contents of sfdb differ from expected content of sfdb");

	// 	test.finish();
	// };

/**
 * Test the use of setupNextTimeStep
 *
 * @method testSetupNextTimeStep
 * @memberof SFDB
 */
	var testSetupNextTimeStep = function(){
		var tempTimeStep = 5;
		cif.loadBaseBlueprints(testSocial);

		//Create a sample test predicate
		var testPred = validate.triggerEffect({
			"class": "status",
			"type": "happy",
			"first": "doc",
			"value": true
		}, "testSetupNextTimeStep setting testPred");

		var defaultDuration = 6;

		//The call itself
		sfdb.setupNextTimeStep(tempTimeStep); // should make the sfdb the length of tempTimeStep

		//Insert our test predicate into the SFDB
		sfdb.set(testPred);

		//TEST 1 -- the time step was successfully updated
		test.start("SFDB", "testSetupNextTimeStep");
		test.assert(sfdb.getCurrentTimeStep(), tempTimeStep, "currentTimeStep did not update properly.");

		//TEST 2 -- The SFDB has grown to the appropriate size
		test.assert(sfdb.getLength(), tempTimeStep+1, "sfdb.length was not the same as timeStep+1.");

		//TEST 3 -- Passing in a time that is IN THE PAST does NOT reset the current time step.
		// This is no longer true since we can now move backwards in time to an earlier state, so this has been commented out.
		// var oldCurrentTimeStep = currentTimeStep;
		// setupNextTimeStep(tempTimeStep - 10); // 10 turns earlier!
		// test.assertGTE(currentTimeStep, oldCurrentTimeStep, "currentTimeStep should be >= previous time step.");

		//TEST 4 -- Check expiresAfter
		sfdb.setupNextTimeStep(7); //move to turn 7
		var p = sfdb.get(testPred, 0, 0);
		test.assert(p.length, 1, "two turns after something with duration 6 was set, it should not have expired (1/2).");
		test.assert(p.length > 0 && p[0].value, true, "two turns after something with duration 6 was set, it should not have expired. (2/2)");
		// test.assert(p[0].duration, 4, "two turns after something with duration 6 was set, its duration should be 4.");

		sfdb.setupNextTimeStep(10); 
		p = sfdb.get(testPred, 0, 0);
		test.assert(p.length, 1, "five turns after something with duration 6 was set, it should not have expired. (1/2)");
		test.assert(p.length > 0 && p[0].value, true, "five turns after something with duration 6 was set, it should not have expired. (2/2)");

		sfdb.setupNextTimeStep(); 
		p = sfdb.get(testPred, 0, 0);
		test.assert(p.length, 0, "six turns after something with duration 6 was set, there should no longer be a match.");

		p = sfdb.get(testPred, 1, 1);
		test.assert(p.length > 0 && p[0].value, true, "six turns after something with duration 6 was set, there should be a match one turn in the past.");

		p = sfdb.get(testPred, 6, 6);
		test.assert(p.length > 0 && p[0].value, true, "six turns after something with duration 6 was set, there should be a match six turns in the past.");

		p = sfdb.get(testPred, 7, 7);
		test.assert(p.length === 0, true, "six turns after something with duration 6 was set, there should not be a match seven turns in the past.");


		// This should work if we use turnsAgoBetween in predicates, too.
		sfdb.clearHistory();
		sfdb.setupNextTimeStep(); // Advance to next turn
		sfdb.set({
			"class": "relationship",
			"type": "friends",
			"first": "alice",
			"second": "bob",
			"value": true
		});
		// It should be true that they were not friends a turn ago.
		var pred = validate.triggerCondition({
			"class": "relationship",
			"type": "friends",
			"first": "alice",
			"second": "bob",
			"value": false,
			"turnsAgoBetween": [1, 1],
		});
		var evaluationResult = sfdb.get(pred);
		test.assert(evaluationResult.length, 1, "ruleLibrary.evaluateCondition - turnsAgoBetween should correctly let you identify a false prior state if there's no record.");


		test.finish();
	};

/**
 * Test the use of the set function
 *
 * @method testSet
 * @memberof SFDB
 */
	var testSet = function(){
		cif.loadBaseBlueprints(testSocial);
		//Create a sample test predicate
		var testPred = validate.triggerEffect({
			"class": "relationship",
			"type": "friends",
			"first": "doc",
			"second": "vanessa",
			"value": true,
		}, "testSet setting testPred");

		var testPredTwo = validate.triggerEffect({
			"class": "network",
			"type": "affinity",
			"first": "doc",
			"second": "reggie",
			"value": 75
		}, "testSet setting testPredTwo");

		var testPredThree = validate.triggerEffect({
			"class": "directedStatus",
			"type": "attracted to",
			"first": "reggie",
			"second": "doc",
			"value": true
		}, "testSet setting testPredThree");

		var testTimeStamp = 0;
		

		//Adding predicates to the SFDB.
		var numPredicatesAdded = 2; // starts off at two, since the first predicate we enter in is a relationship predicate.
		sfdb.set(testPred);

		test.start("SFDB", "testSet");
		//TEST ONE -- setting the first thing in the SFDB.
		test.assert(sfdb.getLengthAtTimeStep(0), numPredicatesAdded, "length of SFDB is incorrect.");

		numPredicatesAdded = numPredicatesAdded + 1;
		sfdb.set(testPredTwo);


		//TEST TWO-- setting a second predicate at a previously established time step 0
		test.assert(sfdb.getLengthAtTimeStep(0), numPredicatesAdded, "length of SFDB is incorrect after setting a second predicate.");

		//TEST THREE -- setting a predicate at a new time step when time step 0 has things in it already.
		//--->Is current time updated?
		sfdb.setupNextTimeStep()
		sfdb.set(testPredThree);
		numPredicatesAdded = numPredicatesAdded + 1;
		test.assert(sfdb.getCurrentTimeStep(), testTimeStamp + 1, "currentTime did not get updated");

		//TEST FOUR -- checking the length across time steps
		//---> We added 2 predicates at timeStep 0, and 1 predicate at timeStep 1. That means that at timeStep 1 we should have three total
		//---> The two from time step 0 that we cloned, and the 1 additional one that we added.
		test.assert(sfdb.getLengthAtTimeStep(testTimeStamp+1), numPredicatesAdded, "Length across time steps fail.");



		//TEST FIVE -- setting a predicate that already exists at that time step doesn't increase the length.
		sfdb.set(testPredThree); // we don't increment numPredicatesAdded, because we dont think that we actually added anything'
		test.assert(sfdb.getLengthAtTimeStep(testTimeStamp+1), numPredicatesAdded, "duplicate predicate pushed to SFDB");

		//TEST SIX -- trying to change a predicate's value when that predicate doesn't exist.
		var testPredFour = validate.triggerEffect({
			"class": "network",
			"type": "trust",
			"first": "reggie",
			"second": "doc",
			"value": 10,
			"operator": '+'
		}, "testSet setting testPredFour");

		sfdb.set(testPredFour);

		testPredFour.operator = "=";
		testPredFour.value = 60; //	the default is 50, so when we pass this in, the predicate will be made, stored, and given a value of 60 (50+10)
		testPredFour = validate.triggerCondition(testPredFour, "testSet setting modified testPredFour (1)");

		var result = sfdb.get(testPredFour, 0, 0);
		test.assert(result[0].value, 60, "failed to ADD new predicate to sfdb using defaultValues and the operator set mode.");

		//TEST SEVEN -- changing a predicate's value.
		sfdb.clearHistory();
		var testPredFourB = validate.triggerEffect({
			"class": "network",
			"type": "trust",
			"first": "reggie",
			"second": "doc",
			"value": 60,
		}, "testSet setting testPredFourB");

		sfdb.set(testPredFourB);
		
		testPredFourB.operator = "+"
		testPredFourB.value = -20;
		testPredFourB = validate.triggerEffect(testPredFourB, "testSet setting modified testPredFourB");
		var results = sfdb.set(testPredFourB);
		delete testPredFourB.value;
		delete testPredFourB.operator;

		var results = sfdb.get(testPredFourB, 0, 0);
		test.assert(results[0].value, 40, "failed to SUBTRACT from a predicate using the operator set mode.");

		//TEST EIGHT -- make sure reciprocal setting works

		var testPredFive = validate.triggerEffect({
			"class": "relationship",
			"type": "involved with",
			"first": "vanessa",
			"second": "doc",
			"value": true
		}, "testSet setting testPredFive");
		sfdb.set(testPredFive);

		var testPredSix = util.clone(testPredFive);
		testPredSix.first = "doc";
		testPredSix.second = "vanessa";
		testPredSix = validate.triggerCondition(testPredSix, "testSet setting testPredSix");

		//	should return an array of length 1 with the reciprocal of testPredFive (which is testPredSix)
		test.assert(sfdb.get(testPredSix, 0, 0).length, 1, "failed to set reciprocal person in sfdb.");

		//TEST NINE -- make sure reciprocal updating works

		testPredFive.value = false;
		sfdb.set(testPredFive);

		testPredSix.value = false;
		var result = sfdb.get(testPredSix, 0, 0);
		test.assert(result.length, 1, "failed to update reciprocal person in sfdb.");

		// Verify that if we set a reciprocal value to false, it overrides a reciprocal assertion.
		sfdb.clearHistory();
		var testPredFriends = validate.triggerCondition({
			"class": "relationship",
			"type": "friends",
			"first": "bob",
			"second": "al"
		}, "testSet setting final recip check");
		sfdb.set(testPredFriends);
		sfdb.setupNextTimeStep();
		testPredFriends.value = false
		sfdb.set(testPredFriends);
		var result = sfdb.get({"first": "al"}, 0, 0);
		test.assert(result.length, 1, "We expect reciprocal values to update correctly, not leaving duplicate records behind.");

		//TEST 10 -- SFDBLabel work
		//SFDBLabels are strange beasts, because they get entered into the SFDB when they happen
		//but they DON'T get cloned (unlike other aspects of social state, they don't represent "this is the current state")
		//but rather they represent "This is what happeend, and this is when it happened".

		var sfdbLabelPred = validate.triggerEffect({
			"class": "SFDBLabel",
			"type": "romanticFailure",
			"first": "reggie",
			"second": "doc",
			"value": true,
		}, "testSet setting sfdbLabelPred");

		var tempBluePrint = {
			"class" : "SFDBLabel",
			"duration" : 0
		};

		sfdb.registerDuration(tempBluePrint);

		//ok, let's put our sfdb label into the sfdb!
		sfdb.set(sfdbLabelPred);
		test.assert(sfdb.get(sfdbLabelPred, 0, 0).length, 1, "even after JUST inserting an sfdbLabelPred, we failed to 'get' it back again");

		//and for kicks, let's add a NEW thing to the NEXT time step, to make sure that
		//the sfdbLabel DIDN'T get cloned to the new timestep!
		sfdb.setupNextTimeStep();
		sfdb.set(testPredFive);
		test.assert(sfdb.get(sfdbLabelPred, 0, 0).length, 0, "We don't want the sfdbLabel predicate to be here now, because we've advanced a timestep. Seeing it here would mean that it cloned.");

		//sfdbLabelPred
		//

		test.finish();
	};

/**
 * Test the use of the get function
 *
 * @method testGet
 * @memberof SFDB
 */
	var testGet = function(){
		cif.loadBaseBlueprints(testSocial);

		//Create a sample test predicate
		var testPred = validate.triggerEffect({
			"class": "relationship",
			"type": "friends",
			"first": "doc",
			"second": "vanessa",
			"value": true
		}, "testGet setting testPred");

		var testPredTwo = validate.triggerEffect({
			"class": "network",
			"type": "affinity",
			"first": "doc",
			"second": "reggie",
			"value": 75,
		}, "testGet setting testPredTwo");

		var testPredThree = validate.triggerEffect({
			"class": "directedStatus",
			"type": "attracted to",
			"first": "reggie",
			"second": "doc",
			"value": true
		}, "testGet setting testPredThree");

		var sfdbLabelPred = validate.triggerEffect({
			"class": "SFDBLabel",
			"type": "romantic advance",
			"first": "reggie",
			"second": "doc",
			"value": true
		}, "testGet setting sfdbLabelPred");

		var testPredFour = validate.triggerEffect({
			"class": "network",
			"value": 75,
			"type": "trust",
			"first": "simon",
			"second": "monica"
		}, "testGet setting testPredFour");

		var testPredFive = validate.triggerEffect({
			"class": "network",
			"type": "trust",
			"first": "monica",
			"second": "simon",
			"value": 30
		}, "testGet setting testPredFive");

		//Populate the SFDB with our test predicates
		sfdb.set(testPred);
		sfdb.set(testPredTwo);
		sfdb.setupNextTimeStep();
		sfdb.set(testPredThree);
		sfdb.set(testPredFour);
		sfdb.set(testPredFive);

		test.start("SFDB", "testGet");

		//TEST 1
		//---> When given a very specific predicate to search for, is it able to find it?
		//---> Least and Most recent time to search for is both 0 i.e. checking the present.
		var testSearchPred = validate.triggerCondition({
			"class": "relationship",
			"type": "friends",
			"first": "doc",
			"second": "vanessa",
			"value": true
		}, "testGet setting testSearchPred");
		var getResults = sfdb.get(testSearchPred, 0, 0);
		test.assert(getResults.length, 1, "Getting a single match at current time step Failed. Expecting length 1, got length " + getResults.length);


		//TEST 1.5
		//-->Checking to see that the thing that was matched in Test 1 actually makes sense/is what we want!
		var match = getResults[0]; // if the previous test is true, then this will work. If the previous test fails, you can't trust this one either.'
		test.assert(match.class, testSearchPred.class, "the contents of the returned match's CLASS when looking at the current time step was wrong");
		test.assert(match.type, testSearchPred.type, "the contents of the returned match's TYPE when looking at the current time step was wrong");
		test.assert(match.first, testSearchPred.first, "the contents of the returned match's FIRST when looking at the current time step was wrong");
		test.assert(match.second, testSearchPred.second, "the contents of the returned match's SECOND when looking at the current time step was wrong");

		//TEST 2
		//---> When expanding the window to be beyond a single time step, we don't want to return
		//multiple matches of the same predicate
		getResults = sfdb.get(testSearchPred, 0, 1);
		test.assert(getResults.length, 1, "Getting a single match with a range for time step Failed. Expecting length 1, got length " + getResults.length);

		//TEST 2.5
		//--->Checking to see that the thing that was matched in Test 2 actually makes sense/is what we want!
		match = getResults[0]; // if the previous test is true, then this will work. If the previous test fails, you can't trust this one either.'
		test.assert(match.class, testSearchPred.class, "the contents of the returned match for CLASS when looking at a range for the time step was wrong.");
		test.assert(match.type, testSearchPred.type, "the contents of the returned match for TYPE when looking at a range for the time step was wrong.");
		test.assert(match.first, testSearchPred.first, "the contents of the returned match for FIRST when looking at a range for the time step was wrong.");
		test.assert(match.second, testSearchPred.second, "the contents of the returned match for SECOND when looking at a range for the time step was wrong.");

		//TEST 3
		//--->When given a partial predicate, does it successfully match all of the predicates in the SFDB that it should?
		testSearchPred = {
			"first": "doc"
		};
		getResults = sfdb.get(testSearchPred, 0, 0);
		test.assert(getResults.length, 2, "Getting multiple matches with a partial predicate at time step 0 failed.");

		//TEST 3.5
		//Same as Test 3, but using a windowed history -- result shouldn't differ'
		getResults = sfdb.get(testSearchPred, 0, 1);
		test.assert(getResults.length, 2, "Getting multiple matches using partial predicates with a windowed time step failed. Expected length 2, got length " + getResults.length);

		//TEST 4
		//--->What about a partial predicate that only matches one thing?
		testSearchPred = {
			"class": "relationship"
		};
		// should match TWO predicates (because we are looking at a relationship, which--since it is recipricol--ends up getting a duplicate entry in the sfdb)
		getResults = sfdb.get(testSearchPred, 0, 0);
		test.assert(getResults.length, 2, "Getting a single match using partial predicate at time step 0 failed. Expected length 2, got length " + getResults.length);

		//TEST 4.5
		//-->Same as test 4 but looking at a window of things?
		getResults = sfdb.get(testSearchPred, 0, 1);
		test.assert(getResults.length, 2, "Getting a single match using partial predicate with windowed time steps failed. Expected length 1, got length " + getResults.length);

		//TEST 5
		//-->What happens when there is a search for something that ISN'T in the SFDB?'
		testSearchPred = {
			"class": "trait"
		};
		getResults = sfdb.get(testSearchPred, 0, 0);
		test.assert(getResults.length, 0, "Searching for something in the SFDB that shouldn't be there at time 0 failed. Expected length 0, got length " + getResults.length);

		//TEST 5.5
		//-->Same as test 5, but with a window
		getResults = sfdb.get(testSearchPred, 0, 1);
		test.assert(getResults.length, 0, "Searching for something in the SFDB that shouldn't be there with a windowed time failed. Expected length 0, got length " + getResults.length);

		//TEST 6
		//-->What happens when you give invalid inputs for the time window (e.g. negative? e.g. looking 1000 turns back on turn 2 of the game?)
		testSearchPred = {
			"first": "doc"
		};
		// should match... two predicates
		getResults= [];
		getResults = cif.get(testSearchPred, 0, 1000); // WAY further back than it should be?
		test.assert(getResults.length, 2, "Going back before time 0 in the SFDB failed. Expected length 2, got length " + getResults.length);

		//TEST 6.5
		//-->Same as Test 6 but with a negative number as an input)
		getResults = cif.get(testSearchPred, -10, 1000); // WAY further back than it should be?
		test.assert(getResults.length, 2, "Using a negative number in get failed. Expected length 2, got length " + getResults.length);

		//TEST 6.75
		//-->Same as Test 6 but with the numbers reversed (bigger number in first slot, smaller number in second))
		getResults = [];
		getResults = cif.get(testSearchPred, 1000); // WAY further back than it should be?
		test.assert(getResults.length, 2, "Passing in a bigger number as the first parameter and a smaller number in the second parameter failed. Expected length 2, got length " + getResults.length);


		//TEST 7
		//-->Checking > operator for network values
		//-->Romance Network from Simon to Monica is 75
		//-->Monica to Simon is 30
		//Search Predicate: True if Simon's love for Monica is greater than 60
		testSearchPred = validate.triggerCondition({
			"class": "network",
			"type": "trust",
			"first": "simon",
			"second": "monica",
			"value": 60,
			"operator": ">"
		}, "testGet testSearchPred (2)");
		getResults = sfdb.get(testSearchPred, 0, 0);
		test.assert(getResults.length, 1, "Searching for network value with > operator failed -- should have found something but didn't");

		//TEST 7.5 -- same as 7, but changing the value to make it false
		testSearchPred.value = 90;
		getResults = sfdb.get(testSearchPred, 0, 0);
		test.assert(getResults.length, 0, "Searching for network value with > operator failed. Found something when it shouldn't have.'");

		//TEST 7.6 -- dealing with a case where testing for something that is HIGHER than what is true, but is LOWER than the default
		//should return false (because we were testing for something HIGHER than is  true (e.g. is it greater than 40, when in actuality it is 30)). Trust Monica-->Simon should be 30.
		testSearchPred.first = "monica";
		testSearchPred.second = "simon";
		testSearchPred.value = 40;
		getResults = sfdb.get(testSearchPred, 0, 0);
		test.assert(getResults.length, 0, "Searching for a network value with > operator failed. Searching for something higher than truth, but lower than default returned true, when should have returned false");

		//TEST 7.7 -- kind of a weird case -- similar to the above, but using a DIFFERENT NETWORK this time.
		//ASK -- this test is passing right now, but I feel like it is only because we are taking advantage
		//of the ordering that the dictionary items are regarded in, which seems pretty scary to me.
		var affinitySearchPred = util.clone(testSearchPred);
		affinitySearchPred.type = "affinity";
		getResults = sfdb.get(affinitySearchPred, 0, 0);
		test.assert(getResults.length, 1, "testing > operator. This network IS undefined in the sfdb, so we SHOULD look at the default value, which IS greater than 40, so SHOULD return true. Aparantly didn't happen, probably due to incorrect setting of 'mismatch' inside of get'");


		//TEST 8 checking the "<" operator for network values
		//--->Saving some time by re-using the testSearchPred defined for Test 7.
		testSearchPred.operator = "<";
		testSearchPred.first = "simon";
		testSearchPred.second = "monica";
		testSearchPred.value = 90;
		getResults = sfdb.get(testSearchPred, 0, 0);
		test.assert(getResults.length, 1, "Searching for network value with < operator failed. Should have found something but didn't.'");

		//TEST 8.5 checking the "<" operator for network values
		//--->Same as 8 but want it to NOT find something this time
		testSearchPred.value = 40;
		getResults = sfdb.get(testSearchPred, 0, 0);
		test.assert(getResults.length, 0, "Searching for network value with < operator failed. Found something when it shouldn't have");

		//TEST 8.6
		//Remember, Simon->Monica is 75.
		//What happens when we search for, say 60, i.e. LESS than the truth, but MORE than the default?
		//It SHOULD return false, yeah? Because we are checking to see if it is less than 60, but it is actually 75, which is
		//MORE than 60!
		testSearchPred.value = 60;
		getResults = sfdb.get(testSearchPred, 0, 0);
		test.assert(getResults.length, 0, "testing < operator, with a search value LESS than actual but MORE than default returnd true. It should return false");

		//TEST 8.7 -- kind of a weird case -- similar to the above, but using a DIFFERENT NETWORK this time.
		//ASK -- this test is passing right now, but I feel like it is only because we are taking advantage
		//of the ordering that the dictionary items are regarded in, which seems pretty scary to me.
		affinitySearchPred = util.clone(testSearchPred);
		affinitySearchPred.type = "affinity";
		getResults = sfdb.get(affinitySearchPred, 0, 0);
		test.assert(getResults.length, 1, "testing < operator. This network IS undefined in the sfdb, so we SHOULD look at the default value, which IS less than 60, so SHOULD return true. Aparantly didn't happen, probably due to incorrect setting of 'mismatch' inside of get'");

		//TEST 9 Checking the "=" operator for network values
		//-->Saving time by re-using the testSearchPred defined for Test 78
		testSearchPred.operator = "=";
		testSearchPred.value = 75;
		getResults = sfdb.get(testSearchPred, 0, 0);
		test.assert(getResults.length, 1, "Searching for network value with = operator failed. Should have found something but didn't.'");

		//TEST 9.5 -- same thing but want it to NOT find something
		testSearchPred.value = 74;
		getResults = sfdb.get(testSearchPred, 0, 0);
		test.assert(getResults.length, 0, "Searching for network value with = operator failed. Found something when it shouldn't have.'");

		//TEST 10 -- Dealing with defaultValues
		//If there is no record matching in the above
		//case, we want to return true: it's true that the given
		//character does not have the requsted info, b/c booleans default
		//to false.
		// condition = [];
		// conditions.push({"class": "status", "type": "injured", "first": "sal", "value": false});
		// evaluationResult = evaluateConditions(conditions);
		// test.assert(evaluationResult, true, "evaluateConditions should return true if you request a false boolean value with no record, since booleans default to false.");

		sfdb.clearHistory(); // we want to keep our registered defaultValues, but clear out all of the 'events' from the sfdb.
		getResults = sfdb.get(testPred, 0, 0);
		test.assert(getResults.length, 0, "Default values of booleans are FALSE, we were looking for something TRUE, but the sfdb was empty, so should have returned false!");

		//Looking for a boolean with a value of false that ISN'T in the sfdb
		sfdb.clearHistory();
		var falseBoolPred = validate.triggerCondition({
			"class": "relationship",
			"type": "friends",
			"first": "clara",
			"second": "reggie",
			"value": false
		}, "testGet setting falseBoolPred");
		getResults = sfdb.get(falseBoolPred, 0, 0);
		test.assert(getResults.length, 1, "we looked for something which, though technically not there, SHOULD still have been flagged as true due to default, but we didn't'.");

		//We do a search to see if something is FALSE when in the SFDB it is stored as true (should return false);
		sfdb.clearHistory();
		var trueBoolPred = util.clone(falseBoolPred);
		trueBoolPred.value = true;
		sfdb.set(trueBoolPred);
		getResults = sfdb.get(falseBoolPred, 0, 0);
		test.assert(getResults.length, 0, "we did a search for something that is FALSE when in the SFDB it is stored as true. Should have returned false");

		// TEST 10.5
		sfdb.clearHistory();
		var lurePred = validate.triggerCondition({
			"class": "relationship",
			"type": "friends",
			"first": "clara",
			"second": "dopey",
			"value": true
		}, "testGet setting lurePred");
		sfdb.set(lurePred);
		var falseBoolPred = validate.triggerCondition({
			"class": "relationship",
			"value": false,
			"type": "friends",
			"first": "clara",
			"second": "reggie",
		}, "testGet setting falseBoolPred2");
		getResults = sfdb.get(falseBoolPred, 0, 0);
		test.assert(getResults.length, 1, "Should work even if 'value' key is not last!");


		//TEST 11
		//-->Dealing with Numeric defaultValues.
		sfdb.clearHistory(); //we want to keep our registered defaultValues, but clear out all of the 'events' from the sfdb.
		var numericPred = validate.triggerCondition({
			"class": "network",
			"type": "trust",
			"first": "reggie",
			"second": "doc",
			"value": 30,
			"operator": "<"
		}, "testGet setting numericPred");
		getResults = sfdb.get(numericPred, 0, 0);
		test.assert(getResults.length, 0, "the default is 50 and we looked for something LESS than 30. We should have came up with nothing");

		//TEST 11.2
		//Let's try the greater than operator
		numericPred.operator = ">";
		getResults = sfdb.get(numericPred, 0, 0);
		test.assert(getResults.length, 1, "the default is 50 and we looked for something GREATER THAN 30. We should have found something (i.e. the default!)");

		//TEST 11.3
		//Let's try teh = operator
		numericPred.operator = "=";
		getResults = sfdb.get(numericPred, 0, 0);
		test.assert(getResults.length, 0, "the default is 50, and we looked for something EQUAL to 30. We should have found nothing.");


		// TEST 11.35
		// What if there's no operator?
		delete numericPred.operator;
		delete numericPred.value;
		getResults = cif.get(numericPred, 0, 0);
		test.assert(getResults.length === 1 && getResults[0].value === 50, true, "Empty search without both an operator and value specified should return a match with the default value.");

		//TEST 11.4 --11.5 are the same as 11.1-11.3, but with the value of 60.
		//So, things that used to fail should now succeed, and vice versa
		//Except for '=' which should still fail...
		numericPred.value = 60;
		numericPred.operator = "<";
		getResults = sfdb.get(numericPred, 0, 0);
		test.assert(getResults.length, 1, "the default is 50, and we are looking for something LESS than 60. We should have come up with the default!");

		//TEST 11.5 -- the ">" operator
		numericPred.operator = ">";
		getResults = sfdb.get(numericPred, 0, 0);
		test.assert(getResults.length, 0, "the default is 50, and we are looking for something GREATER than 60. We should have come up with nothing.");

		//TEST 11.6 -- testing the '=' operator in an instance where it should find a match!
		numericPred.value = 50;
		numericPred.operator = "=";
		getResults = sfdb.get(numericPred, 0, 0);
		test.assert(getResults.length, 1, "the default is 50, and we are looking to something EQUAL to 50, so we should have been OK with the default");

		//TEST 11.7 -- testing what happens when no operator is specified.
		numericPred.operator = "=";
		getResults = sfdb.get(numericPred, 0, 0);
		test.assert(getResults.length, 1, "When an operator isn't specified, default to the '=' sign. And here we are testing a case when it SHOULD be equal so length should be 1'");

		//TEST 11.8 -- testing what happens when no operator is specified and the values aren't equal
		numericPred.value = 40;
		getResults = sfdb.get(numericPred, 0, 0);
		test.assert(getResults.length, 0, "When an operator isn't specified, default to =. The numeric values weren't equal, so shouldn't have found anything'");

		//TEST 12 -- testing getting SFDB values
		sfdb.clearHistory();
		sfdb.set(sfdbLabelPred);
		sfdb.setupNextTimeStep();
		sfdb.set(trueBoolPred); // just some temp thing.
		getResults = sfdb.get(sfdbLabelPred, 0, 0);
		test.assert(getResults.length, 0, "we inserted an sfdb label at timestep 0. We are now at timestep one. Should return false as they are not cloned");

		//12.1 -- what happens with SFDB using history?
		getResults = sfdb.get(sfdbLabelPred, 0, 1); // we are now looking one time step back into the past!
		test.assert(getResults.length, 1, "we inserted an sfdb label at timestep 0, and we're looking one step back in the history (from step 1). So we should be able to find it!'");

		//12.2 -- another history test
		getResults = sfdb.get(sfdbLabelPred, 1, 1); // we are now looking specifically ONE time step ago.
		test.assert(getResults.length, 1, "we inserted an sfdb label at timestep 0, and we're looking one step back in the history (from step 1). So we should be able to find it!'");

		//TEST 13 Giving a value with no operator.
		var noOpPred = validate.triggerCondition({
			"class": "network",
			"type": "trust",
			"first": "reggie",
			"second": "doc",
			"value": 30
		});
		sfdb.clearHistory();
		sfdb.set(noOpPred); // make it so reggie trusts doc by 30
		noOpPred.value = 60;
		getResults = cif.get(noOpPred, 0, 0); // checking to see if reggie trusts doc by 60?
		test.assert(getResults.length, 0, "If we specify a non-matching value in a numeric predicate, we shouldn't get any results back.");

		//TEST 14 
		// Bug: If people are involved timeStep 1, then not involved timeStep2, then you set them involved/not involved on timeStep 3, it sometimes leaves behind ghost records incorrectly.
		cif.loadBaseBlueprints(testSocial);
		var involvedWithTruePredicate = validate.triggerEffect({
			"class": "relationship",
			"type": "involved with",
			"first": "doc",
			"second": "vanessa",
			"value": true
		}, "testGet setting involvedWithTruePredicate");
		var involvedWithFalsePredicate = validate.triggerEffect({
			"class": "relationship",
			"type": "involved with",
			"first": "doc",
			"second": "vanessa",
			"value": false
		}, "testGet setting involvedWithFalsePredicate");
		sfdb.setupNextTimeStep(1); // get us to timestep 1.
		cif.set(involvedWithTruePredicate);
		result = cif.get(involvedWithTruePredicate);
		test.assert(result.length, 1, "14 Base case");
		result = cif.get(involvedWithFalsePredicate);
		test.assert(result.length, 0, "14 Base Case");
		sfdb.setupNextTimeStep(2); // now at timetep 2, we want them to be NOT involved.
		cif.set(involvedWithFalsePredicate);
		result = cif.get(involvedWithTruePredicate);
		test.assert(result.length, 0, "14 - people used to be involved but now they are not, so searching for htem being involved should be false.");
		result = cif.get(involvedWithFalsePredicate);
		test.assert(result.length, 1, "14 - they used to be involved, but now they are not!");
		sfdb.setupNextTimeStep(3); // now at timestep 3, we are going to make them involved again.
		cif.set(involvedWithTruePredicate); // so this seems to not be doing what we need it to do: updating an existing predicate (instead it just makes a new one!)
		result = cif.get(involvedWithTruePredicate);
		test.assert(result.length, 1, "14 - Making a couple involved with after making them not involved with should make them involved with agian.");
		result = cif.get(involvedWithFalsePredicate);
		test.assert(result.length, 0, "14 - Making the couple not involved anymore should remove the entry in the sfdb of them not being involved.");		


		test.finish();

	};

	var testPutCharacterOffstage = function(){
		test.start("SFDB", "testPutCharacterOffstage");
		var offstageCharacters = sfdb.getOffstageCharacters();
		
		//TEST 1 -- offstage characters, by default, should be 0.
		test.assert(offstageCharacters.length,0, "No characters should be offstage by default.");

		//TEST 2 -- adding a character off stage should add it to the sfdb's offstage character array.
		sfdb.putCharacterOffstage("doc");
		offstageCharacters = sfdb.getOffstageCharacters();
		test.assert(offstageCharacters.length, 1, "Offstage character array not upated when putCharacter offstage called");
		test.assert(offstageCharacters[0], "doc", "doc wasn't the character that was placed off stage...");

		//TEST 3 -- adding a character who is already off stage shouldn't add it twice.
		sfdb.putCharacterOffstage("doc");
		offstageCharacters = sfdb.getOffstageCharacters();
		test.assert(offstageCharacters.length, 1, "Should have caught that we were adding the same character twice, but didn't");

		//TEST 4 -- adding other characters who aren't already off stage SHOULD add them to the list.
		sfdb.putCharacterOffstage("reggie");
		sfdb.putCharacterOffstage("clara");
		offstageCharacters = sfdb.getOffstageCharacters();
		test.assert(offstageCharacters.length, 3, "Didn't register when we added additional characters to the offstage list.");

		test.finish();
	};

	var testPutCharacterOnstage = function(){
		test.start("SFDB", "testPutCharacterOnstage");
		var offstageCharacters = sfdb.getOffstageCharacters();

		//TEST 1 -- it should start off as 0, go up to 1, then back to 0 as we add, then remove, a character from offstage.
		test.assert(offstageCharacters.length,0, "Offstage characters should have been empty at first");
		sfdb.putCharacterOffstage("doc");
		offstageCharacters = sfdb.getOffstageCharacters();
		test.assert(offstageCharacters.length, 1, "Adding character to the offstage list didn't work.");
		sfdb.putCharacterOnstage("doc");
		offstageCharacters = sfdb.getOffstageCharacters();
		test.assert(offstageCharacters.length, 0, "Character should have been removed from offstage list but they weren't");
		

		//TEST 2 -- Then if we ADD that character BACK to the offstage list, that should be fine as well.
		sfdb.putCharacterOffstage("doc");
		offstageCharacters = sfdb.getOffstageCharacters();
		test.assert(offstageCharacters.length, 1, "Re-adding a character that was removed from the offstage list didn't work.");
		test.assert(offstageCharacters[0], "doc", "Regardless of the length, the character that was added was incorrect");

		//TEST 3 -- removing characters from the middle of the list shouldn't break anything.
		sfdb.putCharacterOffstage("clara"); //clara is now "in the middle"
		sfdb.putCharacterOffstage("reggie");
		//Ok, so we're going to remove clara from being offstage...
		sfdb.putCharacterOnstage("clara");
		offstageCharacters = sfdb.getOffstageCharacters();
		test.assert(offstageCharacters.length, 2, "removing a character from the 'middle' of the offstage list messed something up.");
		test.assert(offstageCharacters[0], "doc", "The first index in the array got messed up as part of removing someone from the middle of it.");
		test.assert(offstageCharacters[1], "reggie", "Removing a character from the middle messed up an index that came after it.");

		test.finish();
	};

	var testEliminateCharacter = function(){
		test.start("SFDB", "testEliminateCharacter");
		sfdb.setupNextTimeStep(0); // just to get things started.
		//TEST 1 -- the list of eliminated characters should start off as 0.
		var eliminatedCharacters = sfdb.getEliminatedCharacters();
		var offstageCharacters;
		test.assert(eliminatedCharacters.length, 0, "We should always start off with no characters being eliminated.");
		
		//TEST 2 -- eliminate a character.
		sfdb.eliminateCharacter("doc");
		eliminatedCharacters = sfdb.getEliminatedCharacters();
		test.assert(eliminatedCharacters.length, 1, "We tried eliminated a character, but they weren't added to the list");
		test.assert(eliminatedCharacters[0], "doc", "The wrong character was added to the eliminated character list.");

		//TEST 3 -- Taking a character that was 'offstage' and then making them 'eliminated' should take them off of the offtage list
		sfdb.putCharacterOffstage("clara");
		offstageCharacters = sfdb.getOffstageCharacters();
		test.assert(offstageCharacters.length, 1, "Character was not successfully added to the offstage list.");
		sfdb.eliminateCharacter("clara");
		offstageCharacters = sfdb.getOffstageCharacters();
		test.assert(offstageCharacters.length, 0, "After eliminating a character who was on the offstage list, they should be moved off of of the offstage list.");

		//TEST 4 -- Eliminating a character removes all of the recipricol relationships that they might have.
		sfdb.clearEverything(); // fresh slate (clears out offStage/eliminated Characters)
		cif.loadBaseBlueprints(testSocial);
		
		var relationshipPredicate = {
			"class": "relationship",
			"type": "friends",
			"first": "doc",
			"second": "clara"
		};

		cif.set(relationshipPredicate);
		var timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 2, "Recipricol predicate should have made two entries in the sfdb.");
		sfdb.eliminateCharacter("clara");
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 0, "Eliminating the character should have removed both reciprocol references to them in the sfdb.");

		//TEST 5 -- Eliminating a character removes all of the recipricol relationships that they  might have had, but it preserves the PREVIOUS timesteps.
		sfdb.clearEverything();
		cif.loadBaseBlueprints(testSocial);
		cif.set(relationshipPredicate);
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		cif.setupNextTimeStep(1);
		var timestep1 = sfdb.getSFDBCopyAtTimestep(1);
		test.assert(timestep1.length, 2, "Before any eliminating, things got cloned over just as you would expect.");
		sfdb.eliminateCharacter("clara");
		timestep1 = sfdb.getSFDBCopyAtTimestep(1);
		test.assert(timestep1.length, 0, "Eliminating Clara at timestep 1 failed to removed reciprocol references to her at timestep 1");
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 2, "Eliminating Clara at timestep 1 removed references to her at timestep 0 when it shouldn't have.");


		//TEST 6 -- Eliminatig a character removes directed statuses TO them!
		sfdb.clearEverything();
		cif.loadBaseBlueprints(testSocial);

		var directedStatusPredicate = {
			"class"	: "directedStatus",
			"type"	: "upset with",
			"first" : "doc",
			"second": "clara"
		};
		
		cif.set(directedStatusPredicate);
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 1, "Base case for 6; something is super wrong if inserting a directed status didn't even work.");
		sfdb.eliminateCharacter("clara");
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 0, "Eliminating clara when she was the recipient of a directed status didn't remove the status from the sfdb.");

		//TEST 6.5 -- Eliminating a character removes directed statuses that THEY are the 'first' of.
		sfdb.clearEverything();
		cif.loadBaseBlueprints(testSocial);
		cif.set(directedStatusPredicate);
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 1, "Base case for 6.5; something is super wrong if inserting a directed status didn't even work.");
		sfdb.eliminateCharacter("doc");
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 0, "Eliminating doc when he was the first of a directed status didn't remove the status from the sfdb.");

		//TEST 7 -- Eliminating a character can remove multiple directed statuses (regardless of if they are first or second.)
		sfdb.clearEverything();
		cif.loadBaseBlueprints(testSocial);

		var directedStatusPredicate2 = {
			"class"	: "directedStatus",
			"type"	: "upset with",
			"first" : "clara",
			"second": "reggie",
		};

		cif.set(directedStatusPredicate);
		cif.set(directedStatusPredicate2);

		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 2, "Base case for 7; something is super wrong if inserting a directed status didn't even work.");
		sfdb.eliminateCharacter("clara"); // she is 'second' in the first predicate, and 'first' in the second; should remove everything.
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 0, "Eliminating clara when she was referenced in two different roles in different predicates didn't work.");

		//TEST 7.5 -- Eliminating a character will remove the correct directed statuses, but preserve ones that they aren't involved with.
		sfdb.clearEverything();
		cif.loadBaseBlueprints(testSocial);
		cif.set(directedStatusPredicate);
		cif.set(directedStatusPredicate2);
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 2, "Base case for 7.5; something is super wrong if inserting a directed status didn't even work.");
		sfdb.eliminateCharacter("doc"); // she is 'second' in the first predicate, and 'first' in the second; should remove everything.
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 1, "Eliminating doc when she was referenced in a single directed status shouldn't have removed the other one in the sfdb");
		test.assert(timestep0[0].first, "clara");

		//TEST 8 -- Eliminating a character will remove the correct directed statuses, but preserve things that have happened previously in the sfdb.
		sfdb.clearEverything();
		cif.loadBaseBlueprints(testSocial);
		cif.set(directedStatusPredicate);
		cif.set(directedStatusPredicate2);
		cif.setupNextTimeStep(1);
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 2, "Base case for 8; something is super wrong if inserting a directed status didn't even work.");
		timestep1 = sfdb.getSFDBCopyAtTimestep(1);
		test.assert(timestep0.length, 2, "2nd Base case for 8; something is super wrong if inserting a directed status didn't even work.");
		sfdb.eliminateCharacter("clara"); // should remove both from current timestep, preserve everything from past.
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 2, "Timestep 0 shouldn't have been affected by eliminating a character at timestep 1");
		timestep1 = sfdb.getSFDBCopyAtTimestep(1);
		test.assert(timestep1.length, 0, "Eliminating a character should have removed all predicates they were involved with at timestep 1.");

		//TEST 9 -- Eliminating a character will remove non-directed things pertaining to them as well.
		sfdb.clearEverything();
		cif.loadBaseBlueprints(testSocial);

		var traitPredicate = {
			"class" : "trait",
			"type"  : "handy",
			"first" : "clara"
		};

		cif.set(traitPredicate);
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 1, "Base case for 9; something is super wrong if inserting a trait didn't even work.");
		sfdb.eliminateCharacter("clara");
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 0, "Eliminating a character should have removed a non-directed social fact from the sfdb.");

		//TEST 9.5 -- Eliminating a character at timestep 1 will preserve their previous entries in the SFDB.
		sfdb.clearEverything();
		cif.loadBaseBlueprints(testSocial);
		cif.set(traitPredicate);
		cif.setupNextTimeStep(1);
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 1, "Base case for 9.5; something is super wrong if inserting a directed status didn't even work.");
		timestep1 = sfdb.getSFDBCopyAtTimestep(1);
		test.assert(timestep0.length, 1, "2nd Base case for 9.5; something is super wrong if inserting a directed status didn't even work.");
		sfdb.eliminateCharacter("clara"); // should remove both from current timestep, preserve everything from past.
		timestep0 = sfdb.getSFDBCopyAtTimestep(0);
		test.assert(timestep0.length, 1, "UNDIRECTED CASE Timestep 0 shouldn't have been affected by eliminating a character at timestep 1");
		timestep1 = sfdb.getSFDBCopyAtTimestep(1);
		test.assert(timestep1.length, 0, "UNDIRECTED CASE Eliminating a character should have removed all predicates they were involved with at timestep 1.");


		//TEST 10 -- Everything should still work even if you have have a bunch of different types of things in the sfdb 
		sfdb.clearEverything();
		cif.loadBaseBlueprints(testSocial);
		cif.set(traitPredicate); // clara is handy at T=0
		cif.setupNextTimeStep(1);
		cif.set(relationshipPredicate); //doc and clara are friends at T=1
		cif.set(directedStatusPredicate); // doc is upset with Clara at T=1
		cif.setupNextTimeStep(2);
		cif.set(directedStatusPredicate2); // clara is upset with Reggie at T=2

		//If we eliminate Doc, then clara should still be handy, and clara should still be upset with reggie, but nothing else at T=2.
		sfdb.eliminateCharacter("doc");
		var timestep2 = sfdb.getSFDBCopyAtTimestep(2);
		test.assert(timestep2.length, 2, "MIXED TOGETHER CASE -- removing doc should have preserved clara and reggie's sfdb entries together.");
		var results = cif.get(traitPredicate);
		test.assert(results.length, 1, "MIXED TOGETHER CASE -- clara's trait somehow got removed");
		results = cif.get(directedStatusPredicate2);
		test.assert(results.length, 1, "MIXED TOGETHER CASE -- Clara's directed status toward's reggie somehow got removed.");

		//TEST 10.5 -- but if we extend the window to include the past, then we'll find all sorts of stuff!
		results = cif.get(relationshipPredicate, 0, 2);
		test.assert(results.length, 1, "Expanding the window should have let us see their past relationship.");
		results = cif.get(directedStatusPredicate, 0, 2);
		test.assert(results.length, 1, "Expanding the window should have let us see their past directed status.");

		//TEST 11 -- same as test 10, but eliminating a different character -- clara this time.
		sfdb.clearEverything();
		cif.loadBaseBlueprints(testSocial);
		cif.set(traitPredicate); // clara is handy at T=0
		cif.setupNextTimeStep(1);
		cif.set(relationshipPredicate); //doc and clara are friends at T=1
		cif.set(directedStatusPredicate); // doc is upset with Clara at T=1
		cif.setupNextTimeStep(2);
		cif.set(directedStatusPredicate2); // clara is upset with Reggie at T=2

		sfdb.eliminateCharacter("clara");
		timestep2 = sfdb.getSFDBCopyAtTimestep(2);
		test.assert(timestep2.length, 0, "MIXED TOGETHER CASE 2 -- removing clara should remove everything.");

		//TEST 11.5 -- but again, everything should still exist in the past.
		results = cif.get(relationshipPredicate, 0, 2);
		test.assert(results.length, 1, "TEST 11.5 Expanding the window should have let us see their past relationship.");
		results = cif.get(directedStatusPredicate, 0, 2);
		test.assert(results.length, 1, "TEST 11.5 Expanding the window should have let us see their past directed status.");
		results = cif.get(directedStatusPredicate2, 0, 2);
		test.assert(results.length, 0, "TEST 11.5 Expanding the window should NOT let us see things that didn't even happen in the past.");
		results = cif.get(traitPredicate, 0, 2);
		test.assert(results.length, 1, "TEST 11.5 Expanding the window should have let us see their past directed status.");




		test.finish();
	};

	var sfdbUnitTestInterface = {
		runTests	: runTests
	};
	// See comment at top of Tests.js for explanation of below.

	return sfdbUnitTestInterface;


});