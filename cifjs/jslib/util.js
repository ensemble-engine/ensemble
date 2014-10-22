// Package: Util
// Library of useful functions.

/*jshint smarttabs: true */
/*global define */

define([], function() {
	"use strict";

	/* Function: isArray
	Determines if the given object is an array.

	Parameters:
	obj - an object

	Returns:
	boolean - true if obj is an array.
	*/
	var isArray = function(obj) {
		return toString.call(obj) === "[object Array]";
	},

	isInt = function(val){
		if ((parseFloat(val) == parseInt(val)) && !isNaN(val)) {
			return true;
		} else {
			return false;
		}
	},
	
	/* Function: nl2br
	Takes all newlines in a string and inserts breaklines instead.

	Parameters:
	str - string to convert
	is_xhtml - boolean 
	
	Returns:
	string - new string with breaklines inserted.
	*/
	nl2br = function (str, is_xhtml) {   
	    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
	    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
	},
	
	/* Function: has
	Determines if the given object is in an array.

	Parameters:
	array - an array
	item - obj to search for in the array

	Returns:
	boolean - true if item is an array.
	*/
	has = function(array, item) {
		if (array === undefined) return false;
		return array.indexOf(item) > -1;
	},

	/* Function: randomKey
	Keturns a random Key from an object.

	Parameters:
	object - an object

	Returns:
	string - a random key from the object.
	*/
	randomKey = function(obj) {
		return oneOf(Object.keys(obj));
	},
	
	/* Function: randomNumber
	Returns a random integer from 1 to max. Return 1 if max <= 1 or not a number.

	Parameters:
	max - an integer, the highest number that might be returned.

	Returns:
	number (integer) between 1 and max.
	*/
	randomNumber = function (max, min) {
		if (min === undefined) {
			if (max <= 1 || typeof max !== "number") {
				return 1;
			}
			return Math.floor(Math.random() * Math.round(max)) + 1;
		}
		else {
			if (max <= 1 || typeof max !== "number" || max <= min || typeof min !== "number") {
				return 1;
			}
		    return Math.floor(Math.random() * (max - min + 1)) + min;
		}
	},

	_noRepeatTracker = {},

	/* Function: randomNoRepeat
	Like <randomNumber>, but returns a number that tries to be different from the last random number requested for this same key.

	Parameters:
	key - a string representing a unique key. For the same key, calls to randomNoRepeat will try to return a different number than the last call.
	max - an integer, the highest number that might be returned.

	Returns:
	number (integer) between 1 and max.
	*/
	randomNoRepeat = function (key, max) {
		var num = 0,
			lastTime = _noRepeatTracker[key];

		if (typeof max !== "number") {
			throw new Error("util.randomNoRepeat(): called with max of " + max + " which is " + typeof max + " instead of number.");
		}
		if (max <= 1) {
			return 1;
		}

		if (lastTime === undefined) {
			num = randomNumber(max);
		} else {
			num = randomNumber(max - 1);
			if (num >= lastTime) {
				num += 1;
			}
		}
		_noRepeatTracker[key] = num;
		return num;
	},

	/* Function: randomJitter
	When given a number and a jitter value, returns the number modified a little (to the maximum of number * jitter and minimum of number / jitter). Values closer to number are more likely than those on the edges.

	Parameters:
	number - an integer
	jitter - a float >= 1 (1 = no jitter)

	Returns
	a float value based on number
	*/
	randomJitter = function(number, jitter) {
		if (jitter <= 1) {
			return number;
		}
		var lowest = number / jitter;
		var highest = number * jitter;
		var range = highest - lowest;
		var total = (Math.random() * (range / 3)) + (Math.random() * (range / 3)) + (Math.random() * (range / 3));
		return total + lowest;
	},

	_iterators = {},

	/* Function: iterator
	Given a key, returns a number that starts at 1 and increases by 1 each time the function is called for the same key.

	Parameters:
	key - a string

	Returns:
	number (integer)
	*/
	iterator = function (key) {
		if (_iterators[key] === undefined) {
			_iterators[key] = 0;
		}
		_iterators[key] += 1;
		return _iterators[key];
	},

	/* Function: resetIterator
	Resets the iterator for a given key, so the next time <iterator> is called with that key it will return 1 again.

	Parameters:
	key - a string
	*/
	resetIterator = function (key) {
		_iterators[key] = 0;
	},

	/* Function: oneOf
	Returns a random entry from an array, or undefined if the array is empty or not an array.

	Parameters:
	arr - an array of anything

	Returns:
	an entry from a random position in arr.
	*/
	oneOf = function (arr) {
		return arr[randomNumber(arr.length) - 1];
	},

	/* Function: oneOfNoRepeat
	Like <oneOf>, except attempts to return a different entry each time the function is called with the same key.

	Parameters:
	key - a string
	arr - an array of anything

	Returns:
	an entry from a random position in arr.
	*/
	oneOfNoRepeat = function (key, arr) {
		if (!isArray(arr) || arr.length === 0) {
			return undefined;
		}
		if (arr.length === 1) {
			return arr[0];
		}
		return arr[randomNoRepeat(key, arr.length) - 1];
	},

	/* Function: listWriter
	Takes an array of strings and returns a single string representing it as an English list. ["one", "two", "three"] becomes "one, two, and three".

	Parameters:
	stringList - an array of strings.
	separator - (optional) string, the word to use as the final conjunction. Defaults to "and" if not specified.
	wrapper - (optional) string, will be wrapped around each parameter (usually a quote mark)

	Returns:
	a string
	*/
	listWriter = function listWriter(_stringList, _separator, _wrapper) {
		var separator = _separator || "and";
		var wrapper = _wrapper || "";
		var output = "";
		var stringList = clone(_stringList);	// because arrays are pass by reference
		var origLength = stringList.length;
		while (stringList.length > 0) {
			var item = stringList.shift();
			output += wrapper + item + wrapper;
			if (stringList.length == 1) {
				if (origLength == 2) {
					output += " " + separator + " ";
				} else {
					output += ", " + separator + " ";
				}
			} else if (stringList.length !== 0) {
				output += ", ";
			}
		}
		return output;
	},

	/* Function: randomOrder
	Sorts an array in random order and returns it.

	Parameters:
	arr - the array to be sorted.

	Returns:
	arr sorted in a random order.
	*/
	randomOrder = function (arr) {
		var workArr = [],	// get fresh copy of arr
			sortedArr = [],
			randomIndex = -1;
		if (!isArray(arr)) {
			throw new Error("util.randomOrder: Called randomOrder on " + arr + " which is not an array.");
		}
		if (arr.length <= 1) {
			return arr;
		}
		workArr = arr.slice(0);
		while (workArr.length > 0) {
			randomIndex = randomNumber(workArr.length) - 1;
			sortedArr.push(workArr[randomIndex]);
			workArr.splice(randomIndex, 1);
		}
		return sortedArr;
	},

	/* Function: safeAdd
	Adds two numbers, but never exceeds a given maximum or drops below an optional minimum.

	Parameters:
	num - the first number
	val - the number to add to num
	max - an upper limit for the largest value num can be.
	min - (optional) a lower limit for the smallest value num can be.

	Returns:
	a number - The new value of num.
	*/
	safeAdd = function (num, val, max, min) {
		if (typeof num !== "number" || typeof val !== "number" ||
				(max !== undefined && typeof max !== "number") ||
				(min !== undefined && typeof min !== "number")) {
			throw new Error("util.safeAdd: called with non-numeric value (parameters were " + num + ", " + val + ", " + max + ")");
		}
		num = num + val;
		if (num > max) {
			num = max;
		}
		if (min !== undefined && num < min) {
			num = min;
		}
		return num;
	},

	safeOp = function (num, val, op, min, max) {
		if (typeof num !== "number" || typeof val !== "number" ||
				(typeof max !== "number" && max !== undefined) ||
				typeof min !== "number" && min !== undefined) {
			throw new Error("util.safeOp: called with non-numeric value (parameters were num:" + num + ", val:" + val + ", min:" + min + ", max:" + max + ")");
		}
		switch(op) {
			case "+": num = num + val; break;
			case "*": num = num * val; break;
			case "-": num = num - val; break;
			case "/":
				if (val === 0) {
					num = num;
					console.log("util.safeOp: divide by 0, returning num instead. (num=" + num + ", val=" + val + ", op=" + op + ", min=" + min + ", max=" + max);
				} else {
					num = num / val;
				}
				break;
		}
		if (max !== undefined && num > max) {
			num = max;
		}
		if (num < min) {
			num = min;
		}
		return num;
	},

	safeMultiply = function (num, val, max) {
		return safeOp(num, val, "*", 0, max)
	},
	safeAdd = function (num, val, max) {
		return safeOp(num, val, "+", 0, max)
	},
	safeSubtract = function (num, val, min) {
		return safeOp(num, val, "-", min, undefined)
	},
	safeDivide = function (num, val, min) {
		return safeOp(num, val, "/", min, undefined)
	},

	/* Function: iCap
	Takes a string and ensures the first letter is capitalized. Assumes the string begins with a letter, not a space or non-alpha.

	Parameters:
	str - the string in question

	Returns:
	str with the first letter capitalized

	Note:
	You can also say iUpper for parity with <iLower>.
	*/
	iCap = function (str) {
		if (typeof str !== "string") {
			throw new Error("util.iCap(): called iCap on " + str + " which is not a string.");
		}
		return str.charAt(0).toUpperCase() + str.slice(1);
	},

	/* Function: iLower
	Takes a string and ensures the first letter is lower case. Assumes the string begins with a letter, not a space or non-alpha.

	Parameters:
	str - the string in question

	Returns:
	str with the first letter in lower case
	*/
	iLower = function (str) {
		if (typeof str !== "string") {
			throw new Error("util.iLower: called iLower on " + str + " which is not a string.");
		}
		return str.charAt(0).toLowerCase() + str.slice(1);
	},

	/* Function: titleCase
	Takes a string and ensures the first letter of each word is capitalized.

	Parameters:
	str - the string in question

	Returns:
	str with the first letter of each word capitalized
	*/
	titleCase = function (str) {
		var strList = [],
			finalStr = "",
			sPos = 0;
		if (typeof str !== "string") {
			throw new Error("util.titleCase(): called titleCase on " + str + " which is not a string.");
		}
		strList = str.trim().split(" ");
		for (sPos in strList) {
			finalStr += iCap(strList[sPos]) + " ";
		}
		return finalStr.trim();
	},

	/* Function: isOneOf
	Takes a string and an array of strings and returns true if the first string appears in the array, case insensitively.

	Parameters:
	base - the string to check
	options - an array of strings to check against. If base appears in options we return true.

	Returns:
	boolean - true if base is in options.
	*/
	isOneOf = function (base, options) {
		var b = "",
			option = "";
		if (typeof base !== "string" || !isArray(options) || typeof options[0] !== "string") {
			throw new Error("util.isOneOf:Called isOneOf with wrong type of inputs (should be string, array of strings; instead was " + base + " (" + typeof base + "), " + options + " (" + typeof options + ")");
		}
		b = base.toLowerCase();
		for (option in options) {
			if (b === options[option].toLowerCase()) {
				return true;
			}
		}
		return false;
	},

	/* Function: listify
	Take an object and produce a comma-separated list of its keys.

	Parameters:
	obj - the object in question

	Returns:
	string - the list of keys.
	*/
	listify = function (obj) {
		var str = "",
			ctr = 0,
			key = "";
		for (key in obj) {
			if (ctr === 0) {
				str += key;
			} else {
				str += ", " + key;
			}
			ctr += 1;
		}
		return str;
	},

	/* Function: haveSameContents
	Returns true if the two given arrays contain the same elements, order aside.

	Parameters:
	arr1 - the first array
	arr2 - the second

	Returns:
	boolean - true if the two arrays contain the same contents, order aside; false otherwise.
	*/
	haveSameContents = function (arr1, arr2) {
		var i = 0,
			checklist = [];
		if (!isArray(arr1) || !isArray(arr2)) {
			throw new Error("util.haveSameContents(): called with a non-array parameter.");
		}
		if (arr1.length !== arr2.length) {
			return false;
		}
		checklist = arr2.slice(0); // create a deep copy
		for (i in arr1) {
			var matchPos = checklist.indexOf(arr1[i]);
			if (matchPos >= 0) {
				checklist.splice(matchPos, 1);
			} else {
				return false;
			}
		}
		if (checklist.length === 0) {
			return true;
		}
		return false;
	},

	/* Function: degToRad
	Takes a number in degrees and returns in radians.

	Parameters:
	num - a number in degrees

	Returns:
	a number in radians
	*/
	degToRad = function (num) {
		return num * (Math.PI / 180);
	},

	/* Function: radToDeg
	Takes a number in radians and returns in degrees.

	Parameters:
	num - a number in radians

	Returns:
	a number in degrees
	*/
	radToDeg = function (num) {
		return num * (180 / Math.PI);
	},

	/* Function: roundTo
	Round to nearest given decimal. roundNumber(2.432, 1) equals 2.4

	Parameters:
	num - the number to round
	dec - an integer, the number of significant digits after the decimal to round to.

	Returns:
	a number

	Note:
	If you're doing this to display as a string, Javascript has the built-in function num.toFixed(precision)
	*/
	roundTo = function (num, dec) {
		var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
		return result;
	},

	/* Function: remap
	Returns a val in the given old range converted to its position in the given new range, as a float.

	Example:
	remap(10, 1, 10, 1, 100) = 100 (read: If you take 10 on a scale of 1 to 10, and ask what its equivalent is on a scale of 1 to 100, the answer is 100.)

	Parameters:
	val - the number to remap
	oldRangeL - the bottom end of the old range
	oldRangeU - the upper end of the old range
	newRangeL - the bottom end of the new range
	newRangeU - the upper end of the new range

	Returns:
	a number, val remapped to the new range.
	*/
	remap = function (val, oldRangeL, oldRangeU, newRangeL, newRangeU) {
		return (((val - oldRangeL) / (oldRangeU - oldRangeL)) * (newRangeU - newRangeL)) + newRangeL;
	},

	// Returns a number as a spelled-out equivalent, like 20 --> twenty, for any number up to 9999. Four-digit numbers are printed like years (nineteen fifty-six). Return a string unchanged.
	printedNumber = function (num) {
		if (typeof num === "string") return num;
		var s = "";
		if (num < 20) {
			switch(num) {
				case 0: s = "zero"; break;
				case 1: s =  "one"; break;
				case 2: s =  "two"; break;
				case 3: s =  "three"; break;
				case 4: s =  "four"; break;
				case 5: s =  "five"; break;
				case 6: s =  "six"; break;
				case 7: s =  "seven"; break;
				case 8: s =  "eight"; break;
				case 9: s =  "nine"; break;
				case 10: s =  "ten"; break;
				case 11: s =  "eleven"; break;
				case 12: s =  "twelve"; break;
				case 13: s =  "thirteen"; break;
				case 14: s =  "fourteen"; break;
				case 15: s =  "fifteen"; break;
				case 16: s =  "sixteen"; break;
				case 17: s =  "seventeen"; break;
				case 18: s =  "eighteen"; break;
				case 19: s =  "nineteen"; break;
				default: s = "less than zero"; break;
			}
		} else if (num < 100) {
			switch (Math.floor(num/10)) {
				case 2: s = "twenty"; break;
				case 3: s = "thirty"; break;
				case 4: s = "forty"; break;
				case 5: s = "fifty"; break;
				case 6: s = "sixty"; break;
				case 7: s = "seventy"; break;
				case 8: s = "eighty"; break;
				case 9: s = "ninety"; break;
			}
			if (num % 10 != 0) {
				s = s + "-" + printedNumber(num % 10);
			}
		} else if (num < 200) {
			s = "a hundred";
			if (num - 100 > 0) s = s + " and " + printedNumber(num - 100);
		} else if (num < 1000) {
			s = printedNumber(Math.floor(num/100)) + " hundred";
			if (num % 100 != 0) s = s + " and " + printedNumber(num % 100);
		} else if (num < 9999) {
			s = printedNumber(Math.floor(num/100));
			if (num % 100 != 0) {
				s = s + " " + printedNumber(num % 100);
			} else {
				s = s + " hundred";
			}
		} else {
			s = "at least ten thousand";
		}
		return s;
	},

	ordinalNumber = function(num) {
		if (typeof num === "string") return num;
		var s = printedNumber(num) + "th";
		switch(num) {
			case 0: s = "zeroth"; break;
			case 1: s =  "first"; break;
			case 2: s =  "second"; break;
			case 3: s =  "third"; break;
			case 5: s =  "fifth"; break;
			case 8: s =  "eighth"; break;
			case 9: s =  "ninth"; break;
			case 12: s =  "twelfth"; break;
			case 20: s = "twentieth"; break;
		}
		if (num > 20) {
			var numAsStr = ""+num;
			var lastDigit = numAsStr[numAsStr.length-1];
			switch(lastDigit) {
				case "1": s = num + "st"; break
				case "2": s = num + "nd"; break;
				case "3": s = num + "rd"; break;
				default: s = num + "th"; break;
			}
		}
		return s;
	},

	/* Function: clone
	Creates a clone (non-reference version) of an array or object. Code courtesy A. Levy on Stackoverflow.

	Parameters:
	obj - the object to clone

	Returns:
	a new object identical to obj
	*/
	clone = function (obj) {
	    // Handle the 3 simple types, and null or undefined
	    if (null === obj || "object" !== typeof obj) return obj;

	    // Handle Array
	    if (obj instanceof Array) {
	        var copy = [];
	        for (var i = 0, len = obj.length; i < len; i++) {
	            copy[i] = clone(obj[i]);
	        }
	        return copy;
	    }

	    // Handle Object
	    if (obj instanceof Object) {
	        var copy = {};
	        for (var attr in obj) {
	            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
	        }
	        return copy;
	    }

	    throw new Error("Unable to copy obj! Its type isn't supported.");
	},

	assert = function (condition, messageIfFalse) {
		if (condition) {
			console.log("Passed");
		} else {
			console.log("FAILED: " + messageIfFalse);
			for (var i = 2; i <= arguments.length; i++) {
				console.log(arguments[i]);
			}
		}
	},

	objToText = function(obj, indentLevel) {
		if (indentLevel === undefined) {
			indentLevel = 0;
		}
		var str = "";
		var spaces = Array(indentLevel + 1).join(" ");
		for (var key in obj) {
			if (typeof obj[key] === "object") {
				str += spaces + key + ": " + "\n"
				str += objToText(obj[key], indentLevel+2);
			} else {
				str += spaces + key + ": " + obj[key] + "\n";
			}
		}
		return str;
	};

	// Adds support for trim if using a browser that doesn't provide it.
	if(!String.prototype.trim) {
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/g,'');
		};
	}




	// revealing public API
	// Note: The reason we do it this way is to let us declare private variables next to the functions they relate to, rather than having to put them all at the top before the "return" block exposing the functions.
	return {
		randomKey: randomKey,
		isArray: isArray,
		isInt: isInt,
		has: has,
		randomNumber: randomNumber,
		randomNoRepeat: randomNoRepeat,
		randomJitter: randomJitter,
		iterator: iterator,
		resetIterator: resetIterator,
		oneOf: oneOf,
		oneOfNoRepeat: oneOfNoRepeat,
		randomOrder: randomOrder,
		safeAdd: safeAdd,
		safeMultiply: safeMultiply,
		safeSubtract: safeSubtract,
		safeDivide: safeDivide,
		// strip: strip,		// Same as built-in trim.
		iCap: iCap,
		iUpper: iCap,			// Alias
		iLower: iLower,
		titleCase: titleCase,
		isOneOf: isOneOf,
		listify: listify,
		haveSameContents: haveSameContents,
		degToRad: degToRad,
		radToDeg: radToDeg,
		roundTo: roundTo,
		remap: remap,
		listWriter: listWriter,
		clone: clone,
		printedNumber: printedNumber,
		ordinalNumber: ordinalNumber,
		nl2br: nl2br,

		objToText: objToText,

		assert: assert
	};

});

