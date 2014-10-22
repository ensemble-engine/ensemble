/**
 * This is the class Tests, for unit test and other functionality for Yarn.
 * Public methods are:
 *
 * @class Tests
 */

define(["util", "underscore", "jquery"], 
function(util, _, $) {

	var currentFile;
	var currentGroup;
	var passCounter = 0;
	var failCounter = 0;
	var groupContainer;
	var resultsContainer;

	var makeDiv = function(txt, className) {
		return $("<div/>", {
			"class": className,
			"html": txt
		});
	};

	var makeNewFileHeader = function(name) {
		makeDiv(name, "testFileHeader").appendTo("#testResults");
	};

	var pass = function() {
		// makeDiv("Passed", "testPassed");
		passCounter += 1;
	};

	var fail = function(val1, val2, label, msg) {
		var explanation = "Failed '" + label + "'. " + msg;
		resultsContainer.append(makeDiv(explanation, "testFailed"));
		failCounter += 1;
	};

	var checkEquality = function(val1, val2) {
		if (util.isArray(val1)) {
			if (!util.isArray(val2)) {
				return false;
			}
			if (val1.length !== val2.length) {
				return false;
			}
			for (var i = 0; i < val1.length; i++) {
				if (val1[i] !== val2[i]) {
					return false;
				}
			}
		} else if (typeof val1 === Object || typeof val2 === Object) {
			return false;
		} else if (val1 !== val2) {
			return false;
		}
		return true;
	};

	var start = function(originFile, testGroupName) {
		if (originFile !== currentFile) {
			currentFile = originFile;
			makeNewFileHeader(originFile);
		}
		currentGroup = testGroupName;
		passCounter = 0;
		failCounter = 0;
		groupContainer = $("<div/>", {
			"class": "groupBox",
		});
		$("<div/>", {
			"class": "testGroupHeader",
			"html": currentGroup
		}).appendTo(groupContainer);
		resultsContainer = $("<div/>", {
			"class": "testGroupBody",
		});
		resultsContainer.appendTo(groupContainer);
	};

	var finish = function() {
		var allPassed = failCounter===0;
		if (allPassed) {
			groupContainer.addClass("testPassed");
		} else {
			groupContainer.addClass("testFailed");
		}
		var msg = $("<div/>", {
			"class": "testGroupSummary",
			"html": passCounter + "/" + (passCounter+failCounter) + " tests passed."
		});
		resultsContainer.append(msg);

		$("#testResults").append(groupContainer);
	};

	var assert = function (val1, val2, messageIfFalse) {

		var isMatch = checkEquality(val1, val2);

		if (isMatch) {
			pass();
		} else {
			fail(val1, val2, messageIfFalse, "Was '" + val1 + "', expected '" + val2 + "'.");
		}
	};

	var assertNEQ = function (val1, val2, messageIfFalse) {

		var isMatch = !checkEquality(val1, val2);

		if (isMatch) {
			pass();
		} else {
			fail(val1, val2, messageIfFalse, "Was '" + val1 + "', expected not equal to '" + val2 + "'.");
		}
	};

	var assertLT = function (val1, op, val2, messageIfFalse) {

		if (typeof val1 !== "number" || typeof val1 !== "number") {
			fail(val1, val2, messageIfFalse, "Expected '" + val1 + "' < '" + val2 + "' but one of those was not a number.");
		}

		if (val1 < val2) {
			pass();
		} else {
			fail(val1, val2, messageIfFalse, "Expected '" + val1 + "' < '" + val2 + "'.");
		}
	};

	var assertGT = function (val1, val2, messageIfFalse) {

		if (typeof val1 !== "number" || typeof val1 !== "number") {
			fail(val1, val2, messageIfFalse, "Expected '" + val1 + "' > '" + val2 + "' but one of those was not a number.");
		}

		if (val1 > val2) {
			pass();
		} else {
			fail(val1, val2, messageIfFalse, "Expected '" + val1 + "' > '" + val2 + "'.");
		}
	};

	var assertLTE = function (val1, op, val2, messageIfFalse) {

		if (typeof val1 !== "number" || typeof val1 !== "number") {
			fail(val1, val2, messageIfFalse, "Expected '" + val1 + "' <= '" + val2 + "' but one of those was not a number.");
		}

		if (val1 <= val2) {
			pass();
		} else {
			fail(val1, val2, messageIfFalse, "Expected '" + val1 + "' <= '" + val2 + "'.");
		}
	};

	var assertGTE = function (val1, val2, messageIfFalse) {

		if (typeof val1 !== "number" || typeof val1 !== "number") {
			fail(val1, val2, messageIfFalse, "Expected '" + val1 + "' >= '" + val2 + "' but one of those was not a number.");
		}

		if (val1 >= val2) {
			pass();
		} else {
			fail(val1, val2, messageIfFalse, "Expected '" + val1 + "' >= '" + val2 + "'.");
		}
	};


	return {
		assert: assert,
		assertNEQ: assertNEQ,
		assertLT: assertLT,
		assertGT: assertGT,
		assertLTE: assertLTE,
		assertGTE: assertGTE,
		start: start,
		finish: finish,

	};

});