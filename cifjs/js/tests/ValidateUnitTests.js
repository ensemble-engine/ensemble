/**
* This has all of the unit tests that test functions that are from Validate.js
*/
define(["util", "cif", "test", "validate", "text!data/testSocial.json"], function(util, cif, test, validate, testSocial) {

	var runTests = function() {
		testValidate();
	};

	var testValidate = function() {
		test.start("Validate", "blueprints");

		var rejected = false;
		try {
			validate.blueprint({}, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "An empty blueprint should be rejected as invalid.");

		var samplePredicate = {
			"class": "bond",
			"types": ["familial", "fraternal", "passionate"],
			"isBoolean": false,
			"directionType": "reciprocal",
			"defaultValue": 50,
			"allowIntent": true
		};

		rejected = false;
		try {
			validate.blueprint(samplePredicate, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, false, "A valid blueprint should not be rejected.");

		var badPred = util.clone(samplePredicate);
		badPred.class = 5;
		rejected = false;
		try {
			validate.blueprint(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A blueprint's class should be a string.");

		badPred = util.clone(samplePredicate);
		badPred.types = "familial";
		rejected = false;
		try {
			validate.blueprint(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A blueprint's types should not be a string.");

		badPred = util.clone(samplePredicate);
		badPred.isBoolean = true;
		rejected = false;
		try {
			validate.blueprint(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A boolean blueprint shouldn't provide a numeric defaultValue.");

		badPred = util.clone(samplePredicate);
		delete badPred.directionType;
		rejected = false;
		try {
			validate.blueprint(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A boolean blueprint must provide a directionType.");

		badPred = util.clone(samplePredicate);
		badPred.badKey = "asdf";
		rejected = false;
		try {
			validate.blueprint(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A boolean blueprint shouldn't provide any unrecognized keys.");

		badPred = util.clone(samplePredicate);
		badPred.directionType = "asdf";
		rejected = false;
		try {
			validate.blueprint(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A blueprint should provide a recognized directionType.");

		badPred = util.clone(samplePredicate);
		badPred.isBoolean = "true";
		rejected = false;
		try {
			validate.blueprint(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A blueprint should not allow a string in a boolean field.");

		badPred = util.clone(samplePredicate);
		badPred.first = "asdf";
		rejected = false;
		try {
			validate.blueprint(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A blueprint should not have a 'first' field.");

		test.finish();


		test.start("Validate", "other predicates");
		cif.loadBaseBlueprints(testSocial);

		// Test trigger conditions
		samplePredicate = {
			"class": "relationship",
			"type": "involved with",
			"first": "me",
			"second": "sweetie"
		};
		rejected = false;
		try {
			validate.triggerCondition(samplePredicate, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, false, "A valid trigger condition should not be rejected.");

		badPred = util.clone(samplePredicate);
		badPred.operator = "+";
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A trigger condition should not have an operator.");

		badPred = util.clone(samplePredicate);
		badPred.value = 45;
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A binary trigger condition should not have a numeric value.");

		badPred = util.clone(samplePredicate);
		badPred.value = "false";
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A binary trigger condition should not have a string value.");

		badPred = util.clone(samplePredicate);
		delete badPred.second;
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A reciprocal trigger condition should have a second parameter.");

		badPred = util.clone(samplePredicate);
		delete badPred.first;
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A reciprocal trigger condition should not have only a second parameter.");

		rejected = false;
		samplePredicate = {
			"class": "network",
			"type": "trust",
			"first": "buddy",
			"second": "candidate",
			"operator": ">",
			"value": 60
		}
		try {
			validate.triggerCondition(samplePredicate, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, false, "A valid numeric trigger condition should not be rejected.");

		badPred = util.clone(samplePredicate);
		badPred.operator = "*";
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A numeric trigger condition should have a recognized operator.");

		badPred = util.clone(samplePredicate);
		badPred.intentDirection = true;
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A numeric trigger condition should not have an intentDirection.");

		badPred = util.clone(samplePredicate);
		badPred.turnsAgoBetween = 10;
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A single digit is not proper for turnsAgoBetween");

		badPred = util.clone(samplePredicate);
		badPred.turnsAgoBetween = [10];
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A length-1 array is not proper for turnsAgoBetween.");

		badPred = util.clone(samplePredicate);
		badPred.turnsAgoBetween = [10, 5, 2];
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A length-3 array is not proper for turnsAgoBetween.");

		badPred = util.clone(samplePredicate);
		badPred.turnsAgoBetween = [-3, 5];
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "Negative numbers are not proper for turnsAgoBetween");	

		badPred = util.clone(samplePredicate);
		badPred.turnsAgoBetween = [3.45, 5];
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "Non-integers are not proper for turnsAgoBetween");

		badPred = util.clone(samplePredicate);
		badPred.turnsAgoBetween = ["asdf", 5];
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "Non-recognized strings are not okay for turnsAgoBetween");

		badPred = util.clone(samplePredicate);
		badPred.turnsAgoBetween = ["now", 5];
		rejected = false;
		try {
			validate.triggerCondition(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, false, "Case sensitivity does not matter for turnsAgoBetween");	


		// Test trigger effects
		samplePredicate = {
			"class": "network",
			"type": "affinity",
			"first": "me",
			"second": "heartbreaker",
			"operator": "+",
			"value": -10
		};
		rejected = false;
		try {
			validate.triggerEffect(samplePredicate, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, false, "A valid trigger effect should not be rejected.");

		badPred = util.clone(samplePredicate);
		rejected = false;
		try {
			validate.blueprint(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A blueprint should not look like a trigger effect.");

		badPred = util.clone(samplePredicate);
		badPred.operator = "?";
		rejected = false;
		try {
			validate.triggerEffect(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A trigger effect should have a recognized operator.");

		badPred = util.clone(samplePredicate);
		badPred.value = true;
		rejected = false;
		try {
			validate.triggerEffect(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A numeric trigger effect should not have a boolean value.");

		badPred = util.clone(samplePredicate);
		delete badPred.value;
		rejected = false;
		try {
			validate.triggerEffect(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A numeric trigger effect should provide a value.");

		badPred = util.clone(samplePredicate);
		delete badPred.value;
		rejected = false;
		try {
			validate.triggerEffect(badPred, "");
		} catch(e) {
			rejected = true;
		}
		test.assert(rejected, true, "A numeric trigger effect should provide a value.");




		test.finish();

	}

	return {
		runTests: runTests
	}
});