(function () {/**
 * @license almond 0.3.0 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("requireLib", function(){});

// Package: Util
// Library of useful functions.

/*jshint smarttabs: true */
/*global define */

define('util',[], function() {
	

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


//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
(function(){var n=this,t=n._,r={},e=Array.prototype,u=Object.prototype,i=Function.prototype,a=e.push,o=e.slice,c=e.concat,l=u.toString,f=u.hasOwnProperty,s=e.forEach,p=e.map,h=e.reduce,v=e.reduceRight,g=e.filter,d=e.every,m=e.some,y=e.indexOf,b=e.lastIndexOf,x=Array.isArray,w=Object.keys,_=i.bind,j=function(n){return n instanceof j?n:this instanceof j?void(this._wrapped=n):new j(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=j),exports._=j):n._=j,j.VERSION="1.6.0";var A=j.each=j.forEach=function(n,t,e){if(null==n)return n;if(s&&n.forEach===s)n.forEach(t,e);else if(n.length===+n.length){for(var u=0,i=n.length;i>u;u++)if(t.call(e,n[u],u,n)===r)return}else for(var a=j.keys(n),u=0,i=a.length;i>u;u++)if(t.call(e,n[a[u]],a[u],n)===r)return;return n};j.map=j.collect=function(n,t,r){var e=[];return null==n?e:p&&n.map===p?n.map(t,r):(A(n,function(n,u,i){e.push(t.call(r,n,u,i))}),e)};var O="Reduce of empty array with no initial value";j.reduce=j.foldl=j.inject=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),h&&n.reduce===h)return e&&(t=j.bind(t,e)),u?n.reduce(t,r):n.reduce(t);if(A(n,function(n,i,a){u?r=t.call(e,r,n,i,a):(r=n,u=!0)}),!u)throw new TypeError(O);return r},j.reduceRight=j.foldr=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),v&&n.reduceRight===v)return e&&(t=j.bind(t,e)),u?n.reduceRight(t,r):n.reduceRight(t);var i=n.length;if(i!==+i){var a=j.keys(n);i=a.length}if(A(n,function(o,c,l){c=a?a[--i]:--i,u?r=t.call(e,r,n[c],c,l):(r=n[c],u=!0)}),!u)throw new TypeError(O);return r},j.find=j.detect=function(n,t,r){var e;return k(n,function(n,u,i){return t.call(r,n,u,i)?(e=n,!0):void 0}),e},j.filter=j.select=function(n,t,r){var e=[];return null==n?e:g&&n.filter===g?n.filter(t,r):(A(n,function(n,u,i){t.call(r,n,u,i)&&e.push(n)}),e)},j.reject=function(n,t,r){return j.filter(n,function(n,e,u){return!t.call(r,n,e,u)},r)},j.every=j.all=function(n,t,e){t||(t=j.identity);var u=!0;return null==n?u:d&&n.every===d?n.every(t,e):(A(n,function(n,i,a){return(u=u&&t.call(e,n,i,a))?void 0:r}),!!u)};var k=j.some=j.any=function(n,t,e){t||(t=j.identity);var u=!1;return null==n?u:m&&n.some===m?n.some(t,e):(A(n,function(n,i,a){return u||(u=t.call(e,n,i,a))?r:void 0}),!!u)};j.contains=j.include=function(n,t){return null==n?!1:y&&n.indexOf===y?n.indexOf(t)!=-1:k(n,function(n){return n===t})},j.invoke=function(n,t){var r=o.call(arguments,2),e=j.isFunction(t);return j.map(n,function(n){return(e?t:n[t]).apply(n,r)})},j.pluck=function(n,t){return j.map(n,j.property(t))},j.where=function(n,t){return j.filter(n,j.matches(t))},j.findWhere=function(n,t){return j.find(n,j.matches(t))},j.max=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.max.apply(Math,n);var e=-1/0,u=-1/0;return A(n,function(n,i,a){var o=t?t.call(r,n,i,a):n;o>u&&(e=n,u=o)}),e},j.min=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.min.apply(Math,n);var e=1/0,u=1/0;return A(n,function(n,i,a){var o=t?t.call(r,n,i,a):n;u>o&&(e=n,u=o)}),e},j.shuffle=function(n){var t,r=0,e=[];return A(n,function(n){t=j.random(r++),e[r-1]=e[t],e[t]=n}),e},j.sample=function(n,t,r){return null==t||r?(n.length!==+n.length&&(n=j.values(n)),n[j.random(n.length-1)]):j.shuffle(n).slice(0,Math.max(0,t))};var E=function(n){return null==n?j.identity:j.isFunction(n)?n:j.property(n)};j.sortBy=function(n,t,r){return t=E(t),j.pluck(j.map(n,function(n,e,u){return{value:n,index:e,criteria:t.call(r,n,e,u)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),"value")};var F=function(n){return function(t,r,e){var u={};return r=E(r),A(t,function(i,a){var o=r.call(e,i,a,t);n(u,o,i)}),u}};j.groupBy=F(function(n,t,r){j.has(n,t)?n[t].push(r):n[t]=[r]}),j.indexBy=F(function(n,t,r){n[t]=r}),j.countBy=F(function(n,t){j.has(n,t)?n[t]++:n[t]=1}),j.sortedIndex=function(n,t,r,e){r=E(r);for(var u=r.call(e,t),i=0,a=n.length;a>i;){var o=i+a>>>1;r.call(e,n[o])<u?i=o+1:a=o}return i},j.toArray=function(n){return n?j.isArray(n)?o.call(n):n.length===+n.length?j.map(n,j.identity):j.values(n):[]},j.size=function(n){return null==n?0:n.length===+n.length?n.length:j.keys(n).length},j.first=j.head=j.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:0>t?[]:o.call(n,0,t)},j.initial=function(n,t,r){return o.call(n,0,n.length-(null==t||r?1:t))},j.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:o.call(n,Math.max(n.length-t,0))},j.rest=j.tail=j.drop=function(n,t,r){return o.call(n,null==t||r?1:t)},j.compact=function(n){return j.filter(n,j.identity)};var M=function(n,t,r){return t&&j.every(n,j.isArray)?c.apply(r,n):(A(n,function(n){j.isArray(n)||j.isArguments(n)?t?a.apply(r,n):M(n,t,r):r.push(n)}),r)};j.flatten=function(n,t){return M(n,t,[])},j.without=function(n){return j.difference(n,o.call(arguments,1))},j.partition=function(n,t){var r=[],e=[];return A(n,function(n){(t(n)?r:e).push(n)}),[r,e]},j.uniq=j.unique=function(n,t,r,e){j.isFunction(t)&&(e=r,r=t,t=!1);var u=r?j.map(n,r,e):n,i=[],a=[];return A(u,function(r,e){(t?e&&a[a.length-1]===r:j.contains(a,r))||(a.push(r),i.push(n[e]))}),i},j.union=function(){return j.uniq(j.flatten(arguments,!0))},j.intersection=function(n){var t=o.call(arguments,1);return j.filter(j.uniq(n),function(n){return j.every(t,function(t){return j.contains(t,n)})})},j.difference=function(n){var t=c.apply(e,o.call(arguments,1));return j.filter(n,function(n){return!j.contains(t,n)})},j.zip=function(){for(var n=j.max(j.pluck(arguments,"length").concat(0)),t=new Array(n),r=0;n>r;r++)t[r]=j.pluck(arguments,""+r);return t},j.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},j.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if("number"!=typeof r)return e=j.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}if(y&&n.indexOf===y)return n.indexOf(t,r);for(;u>e;e++)if(n[e]===t)return e;return-1},j.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=null!=r;if(b&&n.lastIndexOf===b)return e?n.lastIndexOf(t,r):n.lastIndexOf(t);for(var u=e?r:n.length;u--;)if(n[u]===t)return u;return-1},j.range=function(n,t,r){arguments.length<=1&&(t=n||0,n=0),r=arguments[2]||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=0,i=new Array(e);e>u;)i[u++]=n,n+=r;return i};var R=function(){};j.bind=function(n,t){var r,e;if(_&&n.bind===_)return _.apply(n,o.call(arguments,1));if(!j.isFunction(n))throw new TypeError;return r=o.call(arguments,2),e=function(){if(!(this instanceof e))return n.apply(t,r.concat(o.call(arguments)));R.prototype=n.prototype;var u=new R;R.prototype=null;var i=n.apply(u,r.concat(o.call(arguments)));return Object(i)===i?i:u}},j.partial=function(n){var t=o.call(arguments,1);return function(){for(var r=0,e=t.slice(),u=0,i=e.length;i>u;u++)e[u]===j&&(e[u]=arguments[r++]);for(;r<arguments.length;)e.push(arguments[r++]);return n.apply(this,e)}},j.bindAll=function(n){var t=o.call(arguments,1);if(0===t.length)throw new Error("bindAll must be passed function names");return A(t,function(t){n[t]=j.bind(n[t],n)}),n},j.memoize=function(n,t){var r={};return t||(t=j.identity),function(){var e=t.apply(this,arguments);return j.has(r,e)?r[e]:r[e]=n.apply(this,arguments)}},j.delay=function(n,t){var r=o.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},j.defer=function(n){return j.delay.apply(j,[n,1].concat(o.call(arguments,1)))},j.throttle=function(n,t,r){var e,u,i,a=null,o=0;r||(r={});var c=function(){o=r.leading===!1?0:j.now(),a=null,i=n.apply(e,u),e=u=null};return function(){var l=j.now();o||r.leading!==!1||(o=l);var f=t-(l-o);return e=this,u=arguments,0>=f?(clearTimeout(a),a=null,o=l,i=n.apply(e,u),e=u=null):a||r.trailing===!1||(a=setTimeout(c,f)),i}},j.debounce=function(n,t,r){var e,u,i,a,o,c=function(){var l=j.now()-a;t>l?e=setTimeout(c,t-l):(e=null,r||(o=n.apply(i,u),i=u=null))};return function(){i=this,u=arguments,a=j.now();var l=r&&!e;return e||(e=setTimeout(c,t)),l&&(o=n.apply(i,u),i=u=null),o}},j.once=function(n){var t,r=!1;return function(){return r?t:(r=!0,t=n.apply(this,arguments),n=null,t)}},j.wrap=function(n,t){return j.partial(t,n)},j.compose=function(){var n=arguments;return function(){for(var t=arguments,r=n.length-1;r>=0;r--)t=[n[r].apply(this,t)];return t[0]}},j.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},j.keys=function(n){if(!j.isObject(n))return[];if(w)return w(n);var t=[];for(var r in n)j.has(n,r)&&t.push(r);return t},j.values=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},j.pairs=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},j.invert=function(n){for(var t={},r=j.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},j.functions=j.methods=function(n){var t=[];for(var r in n)j.isFunction(n[r])&&t.push(r);return t.sort()},j.extend=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]=t[r]}),n},j.pick=function(n){var t={},r=c.apply(e,o.call(arguments,1));return A(r,function(r){r in n&&(t[r]=n[r])}),t},j.omit=function(n){var t={},r=c.apply(e,o.call(arguments,1));for(var u in n)j.contains(r,u)||(t[u]=n[u]);return t},j.defaults=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]===void 0&&(n[r]=t[r])}),n},j.clone=function(n){return j.isObject(n)?j.isArray(n)?n.slice():j.extend({},n):n},j.tap=function(n,t){return t(n),n};var S=function(n,t,r,e){if(n===t)return 0!==n||1/n==1/t;if(null==n||null==t)return n===t;n instanceof j&&(n=n._wrapped),t instanceof j&&(t=t._wrapped);var u=l.call(n);if(u!=l.call(t))return!1;switch(u){case"[object String]":return n==String(t);case"[object Number]":return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case"[object Date]":case"[object Boolean]":return+n==+t;case"[object RegExp]":return n.source==t.source&&n.global==t.global&&n.multiline==t.multiline&&n.ignoreCase==t.ignoreCase}if("object"!=typeof n||"object"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]==n)return e[i]==t;var a=n.constructor,o=t.constructor;if(a!==o&&!(j.isFunction(a)&&a instanceof a&&j.isFunction(o)&&o instanceof o)&&"constructor"in n&&"constructor"in t)return!1;r.push(n),e.push(t);var c=0,f=!0;if("[object Array]"==u){if(c=n.length,f=c==t.length)for(;c--&&(f=S(n[c],t[c],r,e)););}else{for(var s in n)if(j.has(n,s)&&(c++,!(f=j.has(t,s)&&S(n[s],t[s],r,e))))break;if(f){for(s in t)if(j.has(t,s)&&!c--)break;f=!c}}return r.pop(),e.pop(),f};j.isEqual=function(n,t){return S(n,t,[],[])},j.isEmpty=function(n){if(null==n)return!0;if(j.isArray(n)||j.isString(n))return 0===n.length;for(var t in n)if(j.has(n,t))return!1;return!0},j.isElement=function(n){return!(!n||1!==n.nodeType)},j.isArray=x||function(n){return"[object Array]"==l.call(n)},j.isObject=function(n){return n===Object(n)},A(["Arguments","Function","String","Number","Date","RegExp"],function(n){j["is"+n]=function(t){return l.call(t)=="[object "+n+"]"}}),j.isArguments(arguments)||(j.isArguments=function(n){return!(!n||!j.has(n,"callee"))}),"function"!=typeof/./&&(j.isFunction=function(n){return"function"==typeof n}),j.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},j.isNaN=function(n){return j.isNumber(n)&&n!=+n},j.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"==l.call(n)},j.isNull=function(n){return null===n},j.isUndefined=function(n){return n===void 0},j.has=function(n,t){return f.call(n,t)},j.noConflict=function(){return n._=t,this},j.identity=function(n){return n},j.constant=function(n){return function(){return n}},j.property=function(n){return function(t){return t[n]}},j.matches=function(n){return function(t){if(t===n)return!0;for(var r in n)if(n[r]!==t[r])return!1;return!0}},j.times=function(n,t,r){for(var e=Array(Math.max(0,n)),u=0;n>u;u++)e[u]=t.call(r,u);return e},j.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))},j.now=Date.now||function(){return(new Date).getTime()};var T={escape:{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;"}};T.unescape=j.invert(T.escape);var I={escape:new RegExp("["+j.keys(T.escape).join("")+"]","g"),unescape:new RegExp("("+j.keys(T.unescape).join("|")+")","g")};j.each(["escape","unescape"],function(n){j[n]=function(t){return null==t?"":(""+t).replace(I[n],function(t){return T[n][t]})}}),j.result=function(n,t){if(null==n)return void 0;var r=n[t];return j.isFunction(r)?r.call(n):r},j.mixin=function(n){A(j.functions(n),function(t){var r=j[t]=n[t];j.prototype[t]=function(){var n=[this._wrapped];return a.apply(n,arguments),z.call(this,r.apply(j,n))}})};var N=0;j.uniqueId=function(n){var t=++N+"";return n?n+t:t},j.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var q=/(.)^/,B={"'":"'","\\":"\\","\r":"r","\n":"n","	":"t","\u2028":"u2028","\u2029":"u2029"},D=/\\|'|\r|\n|\t|\u2028|\u2029/g;j.template=function(n,t,r){var e;r=j.defaults({},r,j.templateSettings);var u=new RegExp([(r.escape||q).source,(r.interpolate||q).source,(r.evaluate||q).source].join("|")+"|$","g"),i=0,a="__p+='";n.replace(u,function(t,r,e,u,o){return a+=n.slice(i,o).replace(D,function(n){return"\\"+B[n]}),r&&(a+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'"),e&&(a+="'+\n((__t=("+e+"))==null?'':__t)+\n'"),u&&(a+="';\n"+u+"\n__p+='"),i=o+t.length,t}),a+="';\n",r.variable||(a="with(obj||{}){\n"+a+"}\n"),a="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+a+"return __p;\n";try{e=new Function(r.variable||"obj","_",a)}catch(o){throw o.source=a,o}if(t)return e(t,j);var c=function(n){return e.call(this,n,j)};return c.source="function("+(r.variable||"obj")+"){\n"+a+"}",c},j.chain=function(n){return j(n).chain()};var z=function(n){return this._chain?j(n).chain():n};j.mixin(j),A(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=e[n];j.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!=n&&"splice"!=n||0!==r.length||delete r[0],z.call(this,r)}}),A(["concat","join","slice"],function(n){var t=e[n];j.prototype[n]=function(){return z.call(this,t.apply(this._wrapped,arguments))}}),j.extend(j.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}}),"function"==typeof define&&define.amd&&define("underscore",[],function(){return j})}).call(this);
//# sourceMappingURL=underscore-min.map;
/*!
 * jQuery JavaScript Library v2.1.0
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-01-23T21:10Z
 */

(function( global, factory ) {

	if ( typeof module === "object" && typeof module.exports === "object" ) {
		// For CommonJS and CommonJS-like environments where a proper window is present,
		// execute the factory and get jQuery
		// For environments that do not inherently posses a window with a document
		// (such as Node.js), expose a jQuery-making factory as module.exports
		// This accentuates the need for the creation of a real window
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//

var arr = [];

var slice = arr.slice;

var concat = arr.concat;

var push = arr.push;

var indexOf = arr.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var trim = "".trim;

var support = {};



var
	// Use the correct document accordingly with window argument (sandbox)
	document = window.document,

	version = "2.1.0",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// Start with an empty selector
	selector: "",

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num != null ?

			// Return a 'clean' array
			( num < 0 ? this[ num + this.length ] : this[ num ] ) :

			// Return just the object
			slice.call( this );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: arr.sort,
	splice: arr.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	isArray: Array.isArray,

	isWindow: function( obj ) {
		return obj != null && obj === obj.window;
	},

	isNumeric: function( obj ) {
		// parseFloat NaNs numeric-cast false positives (null|true|false|"")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		return obj - parseFloat( obj ) >= 0;
	},

	isPlainObject: function( obj ) {
		// Not plain objects:
		// - Any object or value whose internal [[Class]] property is not "[object Object]"
		// - DOM nodes
		// - window
		if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		// Support: Firefox <20
		// The try/catch suppresses exceptions thrown when attempting to access
		// the "constructor" property of certain host objects, ie. |window.location|
		// https://bugzilla.mozilla.org/show_bug.cgi?id=814622
		try {
			if ( obj.constructor &&
					!hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
				return false;
			}
		} catch ( e ) {
			return false;
		}

		// If the function hasn't returned already, we're confident that
		// |obj| is a plain object, created by {} or constructed with new Object
		return true;
	},

	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	type: function( obj ) {
		if ( obj == null ) {
			return obj + "";
		}
		// Support: Android < 4.0, iOS < 6 (functionish RegExp)
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ toString.call(obj) ] || "object" :
			typeof obj;
	},

	// Evaluates a script in a global context
	globalEval: function( code ) {
		var script,
			indirect = eval;

		code = jQuery.trim( code );

		if ( code ) {
			// If the code includes a valid, prologue position
			// strict mode pragma, execute code by injecting a
			// script tag into the document.
			if ( code.indexOf("use strict") === 1 ) {
				script = document.createElement("script");
				script.text = code;
				document.head.appendChild( script ).parentNode.removeChild( script );
			} else {
			// Otherwise, avoid the DOM node creation, insertion
			// and removal by using an indirect global eval
				indirect( code );
			}
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// args is for internal usage only
	each: function( obj, callback, args ) {
		var value,
			i = 0,
			length = obj.length,
			isArray = isArraylike( obj );

		if ( args ) {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

	trim: function( text ) {
		return text == null ? "" : trim.call( text );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	},

	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var tmp, args, proxy;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	now: Date.now,

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
});

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function isArraylike( obj ) {
	var length = obj.length,
		type = jQuery.type( obj );

	if ( type === "function" || jQuery.isWindow( obj ) ) {
		return false;
	}

	if ( obj.nodeType === 1 && length ) {
		return true;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v1.10.16
 * http://sizzlejs.com/
 *
 * Copyright 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-01-13
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	compile,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + -(new Date()),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// General-purpose constants
	strundefined = typeof undefined,
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:([*^$|!~]?=)" + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

	// Prefer arguments quoted,
	//   then not containing pseudos/brackets,
	//   then attribute selectors/non-parenthetical expressions,
	//   then anything else
	// These preferences are here to reduce the number of selectors
	//   needing tokenize in the PSEUDO preFilter
	pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace( 3, 8 ) + ")*)|.*)\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,
	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
		return [];
	}

	if ( documentIsHTML && !seed ) {

		// Shortcuts
		if ( (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document (jQuery #6963)
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName && context.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			nid = old = expando;
			newContext = context;
			newSelector = nodeType === 9 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== strundefined && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare,
		doc = node ? node.ownerDocument || node : preferredDoc,
		parent = doc.defaultView;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;

	// Support tests
	documentIsHTML = !isXML( doc );

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent !== parent.top ) {
		// IE11 does not have attachEvent, so all must suffer
		if ( parent.addEventListener ) {
			parent.addEventListener( "unload", function() {
				setDocument();
			}, false );
		} else if ( parent.attachEvent ) {
			parent.attachEvent( "onunload", function() {
				setDocument();
			});
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Check if getElementsByClassName can be trusted
	support.getElementsByClassName = rnative.test( doc.getElementsByClassName ) && assert(function( div ) {
		div.innerHTML = "<div class='a'></div><div class='a i'></div>";

		// Support: Safari<4
		// Catch class over-caching
		div.firstChild.className = "i";
		// Support: Opera<10
		// Catch gEBCN failure to find non-leading classes
		return div.getElementsByClassName("i").length === 2;
	});

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== strundefined ) {
				return context.getElementsByTagName( tag );
			}
		} :
		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== strundefined && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			div.innerHTML = "<select t=''><option selected=''></option></select>";

			// Support: IE8, Opera 10-12
			// Nothing should be selected when empty strings follow ^= or $= or *=
			if ( div.querySelectorAll("[t^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}
		});

		assert(function( div ) {
			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( div.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return doc;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch(e) {}
	}

	return Sizzle( expr, document, null, [elem] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[5] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] && match[4] !== undefined ) {
				match[2] = match[4];

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

function tokenize( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
}

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (oldCache = outerCache[ dir ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							outerCache[ dir ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context !== document && context;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !group ) {
			group = tokenize( selector );
		}
		i = group.length;
		while ( i-- ) {
			cached = matcherFromTokens( group[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
	}
	return cached;
};

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function select( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		match = tokenize( selector );

	if ( !seed ) {
		// Try to minimize operations if there is only one group
		if ( match.length === 1 ) {

			// Take a shortcut and set the context if the root selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					support.getById && context.nodeType === 9 && documentIsHTML &&
					Expr.relative[ tokens[1].type ] ) {

				context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
				if ( !context ) {
					return results;
				}
				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
			i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[i];

				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
						rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
					)) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, seed );
							return results;
						}

						break;
					}
				}
			}
		}
	}

	// Compile and execute a filtering function
	// Provide `match` to avoid retokenization if we modified the selector above
	compile( selector, match )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
}

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome<14
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;



var rneedsContext = jQuery.expr.match.needsContext;

var rsingleTag = (/^<(\w+)\s*\/?>(?:<\/\1>|)$/);



var risSimple = /^.[^:#\[\.,]*$/;

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			/* jshint -W018 */
			return !!qualifier.call( elem, i, elem ) !== not;
		});

	}

	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		});

	}

	if ( typeof qualifier === "string" ) {
		if ( risSimple.test( qualifier ) ) {
			return jQuery.filter( qualifier, elements, not );
		}

		qualifier = jQuery.filter( qualifier, elements );
	}

	return jQuery.grep( elements, function( elem ) {
		return ( indexOf.call( qualifier, elem ) >= 0 ) !== not;
	});
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	return elems.length === 1 && elem.nodeType === 1 ?
		jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
		jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
			return elem.nodeType === 1;
		}));
};

jQuery.fn.extend({
	find: function( selector ) {
		var i,
			len = this.length,
			ret = [],
			self = this;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter(function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			}) );
		}

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = this.selector ? this.selector + " " + selector : selector;
		return ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow(this, selector || [], false) );
	},
	not: function( selector ) {
		return this.pushStack( winnow(this, selector || [], true) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
});


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	init = jQuery.fn.init = function( selector, context ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector[0] === "<" && selector[ selector.length - 1 ] === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;

					// scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return typeof rootjQuery.ready !== "undefined" ?
				rootjQuery.ready( selector ) :
				// Execute immediately if ready is not present
				selector( jQuery );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,
	// methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.extend({
	dir: function( elem, dir, until ) {
		var matched = [],
			truncate = until !== undefined;

		while ( (elem = elem[ dir ]) && elem.nodeType !== 9 ) {
			if ( elem.nodeType === 1 ) {
				if ( truncate && jQuery( elem ).is( until ) ) {
					break;
				}
				matched.push( elem );
			}
		}
		return matched;
	},

	sibling: function( n, elem ) {
		var matched = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				matched.push( n );
			}
		}

		return matched;
	}
});

jQuery.fn.extend({
	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter(function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			for ( cur = this[i]; cur && cur !== context; cur = cur.parentNode ) {
				// Always skip document fragments
				if ( cur.nodeType < 11 && (pos ?
					pos.index(cur) > -1 :

					// Don't pass non-elements to Sizzle
					cur.nodeType === 1 &&
						jQuery.find.matchesSelector(cur, selectors)) ) {

					matched.push( cur );
					break;
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.unique( matched ) : matched );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// index in selector
		if ( typeof elem === "string" ) {
			return indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.unique(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

function sibling( cur, dir ) {
	while ( (cur = cur[dir]) && cur.nodeType !== 1 ) {}
	return cur;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return elem.contentDocument || jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {
			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				jQuery.unique( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
});
var rnotwhite = (/\S+/g);



// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.match( rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// Flag to know if list is currently firing
		firing,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				firingLength = 0;
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( list && ( !fired || stack ) ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


jQuery.extend({

	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ](function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
									newDefer[ tuple[ 0 ] + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[1] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ]
			deferred[ tuple[0] ] = function() {
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( values === progressValues ) {
						deferred.notifyWith( contexts, values );
					} else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});


// The deferred used on DOM ready
var readyList;

jQuery.fn.ready = function( fn ) {
	// Add the callback
	jQuery.ready.promise().done( fn );

	return this;
};

jQuery.extend({
	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.trigger ) {
			jQuery( document ).trigger("ready").off("ready");
		}
	}
});

/**
 * The ready event handler and self cleanup method
 */
function completed() {
	document.removeEventListener( "DOMContentLoaded", completed, false );
	window.removeEventListener( "load", completed, false );
	jQuery.ready();
}

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready );

		} else {

			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed, false );
		}
	}
	return readyList.promise( obj );
};

// Kick off the DOM ready check even if the user does not
jQuery.ready.promise();




// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = jQuery.access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		len = elems.length,
		bulk = key == null;

	// Sets many values
	if ( jQuery.type( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !jQuery.isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {
			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < len; i++ ) {
				fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
			}
		}
	}

	return chainable ?
		elems :

		// Gets
		bulk ?
			fn.call( elems ) :
			len ? fn( elems[0], key ) : emptyGet;
};


/**
 * Determines whether an object can have data
 */
jQuery.acceptData = function( owner ) {
	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	/* jshint -W018 */
	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};


function Data() {
	// Support: Android < 4,
	// Old WebKit does not have Object.preventExtensions/freeze method,
	// return new empty object instead with no [[set]] accessor
	Object.defineProperty( this.cache = {}, 0, {
		get: function() {
			return {};
		}
	});

	this.expando = jQuery.expando + Math.random();
}

Data.uid = 1;
Data.accepts = jQuery.acceptData;

Data.prototype = {
	key: function( owner ) {
		// We can accept data for non-element nodes in modern browsers,
		// but we should not, see #8335.
		// Always return the key for a frozen object.
		if ( !Data.accepts( owner ) ) {
			return 0;
		}

		var descriptor = {},
			// Check if the owner object already has a cache key
			unlock = owner[ this.expando ];

		// If not, create one
		if ( !unlock ) {
			unlock = Data.uid++;

			// Secure it in a non-enumerable, non-writable property
			try {
				descriptor[ this.expando ] = { value: unlock };
				Object.defineProperties( owner, descriptor );

			// Support: Android < 4
			// Fallback to a less secure definition
			} catch ( e ) {
				descriptor[ this.expando ] = unlock;
				jQuery.extend( owner, descriptor );
			}
		}

		// Ensure the cache object
		if ( !this.cache[ unlock ] ) {
			this.cache[ unlock ] = {};
		}

		return unlock;
	},
	set: function( owner, data, value ) {
		var prop,
			// There may be an unlock assigned to this node,
			// if there is no entry for this "owner", create one inline
			// and set the unlock as though an owner entry had always existed
			unlock = this.key( owner ),
			cache = this.cache[ unlock ];

		// Handle: [ owner, key, value ] args
		if ( typeof data === "string" ) {
			cache[ data ] = value;

		// Handle: [ owner, { properties } ] args
		} else {
			// Fresh assignments by object are shallow copied
			if ( jQuery.isEmptyObject( cache ) ) {
				jQuery.extend( this.cache[ unlock ], data );
			// Otherwise, copy the properties one-by-one to the cache object
			} else {
				for ( prop in data ) {
					cache[ prop ] = data[ prop ];
				}
			}
		}
		return cache;
	},
	get: function( owner, key ) {
		// Either a valid cache is found, or will be created.
		// New caches will be created and the unlock returned,
		// allowing direct access to the newly created
		// empty data object. A valid owner object must be provided.
		var cache = this.cache[ this.key( owner ) ];

		return key === undefined ?
			cache : cache[ key ];
	},
	access: function( owner, key, value ) {
		var stored;
		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				((key && typeof key === "string") && value === undefined) ) {

			stored = this.get( owner, key );

			return stored !== undefined ?
				stored : this.get( owner, jQuery.camelCase(key) );
		}

		// [*]When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i, name, camel,
			unlock = this.key( owner ),
			cache = this.cache[ unlock ];

		if ( key === undefined ) {
			this.cache[ unlock ] = {};

		} else {
			// Support array or space separated string of keys
			if ( jQuery.isArray( key ) ) {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = key.concat( key.map( jQuery.camelCase ) );
			} else {
				camel = jQuery.camelCase( key );
				// Try the string as a key before any manipulation
				if ( key in cache ) {
					name = [ key, camel ];
				} else {
					// If a key with the spaces exists, use it.
					// Otherwise, create an array by matching non-whitespace
					name = camel;
					name = name in cache ?
						[ name ] : ( name.match( rnotwhite ) || [] );
				}
			}

			i = name.length;
			while ( i-- ) {
				delete cache[ name[ i ] ];
			}
		}
	},
	hasData: function( owner ) {
		return !jQuery.isEmptyObject(
			this.cache[ owner[ this.expando ] ] || {}
		);
	},
	discard: function( owner ) {
		if ( owner[ this.expando ] ) {
			delete this.cache[ owner[ this.expando ] ];
		}
	}
};
var data_priv = new Data();

var data_user = new Data();



/*
	Implementation Summary

	1. Enforce API surface and semantic compatibility with 1.9.x branch
	2. Improve the module's maintainability by reducing the storage
		paths to a single mechanism.
	3. Use the same single mechanism to support "private" and "user" data.
	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
	5. Avoid exposing implementation details on user objects (eg. expando properties)
	6. Provide a clear path for implementation upgrade to WeakMap in 2014
*/
var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /([A-Z])/g;

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
					data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			data_user.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}

jQuery.extend({
	hasData: function( elem ) {
		return data_user.hasData( elem ) || data_priv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return data_user.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		data_user.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to data_priv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return data_priv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		data_priv.remove( elem, name );
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = data_user.get( elem );

				if ( elem.nodeType === 1 && !data_priv.get( elem, "hasDataAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {
						name = attrs[ i ].name;

						if ( name.indexOf( "data-" ) === 0 ) {
							name = jQuery.camelCase( name.slice(5) );
							dataAttr( elem, name, data[ name ] );
						}
					}
					data_priv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each(function() {
				data_user.set( this, key );
			});
		}

		return access( this, function( value ) {
			var data,
				camelKey = jQuery.camelCase( key );

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {
				// Attempt to get data from the cache
				// with the key as-is
				data = data_user.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to get data from the cache
				// with the key camelized
				data = data_user.get( elem, camelKey );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, camelKey, undefined );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each(function() {
				// First, attempt to store a copy or reference of any
				// data that might've been store with a camelCased key.
				var data = data_user.get( this, camelKey );

				// For HTML5 data-* attribute interop, we have to
				// store property names with dashes in a camelCase form.
				// This might not apply to all properties...*
				data_user.set( this, camelKey, value );

				// *... In the case of properties that might _actually_
				// have dashes, we need to also store a copy of that
				// unchanged property.
				if ( key.indexOf("-") !== -1 && data !== undefined ) {
					data_user.set( this, key, value );
				}
			});
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each(function() {
			data_user.remove( this, key );
		});
	}
});


jQuery.extend({
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = data_priv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray( data ) ) {
					queue = data_priv.access( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// not intended for public consumption - generates a queueHooks object, or returns the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return data_priv.get( elem, key ) || data_priv.access( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				data_priv.remove( elem, [ type + "queue", key ] );
			})
		});
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[0], type );
		}

		return data === undefined ?
			this :
			this.each(function() {
				var queue = jQuery.queue( this, type, data );

				// ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = data_priv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
});
var pnum = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source;

var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var isHidden = function( elem, el ) {
		// isHidden might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;
		return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
	};

var rcheckableType = (/^(?:checkbox|radio)$/i);



(function() {
	var fragment = document.createDocumentFragment(),
		div = fragment.appendChild( document.createElement( "div" ) );

	// #11217 - WebKit loses check when the name is after the checked attribute
	div.innerHTML = "<input type='radio' checked='checked' name='t'/>";

	// Support: Safari 5.1, iOS 5.1, Android 4.x, Android 2.3
	// old WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Make sure textarea (and checkbox) defaultValue is properly cloned
	// Support: IE9-IE11+
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
})();
var strundefined = typeof undefined;



support.focusinBubbles = "onfocusin" in window;


var
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.get( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== strundefined && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
			};
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.hasData( elem ) && data_priv.get( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;
			data_priv.remove( elem, "events" );
		}
	},

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( data_priv.get( cur, "events" ) || {} )[ event.type ] && data_priv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && jQuery.acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
				jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					elem[ type ]();
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, j, ret, matched, handleObj,
			handlerQueue = [],
			args = slice.call( arguments ),
			handlers = ( data_priv.get( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, matches, sel, handleObj,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.disabled !== true || event.type !== "click" ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var eventDoc, doc, body,
				button = original.button;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
			originalEvent = event,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: Cordova 2.5 (WebKit) (#13255)
		// All events should have a target; Cordova deviceready doesn't
		if ( !event.target ) {
			event.target = document;
		}

		// Support: Safari 6.0+, Chrome < 28
		// Target should not be a text node (#504, #13143)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = function( elem, type, handle ) {
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle, false );
	}
};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				// Support: Android < 4.0
				src.defaultPrevented === undefined &&
				src.getPreventDefault && src.getPreventDefault() ?
			returnTrue :
			returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && e.preventDefault ) {
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && e.stopPropagation ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
// Support: Chrome 15+
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// Create "bubbling" focus and blur events
// Support: Firefox, Chrome, Safari
if ( !support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = data_priv.access( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				data_priv.access( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = data_priv.access( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					data_priv.remove( doc, fix );

				} else {
					data_priv.access( doc, fix, attaches );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var origFn, type;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});


var
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+)/,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style|link)/i,
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /^$|\/(?:java|ecma)script/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

	// We have to close these tags to support XHTML (#13200)
	wrapMap = {

		// Support: IE 9
		option: [ 1, "<select multiple='multiple'>", "</select>" ],

		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		_default: [ 0, "", "" ]
	};

// Support: IE 9
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// Support: 1.x compatibility
// Manipulating tables requires a tbody
function manipulationTarget( elem, content ) {
	return jQuery.nodeName( elem, "table" ) &&
		jQuery.nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ?

		elem.getElementsByTagName("tbody")[0] ||
			elem.appendChild( elem.ownerDocument.createElement("tbody") ) :
		elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );

	if ( match ) {
		elem.type = match[ 1 ];
	} else {
		elem.removeAttribute("type");
	}

	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		data_priv.set(
			elems[ i ], "globalEval", !refElements || data_priv.get( refElements[ i ], "globalEval" )
		);
	}
}

function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( data_priv.hasData( src ) ) {
		pdataOld = data_priv.access( src );
		pdataCur = data_priv.set( dest, pdataOld );
		events = pdataOld.events;

		if ( events ) {
			delete pdataCur.handle;
			pdataCur.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( data_user.hasData( src ) ) {
		udataOld = data_user.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		data_user.set( dest, udataCur );
	}
}

function getAll( context, tag ) {
	var ret = context.getElementsByTagName ? context.getElementsByTagName( tag || "*" ) :
			context.querySelectorAll ? context.querySelectorAll( tag || "*" ) :
			[];

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], ret ) :
		ret;
}

// Support: IE >= 9
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

jQuery.extend({
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var i, l, srcElements, destElements,
			clone = elem.cloneNode( true ),
			inPage = jQuery.contains( elem.ownerDocument, elem );

		// Support: IE >= 9
		// Fix Cloning issues
		if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
				!jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	buildFragment: function( elems, context, scripts, selection ) {
		var elem, tmp, tag, wrap, contains, j,
			fragment = context.createDocumentFragment(),
			nodes = [],
			i = 0,
			l = elems.length;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
					// Support: QtWebKit
					// jQuery.merge because push.apply(_, arraylike) throws
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || fragment.appendChild( context.createElement("div") );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;
					tmp.innerHTML = wrap[ 1 ] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[ 2 ];

					// Descend through wrappers to the right content
					j = wrap[ 0 ];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Support: QtWebKit
					// jQuery.merge because push.apply(_, arraylike) throws
					jQuery.merge( nodes, tmp.childNodes );

					// Remember the top-level container
					tmp = fragment.firstChild;

					// Fixes #12346
					// Support: Webkit, IE
					tmp.textContent = "";
				}
			}
		}

		// Remove wrapper from fragment
		fragment.textContent = "";

		i = 0;
		while ( (elem = nodes[ i++ ]) ) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( fragment.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( (elem = tmp[ j++ ]) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		return fragment;
	},

	cleanData: function( elems ) {
		var data, elem, events, type, key, j,
			special = jQuery.event.special,
			i = 0;

		for ( ; (elem = elems[ i ]) !== undefined; i++ ) {
			if ( jQuery.acceptData( elem ) ) {
				key = elem[ data_priv.expando ];

				if ( key && (data = data_priv.cache[ key ]) ) {
					events = Object.keys( data.events || {} );
					if ( events.length ) {
						for ( j = 0; (type = events[j]) !== undefined; j++ ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}
					if ( data_priv.cache[ key ] ) {
						// Discard any remaining `private` data
						delete data_priv.cache[ key ];
					}
				}
			}
			// Discard any remaining `user` data
			delete data_user.cache[ elem[ data_user.expando ] ];
		}
	}
});

jQuery.fn.extend({
	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().each(function() {
					if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
						this.textContent = value;
					}
				});
		}, null, value, arguments.length );
	},

	append: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		});
	},

	before: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		});
	},

	after: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		});
	},

	remove: function( selector, keepData /* Internal Use Only */ ) {
		var elem,
			elems = selector ? jQuery.filter( selector, this ) : this,
			i = 0;

		for ( ; (elem = elems[i]) != null; i++ ) {
			if ( !keepData && elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem ) );
			}

			if ( elem.parentNode ) {
				if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
					setGlobalEval( getAll( elem, "script" ) );
				}
				elem.parentNode.removeChild( elem );
			}
		}

		return this;
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map(function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1></$2>" );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var arg = arguments[ 0 ];

		// Make the changes, replacing each context element with the new content
		this.domManip( arguments, function( elem ) {
			arg = this.parentNode;

			jQuery.cleanData( getAll( this ) );

			if ( arg ) {
				arg.replaceChild( elem, this );
			}
		});

		// Force removal if there was no new content (e.g., from empty arguments)
		return arg && (arg.length || arg.nodeType) ? this : this.remove();
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, callback ) {

		// Flatten any nested arrays
		args = concat.apply( [], args );

		var fragment, first, scripts, hasScripts, node, doc,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[ 0 ],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction ||
				( l > 1 && typeof value === "string" &&
					!support.checkClone && rchecked.test( value ) ) ) {
			return this.each(function( index ) {
				var self = set.eq( index );
				if ( isFunction ) {
					args[ 0 ] = value.call( this, index, self.html() );
				}
				self.domManip( args, callback );
			});
		}

		if ( l ) {
			fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, this );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			if ( first ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {
							// Support: QtWebKit
							// jQuery.merge because push.apply(_, arraylike) throws
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call( this[ i ], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!data_priv.access( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

							if ( node.src ) {
								// Optional AJAX dependency, but won't run scripts if not present
								if ( jQuery._evalUrl ) {
									jQuery._evalUrl( node.src );
								}
							} else {
								jQuery.globalEval( node.textContent.replace( rcleanScript, "" ) );
							}
						}
					}
				}
			}
		}

		return this;
	}
});

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: QtWebKit
			// .get() because push.apply(_, arraylike) throws
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
});


var iframe,
	elemdisplay = {};

/**
 * Retrieve the actual display of a element
 * @param {String} name nodeName of the element
 * @param {Object} doc Document object
 */
// Called only from within defaultDisplay
function actualDisplay( name, doc ) {
	var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),

		// getDefaultComputedStyle might be reliably used only on attached element
		display = window.getDefaultComputedStyle ?

			// Use of this method is a temporary fix (more like optmization) until something better comes along,
			// since it was removed from specification and supported only in FF
			window.getDefaultComputedStyle( elem[ 0 ] ).display : jQuery.css( elem[ 0 ], "display" );

	// We don't have any data stored on the element,
	// so use "detach" method as fast way to get rid of the element
	elem.detach();

	return display;
}

/**
 * Try to determine the default display value of an element
 * @param {String} nodeName
 */
function defaultDisplay( nodeName ) {
	var doc = document,
		display = elemdisplay[ nodeName ];

	if ( !display ) {
		display = actualDisplay( nodeName, doc );

		// If the simple way fails, read from inside an iframe
		if ( display === "none" || !display ) {

			// Use the already-created iframe if possible
			iframe = (iframe || jQuery( "<iframe frameborder='0' width='0' height='0'/>" )).appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = iframe[ 0 ].contentDocument;

			// Support: IE
			doc.write();
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}
var rmargin = (/^margin/);

var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

var getStyles = function( elem ) {
		return elem.ownerDocument.defaultView.getComputedStyle( elem, null );
	};



function curCSS( elem, name, computed ) {
	var width, minWidth, maxWidth, ret,
		style = elem.style;

	computed = computed || getStyles( elem );

	// Support: IE9
	// getPropertyValue is only needed for .css('filter') in IE9, see #12537
	if ( computed ) {
		ret = computed.getPropertyValue( name ) || computed[ name ];
	}

	if ( computed ) {

		if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// Support: iOS < 6
		// A tribute to the "awesome hack by Dean Edwards"
		// iOS < 6 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
		// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
		if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret !== undefined ?
		// Support: IE
		// IE returns zIndex value as an integer.
		ret + "" :
		ret;
}


function addGetHookIf( conditionFn, hookFn ) {
	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			if ( conditionFn() ) {
				// Hook not needed (or it's not possible to use it due to missing dependency),
				// remove it.
				// Since there are no other hooks for marginRight, remove the whole object.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.

			return (this.get = hookFn).apply( this, arguments );
		}
	};
}


(function() {
	var pixelPositionVal, boxSizingReliableVal,
		// Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
		divReset = "padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;" +
			"-moz-box-sizing:content-box;box-sizing:content-box",
		docElem = document.documentElement,
		container = document.createElement( "div" ),
		div = document.createElement( "div" );

	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;" +
		"margin-top:1px";
	container.appendChild( div );

	// Executing both pixelPosition & boxSizingReliable tests require only one layout
	// so they're executed at the same time to save the second computation.
	function computePixelPositionAndBoxSizingReliable() {
		// Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
		div.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;" +
			"box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;" +
			"position:absolute;top:1%";
		docElem.appendChild( container );

		var divStyle = window.getComputedStyle( div, null );
		pixelPositionVal = divStyle.top !== "1%";
		boxSizingReliableVal = divStyle.width === "4px";

		docElem.removeChild( container );
	}

	// Use window.getComputedStyle because jsdom on node.js will break without it.
	if ( window.getComputedStyle ) {
		jQuery.extend(support, {
			pixelPosition: function() {
				// This test is executed only once but we still do memoizing
				// since we can use the boxSizingReliable pre-computing.
				// No need to check if the test was already performed, though.
				computePixelPositionAndBoxSizingReliable();
				return pixelPositionVal;
			},
			boxSizingReliable: function() {
				if ( boxSizingReliableVal == null ) {
					computePixelPositionAndBoxSizingReliable();
				}
				return boxSizingReliableVal;
			},
			reliableMarginRight: function() {
				// Support: Android 2.3
				// Check if div with explicit width and no margin-right incorrectly
				// gets computed margin-right based on width of container. (#3333)
				// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
				// This support function is only executed once so no memoizing is needed.
				var ret,
					marginDiv = div.appendChild( document.createElement( "div" ) );
				marginDiv.style.cssText = div.style.cssText = divReset;
				marginDiv.style.marginRight = marginDiv.style.width = "0";
				div.style.width = "1px";
				docElem.appendChild( container );

				ret = !parseFloat( window.getComputedStyle( marginDiv, null ).marginRight );

				docElem.removeChild( container );

				// Clean up the div for other support tests.
				div.innerHTML = "";

				return ret;
			}
		});
	}
})();


// A method for quickly swapping in/out CSS properties to get correct calculations.
jQuery.swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};


var
	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rnumsplit = new RegExp( "^(" + pnum + ")(.*)$", "i" ),
	rrelNum = new RegExp( "^([+-])=(" + pnum + ")", "i" ),

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: 0,
		fontWeight: 400
	},

	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];

// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name[0].toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// at this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {
			// at this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// at this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {
		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// we need the check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox &&
			( support.boxSizingReliable() || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = data_priv.get( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = data_priv.access( elem, "olddisplay", defaultDisplay(elem.nodeName) );
			}
		} else {

			if ( !values[ index ] ) {
				hidden = isHidden( elem );

				if ( display && display !== "none" || !hidden ) {
					data_priv.set( elem, "olddisplay", hidden ? display : jQuery.css(elem, "display") );
				}
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"columnCount": true,
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		// normalize float css property
		"float": "cssFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set. See: #7116
			if ( value == null || value !== value ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// Fixes #8908, it can be done more correctly by specifying setters in cssHooks,
			// but it would mean to define eight (for every problematic property) identical functions
			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {
				// Support: Chrome, Safari
				// Setting style to blank string required to delete "style: x !important;"
				style[ name ] = "";
				style[ name ] = value;
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		//convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	}
});

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {
				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				return elem.offsetWidth === 0 && rdisplayswap.test( jQuery.css( elem, "display" ) ) ?
					jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					}) :
					getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
});

// Support: Android 2.3
jQuery.cssHooks.marginRight = addGetHookIf( support.reliableMarginRight,
	function( elem, computed ) {
		if ( computed ) {
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			// Work around by temporarily setting element display to inline-block
			return jQuery.swap( elem, { "display": "inline-block" },
				curCSS, [ elem, "marginRight" ] );
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
});

jQuery.fn.extend({
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each(function() {
			if ( isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			result = jQuery.css( tween.elem, tween.prop, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE9
// Panic based approach to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	}
};

jQuery.fx = Tween.prototype.init;

// Back Compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value ),
				target = tween.cur(),
				parts = rfxnum.exec( value ),
				unit = parts && parts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

				// Starting value computation is required for potential unit mismatches
				start = ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) &&
					rfxnum.exec( jQuery.css( tween.elem, prop ) ),
				scale = 1,
				maxIterations = 20;

			if ( start && start[ 3 ] !== unit ) {
				// Trust units reported by jQuery.css
				unit = unit || start[ 3 ];

				// Make sure we update the tween properties later on
				parts = parts || [];

				// Iteratively approximate from a nonzero starting point
				start = +target || 1;

				do {
					// If previous iteration zeroed out, double until we get *something*
					// Use a string for doubling factor so we don't accidentally see scale as unchanged below
					scale = scale || ".5";

					// Adjust and apply
					start = start / scale;
					jQuery.style( tween.elem, prop, start + unit );

				// Update scale, tolerating zero or NaN from tween.cur()
				// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
				} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
			}

			// Update tween properties
			if ( parts ) {
				start = tween.start = +start || +target || 0;
				tween.unit = unit;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[ 1 ] ?
					start + ( parts[ 1 ] + 1 ) * parts[ 2 ] :
					+parts[ 2 ];
			}

			return tween;
		} ]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	});
	return ( fxNow = jQuery.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		i = 0,
		attrs = { height: type };

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( (tween = collection[ index ].call( animation, prop, value )) ) {

			// we're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	/* jshint validthis: true */
	var prop, value, toggle, tween, hooks, oldfire, display,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHidden( elem ),
		dataShow = data_priv.get( elem, "fxshow" );

	// handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE9-10 do not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		display = jQuery.css( elem, "display" );
		// Get default display if display is currently "none"
		if ( display === "none" ) {
			display = defaultDisplay( elem.nodeName );
		}
		if ( display === "inline" &&
				jQuery.css( elem, "float" ) === "none" ) {

			style.display = "inline-block";
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always(function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		});
	}

	// show/hide pass
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	if ( !jQuery.isEmptyObject( orig ) ) {
		if ( dataShow ) {
			if ( "hidden" in dataShow ) {
				hidden = dataShow.hidden;
			}
		} else {
			dataShow = data_priv.access( elem, "fxshow", {} );
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;

			data_priv.remove( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( prop in orig ) {
			tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// resolve when we played the last frame
				// otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

jQuery.Animation = jQuery.extend( Animation, {

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || data_priv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = data_priv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each(function() {
			var index,
				data = data_priv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// enable finishing flag on private data
			data.finish = true;

			// empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// turn off finishing flag
			delete data.finish;
		});
	}
});

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		i = 0,
		timers = jQuery.timers;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	if ( timer() ) {
		jQuery.fx.start();
	} else {
		jQuery.timers.pop();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = setTimeout( next, time );
		hooks.stop = function() {
			clearTimeout( timeout );
		};
	});
};


(function() {
	var input = document.createElement( "input" ),
		select = document.createElement( "select" ),
		opt = select.appendChild( document.createElement( "option" ) );

	input.type = "checkbox";

	// Support: iOS 5.1, Android 4.x, Android 2.3
	// Check the default checkbox/radio value ("" on old WebKit; "on" elsewhere)
	support.checkOn = input.value !== "";

	// Must access the parent to make an option select properly
	// Support: IE9, IE10
	support.optSelected = opt.selected;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Check if an input maintains its value after becoming a radio
	// Support: IE9, IE10
	input = document.createElement( "input" );
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";
})();


var nodeHook, boolHook,
	attrHandle = jQuery.expr.attrHandle;

jQuery.fn.extend({
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	}
});

jQuery.extend({
	attr: function( elem, name, value ) {
		var hooks, ret,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === strundefined ) {
			return jQuery.prop( elem, name, value );
		}

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {

			if ( value === null ) {
				jQuery.removeAttr( elem, name );

			} else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				elem.setAttribute( name, value + "" );
				return value;
			}

		} else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
			return ret;

		} else {
			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			attrNames = value && value.match( rnotwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( (name = attrNames[i++]) ) {
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
				if ( jQuery.expr.match.bool.test( name ) ) {
					// Set corresponding property to false
					elem[ propName ] = false;
				}

				elem.removeAttribute( name );
			}
		}
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" &&
					jQuery.nodeName( elem, "input" ) ) {
					// Setting the type on a radio button after the value resets the value in IE6-9
					// Reset value to default in case type is set after value during creation
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	}
});

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
};
jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = function( elem, name, isXML ) {
		var ret, handle;
		if ( !isXML ) {
			// Avoid an infinite loop by temporarily removing this function from the getter
			handle = attrHandle[ name ];
			attrHandle[ name ] = ret;
			ret = getter( elem, name, isXML ) != null ?
				name.toLowerCase() :
				null;
			attrHandle[ name ] = handle;
		}
		return ret;
	};
});




var rfocusable = /^(?:input|select|textarea|button)$/i;

jQuery.fn.extend({
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each(function() {
			delete this[ jQuery.propFix[ name ] || name ];
		});
	}
});

jQuery.extend({
	propFix: {
		"for": "htmlFor",
		"class": "className"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ?
				ret :
				( elem[ name ] = value );

		} else {
			return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ?
				ret :
				elem[ name ];
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				return elem.hasAttribute( "tabindex" ) || rfocusable.test( elem.nodeName ) || elem.href ?
					elem.tabIndex :
					-1;
			}
		}
	}
});

// Support: IE9+
// Selectedness for an option in an optgroup can be inaccurate
if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {
			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		}
	};
}

jQuery.each([
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
});




var rclass = /[\t\r\n\f]/g;

jQuery.fn.extend({
	addClass: function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			proceed = typeof value === "string" && value,
			i = 0,
			len = this.length;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
		}

		if ( proceed ) {
			// The disjunction here is for better compressibility (see removeClass)
			classes = ( value || "" ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					" "
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = jQuery.trim( cur );
					if ( elem.className !== finalValue ) {
						elem.className = finalValue;
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			proceed = arguments.length === 0 || typeof value === "string" && value,
			i = 0,
			len = this.length;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}
		if ( proceed ) {
			classes = ( value || "" ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					""
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = value ? jQuery.trim( cur ) : "";
					if ( elem.className !== finalValue ) {
						elem.className = finalValue;
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value;

		if ( typeof stateVal === "boolean" && type === "string" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					classNames = value.match( rnotwhite ) || [];

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( type === strundefined || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					data_priv.set( this, "__className__", this.className );
				}

				// If the element has a class name or if we're passed "false",
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				this.className = this.className || value === false ? "" : data_priv.get( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		return false;
	}
});




var rreturn = /\r/g;

jQuery.fn.extend({
	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[0];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?
					// handle most common string cases
					ret.replace(rreturn, "") :
					// handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";

			} else if ( typeof val === "number" ) {
				val += "";

			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	valHooks: {
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one" || index < 0,
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// IE6-9 doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&
							// Don't return options that are disabled or in a disabled optgroup
							( support.optDisabled ? !option.disabled : option.getAttribute( "disabled" ) === null ) &&
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];
					if ( (option.selected = jQuery.inArray( jQuery(option).val(), values ) >= 0) ) {
						optionSet = true;
					}
				}

				// force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	}
});

// Radios and checkboxes getter/setter
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			// Support: Webkit
			// "" is returned instead of "on" if a value isn't specified
			return elem.getAttribute("value") === null ? "on" : elem.value;
		};
	}
});




// Return jQuery for attributes-only inclusion


jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
});

jQuery.fn.extend({
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	}
});


var nonce = jQuery.now();

var rquery = (/\?/);



// Support: Android 2.3
// Workaround failure to string-cast null input
jQuery.parseJSON = function( data ) {
	return JSON.parse( data + "" );
};


// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml, tmp;
	if ( !data || typeof data !== "string" ) {
		return null;
	}

	// Support: IE9
	try {
		tmp = new DOMParser();
		xml = tmp.parseFromString( data, "text/xml" );
	} catch ( e ) {
		xml = undefined;
	}

	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	// Document location
	ajaxLocParts,
	ajaxLocation,

	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat("*");

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	ajaxLocation = location.href;
} catch( e ) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	ajaxLocation = document.createElement( "a" );
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			while ( (dataType = dataTypes[i++]) ) {
				// Prepend if requested
				if ( dataType[0] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					(structure[ dataType ] = structure[ dataType ] || []).unshift( func );

				// Otherwise append
				} else {
					(structure[ dataType ] = structure[ dataType ] || []).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		});
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

		// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s[ "throws" ] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,
			// URL without anti-cache param
			cacheURL,
			// Response headers
			responseHeadersString,
			responseHeaders,
			// timeout handle
			timeoutTimer,
			// Cross-domain detection vars
			parts,
			// To know if global events are to be dispatched
			fireGlobals,
			// Loop variable
			i,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
				jQuery( callbackContext ) :
				jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( (match = rheaders.exec( responseHeadersString )) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {
								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" )
			.replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( rnotwhite ) || [ "" ];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		fireGlobals = s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
			// Abort if not done already and return
			return jqXHR.abort();
		}

		// aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout(function() {
					jqXHR.abort("timeout");
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		});
	};
});

// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
});


jQuery._evalUrl = function( url ) {
	return jQuery.ajax({
		url: url,
		type: "GET",
		dataType: "script",
		async: false,
		global: false,
		"throws": true
	});
};


jQuery.fn.extend({
	wrapAll: function( html ) {
		var wrap;

		if ( jQuery.isFunction( html ) ) {
			return this.each(function( i ) {
				jQuery( this ).wrapAll( html.call(this, i) );
			});
		}

		if ( this[ 0 ] ) {

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function( i ) {
				jQuery( this ).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function( i ) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	}
});


jQuery.expr.filters.hidden = function( elem ) {
	// Support: Opera <= 12.12
	// Opera reports offsetWidths and offsetHeights less than zero on some elements
	return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;
};
jQuery.expr.filters.visible = function( elem ) {
	return !jQuery.expr.filters.hidden( elem );
};




var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

jQuery.fn.extend({
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map(function() {
			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		})
		.filter(function() {
			var type = this.type;

			// Use .is( ":disabled" ) so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		})
		.map(function( i, elem ) {
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ) {
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});


jQuery.ajaxSettings.xhr = function() {
	try {
		return new XMLHttpRequest();
	} catch( e ) {}
};

var xhrId = 0,
	xhrCallbacks = {},
	xhrSuccessStatus = {
		// file protocol always yields status code 0, assume 200
		0: 200,
		// Support: IE9
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	xhrSupported = jQuery.ajaxSettings.xhr();

// Support: IE9
// Open requests must be manually aborted on unload (#5280)
if ( window.ActiveXObject ) {
	jQuery( window ).on( "unload", function() {
		for ( var key in xhrCallbacks ) {
			xhrCallbacks[ key ]();
		}
	});
}

support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport(function( options ) {
	var callback;

	// Cross domain only allowed if supported through XMLHttpRequest
	if ( support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i,
					xhr = options.xhr(),
					id = ++xhrId;

				xhr.open( options.type, options.url, options.async, options.username, options.password );

				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}

				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}

				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers["X-Requested-With"] ) {
					headers["X-Requested-With"] = "XMLHttpRequest";
				}

				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}

				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							delete xhrCallbacks[ id ];
							callback = xhr.onload = xhr.onerror = null;

							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {
								complete(
									// file: protocol always yields status 0; see #8605, #14207
									xhr.status,
									xhr.statusText
								);
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,
									// Support: IE9
									// Accessing binary-data responseText throws an exception
									// (#11426)
									typeof xhr.responseText === "string" ? {
										text: xhr.responseText
									} : undefined,
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};

				// Listen to events
				xhr.onload = callback();
				xhr.onerror = callback("error");

				// Create the abort callback
				callback = xhrCallbacks[ id ] = callback("abort");

				// Do send the request
				// This may raise an exception which is actually
				// handled in jQuery.ajax (so no try/catch here)
				xhr.send( options.hasContent && options.data || null );
			},

			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});




// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {
	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery("<script>").prop({
					async: true,
					charset: s.scriptCharset,
					src: s.url
				}).on(
					"load error",
					callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					}
				);
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});




// data: string of html
// context (optional): If specified, the fragment will be created in this context, defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( !data || typeof data !== "string" ) {
		return null;
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}
	context = context || document;

	var parsed = rsingleTag.exec( data ),
		scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[1] ) ];
	}

	parsed = jQuery.buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


// Keep a copy of the old load method
var _load = jQuery.fn.load;

/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, type, response,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = url.slice( off );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
		}).done(function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		}).complete( callback && function( jqXHR, status ) {
			self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
		});
	}

	return this;
};




jQuery.expr.filters.animated = function( elem ) {
	return jQuery.grep(jQuery.timers, function( fn ) {
		return elem === fn.elem;
	}).length;
};




var docElem = window.document.documentElement;

/**
 * Gets a window from an element
 */
function getWindow( elem ) {
	return jQuery.isWindow( elem ) ? elem : elem.nodeType === 9 && elem.defaultView;
}

jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			( curCSSTop + curCSSLeft ).indexOf("auto") > -1;

		// Need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend({
	offset: function( options ) {
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each(function( i ) {
					jQuery.offset.setOffset( this, options, i );
				});
		}

		var docElem, win,
			elem = this[ 0 ],
			box = { top: 0, left: 0 },
			doc = elem && elem.ownerDocument;

		if ( !doc ) {
			return;
		}

		docElem = doc.documentElement;

		// Make sure it's not a disconnected DOM node
		if ( !jQuery.contains( docElem, elem ) ) {
			return box;
		}

		// If we don't have gBCR, just use 0,0 rather than error
		// BlackBerry 5, iOS 3 (original iPhone)
		if ( typeof elem.getBoundingClientRect !== strundefined ) {
			box = elem.getBoundingClientRect();
		}
		win = getWindow( doc );
		return {
			top: box.top + win.pageYOffset - docElem.clientTop,
			left: box.left + win.pageXOffset - docElem.clientLeft
		};
	},

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is its only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// We assume that getBoundingClientRect is available when computed position is fixed
			offset = elem.getBoundingClientRect();

		} else {
			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || docElem;

			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position" ) === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || docElem;
		});
	}
});

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : window.pageXOffset,
					top ? val : window.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// getComputedStyle returns percent when specified for top/left/bottom/right
// rather than make the css module depend on the offset module, we just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );
				// if curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
});


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});


// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;




// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.
if ( typeof define === "function" && define.amd ) {
	define( "jquery", [], function() {
		return jQuery;
	});
}




var
	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in
// AMD (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( typeof noGlobal === strundefined ) {
	window.jQuery = window.$ = jQuery;
}




return jQuery;

}));

/**
 * This is the class Tests, for unit test and other functionality for Yarn.
 * Public methods are:
 *
 * @class Tests
 */

define('test',["util", "underscore", "jquery"], 
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
/**
* This is the class socialRecord
* @class  socialRecord
* @private
*/
define('socialRecord',["underscore", "util", "jquery", "test"], function(_, util, $, test) {

	var socialRecord = [];
	var currentTimeStep = -1; //initialize to -1 (assumes we start at time 0 when playings)
	var defaultValues = {};
	var maxValues = {};
	var minValues = {};
	var directions = {};
	var isBooleans = {};
	var clonePolicies = {};
	var durations = {};
	var offstageCharacters = []; // Characters that aren't in the current level (think Prom Week)
	var eliminatedCharacters = []; // Characters that are never coming back and have had references to/from removed (think Dayton)

	/**
	 * @method getLength
	 * @memberof socialRecord
	 * @description gets the length of the socialRecord object.
	 * @private
	 * @return {[int]} [length of the socialRecord object]
	 */
	var getLength = function () {
		return socialRecord.length;
	};

	/**
	 * @function getLengthAtTimeStep 
	 * @description Given a timestep, returns the length of the array at the index represented by that timestep in the socialRecord.
	 * @param  {[int]} timestep [The timestep to get the length of. Should be >= 0]
	 * @return {[int]}          [the length of the array that resides at socialRecord[timestep]]
	 * @private
	 */
	var getLengthAtTimeStep = function(timestep){
		if(timestep < 0){
			console.log("ERROR in getLengthAtTimeStep -- tried to get the length of a negative timestep");
		}
		else{
			return socialRecord[timestep].length;
		}
	};

	/**
	 * @method getCurrentTimeStep
	 * @description return the value of currentTimeStep.
	 * @return {[int]} [the currentTimeStep stored in the socialRecord]
	 */
	var getCurrentTimeStep = function(){
		return currentTimeStep;
	};
	
	/**
	 * @method  dumpSocialRecord
	 * @description Debugging function: Dumps the whole socialRecord object to the console.
	 * @public
	 * @memberOf ensemble
	 */
	var dumpSocialRecord = function() {
		console.log("socialRecord:", socialRecord);
	};

	/**
	 * Returns a copy of the socialRecord at the given timestep.
	 *
	 * @param  {Number} timeStep The timestep to retrieve.
	 *
	 * @return {Object} A copy of an socialRecord timeslice, an array of predicate objects.
	 */
	var getSocialRecordCopyAtTimestep = function(timeStep) {
		if (timeStep === undefined) {
			timeStep = currentTimeStep;
		}
		var slice = util.clone(socialRecord[timeStep]);
		if (slice === undefined) {
			slice = [];
		}
		return slice;
	}
	
	var registerMaxValue = function (predicate) {
		if (maxValues[predicate.category] === undefined) {
			maxValues[predicate.category] = predicate.maxValue !== undefined ? predicate.maxValue : 100;
		}
	};

	var getRegisteredMaxValue = function (predicate) {
		if (predicate === undefined || predicate.category === undefined) {
			console.log("Error: this predicate had no category.", predicate);
		}
		return maxValues[predicate.category];
	};	
	
	var registerMinValue = function (predicate) {
		if (minValues[predicate.category] === undefined) {
			minValues[predicate.category] = predicate.minValue !== undefined ? predicate.minValue : 0;
		}
	};

	var getRegisteredMinValue = function (predicate) {
		return minValues[predicate.category];
	};

	var registerDuration = function (predicate) {
		if (durations[predicate.category] === undefined) {
			durations[predicate.category] = predicate.duration;
		}
	};

	var getRegisteredDuration = function (predicate) {
		return durations[predicate.category];
	};

	var registerDirection = function (predicate) {
		if (directions[predicate.category] === undefined) {
			directions[predicate.category] = predicate.directionType;
		}
	};

	var getRegisteredDirection = function (predicate) {
		return directions[predicate.category];
	};

	var registerDefaultValue = function (predicate) {
		if (defaultValues[predicate.category] === undefined) {
			defaultValues[predicate.category] = predicate.defaultValue;
		}
	};

	var getRegisteredDefaultValue = function (predicate) {
		return defaultValues[predicate.category];
	};

	var registerIsBoolean = function(predicate){
		if(isBooleans[predicate.category] === undefined){
			isBooleans[predicate.category] = predicate.isBoolean;
		}
	};

	var getRegisteredIsBoolean = function(predicate){
		return isBooleans[predicate.category];
	};

/**
* @description  Catches the socialRecord's currentTimeStep to the timeStep specified.
*
* @method setUpNextTimeStep
* @memberof ensemble
* @return {int} The current timestep. 
* @param {Number} timeStep - the timeStep to catch up the socialRecord to. If omitted, assumes the currentTimeStep + 1.
*/
	var setupNextTimeStep = function (timeStep) {
		if (currentTimeStep === -1) {
			currentTimeStep += 1;
		}
		
		if (timeStep === undefined) {
			timeStep = currentTimeStep + 1;
		}
		var currentSocialRecordEntry = currentTimeStep;

		// If this given timestep in the socialRecord doesn't exist yet, fill it in with an empty array.
		if(socialRecord[currentTimeStep] === undefined ){
			socialRecord[currentTimeStep] = [];
		}

		for (var i = currentTimeStep + 1; i <= timeStep ; i += 1) {

			//socialRecord[i] = util.clone(socialRecord[i-1]); OLD WAY, changed to no longer clone things we aren't supposed to in the first place.
			socialRecord[i] = [];
			if(socialRecord[i-1] !== undefined){
				for(var k = 0; k < socialRecord[i-1].length; k += 1){
					if(getRegisteredDuration(socialRecord[i-1][k]) !== 0 ){
						//ONLY clone if the duration is 0.
						//Otherwise we are dealing with something like an socialRecord label, and we don't want to copy it
						//to this new timestep.
						socialRecord[i].push(util.clone(socialRecord[i-1][k]));
					}
				}
			}


			// code to handle the expiring of statuses
			// if at a given timeStep, an element in the socialRecord has a duration timer,
			// decrement it, and if necessary reverse the status value and delete the duration timer
			for (var j = 0 ; j < socialRecord[i].length; j++ ){
				if (getRegisteredIsBoolean(socialRecord[i][j])) {
					if (socialRecord[i][j].duration !== undefined) {
						socialRecord[i][j].duration -= 1;
						if (socialRecord[i][j].duration <= 0) {
							delete socialRecord[i][j].duration;
							// We set it to false; if we just delete it, the old true value gets cloned over.
							if (socialRecord[i][j].value !== false) {
								socialRecord[i][j].value = false;
								socialRecord[i][j].timeHappened = timeStep;
							}
						}
					}
				}
			}
		}

		//Only update the timeStep if the value passed in is greater than the current time step
		//i.e. don't allow this function to 'rewind' time and go back to an earlier timestep.'
		if(timeStep > currentTimeStep){
			currentTimeStep = timeStep;
		}
		// Rewind the socialRecord, clearing out what was in it after the point we are rewinding to
		else if (timeStep < currentTimeStep) {
			for (var i = currentTimeStep; i > timeStep ; i -= 1) {
				socialRecord[i] = [];
			}
			currentTimeStep = timeStep;
		}
		return currentTimeStep;
	};

	// Helper function for newGet(). Checks whether two predicates have a compatible value, taking into account an optional operator and passed-in expected values.
	var checkValueMatch = function(socialRecordValue, searchValue, operator) {
		if (typeof searchValue === "boolean" && socialRecordValue !== searchValue) {
			return false;
		}
		else if (operator === "=" && socialRecordValue !== searchValue) {
			return false;
		}
		else if (operator === ">" && socialRecordValue <= searchValue) {
			return false;
		}
		else if (operator === "<" && socialRecordValue >= searchValue) {
			return false;
		}
		// Either the values match, or we have a numeric category but no operator, in which case we count this as a match (we're probably trying to get the current value of this predicate.)
		return true;
	}

	var matchedResults;
	var matchedResultsStrings;

	// Helper function for newGet(). Adds a matching predicate to the module array matchedResults, either as a new object or a reference to a point in the socialRecord, and ensuring no duplicate predicates are added.
	var addResult = function(predicateRef, value, addAsReference) {

		var matchResult;

		if (addAsReference) {
			// Simply add the reference to this predicate in the socialRecord.
			matchResult = predicateRef;
		} else {
			// We're matching a predicate that doesn't exist in the socialRecord because it's representing a default value.
			matchResult = util.clone(predicateRef);
			if (value !== undefined) {
				matchResult.value = value;
			}
		}

		// Add the predicate to the list, if it hasn't been seen before.
		var hash = predicateHash(matchResult);
		if (! matchedResultsStrings[hash]) {
			matchedResults.push(matchResult);
		}
		matchedResultsStrings[hash] = true;

	}

	// Helper function used by socialRecord.get to see if the given predicate matches a default value.
	var checkForDefaultMatch = function(searchPredicate, defaultValue, searchValue, isBooleanPred) {
		var matchesDefault;
		if (searchPredicate.value !== undefined) {

			matchesDefault = checkValueMatch(defaultValue, searchValue, searchPredicate.operator || "="); // assume a check for equality if no operator
			if (matchesDefault) {
				addResult(searchPredicate, defaultValue, false);
			}
		}

		// If the search predicate is numeric and did not provide a value, we want to add an entry to the socialRecord with the default value, and return a reference to that.
		else if (searchPredicate.value === undefined && !isBooleanPred && defaultValue !== undefined)  {
			var tempPred = util.clone(searchPredicate);
			tempPred.value = defaultValue;
			socialRecord[currentTimeStep].push(tempPred);
			addResult(tempPred, defaultValue, true);
		}

		// If the search predicate is boolean and did not provide a value... we want to do... something?
		else if (searchPredicate.value === undefined && isBooleanPred && defaultValue !== undefined) {
			matchesDefault = checkValueMatch(defaultValue, searchValue, searchPredicate.operator || "="); // assume a check for equality if no operator
			if (matchesDefault) {
				var tempBoolPred = util.clone(searchPredicate);
				addResult(tempBoolPred, defaultValue, false);
			}
		}
	};

	/**
	* @description  Search the socialRecord for a desired searchPredicate within a provided time period. We assume that mostRecentTime and leastRecentTime exist and are formatted properly. 
	*
	* @method get
	* @memberof ensemble
	* @param {Object} searchPredicate - a predicate we want to search the socialRecord for
	* @param {Number} mostRecentTime - the lower bound time that we want to look within (turns ago: 2 = currentTimeStep-2)
	* @param {Number} leastRecentTime - the upper bound time that we want to look within (turns ago: 2 = currentTimeStep-2)
	* @param {Bool} useDefaultValue - If true, then if the searchPredicate is not explicitly found in the socialRecord it will check the searchPredicate against the predicate's default value. If false, it will not. Defaults to true.
	* @return {Array} matchedResults	the array holding the found predicates which match the query
	*/
	//ensemble.get() should be called by public, this should only be used internally.
	var get = function(searchPredicate, mostRecentTime, lessRecentTime, useDefaultValue, params) {

		var searchValue = searchPredicate.value;
		var defaultValue = defaultValues[searchPredicate.category];
		var isBooleanPred = getRegisteredIsBoolean(searchPredicate);
		var foundPatternMatch = false;	// Track whether we ever find a pattern matching the search predicate across this search.
		useDefaultValue = typeof useDefaultValue !== 'undefined' ? useDefaultValue : true;

		// if (searchPredicate.value !== undefined && searchPredicate.operator === undefined && isBooleanPred === false) {
		// 	console.log("searchPredicate", searchPredicate);
		// 	throw new Error("Must define operator with value!");
		// }


		matchedResults = [];		//predicate results to return
		matchedResultsStrings = {};	//dictionary of predicates already stored.

		
		if (searchValue === undefined && useDefaultValue) {
			if (isBooleanPred) {
				// If the client fails to specify a boolean value, we assume we are searching for the opposite of the default state. For instance, if the default value of a flag is false, and we omit a value in get(), the implication is that we're searching for a non-default case (true).
				searchValue = true;
			}
		}
		

		//In the case where we have a numeric predicate with a value, but no operator specified,
		//assume that the operator is '='
		if(!isBooleanPred){
			if(searchValue !== undefined && searchPredicate.operator === undefined){
				searchPredicate.operator = "=";
			}
		}

		// Convert relative to absolute time steps.
		// doing a special check to verify that we aren't 'pretending' that the
		//end of the sfdb is maybe a little earier than it would be otherwise.
		var currentTimeStepToUse = currentTimeStep;
		if(params !== undefined && params.timeStep !== undefined){
			currentTimeStepToUse = params.timeStep; // pretend that the 'current time step' (i.e. the end of the sfdb) was the value that was passed in.
		}
		mostRecentTime = currentTimeStepToUse - mostRecentTime;
		lessRecentTime = currentTimeStepToUse - lessRecentTime;

		var foundAnySocialRecordTimesteps = false;

		// Look through each defined socialRecord time step in the given range.
		for (var i = lessRecentTime ; i <= mostRecentTime ; i += 1) {
			if(socialRecord[i] !== undefined) {

				foundAnySocialRecordTimesteps = true;
				// Consider each predicate at this socialRecord timestep.
				for (var j = 0 ; j < socialRecord[i].length ; j += 1) {
					var socialRecordPredicate = socialRecord[i][j];

					// Skip any predicates that don't match the search predicate's specification. 

					if (searchPredicate.category !== undefined && searchPredicate.category !== socialRecordPredicate.category) {
						continue;
					}
					if (searchPredicate.type !== undefined && searchPredicate.type !== socialRecordPredicate.type) {
						continue;
					}
					if (searchPredicate.first !== undefined && searchPredicate.first !== socialRecordPredicate.first) {
						continue;
					}
					if (searchPredicate.second !== undefined && searchPredicate.second !== socialRecordPredicate.second) {
						continue;
					}

					// If we made it to here, we found a match of the search predicate's pattern (although the value may not match up.)
					foundPatternMatch = true;

					// We don't want to assume "=" as operator, b/c then we won't match checks for existing socialRecord values.
					var doesValueMatch = checkValueMatch(socialRecordPredicate.value, searchValue, searchPredicate.operator);

					if (doesValueMatch) {
						addResult(socialRecordPredicate, searchValue, true);
					}
				}

				// In the case that we found no pattern matches for this predicate (meaning the socialRecord has no record of this information), see if the default value should indicate a positive result anyway.
				if ( !foundPatternMatch ) {
					checkForDefaultMatch(searchPredicate, defaultValue, searchValue, isBooleanPred);
				}
				foundPatternMatch = false;

			} // end if(socialRecord[i] !== undefined)

		} // end for (var i = lessRecentTime

		// In the case where the whole socialRecord was empty, we never got a chance to check for default values, so do it here.
		if (!foundAnySocialRecordTimesteps) {
			checkForDefaultMatch(searchPredicate, defaultValue, searchValue, isBooleanPred);
		}

		return matchedResults;
	};

	/**
	 * @method addHistory 
	 * @description  Take a history definition object, and load it into ensemble. See sampleGame/data/history.json for an example.
	 * @public
	 * @memberOf ensemble
	 * @return {object} A Parsed JSON file representing the history that was just loaded in.
	 * @param  {object} content - A javascript object detailing the social history to populate the socialRecord with.
	 */
	var addHistory = function(content) {
		var history;
		try {
			if (typeof content === "string") {
				history = (JSON.parse(content)).history;
			} else if (typeof content === "object") {
				history = content.history;
			} else {
				console.log("unexpected value:", content);
				throw new Error("Error load social structure: unexpected data value: ", typeof content);
			}
		} catch (e) {
			throw new Error("JSON Error load social structure (history): " + e);
		}
		
		var lastPos = -9999999999;
		for (var i = 0; i < history.length; i++) {
			// TODO add more error checking to look for out-of-order history steps, etc.
			var historyAtTime = history[i];
			if (historyAtTime.pos <= lastPos) {
				console.log("Tried to load a history file but timeStep " + historyAtTime.pos + " came after timeStep " + lastPos + "; history files must declare timesteps sequentially.");
				return;
			}
			lastPos = historyAtTime.pos;
			setupNextTimeStep(historyAtTime.pos);
			for (var j = 0; j < historyAtTime.data.length; j++) {
				var pred = historyAtTime.data[j];
				try {
					set(pred);
				} catch(e) {
					console.log("invalid history file! double check  predicate on console");
					console.log("invalid predicate in history:", pred);
					return;
				}
			}
		}
		return content;
	};


	// Return a hash string guaranteed to be unique for each distinct predicate regardless of key order.
	var predicateHash = function(obj) {
		var hash = [];
		var sortedKeys = _.keys(obj).sort();
		for (var i = 0; i < sortedKeys.length; i++) {
			hash[i] = obj[sortedKeys[i]];
		};
		return hash.join("");
	};

/**
 * A simple toString for a predicate, as the natural one just returns Object [object]
 * This function is meant to be assigned to a predicate objects toString method.
 *
 * @method predicateToString
 * @memberof socialRecord
 * @return a string representation of the current predicate represented by 'this'
 */
	var predicateToString = function(){
		var returnString = "";
		for (var key in this) {
			returnString += key + ": " + this[key] + ", ";
			//console.log(key + ": " + this[key]);
		}
		return returnString;
	};


/**
 * @description Allows a predicate to be saved to the socialRecord at the current timeStep. Handles stored predicate updating as well as storing new predicates
 *
 * @method set
 * @memberof ensemble
 * @public
 * @param {Object} setPredicate - the predicate that we would like to save to the socialRecord
 */
	var set = function(setPredicate) {
		var pattern = {};
		pattern.category = setPredicate.category;
		pattern.type = setPredicate.type;
		pattern.first = setPredicate.first;
		pattern.second = setPredicate.second;

		var value = setPredicate.value;
		var operator = setPredicate.operator;

		var isBooleanPred = getRegisteredIsBoolean(setPredicate);
		var isReciprocal = getRegisteredDirection(setPredicate) === "reciprocal";
		var defaultValue = defaultValues[pattern.category];
		var duration = getRegisteredDuration(setPredicate);
		var max = getRegisteredMaxValue(setPredicate);
		var min = getRegisteredMinValue(setPredicate);

		var timeStep = getCurrentTimeStep();
		if (timeStep === -1) {
			setupNextTimeStep(0);
			timeStep = 0;
		}

		//TODO: Changed this to just making value = true for consistency, but we should discuss this.
		// If we're trying to set a boolean value and we've left out the value, assume we mean the non-default.
		if (isBooleanPred && value === undefined) {
			//value = ! defaultValue;
			value = true;
		}

		// Get a reference to an socialRecord record.
		var socialRecordPredicate;
		var searchResult = get(pattern, 0, 0, false);
		if (searchResult.length === 0) {
			socialRecordPredicate = pattern;
			socialRecordPredicate.value = defaultValue;
			socialRecord[timeStep].push(socialRecordPredicate);
		} else if (searchResult.length === 1) {
			socialRecordPredicate = searchResult[0];
		} else {
			console.log("bad predicate: ", setPredicate);
			throw new Error("Expected any pattern get to the socialRecord to return either an existing record or make a new one w/the default value and return that.")			
		}

		socialRecordPredicate.timeHappened = timeStep;
		socialRecordPredicate.duration = duration;

		if (operator === undefined || operator === "=") {
			// Straight update.
			socialRecordPredicate.value = value;
		} else {
			// Offset.
			if (operator === "+") {
				socialRecordPredicate.value += value;
			} else if (operator === "-") {
				socialRecordPredicate.value -= value;
			}
		}

		// Verify new value is valid.
		if (!isBooleanPred) {
			if (socialRecordPredicate.value > max) {
				socialRecordPredicate.value = max;
			}
			if (socialRecordPredicate.value < min) {
				socialRecordPredicate.value = min;
			}
		}

		// Also update if a reciprocal predicate.
		if (isReciprocal) {
			var recipPredicate = util.clone(setPredicate);
			var temp = recipPredicate.second;
			recipPredicate.second = recipPredicate.first;
			recipPredicate.first = temp;
			recipPredicate.value = undefined;

			var rPred;
			var recipSearchResult = get(recipPredicate, 0, 0, false);
			if (recipSearchResult.length === 1) {
				rPred = recipSearchResult[0]
			} else {
				rPred = recipPredicate;
				socialRecord[timeStep].push(rPred);
			}

			rPred.timeHappened = socialRecordPredicate.timeHappened;
			rPred.duration = socialRecordPredicate.duration;
			rPred.value = socialRecordPredicate.value;

		}

	}

/**
 * Clears out the history of the socialRecord. Note that all registered things from blueprints, such as
 * defaultValues and directions, are NOT removed, so there is no need to re-register
 *
 * @method clearHistory
 * @memberof socialRecord
 */
	var clearHistory = function(){
		socialRecord = [];
		currentTimeStep = -1;
	};

/**
 * Clears out EVERYTHING from the socialRecord. This means the entire social history, and also data that came from
 * our factory blueprints, including defaultValues and directions. After calling this, predicates need to be re-registered
 *
 * @method clearEverthing
 * @memberof socialRecord
 */
	var clearEverything = function(){
		socialRecord = [];
		currentTimeStep = -1;
		defaultValues = {};
		maxValues = {};
		minValues = {};
		directions = {};
		isBooleans = {};
		clonePolicies = {};
		durations = {};
		offstageCharacters = [];
		eliminatedCharacters = [];
	};

	/**
	 * Prints out the contents of the socialRecord's history at a given timeStep. If no timeStep is specified,
	 * prints out the conents of the socialRecord at the current time step
	 *
	 * @method socialRecordHistoryToString
	 * @memberof socialRecord
	 * @param timeStep 			an integer representing the timeStep we want to see the contents of the socialRecord at. Assume current time step if undefined.
	 * @return historyString 	A string representing the contents of the socialRecord at the specified point in history
	 */
	var socialRecordHistoryToString = function(timeStep){
		if(timeStep === undefined){
			timeStep = currentTimeStep;
		}

		var historyString = "******socialRecord At Time " + timeStep + "********\n";

		for(var i = 0; i < socialRecord[timeStep].length; i += 1){
			historyString += "<PREDICATE " + i + ">\n";
			historyString += "category: " + socialRecord[timeStep][i].category + "\n";
			historyString += "type: " + socialRecord[timeStep][i].type + "\n";
			historyString += "first: " + socialRecord[timeStep][i].first + "\n";
			historyString += "second: " + socialRecord[timeStep][i].second + "\n";
			historyString += "value: " + socialRecord[timeStep][i].value + "\n";
			historyString += "timeHappened: " + socialRecord[timeStep][i].timeHappened + "\n";
			historyString += "---------------------------\n";
		}

		historyString += "Total Length: " + socialRecord[timeStep].length + "\n";
		historyString += "******************************";
		return historyString;

	};

	var socialRecordFullHistoryToString = function(){
		var returnString = "";
		for(var i = 0; i < socialRecord.length; i += 1){
			returnString += socialRecordHistoryToString(i);
		}
		return returnString;
	};

	//setter for if a character is offstage.
	var putCharacterOffstage = function(characterName){
		//TODO: Validate that 'characterName' is a valid character in this system!
		if(offstageCharacters.indexOf(characterName) === -1){
			//Awesome, let's add them to offstage!
			offstageCharacters.push(characterName);
		}
		else{
			//Character was already offstage...
			console.log("Character was already offstage, doing nothing...");
		}
	};

	//getting for if a character is offstage.
	var getIsCharacterOffstage = function(characterName){
		if(offstageCharacters.indexOf(characterName) === -1){
			//they are not offstage
			return false;
		}
		return true;
	};

	//set a character to be eliminated
	var eliminateCharacter = function(characterName){
		//TODO: Validate that 'characterName' is a valid character in this system.
		if(eliminatedCharacters.indexOf(characterName) === -1){
			//Alright, let's add them to the eliminated list...
			eliminatedCharacters.push(characterName);

			//if this character was also on the 'offstage' list, let's remove them from there.
			var indexInOffstage = offstageCharacters.indexOf(characterName);
			if(indexInOffstage !== -1){
				offstageCharacters.splice(indexInOffstage, 1);
			}

			//actually remove references to this character.
			removeAllSocialFactsFromCharacter(characterName);
		}
		else{
			//Character was already eliminated...
			console.log("Character was already eliminated, doing nothing...");
		}
	};

	//getter for if a character is eliminated.
	var getIsCharacterEliminated = function(characterName){
		if(eliminatedCharacters.indexOf(characterName) === -1){
			//they are not eliminated
			return false;
		}
		return true;
	};

	//takes a character OFF of the offstage list.
	var putCharacterOnstage = function(characterName){
		var index = offstageCharacters.indexOf(characterName);
		if(index !== -1){
			//They used to be offstage -- let's put them onstage!
			offstageCharacters.splice((index), 1);
		}
	};

	var removeAllSocialFactsFromCharacter = function(characterName){
		//TODO: Validate that characterName is an actual character in the system.
		removeDirectedSocialFacts(characterName);
		removeReciprocalSocialFacts(characterName);
		removeUndirectedSocialFacts(characterName);
	};

	var removeUndirectedSocialFacts = function(characterName){
		var indicesToRemove = [];
		for(var i = 0; i < socialRecord[currentTimeStep].length; i += 1){
			var socialFact = socialRecord[currentTimeStep][i];
			if(getRegisteredDirection(socialFact) === "undirected"){
				if(socialFact.first === characterName || socialFact.second === characterName){
					indicesToRemove.push(i);
				}
			}
		}

		for(var j = indicesToRemove.length - 1; j >= 0; j -= 1){
			socialRecord[currentTimeStep].splice(indicesToRemove[j], 1);
		}
	};

	var removeDirectedSocialFacts = function(characterName){
		//TODO: Validate that characterName is an actual character in the system.
		var indicesToRemove = [];
		for(var i = 0; i < socialRecord[currentTimeStep].length; i +=1){
			var socialFact = socialRecord[currentTimeStep][i];
			if(getRegisteredDirection(socialFact) === "directed"){
				if(socialFact.first === characterName || socialFact.second === characterName){
					//This means that we are dealing with someone who has a directed attribute to or from the 'name' character.
					indicesToRemove.push(i); // store for removal later; removing now would mess up our pass through the array.
				}
			}
		}

		for(var j = indicesToRemove.length - 1; j >= 0; j -= 1){
			//We want to go backwards, so as not to disrupt the ordering of the indexes we've marked for removal.
			socialRecord[currentTimeStep].splice(indicesToRemove[j], 1);
		}
	};

	var removeReciprocalSocialFacts = function(characterName){
		//TODO: Validate that characterName is an actual character in the system.
		var indicesToRemove = [];
		for(var i = 0; i < socialRecord[currentTimeStep].length; i += 1){
			var socialFact = socialRecord[currentTimeStep][i];
			if(getRegisteredDirection(socialFact) === "reciprocal"){
				if(socialFact.first === characterName || socialFact.second === characterName){
					//Anything that involves this character is going to be removed.
					indicesToRemove.push(i);
				}
			}
		}

		for(var j = indicesToRemove.length - 1; j >= 0; j -= 1){
			//we want to go backwards, so as not to disrupt the ordering of the indexes we've marked for removal.
			socialRecord[currentTimeStep].splice(indicesToRemove[j], 1);
		}
	};

	var getOffstageCharacters = function(){
		return offstageCharacters;
	};

	var getEliminatedCharacters = function(){
		return eliminatedCharacters;
	};

	//TODO: this is now redundant with ensemble.get()
	var publicGet = function (predicate, earliestTime, latestTime, useDefaultValue, params) {
		return get(predicate, earliestTime, latestTime, useDefaultValue, params);
	};

	var init = function(initialTimeStep) {
		if (initialTimeStep !== undefined) {
			currentTimeStep = initialTimeStep;
		}
		//offstageCharacters = [];

	};

	var socialRecordInterface = {
		init: init,
		dumpSocialRecord: dumpSocialRecord,
		getSocialRecordCopyAtTimestep: getSocialRecordCopyAtTimestep,

		getCurrentTimeStep		: getCurrentTimeStep,

		registerMaxValue		: registerMaxValue,
		getRegisteredMaxValue	: getRegisteredMaxValue,
		registerMinValue		: registerMinValue,
		getRegisteredMinValue	: getRegisteredMinValue,
		registerDuration 		: registerDuration,
		getRegisteredDuration 	: getRegisteredDuration,
		registerDirection 		: registerDirection,
		getRegisteredDirection 	: getRegisteredDirection,
		registerDefault 		: registerDefaultValue,
		getRegisteredDefault 	: getRegisteredDefaultValue,
		registerIsBoolean 		: registerIsBoolean,
		getRegisteredIsBoolean 	: getRegisteredIsBoolean,
		clearHistory 			: clearHistory,
		clearEverything			: clearEverything,
		set 					: set,
		get 					: publicGet,
		addHistory				: addHistory,
		socialRecordHistoryToString 	: socialRecordHistoryToString,
		socialRecordFullHistoryToString	: socialRecordFullHistoryToString,
		putCharacterOffstage	: putCharacterOffstage,
		putCharacterOnstage		: putCharacterOnstage,
		eliminateCharacter		: eliminateCharacter,
		getIsCharacterOffstage  : getIsCharacterOffstage,
		getIsCharacterEliminated: getIsCharacterEliminated,
		getOffstageCharacters	: getOffstageCharacters,
		getEliminatedCharacters	: getEliminatedCharacters,
		setupNextTimeStep		: setupNextTimeStep
	};
	// See comment at top of Tests.js for explanation of below.

	/* test-code */
	socialRecordInterface.currentTimeStep = currentTimeStep;
	socialRecordInterface.getLength = getLength;
	socialRecordInterface.getCurrentTimeStep = getCurrentTimeStep;
	socialRecordInterface.getLengthAtTimeStep = getLengthAtTimeStep;
	/* end-test-code */

	//public things removed and turned 'private'
	//getLength 				: getLength,

	return socialRecordInterface;


});
/*global console, define */
/*jshint sub:true*/
/*
 * This is the class Volition, for caching and accessing calculated volitions for characters in ensemble, using an Iterator pattern.
 *
 * Basic usage of this module: store a calculated volition using the saveVolitions function
 *
 * The internal format for a volitions objects should be structured like this:
 * 		{
			"Simon": {
				"Monica": [
					{ "category": "network", "type": "buddy", "intentType": true, "weight": 20 },
					{ "category": "relationship", "type": "involved with", "intentType": true, "weight": 19 }
				]
			},
			"Monica": {
				"Simon": [
					{ "category": "network", "type": "romance", "intentType": false, "weight": 12 }
				]
			}
		}
 *
 * Public methods are:
 *
 * calculateVolition
 * runTriggerRules
 *
 * @class volition
 * @private
 */


define('volition',["util", "underscore", "test"], function(util, _, test) {

	var volitionCache = {};
	var cachePositions = {};

	/**
	 * Get the highest-weighted volition in a given set, for a particular pair of characters, or return undefined if no such volition can be found.
	 *
	 * @param  {String} key    The identifier for a volition set.
	 * @param  {String} from   Identifier for the "from" character.
	 * @param  {String} to     Identifier for the "to" character.
	 *
	 * @return {Object}        A volition predicate, with keys "category", "network", "type", "intentType", and "weight". (Or undefined if there are no volotions for this pair of characters.)
	 */
	var getFirstVolition = function(key, from, to) {

		// Check that we have volitions to return.
		var vSet = volitionCache[key];
		if (vSet === undefined) {
			console.log("No matching volition set found with key '" + key + "'.");
			return undefined;
		}
		if (vSet[from] === undefined || vSet[from][to] === undefined) {
			console.log("No matching volitions found in set '" + key + "' from '" + from + "' to '" + to + "'.");
			return undefined;
		}

		// Set the cache position for this pair of characters to 0.
		var cachePositionsKey = key + from + to;
		cachePositions[cachePositionsKey] = 0;

		// Return the volition at the first position (highest weighted).
		return vSet[from][to][0];

	};

	/**
	 * Get the next-highest-weighted volition in a given set, for a particular pair of characters, or return undefined if no such volition can be found. If this function on a set for the first time, it acts the same as getFirstVolition. Note that iteration is by a particular pair of characters; calling the function for a different pair of characters will start at getFirst for that pair.
	 *
	 * @param  {String} key    The identifier for a volition set.
	 * @param  {String} from   Identifier for the "from" character.
	 * @param  {String} to     Identifier for the "to" character.
	 * 
	 * TODO: It would be nice to have functionality to get a specified intent (e.g. 'what is the volition for Simon to startDating Monica?')
	 *
	 * @return {Object}        A volition predicate, with keys "category", "network", "type", "intentType", and "weight". (Or undefined if there are no more volitions for this pair of characters.)
	 */
	var getNextVolition = function(key, from, to) {

		var cachePositionsKey = key + from + to;
		var vSet = volitionCache[key];
		var pos = cachePositions[cachePositionsKey];

		// If we have no cached position, act like getFirstVolition.
		if (pos === undefined) {
			return getFirstVolition(key, from, to);
		}

		// If we are out of volitions, return undefined
		if (vSet[from][to][pos+1] === undefined) {
			return undefined;
		}

		// Advance the cache position and return the next volition.
		cachePositions[cachePositionsKey] += 1;
		pos = cachePositions[cachePositionsKey];
		return vSet[from][to][pos];

	};

	/** Given a set of pre-computed volitions, returns an object with a boolean and an array of reasons why (i.e. b/c their weight is >= 0).
	 * 
	 * @method isAccepted
	 * @memberof Volition
	 * @param {String}	key 	The string that serves as an index to look up volitions in the volitionCache
	 * @param {String}	initiator	The first person in the predicate attempted the intent predicate
	 * @param {String}	responder	The second person in the predicate
	 * @param {Object}	predicate	Predicate intent object to try to match from the predicate intents in the volitionCache 
	 * @return {Object}	returnObject	an object with the keys:
	 * 									{Boolean} accepted - whether the intent is accepted
	 * 									{Array} reasonsWhy - the array of volition predicates that are the reason(s) something was accepted
	 */
	var isAccepted = function(key, initiator, responder, predicate) {
		var acceptIfNoMatch = true; // If no matching rules affect the decision, should the character accept or reject the game?
		var minimumWeightForAccept = 0;
		
		var returnObject = {};		
		returnObject.accepted = acceptIfNoMatch;
		returnObject.reasonsWhy = [];
			
		var thisV = getFirstVolition(key, responder, initiator);
		while (thisV !== undefined) {
			if (thisV["category"] === predicate["category"] &&
				thisV["type"] === predicate["type"] &&
				thisV["intentType"] === predicate["intentType"]) {
				returnObject.weight = thisV.weight;
				if (thisV.weight < minimumWeightForAccept) {
					returnObject.reasonsWhy.push(thisV);
					returnObject.accepted = false;
					return returnObject;
				}
				else {
					returnObject.reasonsWhy.push(thisV);
					returnObject.accepted = true;
					return returnObject;
				}
			}
			thisV = getNextVolition(key, responder, initiator);
		}

		return returnObject;
	};

	/**
	 * Take a set of calculated volitions, sort it, and store it in the internal cache. Return an interface that allows for iterating through its results.
	 *
	 * @param  {String} key       An identifier for this volition set.
	 * @param  {Object} volitions [description]
	 *
	 * @return {Object}           An interface with functions "getFirst" and "getNext" to iterate through the volitions for particular pair of characters.
	 */
	var register = function(key, volitions) {

		// Sort the passed-in volitions.
		//
		// Very simple function used by _.sortBy below to know how to order
		// the volition objects for a character set.
		var vSort = function(obj) {
			return -1 * obj.weight; // -1* since sort works in asending
		};

		// Each character pair in calculatedVolitions now needs to be sorted
		// in weight order. Use underscore sortBy on the weight key.
		var cast = _.keys(volitions);
		var castLength = cast.length;
		for (var first = 0; first < castLength; first++) {
			for (var second = 0; second < castLength; second++) {
				if (second === first) {
					//For 'undirected' volitions, we want people to be able to direct volitions towards themselves.
					//continue;
				}

				volitions[cast[first]][cast[second]] = _.sortBy(volitions[cast[first]][cast[second]], vSort);
			}
		}

		// Store the sorted volition object in our internal cache.
		volitionCache[key] = volitions;

		// Return an interface using currying to pre-fill the value
		// of key to the volition set in question.
		return {
			getFirst: function(first, second) {
				return getFirstVolition(key, first, second);
			},
			getNext: function(first, second) {
				return getNextVolition(key, first, second);
			},
			getWeight: function(first, second, predicate) {
				var tempPredicates = volitionCache[key][first][second];
				var checkNextPredicate = false;
				for (var i = 0 ; i < tempPredicates.length ; i += 1) {
					for (var key in predicate) {
						if (predicate[key] !== tempPredicates[key]) {
							checkNextPredicate = true;
							break;
						}
					}
					if(checkNextPredicate !== true) {
						return tempPredicates[i].weight;
					}
				}
				return 0;	// our default value
			},
			dump: function() {	// for testing
				return volitionCache[key];
			},
			isAccepted: function(initiator, responder, predicate) {
				return isAccepted(key, initiator, responder, predicate);
			}
		};
	};

	/**
	 * Return a volitions object prepared to have a blank array for every  obj[first][second] pair of cast members.
	 *
	 * @param  {Array of Strings} cast Cast members to prepare the object with.
	 *
	 * @return {Object}      Prepared volitions object.
	 */
	var newSet = function(cast) {
		var volitionShell = {};
		for (var i = 0; i < cast.length; i++) {
			volitionShell[cast[i]] = {};
			for (var j = 0; j < cast.length; j++) {
				if (i === j) {
					//We want the i === j case to be represented, as a means of characters having undirected volitions (e.g., a character wants to boost their own intelligence).
					//continue;
				}
				volitionShell[cast[i]][cast[j]] = [];
			}
		}
		return volitionShell;
	};

	/**
	 * @function getVolitionCacheByKey
	 * @memberof Volition
	 * @description Given a key, return the contents of the voitionCache at that point
	 * @private
	 * @param  {[string]} key [The identifier of a volition set.]
	 * @return {[type]}     [The volitions of the specified key.]
	 */
	var getVolitionCacheByKey = function(key){
		return volitionCache[key];
	};

	/**
	 * @functiongetAllVolitionsByKeyFromTo
	 * @private
	 * @memberof Volition
	 * @param  {[string]} key  [The idenfifier of a volition set]
	 * @param  {[string]} from [The 'initiator' that these volitions pertain to]
	 * @param  {[string]} to   [The 'responder' that these volitions pertain to]
	 * @return {[type]}      [The volitions from the volition set specified by key that describe what the 'from' character wants to do with the 'to' character]
	 */
	var getAllVolitionsByKeyFromTo = function(key, from, to){
		return volitionCache[key][from][to];
	};

	var volitionInterface = {
		newSet: newSet,
		register: register,
	};

	/* test-code */
	volitionInterface.getVolitionCacheByKey = getVolitionCacheByKey;
	volitionInterface.getAllVolitionsByKeyFromTo = getAllVolitionsByKeyFromTo;
	volitionInterface.isAccepted = isAccepted;
	/* end-test-code */

	return volitionInterface;

});
// Package: Log
// Logging and error reporting interface.

/*jshint smarttabs: true */
/*global define, console */

define('log',["jquery"], function($) {
	

	// A reference to a global variable holding log messages. This is necessary so we can plug into the React framework.
	var GLOBAL_LOG_ARRAY;
	var GLOBAL_LOG_TYPES;

	var currentlyTracking = {};
	var parentNode = "";

	var init = function(_parentNode, optGlobalRef, optLogTypes) {
		parentNode = _parentNode;
		if (parentNode === "REACT") {
			GLOBAL_LOG_ARRAY = optGlobalRef;
			GLOBAL_LOG_TYPES = optLogTypes;
			var target = $("#logControlsArea");
			for (var i = 0; i < GLOBAL_LOG_TYPES.length; i++) {
				var t = GLOBAL_LOG_TYPES[i];
				var tName = t[0];
				var tTracking = t[1];
				target.append("<input id='box_" + tName + "' type='checkbox' " + (tTracking ? "checked" : "") + " value='" + tName + "'> " + tName + "<br/>")
			};
		}
		$("#logControlsArea input").change(function(e) {
			console.log("e", e, "this", this);
			if (e.target.checked === true) {
				trackOn(e.target.value);
			} else {
				trackOff(e.target.value);
			}
		});
	}

	/* Function: trackOn
	Start showing <Log.log> messages for the given key.

	Paramters:
	category - a string
	*/
	var trackOn = function(category) {
		currentlyTracking[category] = true;
	};

	/* Function: trackOff
	Stop showing <Log.log> messages for the given key.

	Paramters:
	category - a string
	*/
	var trackOff = function(category) {
		currentlyTracking[category] = false;
	};

	var areTracking = function(category) {
		return (currentlyTracking[category] === true);
	};

	/* Function: trackAll
	Start showing <Log.log> messages for all keys.
	*/
	var trackAll = function() {
		for (var i = 0; i < GLOBAL_LOG_TYPES.length; i++) {
			var t = GLOBAL_LOG_TYPES[i];
			trackOn(t[0]);
			$("#box_" + t[0]).prop('checked', true);
		}
	};

	/* Function: trackReset
	Stop tracking <Log.log> messages for all keys.
	*/
	var trackReset = function() {
		currentlyTracking = {};
		for (var i = 0; i < GLOBAL_LOG_TYPES.length; i++) {
			var t = GLOBAL_LOG_TYPES[i];
			t[1] = false;
			trackOff(t[0]);
			$("#box_" + t[0]).prop('checked', false);
		}
	};

	/* Function: log
	Log something to the designated loggy place (console, currently)

	Paramters:
	category - string, specifying this lets you turn on/off logging for certain categories (see <trackOn> and <trackOff>). If you omit this parameter, the message is always displayed.
	message - string, what to display
	*/
	var log = function(category, message, alwaysLog) {
		// console.log('log.js: "' + category + "', msg: " + message);
		if (currentlyTracking[category] === true || alwaysLog) {
			if (parentNode === "REACT") {
				// GLOBAL_LOG_ARRAY.push("<span class=log_" + category + "'>" + message + "</span>");
				// if (GLOBAL_LOG_TYPES.indexOf(category) < 0) {
					// GLOBAL_LOG_TYPES.push([category, true]);
				// }
				$("#logWindow").append("<p class='log_" + category + "'>" + message + "</p>");
			} else {
				var msg = "<div class='logmsg log_" + category + "'>" + message + "</div>";
				$(parentNode).append(msg);
			}
		}
	};

	var error = function(category, message) {
		console.log("ERROR " + category + ": " + message);
		console.log("Additional error info follows:");
		for (var i = 2; i <= arguments.length; i++) {
			console.log(arguments[i]);
		}
		if (parentNode === "REACT") {
			log("error", "ERROR: Additional info on Javascript console.", true);
		}
	}

	var fatalError = function(category, message) {
		error(category, message);
		console.log("Stack trace follows:");
		console.trace();
		throw new Error("Halting execution.");
	}

	return {
		init: init,

		log: log,
		error: error,
		fatalError: fatalError,

		on: trackOn,
		off: trackOff,
		areTracking: areTracking,
		all: trackAll,
		reset: trackReset
	};

});
/**
 * This is the class RuleLibrary
 * Public methods are:
 *
 * calculateVolition
 * runTriggerRules
 *
 * @class  RuleLibrary
 * @private
 */

define('ruleLibrary',["socialRecord", "volition", "underscore", "util", "log", "test"], function(socialRecord, volition, _, util, log, test) {

	var ruleLibrary = {
		triggerRules : [],
		volitionRules : []
	};

/**
 * @description Runs a rule set over a cast of characters.
 * First it temporarily stores a specific ruleSet from the ruleLibrary into an array called rules.
 * For each rule in this array, the characters that apply to each rule are bound to that rule.
 *
 * @method runRules
 * @memberof RuleLibrary
 * @param {String} ruleSet	an array of rules to check for in the socialRecord
 * @param {Array} cast		an array of characters we are interested in seeing if the provided rules apply to
 * @param onMatchFunction	the function that we will apply if the rule(s) are found to be true
 */
	var runRules = function (ruleSet, cast, onMatchFunction, params, unaffectedCharacters) {
		var rules = ruleLibrary[ruleSet];
		for (var i = 0 ; i < rules.length ; i += 1) {
				//ASK -- leaving this in fow now until the 'additive addRuleSet' issue is resolved
				if(rules[i].conditions === undefined){
					throw new Error("runRules called for ruleSet '" + ruleSet + "' (length " + rules.length + ") but there are no conditions in rule " + i + ".");
				}
				var allPredicates = rules[i].conditions.concat(rules[i].effects);
				var uniqueBindings = getUniqueBindings(allPredicates);
				matchUniqueBindings(uniqueBindings, cast, onMatchFunction, rules[i], params, unaffectedCharacters);
		}
	};


/**
 * Finds the place-holders for the unique characters who appropriately apply to a given rule
 * @method getUniqueBindings
 * @memberof RuleLibrary
 * @param {Array} ruleConditions	the conditions which need to have specific characters filled into roles first and (optionally) second.
 * @return {Array} dictionary		each of the conditions will be stored in this dictionary, with keys
 */
	var getUniqueBindings = function (ruleConditions) {
		var dictionary = {};
		for (var i = 0 ; i < ruleConditions.length ; i += 1) {
			var predicate = ruleConditions[i];			//store the current rule condition in a temp

			//if the dictionary does not have an entry for the current predicate's first, initialize it
			if (dictionary[predicate.first] === undefined) {
				dictionary[predicate.first] = "";		//possible optimization to change the initialization to zero
			}
			//and the same for the second entry in there is a second character in the predicate
			if (predicate.second !== undefined) {
				if (dictionary[predicate.second] === undefined) {
					dictionary[predicate.second] = "";
				}
			}
		}
		return dictionary;
	};

/**
 * A recursive method which fills the roles for unique bindings previously found with actual characters
 *
 * @method matchUniqueBindings
 * @memberof RuleLibrary
 * @param {Object} uniqueBindings	the dictionary of place-holders for unique characters to fill
 * @param {Array} availableCastMembers	array of cast members who can potentially fill a unique role
 * @param {Function} processResult 	the function which will process the result of the unique binding
 * @param {Array} rule	the particular rule that needs to be applied
 */
	var matchUniqueBindings = function (uniqueBindings, availableCastMembers, processResult, rule, params, unaffectedCharacters) {
		var isFilled = true;
		var emptyKey = "";

		//find an unbound key in the uniqueBindings dictionary
		for (key in uniqueBindings) {
			if (uniqueBindings[key] === "") {
				emptyKey = key;
				isFilled = false;
				break;
			}
		}

		// essentially our base case for the recursion
		// if all of the keys in the uniqueBindings dictionary have an entry
		if (isFilled === true) {
			// then recursion has bottomed out. we have a completely bound set of characters.
			var boundConditions = doBinding(uniqueBindings, util.clone(rule.conditions));	//characters are assigned

			//Because some characters might be offstage or eliminated, we might not want to
			//bother evaluating this rule. The only way we'll know for sure is by looking
			//at the effects. If they involve characters that are on our 'ignore' list,
			//then we'll want to skip evaluating this rule.
			//It's worth noting that one rule might have multiple effects, some of which
			//we want to ignore and others we don't. In that case, as long as one effect
			//is good, then we have to evaluate anyway. We'll let the respective
			//rule set handle ignoring the 'bad' effects inside of processResult.
			var boundEffects = doBinding(uniqueBindings, util.clone(rule.effects));
			var atLeastOneGoodEffect = false;
			for(var k = 0; k < boundEffects.length; k+=1){
				if(boundEffects[k].first !== undefined){
					if(unaffectedCharacters.indexOf(boundEffects[k].first) !== -1){
						//This is a "bad" effect -- it affects someone we are ignoring.
						continue;
					}
				}
				if(boundEffects[k].second !== undefined){
					if(unaffectedCharacters.indexOf(boundEffects[k].second) !== -1){
						//This is a "bad" effect -- it affects someone we are ignoring.
						continue;
					}
				}
				//If we've made it here, then at least one of the effects is something
				//that we'll want to enact if the condition evaluates to true.
				//That means we might as well start evaluating now!
				atLeastOneGoodEffect = true;
				break;
			}

			//Only bother evaluating if at least one effect involves characters that
			//we don't want to ignore (e.g., they aren't offstage, they aren't eliminated)
			var conditionsAreTrue = false;
			if(atLeastOneGoodEffect){
				conditionsAreTrue = evaluateConditions(boundConditions, rule, params);
			} 

			// All the conditions are true, so process all effects.
			if (conditionsAreTrue === true){
				var boundEffects = doBinding(uniqueBindings, util.clone(rule.effects));
				for (var j = 0 ; j < boundEffects.length ; j +=1 ) {
					processResult(boundEffects[j], boundConditions, rule, j, boundEffects.length-1);
				}
			}
		}
		// time to recurse
		else {
			// There are still some characters unbound: recurse down the chain with each
			// possible assignment for the first unbound slot.
			for (var i = 0 ; i < availableCastMembers.length ; i +=1) {
				uniqueBindings[emptyKey] = availableCastMembers[i];	// place an available cast member into the empty slot in the dictionary
				var updatedCastMembers = util.clone(availableCastMembers);
				updatedCastMembers.splice(i, 1);	// the updated cast has the currently assigned member removed for the recursion
				matchUniqueBindings(uniqueBindings, updatedCastMembers, processResult, rule, params, unaffectedCharacters);
			}
			//If we've gotten here, we want to 'clear out' the uniqueBindings slot of the current 'emptyKey'
			//Because we want it to be clear for when we pop back up to the previous level of recursion.
			uniqueBindings[emptyKey] = "";
		}
	};

	/**
	 * evaluateConditions takes an array of bound conditions (that is, the first and second
	 * role slots are "filled in" (i.e. first: "simon" as opposed to first: "x"), and for each one
	 * of them checks, to see if they hold true. Returns true if all conditions are true. False otherwise.
	 *
	 * @method evaluateConditions
	 * @memberof RuleLibrary
	 * @param {Array} conditions An array of predicates representing the condition of a rule.
	 * @return {Boolean} conditionsAreTrue Returns true if all of the predicates in the conditions array is true. Returns False otherwise.
	 */
	/*
	var evaluateConditions = function(conditionsArray, rule, params){
		var orderedConditions = [];
		var conditions = util.clone(conditionsArray);
		var counter = conditions.length;

		for (var i = 0 ; i < counter ; i += 1) {

			// in the case of an ordered condition array, if a mistake was made and there is a gap
			// i.e. 1,2,4,5, skip the undefined entry and continue
			if (conditions[i] === undefined) {
				counter += 1;
				continue;
			}

			var condition = conditions[i];
			var earlyTime = 0;
			var latestTime = 0;

			//Let's do it with default time steps too!
			if(condition.timeEarliest !== undefined){
				earlyTime = condition.timeEarliest;
			}
			if(condition.timeLatest !== undefined){
				latestTime = condition.timeLatest;
			}

			// Put the ordered conditions in an ordered array
			
			if(condition.order !== undefined) {
				var tempCondition = util.clone(condition);
				if (tempCondition.order === -1){
					delete tempCondition.order;
					delete tempCondition.timeEarliest;
					delete tempCondition.timeLatest;
					if(tempCondition.class === "SFDBLabel"){
						console.log("Dealing with my thing...");
					}
					var results = sfdb.get(tempCondition, earlyTime, latestTime);
					if (results.length === 0) {
						return false;
					}
					else {
						// only do this if the next condition is defined, otherwise we're done!
						if(conditions[i+1] !== undefined) {
							conditions[i+1].timeLatest -= results[0].timeFoundOffset;	// this offset is the time that the predicate was found
						}																// less the earliest time the get method started looking for it
						continue;														// e.g. we are at time step 10, earliestTime = 4, so we began looking for
					}																	// it at time step 6, found it at step 7, so 7-6 gives us an offset of 1
				}																		// and we add 1 to it so we begin our next pass 1 step past step 7 (i.e. 8)
				else {
					var tempCondition = util.clone(condition);
					var orderNumber = tempCondition.order;
					tempCondition.order = -1;	// let us know that we've already found this predicate to be ordered
					orderedConditions[orderNumber] = tempCondition;
					continue;
				}
			}

			//Here is where we should 'modify' this predicate based on certain default
			//assumptions. For example, a condition predicate that is a 'status' we
			//want to default to having the value true (right? Because that is the way more
			//more common case). There may be enough of these conventions that it should be
			//separated out into it's own file, but for now, let's just do the status thing.
			// TODO: change to default value here
			if(condition.value === undefined && sfdb.getRegisteredIsBoolean(condition) === true) {
			 	//condition.value = sfdb.getRegisteredDefault(condition);
			 	condition.value = true;
			}
			//condition.earliestTime and condition.latestTime mess up 'get', because things STORED in the
			//sfdb don't have earliest and latest times, so they don't match. delete them for now, and give them back
			//at the end of the function
			var searchCondition = util.clone(condition);
			delete searchCondition.timeEarliest;
			delete searchCondition.timeLatest;

			var results = sfdb.get(searchCondition, earlyTime, latestTime);	//zeros signify currentTimeStep


			// If no match was found, this condition is false; so this
			// whole predicate must be false..
			if (results.length === 0) {
				// This check can be used to show why a trigger rule failed for a particular rule and character(s). In ensembleBridge when runTriggerRules is called, add as a final param an object with key "monitor" and a value of the name of the rule to track.
				if (params && params.monitor === rule.name) {
					if (params.first && params.first !== condition.first) {
					} else {
						if (params.second && condition.second && params.second !== condition.second) {
						} else {
							console.log("***Failed rule '" + rule.name + "' because condition #" + i + " was not true in sfdb at earlyTime " + earlyTime + ", latestTime " + latestTime + ". searchCondition:", searchCondition, ". results:", results);
						}
					}
				}

				return false;
			}
		}

		if(orderedConditions.length > 0){
			return evaluateConditions(orderedConditions);
		}

		//If we got here, that means that we want to return true -- all of the conditions checked out!
		return true;
	};*/

	//TODO: Write a function comment block for this guy
	//TODO: Do we still use 'rule' and 'params' here!?!? Can we get rid of them!?!
	var evaluateConditions = function(conditionsArray, rule, params){

		// if(conditionsArray.length >= 3 && conditionsArray[2].class === "SFDBLabel" && conditionsArray[2].first === "clara" && conditionsArray[2].second === "reggie"){
		// 	console.log("match..");
		// }
		var sortedConditions = sortConditionsByOrder(conditionsArray);
		var condition;
		var orderCounter = - 9999;
		var timeStart = 0;
		var timeEnd;
		if(params !== undefined && params.timeStep !== undefined){
			timeEnd = params.timeStep;
		}
		else{
			timeEnd = socialRecord.getCurrentTimeStep();
		}
		var timeOfLastMatch = -1;
		var currentTimeStep = timeEnd;
		var results;
		for(var i = 0; i < sortedConditions.length; i += 1){
			condition = sortedConditions[i];
			var largerRelTime = 0;
			var smallerRelTime = 0;

			//Let's do it with default time steps too! Our validator should have verified if this exists, it's a tuple of integers or special words ordered with the lowest first.
			if(condition.turnsAgoBetween !== undefined){
				smallerRelTime = condition.turnsAgoBetween[0];
				if (typeof smallerRelTime === "string") {
					if (smallerRelTime.toLowerCase() === "now") {
						smallerRelTime = 0;
					}
					else if (smallerRelTime.toLowerCase() === "start") {
						smallerRelTime = currentTimeStep;
					}
				}
				largerRelTime = condition.turnsAgoBetween[1];
				if (typeof largerRelTime === "string") {
					if (largerRelTime.toLowerCase() === "now") {
						largerRelTime = 0;
					}
					else if (largerRelTime.toLowerCase() === "start") {
						largerRelTime = currentTimeStep;
					}
				}
			}

			// assert that the times are properly ordered.
			if (smallerRelTime > largerRelTime) {
				throw new Error("found smallerRelTime " + smallerRelTime + " and largerRelTime " + largerRelTime);
			}

			//TODO: This seems to be an attempt at the 'defualt values' note in the google doc, but it doesn't appear to be working.
			//For one thing, it isn't actually looking up a stored default value, it just assumes to be true.
			//Here is where we should 'modify' this predicate based on certain default
			//assumptions. For example, a condition predicate that is a 'status' we
			//want to default to having the value true (right? Because that is the way more
			//more common case). There may be enough of these conventions that it should be
			//separated out into it's own file, but for now, let's just do the status thing.
			// TODO: change to default value here
			if(condition.value === undefined && socialRecord.getRegisteredIsBoolean(condition) === true) {
				//condition.value = sfdb.getRegisteredDefault(condition);
				condition.value = true;
			}

			//condition.turnsAgoBetween mess up 'get', because things STORED in the
			//sfdb don't have earliest and latest times, so they don't match. delete them for now, and give them back
			//at the end of the function
			var searchCondition = util.clone(condition);
			delete searchCondition.turnsAgoBetween;


			if(searchCondition.order === undefined){
				//Normal Evaluation. 
				results = socialRecord.get(searchCondition, smallerRelTime, largerRelTime, true, params);	//zeros signify currentTimeStep
				// If no match was found, this condition is false; so this
				// whole predicate must be false..
				if (results.length === 0) {
					//No results found! Must not be true!
					return false;
				}
			}
			else{
				//Ordered Evaluation.
				
				//Check to see if we've entered a new order group (e.g. previously order was 0, now order is 1)
				if(searchCondition.order > orderCounter){
					//we are in a new order group! -- might have to do a special check here for the 'first' time we get here.
					timeStart = currentTimeStep - (timeOfLastMatch + 1);
					timeEnd = smallerRelTime;
					orderCounter = searchCondition.order;
				}

				//See if the window specified by the predicate affects where we are allowed to start.
				if(largerRelTime < timeStart){
					timeStart = largerRelTime;
				}

				if(smallerRelTime > timeEnd){
					timeEnd = smallerRelTime;
				}

				if(timeEnd > timeStart){
					return false; // the 'start point' is already PAST the acceptable end point, which means it is impossible for us to succeed.
				}

				results = socialRecord.get(searchCondition, timeEnd, timeStart );

				if (results.length === 0) {
					//No results found! Must not be true!
					return false;
				}

				//TODO: This may not actually work if multiple matches are found... write unit tests or something!
				//TODO: Changing 'timeHappened' doesn't seem to actually make any differences. OH WAIT, unless
				//it isn't actually updating!?!?! Ok it is. So, that means that I have no idea why one is working and the other isn't.
				if(results[0].timeHappened > timeOfLastMatch){
					timeOfLastMatch = results[0].timeHappened;
					//timeHappened -- the thing I added into set (what I think would work);
				}

			}
		}

		//If we got here, that means that we want to return true -- all of the conditions checked out!
		return true;
	};

	/**
	 * @function sortConditions
	 * @description Given an array of predicates (ideally one from the condition of a rule) sorts them based on the value of their 'order' field. Not every predicate will have order specified; The returned array will have undefined order predicates first, followed by predicates with order in ascending order.
	 * @private
	 * @param  {[array]} conditions [An array filled with the condition predicates from a rule]
	 * @return {[array]}            [The conditions sorted on the key "order" in ascending order (undefined orders will appear first in the array.)]
	 */
	var sortConditionsByOrder = function(conditions){
		var nonOrderConditions = [];
		var orderConditions = [];
		var sortedConditions = [];
		var i;
		//Figure out which condition predicates have order specified, and which predicates do not.
		//TODO: This step may be extraneous, the _ sortBy function might get the job done automatically,
		//but this definitely ensures that the final array will be in the form we want. Look into removing this if need be.
		for(i = 0; i < conditions.length; i += 1){
			if(conditions[i].order === undefined){
				nonOrderConditions.push(conditions[i]);
			}
			else{
				orderConditions.push(conditions[i]);
			}
		}

		//Sort the order conditions BY thier order.
		orderConditions = _.sortBy(orderConditions, "order");

		//Make one super array! Orderless predicates come first, then order specified predicates.
		for(i = 0; i < nonOrderConditions.length; i += 1){
			sortedConditions.push(nonOrderConditions[i]);
		}
		for(i = 0; i < orderConditions.length; i += 1){
			sortedConditions.push(orderConditions[i]);
		}

		return sortedConditions;
	};

/**
 * A (smallish) array of characters to fill each needed role in a (condition) predicate is passed in,
 * and an array with these characters filling rolls is returned.
 *
 * @method doBinding
 * @memberof RuleLibrary
 * @param {Object} characters	a dictionary of characters to bind to predicates
 * @param {Object} predicates	a clone of the array of predicates that needs characters assigned to each of its roles
 * @return {Array} resultsArray an array of the conditions that have characters bound to their roles
 */
	var doBinding = function (characters, predicates) {
		var resultsArray = [];	//array to hold our conditions that have characters bound to roles in each entry
		for (var i = 0 ; i < predicates.length ; i += 1) {
			var predicate = predicates[i];	// current predicate to consider
			predicate.first = characters[predicate.first];	// bind a character to the role that only had a place-holder

			//and do that same for the second role, if there is a second role to fill
			if (predicate.second !== undefined) {
				predicate.second = characters[predicate.second];
			}
			resultsArray.push(predicate);
		}
		return resultsArray;
	};

/**
 * @description  Run the socialRecord's appropriate trigger rules with a given cast. Trigger rules always run at the current timeStep.
 *
 * @method runTriggerRules
 * @memberof ensemble
 * @param {Array} cast - the array of cast members
 * @param {Object} params - Debugging info to pass down the chain to runRules. Can be safely ignored.
 * @return {Object} An object representing the changes made to the social state as a result of running these trigger rules.
 */
	var runTriggerRules = function (cast, params) {
				// Construct an array of fired trigger rules.
		var triggerObj = {};
		triggerObj.explanations = [];
		triggerObj.effects = [];
		triggerObj.inCharMsgs = [];
		var explanation = "";

		//Construct a list of characteres to ignore.
		//For now, let's just say that it's the same as the eliminated characters
		//(we still want offstage characters to be involved, for the sake of
		//perfect information.)
		//Note -- we need to still be a little cautious, because there may be instances where
		//a trigger had two effects: one we want to run, and one that involves 'characters to ignore'
		//So we still need to do another check here!
		var charactersToNotBeTheSubjectOrObjectOfTriggerRules = [];
		var eliminatedCharacters = socialRecord.getEliminatedCharacters();
		charactersToNotBeTheSubjectOrObjectOfTriggerRules = util.clone(eliminatedCharacters);


		var processRuleEffects = function (effect, conditions, rule, effectNumber, lastNumber) {
			if (effectNumber === 0) {
				explanation = "TRIGGER RULE: Because ";
				for (var i = 0; i < conditions.length; i++) {
					explanation += i + ") " + predicateToEnglish(conditions[i]).text + (i+1 === conditions.length? "":" ");
				}
				explanation += ", now ";
			} else {
				explanation += " and ";
			}
			explanation += predicateToEnglish(effect).text;
			if(isEffectValid(effect, charactersToNotBeTheSubjectOrObjectOfTriggerRules)){
				socialRecord.set(effect);
				triggerObj.effects.push(effect);
			}
			if (effectNumber === lastNumber) {
				triggerObj.inCharMsgs.push(rule.msg || "I feel different...");
				triggerObj.explanations.push(explanation);
			}
		};


		runRules("triggerRules", cast, processRuleEffects, params, charactersToNotBeTheSubjectOrObjectOfTriggerRules);

		return triggerObj;
	};

	/**
	 * @function isEffectValid
	 * @description When running trigger rules or calculating volitions, there is a chance that
	 * it might involve characters that are offstage, eliminated, or that should otherwise be ignored.
	 * This function does one final check to make sure that the effect in question doesn't include
	 * any such characters. 
	 * @param  {[Object]} effect             [The effect. By this point, it should be bound with character names]
	 * @param  {[Array]} charactersToIgnore [A list of characters that have been deemed to be ignored.]
	 * @return {[Bool]}                    [Returns true if the effect is 'safe' to be set or used for volition. False otherwise.]
	 */
	var isEffectValid = function(effect, charactersToIgnore){
		for(var i = 0; i < charactersToIgnore.length; i += 1){
			if(effect.first !== undefined){
				if(effect.first === charactersToIgnore[i]){
					return false;
				} 
			}
			if(effect.second !== undefined){
				if(effect.second === charactersToIgnore[i]){
					return false;
				}
			}
		};
		return true;
	};

/**
 * @description Calculate the volition of each character in the given cast, i.e determine all of their possible actions, and
 * how badly they want to do those actions (how much weight they have).
 *
 * @method calculateVolition
 * @memberof ensemble
 * @param {Array} cast - an array of the cast of characters to calculate volition for
 * @return {Object} calculatedVolitions a dictionary containing the cast and their volitions
 */
	var calculateVolition = function (cast, params) {

		// We punt most of the work of dealing with the volitions object to the Volitions module. More documentation is there. The object we get below is a dictionary with a [first][second] structure for every combination of cast pairs, with the contents initially an empty array which we will add volition predicates to.
		var calculatedVolitions = volition.newSet(cast);

		//Not to be confused -- these characters are STILL
		//important in the cacluation process, we just don't
		//want THEIR volitions towards anyone, nor do we want
		//anyone's volitions towards them. Think "offstage"
		//in prom week.
		//In this case, it is as simple as taking everyone
		//from the offstage list and the eliminated list
		//and lumping them together here.
		var charactersToSkipVolitionCalculation = [];
		var offstageCharacters = socialRecord.getOffstageCharacters();
		var eliminatedCharacters = socialRecord.getEliminatedCharacters();
		for(var i = 0; i < offstageCharacters.length; i += 1){
			if(charactersToSkipVolitionCalculation.indexOf(offstageCharacters[i]) === -1){
				charactersToSkipVolitionCalculation.push(offstageCharacters[i]);
			}
		}
		for(i = 0; i < eliminatedCharacters.length; i += 1){
			if(charactersToSkipVolitionCalculation.indexOf(eliminatedCharacters[i]) === -1){
				charactersToSkipVolitionCalculation.push(eliminatedCharacters[i]);
			}
		}


		// The "do the work" function we'll pass down the recursion chain.
		// "effect" is a single effect predicate,
		// which should have these fields:
		//
		// "first": a character
		// "second"
		// "category": a category of abstract predicate ("relationship", "trait", etc.)
		// "type": The kind within that category ("friend", "shy", etc.)
		// "weight": The amount to adjust the weight up or down
		// "intentType": true or false, for a desire to adjust this network up
		// or down. (or to make true or false, for booleans).
		var adjustWeight = function (effect, condition, rule) {
			
			var result = util.clone(effect);
			var skipToNextPredicate = false;
			delete result.weight;

			//And now here we need to do one last check to make sure that a 'bad' effect
			//didn't hitch a ride with a 'good' effect.
			//That is to say: we don't want to adjust any volitions for or to people on our
			//'ignore' list.
			if(!isEffectValid(effect, charactersToSkipVolitionCalculation)){
				return;
			}
			/*
			if(effect.first !== undefined && charactersToSkipVolitionCalculation.indexOf(effect.first) !== -1){
				return;
			}
			if(effect.second !== undefined && charactersToSkipVolitionCalculation.indexOf(effect.second) !== -1){
				return;
			}
			*/
			// loop through all of the effects in the calculatedVolitions that pertain to a particular pair of characters
			//ASK: (speed optimization) This definitely gets the job done, but it also seems like perhaps this loop is unnecessary?
			//Because we've parsed the blueprints, we know all of the potential types of intents there are. wouldn't
			//it be faster to simply dynamically construct all of the potential keys in the array ahead of time,
			//and then directly update/adjust the value at that spot in the array.
			
			//TODO: currently, adjustWeight cannot handle a situation where there is no second person in the effect. We might want to handle this.
			var direction = socialRecord.getRegisteredDirection(effect);
			//console.log(direction);
			if(effect.second === undefined){
				if(direction === "undirected" ){
				//ok, we are dealing with a situation where a character is attempting to adjust an undirected property.
				//Do this by making the 'second' character actually the first.
				effect.second = effect.first;
				}
			}
			var lengthOfPairsEffectsArray = calculatedVolitions[effect.first][effect.second].length;
			for (var i = 0 ; i <= lengthOfPairsEffectsArray ; i += 1) {

				// we haven't found this effect in the array yet,
				// and we are at its end, so make one and insert it
				if (i === lengthOfPairsEffectsArray) {

					result.weight = 0;
					result.weight += effect.weight;
					result.englishInfluences = [];

					//Store stuff for rule 'diagnostics' -- we can see where a rule came from, and why this rule fired,
					//and how much influence it had over this particular volition
					var englishData = [];
					var englishInfluence = predicateArrayToEnglish(condition);
					englishData["englishRule"] = englishInfluence;
					englishData["ruleName"] = rule.name;
					englishData["weight"] = result.weight;
					englishData["origin"] = rule.origin;
					result.englishInfluences.push(englishData);

					calculatedVolitions[effect.first][effect.second].push(result);
					break;
				}

				var currentVolition = calculatedVolitions[effect.first][effect.second][i];
				for (var key in result) {
					if(key === "englishInfluences"){
						continue; // ignore this key.
					}
					if (result[key] !== currentVolition[key]) {
						skipToNextPredicate = true;
						break;
					}
				}
				if (skipToNextPredicate === true) {
					skipToNextPredicate = false;
					continue;
				}
				else {		// found the effect that needs to be updated
					currentVolition.weight += effect.weight;

					var englishData = [];
					var englishInfluence = predicateArrayToEnglish(condition);
					englishData["englishRule"] = englishInfluence;
					englishData["ruleName"] = rule.name;
					englishData["weight"] = effect.weight;
					englishData["origin"] = rule.origin;

					currentVolition.englishInfluences.push(englishData);

					//Ok! And now let's actually sort the english influences based on the weight
					//so most important comes first!
					currentVolition.englishInfluences.sort(function(a,b){
						return (a["weight"] < b["weight"]) ? 1 : ((b["weight"] < a["weight"]) ? -1 : 0);
					});

					break;	// there will only be one unique effect to update, so we are done; break out of the loop
				}
			}
		};
		//var params = {}; // TODO: Remove params from runRules entirely? 
		

		runRules("volitionRules", cast, adjustWeight, params, charactersToSkipVolitionCalculation);

		// volition.register will sort the volitions and create an interface into this set, which we label "main".
		// TODO: if multiple volition sets are needed at some point (perhaps to calculate just-in-time volitions,
		// or a separate set for off-stage characters), this should be refactored so a key is passed into this function.
		return volition.register("main", calculatedVolitions);
	};

	/**
	 * @description Stores a set of rules in the appropriate spot in the rules library. NOTE That this should only be used internally, not by unit tests or the public, since it skips data validation steps.
	 * Additive
	 *
	 * @method addRuleSet
	 * @memberof RuleLibrary
	 * @param {String} key The identifier for this set of rules.
	 * @param {Array} set The array containing the rule object definitions.
	 */
	var addRuleSet = function(key, set) {
		if (ruleIndexes[key] === undefined) {
			ruleIndexes[key] = {};
		}
		for(var i = 0; i < set.length; i++){
			if(isRuleAlreadyInRuleSet(key, set[i])){
				console.log("ERROR! You are adding the rule " + predicateToEnglish(set[i]).text + " (from " + set[i].origin + ") but that rule already was written!", set[i]);
			}
			else{
				addRule(key, set[i]); 

				// Set up a cross-reference so we can look up rules by ID.
				var rule = set[i];
				if (rule.id) {
					var lastPos = ruleLibrary[key].length - 1;
					ruleIndexes[key][rule.id] = lastPos;
				}
			}
		}
	};

	var ruleIndexes = {};

	/**
	 * @descriptionStores a new rule in the appropriate key in last spot in the rules library.
	 * @method addRule
	 * @memberof RuleLibrary
	 * @param {String} key The identifier for this set of rules.
	 * @param {Object} rule The object containing the rule definition to add.
	 */
	var addRule = function (key, rule) {
		if (ruleLibrary[key] === undefined) {
			ruleLibrary[key] = [];
		}
		ruleLibrary[key].push(rule);
	};

	/**
	 * @method isRuleAlreadyInRuleSet
	 * @memberof RuleLibrary
	 *
	 * This function takes in a key for a rule set (e.g. "volitionRules" or "triggerRules") and a rule,
	 * and checks to see if that rule already exists inside of the specified rule set. If it does
	 * it will return a clone of the found rule. If it does not, it will return false.
	 *
	 * ASSUMES THAT rules, when parsed in, have their predicates sorted in some way for consistency!!!!
	 * TODO: Make it so that rules get their predicates sorted when parsed in OR make this function not care about ordering.
	 *
	 * @param {String} key the identfier for this set of rules.
	 * @param {Object} rule the rule that we are checking to see if it already exists in the rule library
	 *
	 * @return if the rule already exists in the rule set, returns a copy of that rule. Otherwise returns false.
	 */
	var isRuleAlreadyInRuleSet = function(key, rule){
		//Let's loop through all of the rules at this spot in the ruleLibrary, and see if this rule already lives inside of it.
		var storedRule;
		var couldBeDuplicateRule = true;
		if(ruleLibrary[key] !== undefined){ //only want to do this if we're dealing with a defined key!
			for(var i = 0; i < ruleLibrary[key].length; i += 1){
				storedRule = ruleLibrary[key][i];
				if(areRulesEqual(storedRule, rule) === true){
					//oh oh, we in fact already have this rule in the rule set! return true
					return true;
				}
			}
		}
		//if we made it to this point, it must mean that the rule is not already in the rule set!
		return false;
	};

	/**
	 * @method arePredicatesEqual
	 * @memberof RuleLibrary
	 *
	 * @description Given two predicates, check to see if they are equal to each other. It is difficult to tell if predicates
	 * are equal to each other, because depending on the context, different predicates will have different fields
	 * specified. For example, the "weight" field will only ever be in an effect predicate. Moreover, it will only
	 * ever be in an effect predicate in a VOLITION rule; a trigger rule won't have a weight.' This function essentially
	 * goes through each one of these fields, and checks to see if they are the same for both of the predicates. If they
	 * are, then return true. If not, return false.
	 *
	 *
	 * @param {Object} pred1 One of the two predicates we are testing for equality.
	 * @param {Object} pred2 The second of the two predicates we are testing for equality.
	 * @return true if pred1 and pred2 are equal. False otherwise.
	 */
	var arePredicatesEqual = function(pred1, pred2){

		//first simple test! do these two guys have the same number of attributes?
		//If not, then heck, we know they are definitely not equal.
		if(_.size(pred1) !== _.size(pred2)){
			return false;
		}

		//ok, we now know that they have the same number of attributes.
		//I think now it is actually a pretty simple task of looping thorugh these attributes
		//and comparing them to each other!

		for(var key in pred1){
			if (util.isArray(pred1[key]) && util.isArray(pred2[key])) {
				// Technically, we should compare each array value; but for now, the only field that can be an array is turnsAgoBetween, and we'll ignore that for now. (Complex b/c tuple keys could be in diff. order and still be considered equal, 0 === "NOW", etc.)
				continue;
			}
			if (pred1[key] !== pred2[key]){
				return false;
			}
		}

		return true;
	};

	/*
	 * @method areRulesEqual
	 * @memberof RuleLibrary
	 *
	 * @description This method is given two rules to compare if they are 'equal' to each other. equal,
	 * for purposes of this method, means that all of the predicates of these two rules match.
	 * Right now, this function ASSUMES that the ORDERING of the predicates is uniform. However
	 * that is a potentially dangerous assumption, unless we implement some form of pre-processing that
	 * helps with the ordering.
	 * TODO: Do we want to enforce an ordering? Or change this function to be a little more robust?
	 *
	 * @param {object} rule1 one of the two rules we are comparing
	 * @param{object} rule2 the second of the two rules we are comparing
	 * @return true if the two rules are equal, false if otherwise.
	 */
	var areRulesEqual = function(rule1, rule2){

		//first, let's do the easy check to see if the lengths of the conditions and/or effects are different.
		//Made, I suppose, a little more complicated because some rules might not have conditions or effects specified.
		if(rule1.conditions === undefined && rule2.conditions !== undefined ||
			rule1.conditions !== undefined && rule2.conditions === undefined){
				//one of these rule has a condition set, adn the other one doesn't. not equal! return false!
				return false;
			}
		if(rule1.effects === undefined && rule2.effects !== undefined ||
			rule1.effects !== undefined && rule2.effects === undefined){
				//one of these rules has an effect and the other one doesn't. not equal return false!'
				return false;
			}

		//Ok, if we've gotten here, let's start stepping through the conditions one by one.
		if(rule1.conditions !== undefined && rule2.conditions !== undefined){
			if(rule1.conditions.length !== rule2.conditions.length){
				return false; // they had a different number of conditions! Must be different!
			}
			else{
				//the conditions are the same length, great!
				for(var i = 0; i < rule1.conditions.length; i += 1){
					var result = arePredicatesEqual(rule1.conditions[i], rule2.conditions[i]);
					if(result !== true){
						//This means that there was a difference between the two rules! Let's return false!
						return false;
					}
				}
			}
		}

		//And now, let's loop through all of the effects!
		if(rule1.effects !== undefined && rule2.effects !== undefined){
			if(rule1.effects.length !== rule2.effects.length){
				return false; // they had a different number of effects! Must be different!
			}
			else{
				//The effects are the same length, great!
				for(var j = 0; j < rule1.effects.length; j += 1){
					result = arePredicatesEqual(rule1.effects[j], rule2.effects[j]);
					if(result !== true){
						//This means that the two rules have a different effect. Let's return false!
						return false;
					}
				}
			}
		}

		//If we've gotten to this point, it must mean that the two rules are identical!
		return true;
	};

	var ruleToEnglish = function(rule){
		var returnString = "If: ";
		returnString += predicateArrayToEnglish(rule.conditions, false);
		returnString += ", Then: ";
		returnString += predicateArrayToEnglish(rule.effects, true);
		return returnString;
	};



	var predicateArrayToEnglish = function(conditions, isEffect){
		var returnString = "";
		for(var i = 0; i < conditions.length; i += 1){
			if(i >= 1){
				returnString += ", and ";
			}
			returnString += predicateToEnglish(conditions[i]).text;
		}
		return returnString;
	};

	/**
	 * Turns a predicate into an English language definition.
	 *
	 * @param  {[type]}  realPredicate
	 *
	 * @return {[type]}
	 */
	var predicateToEnglish = function(pred) {
		var result = [];
		var addPhrase = function(text, label, optMeta) {
			var ph = {};
			ph.text = text;
			ph.label = label || "";
			if (optMeta !== undefined) {
				ph.meta = optMeta;
			}
			result.push(ph);
		}

		if (pred.name || pred.first === undefined) {
			// For complicated predicates, for now just return the human-authored rule name.
			var o = {};
			o.text = pred.name;
			return o;
		}

		var isBoolean = socialRecord.getRegisteredIsBoolean(pred);
		var directionType = socialRecord.getRegisteredDirection(pred);
		var duration = socialRecord.getRegisteredDuration(pred);
		var isPersistent = (duration !== 0) ? true : false;

		var nameFirst = pred.first;
		var nameSecond = pred.second !== undefined ? pred.second : "";

		var predType = "fact";
		if (pred.operator && ["+", "-"].indexOf(pred.operator) >= 0) {
			predType = "change";
		}
		if (pred.operator && [">", "<", "="].indexOf(pred.operator) >= 0) {
			predType = "compare"
		}
		if (pred.weight !== undefined) {
			predType = "volition"
		}

		var isWord = "is";
		var hasWord = "has";
		var moreRecent, lessRecent;
		if (pred.turnsAgoBetween !== undefined) {
			moreRecent = pred.turnsAgoBetween[0];
			lessRecent = pred.turnsAgoBetween[1];
			if (moreRecent === "NOW") moreRecent = 0;
			if (lessRecent === "NOW") lessRecent = 0;
			if (moreRecent === "START") moreRecent = Infinity;
			if (lessRecent === "START") lessRecent = Infinity;
			if (moreRecent === 0 && lessRecent === 0) {
				// Leave as is; skip further custom text.
				moreRecent = undefined;
				lessRecent = undefined;
			}
			else if (moreRecent === 0) {
				isWord = "has been";
				hasWord = "has had";
			} else {
				isWord = "was";
				hasWord = "had";
			}
		}
		var notWord = (pred.value === false ? " not" : "")
		var directionWord;
		switch(pred.operator) {
			case "+": directionWord = "more"; break;
			case ">": directionWord = "more than"; break;
			case "-": directionWord = "less"; break;
			case "<": directionWord = "less than"; break;
			default: directionWord = "exactly"; break;
		}
		// var directionWord = (pred.operator !== undefined && ["+", ">"].indexOf(pred.operator) >= 0) ? "more" : "less";
		// directionWord
		if (pred.weight !== undefined) {
			directionWord = pred.weight >= 0 ? "more" : "less";
		}

		if (predType === "fact" || predType === "compare") {
			addPhrase(nameFirst, "first");
			if (!isPersistent) {
				var didWord = (pred.value === true || pred.value === undefined ? "did" : "did not do");
				addPhrase(didWord, "beVerb");
				addPhrase("something");
			}
			else if (isBoolean) {
				addPhrase(isWord+notWord, "beVerb");
			} else {
				addPhrase(hasWord);
				addPhrase(directionWord, "direction");
				addPhrase(pred.value, "value");
			}
		}
		if (predType === "change") {
			addPhrase(nameFirst, "first");
			addPhrase(hasWord);
			addPhrase(pred.value, "value");
			addPhrase(directionWord, "direction");
		}
		if (predType === "volition") {
			var intentWord = pred.intentType === true ? "become" : "stop being";
			if (!isBoolean) {
				intentWord = pred.intentType === true ? "increase" : "decrease";
			}
			addPhrase(nameFirst, "first");
			addPhrase(hasWord, "beVerb");
			addPhrase(directionWord, "..");
			addPhrase("volition");
			var sign = pred.weight >= 0 ? "+" : "";
			addPhrase("(");
			addPhrase(sign+pred.weight, "weight");
			addPhrase(")");
			addPhrase("to");
			addPhrase(intentWord, "intentType");
		}

		addPhrase(pred.type, "type", pred.category);

		if (directionType !== "undirected") {
			var helper = "";
			if (!isPersistent) {
				helper = "to";
			} else if (!isBoolean) {
				helper = "for";
			}
			addPhrase(helper);
			addPhrase(nameSecond, "second");
		}

		// Explanation of past tense parameters.
		if (moreRecent !== undefined) {
			addPhrase("", "timeOrderStart");
			var printedMoreRecent = pred.turnsAgoBetween[0];
			if (printedMoreRecent === "NOW") {
				printedMoreRecent = 0;
			}
			var printedLessRecent = pred.turnsAgoBetween[1];
			if (printedLessRecent === "NOW") {
				printedLessRecent = 0;
			}
			if (lessRecent === Infinity) {
				if (moreRecent === 0) {
					addPhrase("at any point");
				} else if (moreRecent === Infinity) {
					addPhrase("at the very beginning");
				} else {
					addPhrase("sometime up until");
					addPhrase(printedMoreRecent);
					addPhrase("turns ago");
				}
				addPhrase("[");
				addPhrase(printedMoreRecent, "moreRecent");
				addPhrase(",");
				addPhrase(printedLessRecent, "lessRecent");
				addPhrase("]");
			} else {
				addPhrase("sometime between");
				addPhrase(printedMoreRecent, "moreRecent");
				addPhrase("and");
				addPhrase(printedLessRecent, "lessRecent");
				addPhrase("turns ago");
			}
			addPhrase("", "timeOrderEnd");
		}

		// Assemble the result object. Generate the single string of text by turning our array of objects into an array of texts, then filtering any empty texts from the array, then putting a space between each element to make a string.
		var resultObj = {};
		resultObj.diagram = result;
		resultObj.text = result.map(function(r){return r.text;})
			.filter(function(n){ return n !== ""; })
			.join(" ");

		return resultObj;

	};

	/**
	 * @method getTriggerRules
	 * @memberof RuleLibrary
	 *
	 * @description returns an array containing all of the rules currently residing in the ruleLibrary triggerRules array.
	 * TODO: Write Unit Tests for this
	 *
	 * @return {array} an array of rules representing the ruleLibrary's current collection of triggerRules
	 */
	var getTriggerRules = function(){
		if (ruleLibrary.triggerRules) {
			return util.clone(ruleLibrary.triggerRules);
		} else {
			return [];
		}
	};

	/**
	 * @method getVolitionRules
	 * @memberof RuleLibrary
	 *
	 * @description Returns an array containing all of the rules currently residing in the ruleLibrary volitionRules array.
	 * TODO: Write Unit Tests for this
	 *
	 * @return {array} an array of rules representing the ruleLibrary's current collection of volitionRules
	 */
	var getVolitionRules= function(){
		if (ruleLibrary.volitionRules) {
			return util.clone(ruleLibrary.volitionRules);
		} else {
			return [];
		}
	};

	// Internal function used to both get and set rules by id: in both cases, first validates that the requested rule exists, before carrying out the relevant operation.
	var _alterRule = function(label, rule) {
		var labelParts = label.split("_");
		var ruleSet = labelParts[0];
		var id = labelParts[1];

		var rl = ruleLibrary[ruleSet];
		if (rl === undefined) {
			console.log("ruleLibrary[" + ruleSet + "] was undefined.");
			return false;
		}
		var pos = ruleIndexes[ruleSet][label];
		if (pos === undefined) {
			console.log("ruleIndexes", ruleIndexes);
			console.log("ruleIndexes[" + ruleSet + "][" + id + "] was undefined.");
			return false;
		}

		if (rule === undefined) {
			// Get
			return util.clone(ruleLibrary[ruleSet][pos]);
		} else if (typeof rule === "boolean") {
			// Delete
			// ruleIndexes is a dictionary with keys for each rule id, and values of its position in the corresponding rulesLibrary array. Splicing a rule from the middle of the array would cause all the ruleIndex position numbers to be wrong. Instead, we move the last rule in the library into the position of the one we're deleting and shorten its length by one, updating the index accordingly: this lets all other positions remain unchanged.

			var lib = ruleLibrary[ruleSet];
			var ind = ruleIndexes[ruleSet];
			var posOfDyingRule = ind[label];
			var posOfFinalRule = lib.length - 1;
			var finalRuleId = lib[posOfFinalRule].id;

			// Replace the rule we're deleting with the final rule in the library.
			lib[posOfDyingRule] = lib[posOfFinalRule];
			lib.length = lib.length - 1;

			// Remove the old rule's key in the index, and update the index  for the moved rule to the position of the old.
			delete ind[label];
			ind[finalRuleId] = posOfDyingRule;

			return true;			
		} else {
			// Set
			ruleLibrary[ruleSet][pos] = util.clone(rule);
			return true;
		}
	}

	/**
	 * @method getRuleById
	 * @memberof RuleLibrary
	 * @private
	 * 
	 * @description When given an ID in the format "ruleSetName_number", returns the rule with the corresponding ID. Rules are automatically be given a unique ID in this format when added via normal channels. Return false if no such rule can be found.
	 *
	 * 	@param {String} label  The ID, such as "triggerRules_14"
	 * 	 
	 * @return {Object}	a copy of the requested rule, or false if no such rule could be found.
	 */
	var getRuleById = function(label) {
		return _alterRule(label);
	}

	/**
	 * @method setRuleById
	 * @memberof RuleLibrary
	 * @private
	 * 
	 * @description When given an ID in the format "ruleSetName_number", and a rule object, updates the rule with this ID in ensemble's internal store of loaded rules. NOTE: This is not a public-facing function, since it does no validation on the rule to be added. Instead use ensemble.setRuleById.
	 *
	 * 	@param {String} label  The ID, such as "triggerRules_14"
	 * 	@param {Object} rule  An object representing a valid rule for the given rule set.
	 *  
	 * @return {Boolean}	true if the rule was successfully updated, false otherwise.
	 */
	var setRuleById = function(label, rule) {
		return _alterRule(label, rule);
	}

	/**
	 * @method deleteRuleById
	 * @memberof RuleLibrary
	 * @private
	 * 
	 * @description When given an ID in the format "ruleSetName_number", deletes the rule with the corresponding ID. Rules are automatically be given a unique ID in this format when added via normal channels. Return false if no such rule can be found.
	 *
	 * 	@param {String} label  The ID, such as "triggerRules_14"
	 * 	 
	 * @return {Object}	true if the operation is successful, false otherwise.
	 */
	var deleteRuleById = function(label) {
		return _alterRule(label, true);
	}

	var clearRuleLibrary = function() {
		ruleLibrary = {};
		ruleIndexes = {};
		triggerRules = [];
		volitionRules = [];
		util.resetIterator("rules");
	}

	var ruleLibraryInterface = {

		predicateToEnglish : predicateToEnglish,
		runTriggerRules : runTriggerRules,
		calculateVolition : calculateVolition,
		addRuleSet: addRuleSet,
		ruleToEnglish: ruleToEnglish,

		getTriggerRules: getTriggerRules,
		getVolitionRules: getVolitionRules,
		getRuleById: getRuleById,
		setRuleById: setRuleById,
		deleteRuleById: deleteRuleById,

		clearRuleLibrary: clearRuleLibrary
	};

	/* test-code */
	ruleLibraryInterface.getUniqueBindings = getUniqueBindings;
	ruleLibraryInterface.matchUniqueBindings = matchUniqueBindings;
	ruleLibraryInterface.doBinding = doBinding;
	ruleLibraryInterface.evaluateConditions = evaluateConditions;
	ruleLibraryInterface.arePredicatesEqual = arePredicatesEqual;
	ruleLibraryInterface.areRulesEqual = areRulesEqual;
	ruleLibraryInterface.isRuleAlreadyInRuleSet = isRuleAlreadyInRuleSet;
	ruleLibraryInterface.sortConditionsByOrder = sortConditionsByOrder;
	/* end-test-code */

	return ruleLibraryInterface;

});
/**
 * This is the class Validate, for verification of predicates and other data.
 *
 */

define('validate',["util", "underscore", "jquery", "socialRecord"], 
function(util, _, $, socialRecord) {

	var allowedDirTypes = ["directed", "undirected", "reciprocal"];
	var allowedOpsConditions = [">", "<", "="];
	var allowedOpsEffects = ["+", "-", "="];
	var allowedTurnConstants = ["now", "start"];

	var socialStructure;
	/**
	 * @method registerSocialStructure
	 * @memberOf Validate
	 * @description Store a local copy of the registered social structure, to check predicates for validity. Called by ensemble.loadSocialStructure. Shouldn't be needed by end users.
	 *
	 * @param  {Object} ss     A reference to the social schema registered in ensemble.
	 *
	 */
	var registerSocialStructure = function(ss) {
		socialStructure = ss;
	};

	/**
	 * @method triggerCondition
	 * @memberOf Validate
	 * @description Checks that a trigger condition predicate is structured properly, throwing an error if it is not, and returning the predicate reference back if is.
	 *
	 * @param  {Object} pred     A trigger condition predicate object.
	 * @param  {String} preamble Optional string explaining the context of this predicate, i.e. the specific unit test it's part of, so the error thrown for an invalid predicate can contain this information.
	 *
	 * @return {Object}          The same predicate reference passed in, if valid.
	 */
	var triggerCondition = function(pred, preamble) {
		checkPredicate(pred, "condition", "trigger", preamble);
		return pred;
	};

	/**
	 * @method triggerEffect
	 * @memberOf Validate
	 * @description Checks that a trigger effect predicate is structured properly, throwing an error if it is not, and returning the predicate reference back if is.
	 *
	 * @param  {Object} pred     A trigger effect predicate object.
	 * @param  {String} preamble Optional string explaining the context of this predicate, i.e. the specific unit test it's part of, so the error thrown for an invalid predicate can contain this information.
	 *
	 * @return {Object}          The same predicate reference passed in, if valid.
	 */
	var triggerEffect = function(pred, preamble) {
		checkPredicate(pred, "effect", "trigger", preamble);
		return pred;
	};

	/**
	 * @method volitionCondition
	 * @memberOf Validate
	 * @description Checks that a volition condition predicate is structured properly, throwing an error if it is not, and returning the predicate reference back if is.
	 *
	 * @param  {Object} pred     A volition condition predicate object.
	 * @param  {String} preamble Optional string explaining the context of this predicate, i.e. the specific unit test it's part of, so the error thrown for an invalid predicate can contain this information.
	 *
	 * @return {Object}          The same predicate reference passed in, if valid.
	 */	
	var volitionCondition = function(pred, preamble) {
		checkPredicate(pred, "condition", "volition", preamble);
		return pred;
	};

	/**
	 * @method volitionEffect
	 * @memberOf Validate
	 * @description Checks that a volition effect predicate is structured properly, throwing an error if it is not, and returning the predicate reference back if is.
	 *
	 * @param  {Object} pred     A volition effect predicate object.
	 * @param  {String} preamble Optional string explaining the context of this predicate, i.e. the specific unit test it's part of, so the error thrown for an invalid predicate can contain this information.
	 *
	 * @return {Object}          The same predicate reference passed in, if valid.
	 */
	var volitionEffect = function(pred, preamble) {
		checkPredicate(pred, "effect", "volition", preamble);
		return pred;
	};

	/**
	 * @method blueprint
	 * @memberOf Validate
	 * @description Checks that a blueprint predicate is structured properly, throwing an error if it is not, and returning the predicate reference back if is.
	 *
	 * @param  {Object} pred     A blueprint predicate object.
	 * @param  {String} preamble Optional string explaining the context of this predicate, i.e. the specific unit test it's part of, so the error thrown for an invalid predicate can contain this information.
	 *
	 * @return {Object}          The same predicate reference passed in, if valid.
	 */

	var blueprint = function(pred, preamble) {
		checkPredicate(pred, "blueprint", "", preamble);
		return pred;
	};

	/**
	 * @method rule
	 * @memberOf Validate
	 * @description Checks to ensure a whole trigger or volition rule is valid. Returns the error message explaining what's wrong if it's not, otherwise returns the whole rule.
	 *
	 * @param  {Object} rule     An object containing a trigger or volition rule. Should have top level keys "conditions" and "effects". Auto-determines what kind of rule it is by checking to see whether the first effect includes a weight.
	 *
	 * @return {Object}          Either an object if valid (the original rule) or a string if invalid (the error message).
	 */
	var rule = function(rule) {
		var isVolition = rule.effects[0].weight !== undefined;
		var effectValidator = isVolition ? volitionEffect : triggerEffect;
		var conditionValidator = isVolition ? volitionCondition : triggerCondition;
		try {
			for (var i = 0; i < rule.effects.length; i++) {
				var effect = rule.effects[i];
				effectValidator(effect, "" + (isVolition ? "Volition" : "Trigger") + " Rule Effect #" + i);
			}
			for (var i = 0; i < rule.conditions.length; i++) {
				var condition = rule.conditions[i];
				conditionValidator(condition, "" + (isVolition ? "Volition" : "Trigger") + " Rule Condition #" + i);
			}
		} catch(e) {
			return e.message;
		}
		return rule;
	}

	/**
	 * @method action
	 * @memberOf Validate
	 * @description Checks that an action is structured properly, throwing an error if it is not, and returning the predicate reference back if it is.
	 * 
	 * @param  {[Object]} pred     [An action predicate object.]
	 * @param  {[String]} preamble [Optional string explaining the context of this predicate, i.e. the specific unit test it's part of, so the error thrown for an invaid predicate can contain this information.]
	 * 
	 * @return {[Object]}          [The same predicate reference passed in, if valid.]
	 */
	var action = function(pred, preamble) {
		console.log("TODO: Make Validate for reading in actions!");
		//checkPredicate(pred, "action", "", preamble);
		return pred;
	}

	/**
	 * @method checkPredicate
	 * @memberOf Validate
	 * @description Internal function to deal with the wrapper functions triggerCondition, triggerEffect, volitionCondition, etc. Itself a wrapper for isPredBad, which handles the bulk of the work. Here we simply display diagnostic information to the console and throw an error if a bad predicate is found.
	 * @private
	 *
	 * @param  {Object} pred     The predicate to check.
	 * @param  {String} type     Predicate type, either "condition" or "effect"
	 * @param  {String} category Subtype, if necessary (i.e. "trigger", "volition")
	 * @param  {String} preamble Text explaining the origin of the predicate being tested.
	 *
	 * @return {Boolean}          Returns false (the result of isPredBad) or throws an error.
	 */
	var checkPredicate = function(pred, type, category, preamble) {
		var result = isPredBad(pred, type, category);
		if (result !== false) {
			console.log("Bad predicate: ", pred);
			throw new Error(preamble + " and found a malformed predicate: " + result + ".");
		}
		return result;
	};

	var isPredBad = function(predicate, type, category) {

		// Make a local copy of the predicate. We will strip fields out of this copy until we've validated all of them, or we are left with extra unrecognized fields.
		var pred = util.clone(predicate);

		// Create a variable to store information about what went wrong with the predicate.
		var msg = "";

		// Skip socialRecordLabel predicates for now.
		if (predicate.category === "socialRecordLabel" || predicate.category === "socialRecordLabelUndirected") return false;

		// Verify that the contents of a particular key exist and are of the expected type. If isRequired is false, it's okay for the given key to be missing. Add problem details to the isPredBad scoped "msg" variable.
		var isTypeWrong = function(pred, key, type, isRequired) {
			if (pred[key] === undefined) {
				if (!isRequired) {
					return false;
				}
				msg += "'" + key + "' was undefined";
				return true;
			}
			var jsType = typeof pred[key];
			if (type === "array" && util.isArray(pred[key])) {
				// Allow this to pass.
				type = "object";
			}
			if (jsType !== type) {
				msg += "'" + key + "' was '" + pred[key] + "' which seems to be of type '" + jsType + "' instead of '" + type + "'";
				return true;
			}
			return false;
		};

		if (isTypeWrong(pred, "category", "string", true)) {
			return msg;
		}

		// Handle blueprints.
		if (type === "blueprint") {
			if (!util.isArray(pred.types) || pred.types.length === 0 || typeof pred.types[0] !== "string") {
				return "key 'types' should be a non-empty array of strings; was '" + pred.types + "'";
			}
			delete pred.types;

			if (isTypeWrong(pred, "isBoolean", "boolean", true)) return msg;
			if (isTypeWrong(pred, "directionType", "string", true)) return msg;
			if (allowedDirTypes.indexOf(pred.directionType) < 0) {
				return "directionType was '" + pred.directionType + "' but it should have been one of " + util.listWriter(allowedDirTypes);
			}
			delete pred.directionType;

			if (isTypeWrong(pred, "duration", "number", false)) return msg;
			if (pred.duration !== undefined && (pred.duration < 1 || !util.isInt(pred.duration))) {
				return "duration was '" + pred.duration + "' which does not seem to be an integer > 0.";
			}
			delete pred.duration;

			if (pred.defaultValue !== undefined && (pred.isBoolean === true && typeof pred.defaultValue !== "boolean") || (pred.isBoolean === false && typeof pred.defaultValue !== "number")) {
				return "mismatch between blueprint isBoolean '" + pred.isBoolean + "' and type of defaultValue '" + pred.defaultValue + "' (" + typeof pred.defaultValue + ")";
			}
			delete pred.defaultValue;
			
			if (pred.isBoolean === true && ((pred.minValue !== undefined) || (pred.maxValue !== undefined))) {
				return "blueprint specifies this is a boolean type but provides a min ('" + pred.minValue + "') or max ('" + pred.maxValue + "') value: this is not allowed.";
			}
			if (pred.minValue !== undefined && typeof pred.minValue !== "number") {
				return "mismatch between blueprint and type of minValue '" + pred.minValue + "' (" + typeof pred.minValue + "); expected a number.";
			}
			delete pred.minValue;
			
			if (pred.maxValue !== undefined && typeof pred.maxValue !== "number") {
				return "mismatch between blueprint and type of maxValue '" + pred.maxValue + "' (" + typeof pred.maxValue + "); expected a number.";
			}
			delete pred.maxValue;

			if (isTypeWrong(pred, "actionable", "boolean", false)) return msg;
			delete pred.actionable;

			delete pred.isBoolean;
		} else {// if type is not blueprint

			// Lookup details about this predicate.
			if (socialStructure[pred.category] === undefined) {
				return "category '" + pred.category + "' is not a registered social scheme category.";
			}
			if (socialStructure[pred.category][pred.type] === undefined) {
				console.log("pred.category", pred.category, "pred.type", pred.type);
				console.log("socialStructure", socialStructure);
				return "found category " + pred.category + " type " + pred.type + " but that type does not appear to be registered for that category.";
			}
			var descriptors = socialStructure[pred.category][pred.type];
			var dir = descriptors.directionType;
			var isBool = descriptors.isBoolean;

			if (isTypeWrong(pred, "type", "string", true)) return msg;

			delete pred.type;

			if (isTypeWrong(pred, "first", "string", true)) return msg;
			// Could strengthen here to register cast and check we are specifying a character that's been defined.

			var okayOps = type === "condition" ? allowedOpsConditions : allowedOpsEffects;

			if (pred.operator !== undefined && okayOps.indexOf(pred.operator) < 0) {
				return "unrecognized operator: '" + pred.operator + "'. In " + type + " predicates, the only valid operators are " + util.listWriter(okayOps);
			}
			delete pred.operator;

			if (pred.second !== undefined && dir === "undirected") {
				return "key second: '" + pred.second + "' found but category '" + predicate.category + "' is undirected";
			}
			// Temporarily relaxing the below constraint, because it makes it hard to swap roles in the Rule Editor. (Currently, the editor validates any change by verifying the changed rule is valid with this code; however, to swap two roles, you must first change one role to the other, which makes the rule invalid. In some ways this is a sort of higher-level validity check which we don't conceptually account for now: a rule with the same person in both roles is technically valid, it just can't ever be true.)
			// if (pred.second !== undefined && pred.second === pred.first) {
			// 	return "key second: '" + pred.second + "' found but this is the same as key first; this is not allowed.";
			// }
			if (dir !== "undirected" && pred.second === undefined) {
				return "no 'second' found but type '" + pred.type + "' is " + dir + ".";
			}
			delete pred.first;
			delete pred.second;

			if (type === "condition" || (type === "effect" && category === "trigger")) {
				if (pred.value === undefined && !isBool) {
					return "'value' was undefined: for numeric types, must be defined";
				}
				if (!isBool && typeof pred.value !== "number") {
					return "'value' was '" + pred.value + "' which seems to be of type '" + typeof pred.value + "' but category '" + predicate.category + "' specifies isBoolean false";
				}
				if (!isBool && isNaN(pred.value)) {
					return "'value' was '" + pred.value + "' which is not a number: category '" + predicate.category + "' specifies numeric value";
				}
				if (isBool && typeof pred.value !== "boolean" && pred.value !== undefined) {
					return "'value' was '" + pred.value + "' which seems to be of type '" + typeof pred.value + "' but category '" + predicate.category + "' specifies isBoolean true";
				}
				if (!isBool) {
					if (typeof descriptors.max === "number" && pred.value > descriptors.max) {
						return "'value' was '" + pred.value + "' but that exceeds max of '" + descriptors.max + "' for category '" + predicate.category + "'";
					}
					if (typeof descriptors.min === "number" && pred.value < descriptors.min) {
						return "'value' was '" + pred.value + "' but that's below min of '" + descriptors.min + "' for category '" + predicate.category + "'";
					}
				}
				delete pred.value;
			}

			if (type === "condition") {

				if (pred.turnsAgoBetween !== undefined) {
					if (isTypeWrong(pred, "turnsAgoBetween", "array", false)) return msg;

					var tab = pred.turnsAgoBetween
					if (tab.length !== 2) {
						return "key turnsAgoBetween must be an array with exactly two entries; found " + tab.length + " (" + tab.join(", ") + ")";
					}

					var testTupleEntries = function(pos) {
						var validmsg = "entry " + pos + " of turnsAgoBetween tuple must be a positive integer representing a number of turns into the past to check, or a valid quoted keyword (" + allowedTurnConstants.join(", ") + ")";
						if (typeof tab[pos] === "string") {
							if (allowedTurnConstants.indexOf(tab[pos].toLowerCase()) < 0) {
								return validmsg + "; instead saw string '" + tab[pos] + "'";
							}
						} else if (typeof tab[pos] === "number") {
							if (!util.isInt(tab[pos])) {
								return validmsg + "; instead saw number '" + tab[pos] + "'"
							}
							if (tab[pos] < 0) {
								return validmsg + "; instead saw negative integer '" + tab[pos] + "'";
							}
						} else {
							return validmsg + "; instead saw " + typeof tab[pos] + " '" + tab[pos] + "'.";
						}
						return false;
					}
					var res;
					res = testTupleEntries(0);
					if (res !== false) return res;
					res = testTupleEntries(1);
					if (res !== false) return res;

					delete pred.turnsAgoBetween;
				}

				if (isTypeWrong(pred, "order", "number", false)) return msg;
				if (pred.order && (!util.isInt(pred.order) || pred.order < 0)) {
					return "key order: '" + pred.order + "' seems not to be a positive integer";
				}
				delete pred.order;

			} else if (type === "effect") {

				if (category === "volition") {
					if (isTypeWrong(pred, "weight", "number", true)) return msg;
					delete pred.weight;

					if (isTypeWrong(pred, "intentType", "boolean", true)) return msg;
					delete pred.intentType;

					delete pred.value
				}
			}
		}

		delete pred.category;

		// Look for extra keys.
		delete pred.comment;
		var remainingKeys = _.keys(pred);
		for (var i = 0; i < remainingKeys.length; i++) {
			if (pred[remainingKeys[i]] !== undefined) {
				return "found unexpected key for " + type + " predicate: '" + remainingKeys[i] + "'";
			}
		}
		return false;
	};

	var validateInterface = {

		rule: rule,
		triggerCondition: triggerCondition,
		triggerEffect: triggerEffect,
		volitionCondition: volitionCondition,
		volitionEffect: volitionEffect,
		blueprint: blueprint,
		action: action,

		registerSocialStructure: registerSocialStructure

	};

	/* test-code */
	/* end-test-code */

	return validateInterface

});
/**
 * This is the class actionLibrary
 *
 *
 * @class  ActionLibrary
 * @private
 */

define('actionLibrary',["util", "underscore", "validate", "volition", "ruleLibrary"],
function(util, _, validate, volition, ruleLibrary, testSocial, testActions) {
	var actions = []; //An array containing all of the actions available in this social world.

	//Experimenting with having a 'grammar' to define the actions of the world.
	var startSymbols = [];
	var nonTerminals = [];
	var terminalActions = [];


	/**
	 * @method getAllActions 
	 * @private
	 * @description returns an array containing every action (terminal or otherwise) available in the social world.
	 * @return {Array} [An array containing every single action defined in the social world.]
	 */
	var getAllActions = function(){
		return actions;
	};

	var dumpActions = function(){
		console.log("***DUMPING ACTIONS***");
		console.log("There are " + actions.length + " actions.");
		for(var i = 0; i < actions.length; i += 1){
			console.log(i + ".) " ,  actions[i]);
		}
		console.log("***END DUMPING ACTIONS***");
	}

	/**
	 * @method getStartSymbols 
	 * @private
	 * @description Returns an array containing every 'start action.' Conceived to return all actions specifically tied to an intent.
	 * @return {Array} [An array containing every 'root' acton (every action tied to an intent) in the social world]
	 */
	var getStartSymbols = function(){
		return startSymbols;
	};

	/**
	 * @method getNonTerminals 
	 * @private
	 * @description Returns an array containing every 'non terminal' This will include both root and non-root actions, but exclude terminal actions.
	 * @return {[type]} [An array containing every 'non terminal' action.]
	 */
	var getNonTerminals = function(){
		return nonTerminals;
	};

	/**
	 * @method getTerminalActions 
	 * @description Returns an array containing every terminal action.
	 * @return {[type]} [An array containing every terminal action]
	 */
	var getTerminalActions = function(){
		return terminalActions;
	};

	/**
	 * @methodclearActionLibrary 
	 * @description Completely empties out the the action library by zero-ing out the arrays of actions, startSymbols, nonTerminals, and terminalActions. Used mainly for testing purposes.
	 */
	var clearActionLibrary = function(){
		actions = [];
		startSymbols = [];
		nonTerminals = [];
		terminalActions = [];
	};

	/**
	 * @method addActions
	 * @public
	 * @memberOf ensemble 
	 * @description Takes in either a JSON file or a JSON string representing the definition of an action or actions and stores it in the action library. This effect is cumulative; calling this function on multiple files will lead to the actions from both files being stored in the action library.]
	 * @param  {JSON} data - Either a JSON string or a JSON file defining an action or actions.
	 * @return {array}      [An array of every action currently stored in the action library.]
	 */
	var parseActions = function(data){
		var parsedActions;
		var fileName;
		var actionsToCategorize = [];

		try {
			if (typeof data === "string") {
				parsedActions = (JSON.parse(data)).actions;
				fileName = (JSON.parse(data)).fileName;
			} else if (typeof data === "object") {
				parsedActions = data.actions;
				fileName = data.fileName;
			} else {
				console.log("unexpected value:", data);
				throw new Error("Error parseActions: unexpected data value: ", typeof data);
			}
		} catch (e) {
			throw new Error("JSON Error parseActions " + e);
		}
		if (parsedActions === undefined) {
			throw new Error("Error: social structure data file must be JSON that defines a top-level key 'socialStructure'");
		}
		for (var i = 0; i < parsedActions.length; i++) {
			var action = parsedActions[i];
			action.fileName = fileName;

			// Error Checking
			validate.action(action, "Examining action  #" + i);

			if(actionAlreadyExists(action)){
				console.error("Error! The action " + action.name + " is already defined!" );
				continue;
			}
			actions.push(util.clone(action));
			actionsToCategorize.push(action);
		}
		categorizeActionGrammar(actionsToCategorize);
		return actions;
	};

	/**
	 * @method actionAlreadyExists 
	 * @private
	 * @description a simple helper function to see if a newly parsed in action hasn't already been defined -- this is done by looking at the name of the action. This means that even if two actions are quite different, if they share the same name an error will be printed to the console.]
	 * @param  {Object} potentialNewAction [The action that has just been read in, and is to be checked against the actions already in the action library.]
	 * @return {Boolean}                    [Returns true if the action already exists. False otherwise.]
	 */
	var actionAlreadyExists = function(potentialNewAction){
		for(var i = 0; i < actions.length; i += 1){
			if(actions[i].name === potentialNewAction.name){
				//uh oh, is already exists!
				return true;
			}
		}
	};

	//Checks to see if a passed in action matches an action that has already
	//been categorized as a start symbol. Returns true if it does (i.e. it is a duplicate),
	//false otherwise.
	var startSymbolAlreadyExists = function(potentialNewAction){
		
		//One thing that we'll do is double check that there aren't two identical start symbols.
		if(potentialNewAction.intent !== undefined){
			var newStartSymbolIntent = potentialNewAction.intent;
			//alright, we're dealing with a 'start symbol' apparantly! Let's make sure it isn't a duplicate of 
			//any other start symbols that already exist!
			for(var i = 0; i < startSymbols.length; i += 1){
				var existingStartSymbol = startSymbols[i].intent;
				if(existingStartSymbol.category === newStartSymbolIntent.category &&
					existingStartSymbol.type === newStartSymbolIntent.type &&
					existingStartSymbol.intentType === newStartSymbolIntent.intentType &&
					existingStartSymbol.first === newStartSymbolIntent.first &&
					existingStartSymbol.second === newStartSymbolIntent.second){
						return true;
						//oops, they are the same! We have a problem!
						//console.log("ERROR! WE DON'T WANT TO ADD THIS TO THE LIBRARY BECAUSE IT WAS DEFINED ALREADY!");
				}
			}
		}
		return false; // they are not the same! we are okay!
	}

	/**
	 * @method categorizeActionGrammar
	 * @description This method takes in an unsorted list of actions (in the style returned from the parseActions method) and, based on the properties of these actions, determines if they are 'start', 'terminal' or 'non-terminal' actions and stores them in teh appropriate array of actionLibrary
	 * @param  {[array]} actionPool [Contains an unsorted list of all of the action termainals and non terminals]
	 */
	var categorizeActionGrammar = function(actionPool){
		var currentAction;
		for(var i = 0; i < actionPool.length; i += 1){
			currentAction = util.clone(actionPool[i]);
			if(actionPool[i].intent !== undefined){
				if(startSymbolAlreadyExists(currentAction)){
					//we only want there to be one action per intent, i.e. each start symbol
					//should be unuqie. If that's not the case, then, er, don't push it I guess!
					console.log("ERROR! WE DON'T WANT TO ADD THIS TO THE LIBRARY BECAUSE IT WAS DEFINED ALREADY!");

				}
				else{
					startSymbols.push(currentAction);
				}

			}
			if(actionPool[i].leadsTo !== undefined){
				nonTerminals.push(currentAction); // so start terminals ALSO end up here. Maybe that's good? Can change into an else-if if not!
			}
			if(actionPool[i].effects !== undefined){
				terminalActions.push(currentAction);
			}
		}

	};

	/**
	 * @method getSortedActionsFromVolition
	 * @description Finds the actions that the initiator wants to take towards the responder, and sorts them by volition score.
	 * @param  {String}  initiator          [The name of the initiator of the action]
	 * @param  {String}  responder          [The name of the responder of the action]
	 * @param  {Object}  registeredVolition [A registered volition object]
	 * @param  {Boolean} isAccepted         [Whether or not the responder accepts the intent of the volition.]
	 * @param  {Number}  weight             [How much the initiator wants to pursue this volition.]
	 * @param  {[Number]}  numActionsPerGroup [Used to determine how many 'actions per group' to include. Will ultimately default to one if unspecified.]
	 * @param  {Array}  cast               [The characters to use in consideration for the binding of various roles the actions might need.]
	 * @return {[Array]}                     [An array of actions the initiator wants to take towards the responder, sorted by weight.]
	 */
	var getSortedActionsFromVolition = function(initiator, responder, registeredVolition, isAccepted, weight, numActionsPerGroup, cast){
		//console.log("Inside of getSortedactionsFromVolition");

		var actions = getActionHierarchyFromVolition(initiator, responder, registeredVolition, isAccepted, weight, numActionsPerGroup, cast);
		var sortedActions = sortActionsByVolitionScore(actions);
		return sortedActions;

	};


	/**
	 * @method sortActionsByVolitionScore 
	 * @private
	 * @description Sorts an array of actions based on their weights in descending order.. Specifically, each action has a list of actions that it 'leads to' -- and it is THIS list of actions that is being sorted. Uses recursion to get to the end of the chain. Also sorts the GoodBindings of each weight as well.
	 * @param  {Array} actions [An array of actions to be sorted]
	 * @return {Array}         [The sorted actions]
	 */
	var sortActionsByVolitionScore = function(actions){
		var descSortedActions = _.sortBy(actions, "weight");
		actions = descSortedActions.reverse(); // now all of our actions are sorted, sweet!
		//Sadly, the above messes up ties, a little bit. The initial sort by screws up the order of ties, and the reverse then 'respects' the messed up order from underscore.

		//And, uh, I guess now we want to do the same as we drill downwards?
		for(var i = 0; i < actions.length; i += 1){
			var nextActions = actions[i].actions;
			if(nextActions !== undefined){
				actions[i].actions = sortActionsByVolitionScore(nextActions);
			}

			//let's try sorting the 'good bindings' by their weight$$ property.
			if(actions[i].goodBindings !== undefined){
				var descSortedBindings = _.sortBy(actions[i].goodBindings, "weight$$");
				actions[i].goodBindings = descSortedBindings.reverse();
			}
		}

		return actions;
	};

	/**
	 * @method getActionHierarchyFromVolition
	 * @description This method takes the names of the initiator and responder of an action and a registered volition 
	 * between them, and will go through the entire grammar for the intnet specified in the volition and return all 
	 * terminal actions that are appropriate (are of the correct accept/reject polarity, have all conditions met, etc.)
	 * The number of actions returned per action group is determined by numActionsPerGroup. 
	 * Cast indicates the characters to use for role binding.
	 * @param  {[String]} initiator          [The name of the initiator of the action.]
	 * @param  {[String]} responder          [The name of the responder of the action.]
	 * @param  {[Object]} registeredVolition [The registered volition between the initiator and responder]
	 * @param  {[Number]} numActionsPerGroup [The number of terminal actions to return per 'action group.' They will ultimately be sorted by salience; i.e. if this number is 1, then only the most salient terminal action per action group will be returned. If 2, the top two salient terminal actions, etc.]
	 * @param  {[Array]} cast               [The characters to be used in the role binding process]
	 * @return {[Array]}                    [An Array of potential actions that can be carried out from the initiator to the responder]
	 */
	var getActionHierarchyFromVolition = function(initiator, responder, volition, isAccepted, weight, numActionsPerGroup, cast){
		var actionIntent;
		var goodTerminals = [];
		var returnTerminalList = [];
		var potentialTerminal;
		var uniqueBindings = {};
		uniqueBindings["initiator"] = initiator;
		uniqueBindings["responder"] = responder;

		//first, we need to find the 'start' action based on the volition
		for(var i = 0; i < startSymbols.length; i += 1){
			actionIntent = startSymbols[i].intent;
			if(actionIntent.category === volition.category &&
				actionIntent.type === volition.type &&
				actionIntent.intentType === volition.intentType){
					//it appears that this is an action pertaining to this volition!
					var rootAction = util.clone(startSymbols[i]);
					rootAction.goodBindings = [];
					rootAction.goodBindings.push(uniqueBindings);
					rootAction.weight = weight; // This is the 'base' score that came from our microtheories equivalent.
					goodTerminals = getActionHierarchyFromNonTerminal(rootAction, isAccepted, numActionsPerGroup, uniqueBindings, cast);
					if(goodTerminals === undefined){ // this means we didn't find any good actions!
						console.log("found no valid actions for init: " + initiator + ", respond: " + responder + ", for volition " , volition);
						return;
					}

					returnTerminalList = goodTerminals; //Ok, so, it said temp temp temp, but actually I think this is pretty much exactly what we want!
					break;
			}
		}

		return returnTerminalList;
	};


	//terminalFoundInRecursiveSearch is meant to be called only when we enter the
	//"terminal found" branch of getActionHierarchyFromNonTerminal. It grabs the
	//relavant terminal information, including checking for new role bindings, 
	//and returns it for use by getActionHierarchyFromNonTerminal.
	var terminalFoundInRecursiveSearch = function(terminalAction, nonTerminal, uniqueBindings, cast, isAccepted, terminalActionParentObject){
		terminalsAtThisLevel = true;
		terminalAction.goodBindings = util.clone(nonTerminal.goodBindings);
		
		//Store this terminal's lineage so we know how to 'reach it'.
		if(nonTerminal.lineage === undefined){
			terminalAction.lineage = nonTerminal.name;
		}
		else{
			terminalAction.lineage = nonTerminal.lineage + "-" + nonTerminal.name;
		}

		//This new terminal may introduce new roles to be bound, or may impose new preconditions on existing roles.
		//In light of this, figure out what good bindings we have available and store them in the terminal.
		currentUniqueBindings = getUniqueActionBindings(terminalAction, uniqueBindings);
		var workingBindingCombinations = getWorkingBindingCombinations(terminalAction, util.clone(currentUniqueBindings), util.clone(cast), util.clone(terminalAction.goodBindings), util.clone(cast));
		terminalAction.goodBindings = workingBindingCombinations;

		//we found a terminal symbol! Great, let's add it to the list!
		//Let's do some checks to make sure that the action that we're looking at is good.
		//This means checking it's conditions, and checking if it's "isAccept" matches what we want.
		if(!actionIsAppropriate(terminalAction, isAccepted, currentUniqueBindings)){
			//oops, either the conditions or the isAccept didn't pass! Let's move along...
			//console.log("how many times do you see me? inappropriate action: " , terminalAction);
			var returnObject = {};
			returnObject.terminalsAtThisLevel = true;
			returnObject.boundTerminal = undefined;
			return returnObject;
		}

		//Let's compute influence rules for this terminal action, too!
		computeInfluenceRuleWeight(terminalAction);

		//and let's break out of here if the influence rule weight is less than 0...
		//interpreting that as the initiator doesn't actually want to do this thing...
		if(terminalAction.weight < 0){
			var returnObject = {};
			returnObject.terminalsAtThisLevel = true;
			returnObject.boundTerminal = undefined;
			return returnObject;		
		}

		if(terminalAction.salience === undefined ){
			terminalAction.salience = 0;
		}
		if(terminalAction.weight === undefined){
			terminalAction.weight = 0;
		}

		//Because salience may come back someday, use the weight as our salience.
		terminalAction.salience = terminalAction.weight + terminalAction.salience; // if there is a hard-coded sailence, honor it.

		//Return the terminal we found and other pertinent information.
		var returnObject = {};
		returnObject.terminalsAtThisLevel = true;
		returnObject.boundTerminal = terminalAction;
		return returnObject;
	}

	//This function is meant to be called inside of getActionHierarchyFromNonTerminal when looking at a
	//"leadsTo" array of actions and finding a non-terminal. This will recursively call getActionHierarchyFromNonTerminal.
	//Ultimately, we return a single action, but that action will full 'leadsTo' information all filled out based on those
	//recursive calls.
	var nonTerminalFoundInRecursiveSearch = function(actionName, nonTerminal, uniqueBindings, isAccepted, actionsPerGroup, cast){
		var returnList = [];

		var nonTerminalAction = getActionFromNameInArray(actionName, nonTerminals);
		nonTerminalAction.goodBindings = nonTerminal.goodBindings;
		nonTerminalAction.weight = nonTerminal.weight;

		//Figure out the 'lineage' of the action (i.e., keep track of the path we've taken down the tree.)
		if(nonTerminal.lineage === undefined){
			nonTerminalAction.lineage = nonTerminal.name;
		}
		else{
			nonTerminalAction.lineage = nonTerminal.lineage + "-" + nonTerminal.name;
		}
		
		//Get the unique bindings that still work.
		currentUniqueBindings = getUniqueActionBindings(nonTerminalAction, uniqueBindings);
		if(!actionIsAppropriate(nonTerminalAction, isAccepted, currentUniqueBindings)){
			//oops, either the conditions or the isAccept didn't pass! Let's move along...
			//console.log("how many times do you see me? inappropriate action: " , terminalAction);
			return;
		}

		//RECURSIVE CALL! Using the non-terminal we're on as the starting point for the next level down the tree.
		var diggingDeeperActions = getActionHierarchyFromNonTerminal(nonTerminalAction, isAccepted, actionsPerGroup, util.clone(currentUniqueBindings), util.clone(cast));
		if(diggingDeeperActions === undefined || diggingDeeperActions.length <= 0){
			return; // oops! This 'leads to' led to something that had no valid bindings! Better move on!
		}
		
		//Store the actions we found by 'digging deeper'
		nonTerminalAction.actions = [];
		for(var ddActionIndex = 0; ddActionIndex < diggingDeeperActions.length; ddActionIndex += 1){
			var thingToAdd = diggingDeeperActions[ddActionIndex];
			nonTerminalAction.actions.push(util.clone(thingToAdd));
		}

		//Altough this appears that we are returning a single action, it's "leads to" information should
		//be all fleshed in at this point.
		return nonTerminalAction;
	}

	/**
	 * 
	 * @method getActionHierarchyFromNonTerminal
	 * @description Returns an array that represents an 'action hierarchy' i.e. each element in the array will either be a terminal, or will be a non-terminal with fully fleshed out "leads to" information that will ultimately lead to a terminal (with potentally many non terminals 'in the way' with their own leads to information.)
	 * @param  {[Object]} nonTerminal [A 'non-terminal object that theoretically has a "leadsTo" field defined. This leadsTo field may lead to terminals or nonTerminals. If nonTerminals, this function is called recursively until terminals are reached.']
	 * @return {[Array]}             [An Array of all of the non-terminals you can reach from the provided nonTerminal]
	 */
	var getActionHierarchyFromNonTerminal = function(nonTerminal, isAccepted, actionsPerGroup, uniqueBindings, cast){
		var returnList = [];
		var terminalsAtThisLevel = false;
		var currentUniqueBindings = uniqueBindings;
		var startingWeight = nonTerminal.weight;
		actionsPerGroup = actionsPerGroup || 1; //By default, assume you want the MOST salient action per group (as opposed to, say, the top TWO salient actions)
		isAccepted = typeof isAccepted !== 'undefined' ? isAccepted : true;
		if(nonTerminal.leadsTo === undefined){
			//we don't know what to do here! Uh, end of the road? Return?
			return;
		}

		//Find what the good current binding combinations are.
		currentUniqueBindings = getUniqueActionBindings(nonTerminal, uniqueBindings);
		var nonTerminalWorkingBindingCombinations = getWorkingBindingCombinations(nonTerminal, util.clone(uniqueBindings), util.clone(cast), util.clone(nonTerminal.goodBindings), cast);
		if(nonTerminalWorkingBindingCombinations.length <= 0){
			//Oops, there is no possible combination of cast members that make this work! 
			//So no point in going down this path anymore!
			return;
		}

		//Store the bindings that we know 'work' (i.e. there exist characters that satisfy the preconditions)
		//inside of our nonTerminal action.
		nonTerminal.goodBindings = nonTerminalWorkingBindingCombinations;

		//So, now at this point, where I have all of the 'good bindings' at this level... I guess what I want to do
		//is go through all of the influence rules, for each binding, and re-score them?
		//The starting score should come from the 'parent' element.
		//oh, wait, it has it already I think, because we don't have any children yet. OK.
		computeInfluenceRuleWeight(nonTerminal);

		//Used to help us have a nice 'wrapper' action object, for keeping track of the 
		//heritage of an action as we ultimately drill down to find the terminals.
		var terminalActionParentObject = {};
		terminalActionParentObject.name = nonTerminal.name;
		terminalActionParentObject.weight = nonTerminal.weight;
		terminalActionParentObject.goodBindings = nonTerminal.goodBindings;
		terminalActionParentObject.actions = [];
		var potentialActionsToReturn = [];
		
		//The big for-loop! We'll loop through each action in the 'leads to' list, and do 
		//something different depending on if it is a terminal action or a non terminal actions.
		for(var i = 0; i < nonTerminal.leadsTo.length; i += 1){
			var actionName = nonTerminal.leadsTo[i];

			//optimistically check to see if the first action we are looping through is a terminal.
			var terminalAction = getActionFromNameInArray(actionName, terminalActions);

			//Check to see if the action in the "leads to" leads to a terminal.
			if(terminalAction !== undefined){
				//Great, we found a terminal! Let's grab the important information from it!

				var response = terminalFoundInRecursiveSearch(terminalAction, nonTerminal, uniqueBindings, cast, isAccepted, terminalActionParentObject);
				terminalsAtThisLevel = response.terminalsAtThisLevel;
				var foundTerminal = response.boundTerminal;
				
				//Now, just because we found a terminal doesn't mean that it is a 'good' terminal
				//for example, we may have found an 'accept' terminal but we are looking for a 
				//reject terminal.
				if(foundTerminal !== undefined){
					//Alright, this is, in fact, a terminal that we are planning on keeping (at least for now!)

					//We want to add this terminal to a running list of terminals we've found at this level
					//in the hiearchy, and sort the list based on salience.
					//Salience itself isn't particularly used right now, and instead the 'weight' computed
					//from influence rules is essentially used to represent salience.
					terminalActionParentObject.actions.push(foundTerminal);
					var sortedActionsBySalienceAscending = _.sortBy(terminalActionParentObject.actions, "salience");
					var sortedActionsBySalienceDescending = sortedActionsBySalienceAscending.reverse();
					terminalActionParentObject.actions = sortedActionsBySalienceDescending;
		
					//The user may have selected a finite amount of actions per 'action group'
					//This is where that cut off happens. Cut off the least salient actions if we have
					//more actions than the actionsPerGroup allows.
					if(terminalActionParentObject.actions.length > actionsPerGroup){
						terminalActionParentObject.actions.splice(actionsPerGroup, terminalActionParentObject.actions.length - actionsPerGroup);
					}
				}
			}
			else{ // Ah, we must be dealing with another non-terminal! let's DIG DEEPER!
				
				//We know that we're looking at a non-terminal. It will probably lead to other actions.
				//We'll ultimately use the poewr of recursion to help us get there!
				var nonTerminalWithNewRoles = nonTerminalFoundInRecursiveSearch(actionName, nonTerminal, uniqueBindings, isAccepted, actionsPerGroup, cast);
				if(nonTerminalWithNewRoles !== undefined){ // there's a chance we might get an undefined thing (like if the preconditions to the non-terminal don't hold). Don't add it if it is undefined!
					returnList.push(nonTerminalWithNewRoles);
				}
			}

		}

		//Because there might be non-terminals and terminals at the same level, do a check 
		//to see if we need to add anything in at this level in the tree.
		if(terminalsAtThisLevel === true){
			for(var terminalsToPushUpIndex = 0; terminalsToPushUpIndex < terminalActionParentObject.actions.length; terminalsToPushUpIndex += 1){
				returnList.push(util.clone(terminalActionParentObject.actions[terminalsToPushUpIndex]));
			}
		}

		//If we've gotten here, we must have gotten everything we need!
		return returnList;

	};

	/**
	 * @method computeActionsSalience
	 * @description Takes an action as a parameter. If it's salience score is undefined, computes a new salience score based on it's conditions.
	 * @param  {[Object]} terminalAction [An action that should come at the 'end' of the action tree (i.e. it should have effects associated with it). This actions conditions are used to compute salience.]
	 * @return {[Number]}                [The number representing the salience of this particular action.]
	 */
	var computeActionSalience = function(terminalAction){
		var returnValue;
		var multiplier = 5; // Maybe this should live in some constants thing? Or, better yet, be something that the user can specify?
		if(terminalAction.salience !== undefined){
			returnValue = terminalAction.salience;
		}
		else{
			var numConditions = terminalAction.conditions.length;
			if(numConditions === undefined){
				numConditions = 0;
			}
			var salienceCalculation = numConditions * multiplier;
			returnValue = salienceCalculation;
		}
		return returnValue;
	};

	//MYU OLD INFLUENCE RULE CODE, but separated out (because I think other things were calling it!)
	//Going to change all instances of 'nonTerminal' to 'action', because I think any action can actually
	//be passed through this now.
	/**
	 * @method computeInfluenceRuleWeight 
	 * @private
	 * @description Takes in an action, goes through all of its valid bindings, and evaluates the influence rule for each set of bindings. Stores the weight with each binding and, for the best weight (i.e. the best binding) stores it at the level of the action.
	 * @param  {Object} action [The action to compute the weight for. Should have at least one 'goodBinding' attached to it]
	 */
	var computeInfluenceRuleWeight = function(action){
		var bestWeightFoundSoFar = -999999;
		for(var goodBindingIndex = 0; goodBindingIndex < action.goodBindings.length; goodBindingIndex += 1){
			var tempGoodBindings = action.goodBindings[goodBindingIndex];
			//var oldWeight = findWeightFromPreviousBinding(tempGoodBindings, oldGoodBindings);
			var oldWeight = tempGoodBindings.weight$$;
			if(oldWeight === undefined){
				//This should only happen at the 'top level' I think.
				oldWeight = action.weight; // This should be equal to the 'starting volition'
			}
			var scoreFromInfluenceRules = evaluateActionInfluenceRules(action, tempGoodBindings);
			//console.log("Getting here! Here is score from influence rules! " , scoreFromInfluenceRules);
			//I'm starting to get a little doubtful that this is going to work. Oh, unless... unless the score LIVEs inside of the good bindings?
			//Sure, the score can live there, but the 'BEST' score should also live at the level of the influence rule itself... yah?
			//AND DON'T FORGET! The score is adjusted by what has come before it, too!
			//var candidateWeight = startingWeight + scoreFromInfluenceRules;
			var candidateWeight = oldWeight + scoreFromInfluenceRules;
			if(candidateWeight > bestWeightFoundSoFar){
				//We've found a new best candidate!
				action.weight = candidateWeight;
				bestWeightFoundSoFar = candidateWeight;
			}

			action.goodBindings[goodBindingIndex].weight$$ = candidateWeight;
			
		}
	};

	/**
	 * @method actionIsAppropriate
	 * @description actionIsAppropriate checks various qualities that would make an action "not appropriate", such as an action being marked as an "accept" action when we are looking for a reject action.
	 * @param  {[Object]}  action         [The method uses properties of this action, such as isAccept and goodBindings, to confirm if the action is still appropriate.]
	 * @param  {Boolean} isAccepted     [A boolean representing the type of action we are looking for -- true for an accept action, false for a reject action.]
	 * @param  {[Object]}  uniqueBindings [All of the unique roles that have been defined for the action tree.]
	 * @return {[Boolean]}                 [Returns true if the action is still appropriate, false otherwise. Returning false here halts continuation down the action tree, as this being false means all subsequent actions will also be false.]
	 */
	var actionIsAppropriate = function(action, isAccepted, uniqueBindings){
		if(action.isAccept !== undefined){
			if(isAccepted !== action.isAccept){
				return false; // oops, looking for one truth value but found another!
			}
		}

		//If actions don't have an isAccept defined, assume that they are an isAccept of true.
		//This only works with TERMINAL ACTIONS.
		//TODO: Come up with a more robust means of teting for terminal actions than looking at existance of leadsTo and effects
		if(action.isAccept === undefined && action.leadsTo === undefined && action.effects !== undefined){
			if(isAccepted === false){
				return false; // oops, if undefined we assume true, but we are looking for false!
			}
		}


		//If we get to this point, and the action has no "goodBindings" associated with it,
		//that means that there is no combination of characters that exists that satisfies all 
		//of the conditions that have been specified by this point in the "action tree." Therefore,
		//there is no point in going further.
		if(action.goodBindings.length <= 0){
			return false; // if there are no good bindings here, the action is not appropriate?
		}
		return true;
	};


	/**
	 * @method getActionFromNameInArray
	 * @private
	 * @description Given the name of an action, searches through a provided array to find the corresponding action object and returns it.
	 * @param  {string} actionName [The name of the action we are hunting for in the provided array.]
	 * @return {object}            [An object representing all relevant information pertaining to the requested action. Returns undefined if no such action exists.]
	 */
	var getActionFromNameInArray = function(actionName, actionArray){
		for(var i = 0; i < actionArray.length; i += 1){
			if(actionArray[i].name === actionName){
				return util.clone(actionArray[i]);
			}
		}
		return undefined;
	};

	/**
	 * @method getActionFromName
	 * @private
	 * @description Given the name of an action, searches through the action array to find the corresponding action object and returns it.
	 * @param  {string} actionName [The name of the action we are hunting for in the actions array.]
	 * @return {object}            [An object representing all relevant information pertaining to the requested action. Returns undefined if no such action exists.]
	 */
	var getActionFromName = function(actionName){
		for(var i = 0; i < actions.length; i += 1){
			if(actions[i].name === actionName){
				return util.clone(actions[i]);
			}
		}
		return undefined;
	};

	//Given an action and a set of bindings to use, goes through all of the roles in the action and
	//replaces them with character names
	var bindActionEffects = function(actionObject, bindingsToUse){
		for(var i = 0; i < actionObject.effects.length; i += 1){
			actionObject.effects[i].first = bindingsToUse[actionObject.effects[i].first];
			actionObject.effects[i].second = bindingsToUse[actionObject.effects[i].second];
		}
		return actionObject;
	};

	/**
	 * @method getUniqueActionBindings
	 * @description Given an action (actionObject) and an object representing all of the unique roles we've encountered thus far (uniqueBindings), go through the roles specified in the action and, if not already present in the uniqueBindings object, add them to it!
	 * @param  {[Object]} actionObject   [An action object. This method goes through it's first and second roles of each of it's conditions, and adds any new roles it finds to the unique bindings object]
	 * @param  {[Object]} uniqueBindings [An object representing all of the unique roles found by this point in the action chain. If undefined, this method will create a new one.]
	 * @return {[Object]}                [An object containing all of the unique roles used by this point in the action chain.]
	 */
	var getUniqueActionBindings = function(actionObject, uniqueBindings){

		//Go through all of the conditions and check them for new roles
		var conditions = actionObject.conditions;
		for (var i = 0 ; i < conditions.length ; i += 1) {
			var predicate = conditions[i];			//store the current condition in a temp

			//if the dictionary does not have an entry for the current predicate's first, initialize it
			if (uniqueBindings[predicate.first] === undefined) {
				uniqueBindings[predicate.first] = "";		//possible optimization to change the initialization to zero
			}
			//and the same for the second entry in there is a second character in the predicate
			if (predicate.second !== undefined) {
				if (uniqueBindings[predicate.second] === undefined) {
					uniqueBindings[predicate.second] = "";
				}
			}
		}

		return uniqueBindings;
	};

/**
 * @method getWorkingBindingCombinations
 * @description This method figures out potential combinations of characters that will satisfy all of the conditions
 * that have been specified by this point in the action tree. Actions passed into the function through the 'action' parameter
 * are assumed to have a field called "goodBindings" that represent working combinations of characters to roles found through 
 * previous calls to this function. These good bindings will be updated in this function as new roles are discovered (e.g a new role 
 * that appeared later on down the action tree). Additionally, as new conditions are found, old combinations of bindings that
 * used to work may no longer work; this function will accomadate that as well. This method uses recursion.
 * @param  {[Object]} action               [The action we are finding valid combinations of bindings for. Assumes it has both a conditions array and a goodBindings array.]
 * @param  {[Object]} uniqueBindings       [A list of the roles that need to be filled. Some roles, such as initiator and responder, should be pre-populated with the initiator and responder of the action.]
 * @param  {[Array} availableCastMembers [The cast members to use in filling in roles. As a character can only fulfill one role at a time, characters are 'removed' from the cast once they are assigned a role.]
 * @param  {[Array]} combinationsToUse    [Although the action parameter will have all of the potential combinations, due to the recursive nature of this function, it is important to specify which set of combinations we want to use. In general, when this function is called non-recursively, this parameter should include all of the 'goodBindings' found in the action. When called recursively, you shoudl only pass in a single binding at a time.s]
 * @return {[Array]}                      [An array of all valid character-role combinations for the given action]
 */
var getWorkingBindingCombinations = function(action, uniqueBindings, availableCastMembers, combinationsToUse, allCastMembers){
		var returnArray = [];
		var newCombinationsToUse = [];


		//We want to do the following for each of our existing 'good' Combinations.
		//NOTE: This should only be > 1 when called from the outside. When called recursively, combinationsToUse should only consist of a single combination.	
		for(var workingCombinationIndex = 0; workingCombinationIndex < combinationsToUse.length; workingCombinationIndex += 1){
		
			newCombinationsToUse = []; // kinda weird, but we want to zero it out each time, because we only ever want it to have one entry.
			newCombinationsToUse.push(util.clone(combinationsToUse[workingCombinationIndex]));
			availableCastMembers = util.clone(allCastMembers);

			//I feel like we need to do something here to re-populate availableCastMembers with 
			//the people previously spliced out from the previous uniqueBindings?
			
			//We want to start off by filling in the roles stored in 'uniqueBindings' with the roles
			//that we've found that work from the previous combinations discovered.
			for (var role in combinationsToUse[workingCombinationIndex]){
				var characterName = combinationsToUse[workingCombinationIndex][role];
				if( characterName !== ""){
					//a character has been specified to work in this role (could be initiator, responder, or something else)
					//remove them from the available cast members, but make sure that they are 'lodged' in the unique bindings.
					//We remove them from the available cast members, because it means this character should be unavailable for any other role.
					if(availableCastMembers !== undefined){
						var castIndex = availableCastMembers.indexOf(characterName);
						if(castIndex >= 0){
							availableCastMembers.splice(castIndex, 1);
						}
					}

					//And just as the initiator and responder roles have already been clearly defined earlier,
					//inside of uniqueBidings, let's do the same for this new role...
					uniqueBindings[role] = characterName;
				}
			}

			//Used to help us find out if there are any roles that still need to be specified
			//Even though we just went through previous combinations to fill in roles, there could
			//still be some unspecified if this new action has introduced NEW roles.
			var isFilled = true;
			var emptyKey = "";

			//find an unbound key in the uniqueBindings dictionary
			for (var key in uniqueBindings) {
				if (uniqueBindings[key] === "") {
					emptyKey = key;
					isFilled = false;
					break;
				}
			}

			//All of the roles are filled. We can check to see if the conditions of this action
			//evaluate to true with this particular combination of roles and characters.
			if(isFilled === true){

				//Replace placeholder variables in conditions with actual character names.
				var boundConditions = ruleLibrary.doBinding(uniqueBindings, util.clone(action.conditions));

				//Find out if the conditions are true with this particular set of characters in these roles.
				var evaluationResult = ruleLibrary.evaluateConditions(boundConditions);

				if(evaluationResult === true){
					//Awesome! It's true! Push it on to our return array for later!
					returnArray.push(util.clone(uniqueBindings));
				}
				else{
					//console.log("FAILURE FAILURE. not even going to bother printing the combination.");
				}
			}
			else{ // uniqueBindings is not totally filled in yet.
				//time to recurse.
				for(var i = 0; i < availableCastMembers.length; i += 1){
					uniqueBindings[emptyKey] = availableCastMembers[i];	// place an available cast member into the empty slot in the dictionary
					var updatedCastMembers = util.clone(availableCastMembers);
					updatedCastMembers.splice(i, 1);	// the updated cast has the currently assigned member removed for the recursion
					var potentialCombinations = getWorkingBindingCombinations(action, uniqueBindings, updatedCastMembers, newCombinationsToUse, allCastMembers);
					
					//Depending on where we are in the recursion chain, there's a chance that potentialCombinations
					//might have a length > 1. At least I think that's the case. If not, better safe than sorry, yeah?
					for(var k = 0; k < potentialCombinations.length; k += 1){
						returnArray.push(util.clone(potentialCombinations[k]));
					}
				}
				//If we've gotten here, we want to 'clear out' the uniqueBindings slot of the current 'emptyKey'
				//Because we want it to be clear for when we pop back up to the previous level of recursion.
				uniqueBindings[emptyKey] = "";
			}
		}
		return returnArray;
	};

	/**
	 * @method bindActionCondition 
	 * @description Takes in an array of conditions and a specific binding to use, and replaces all 'generic roles' in the conditions (e.g., "x", "y", "cheater", etc.) with actual character names.
	 * @param  {Array} conditions   [An Array of conditions filled with generic roles (such a initiator, x, or cheater)]
	 * @param  {[Object]} bindingToUse [A dictionary of sorts mapping which charactes should be used to fill in which roles]
	 * @return {[Array]}              [An array of the same conditions passed in, but with their generic roles filled in with character names.]
	 */
	var bindActionCondition = function(conditions, bindingToUse){
		for(var i = 0; i < conditions.length; i += 1){
			if(conditions[i].first !== undefined){
				conditions[i].first = bindingToUse[conditions[i].first];
			}
			if(conditions[i].second !== undefined){
				conditions[i].second = bindingToUse[conditions[i].second];
			}
		}
		return conditions;
	};
	

	//Given a binding, goes througha all of the influence rules of an action
	//and keeps a running sum of their effects. Then returns that sum.
	/**
	 * @method evaluateActionInfluenceRules 
	 * @description Given a binding, goes through all of the influence rules of an action and keeps a rnning sum of their effects, then returns that sum.
	 * @param  {[Object]} action       [An action, with specified influence rules]
	 * @param  {[Object]} bindingToUse [A specfication of the characters to use to fill in each role in the action's influence rules]
	 * @return {[Number]}              [The sum of the influence rules for this action given this binding.]
	 */
	var evaluateActionInfluenceRules = function(action, bindingToUse){
		var volitionSum = 0;

		for(var i = 0; i < action.influenceRules.length; i += 1){
			var rule = action.influenceRules[i];
			var boundConditions = bindActionCondition(util.clone(rule.conditions), bindingToUse);
			var isRuleTrue = ruleLibrary.evaluateConditions(boundConditions);
			if(isRuleTrue === true){
				volitionSum += rule.weight;
			}

		}
		return volitionSum;
	};

	//Returns the 'best' terminal based on an actionList (where an actionList is presumambly)
	//a list of potential actions that has been computed given a certain cast. Everything should
	//already be sorted already, so it's just an easy matter of finding the 'first' thing in every
	//action list until we find one with no other actions -- then that means that we're at the 
	//best terminal!
	/**
	 * @method getBestTerminalFromActionList 
	 * @description Returns the 'best' terminal from an actionList, where best is defined to be the terminal with the highest weight. This function assumes the actionList has already been sorted.
	 * @param  {[Array]} actionList [An array of actions. Each of these actions itself contains another array of actions. All of these arrays within arrays, however, should be sorted already before calling this function.]
	 * @return {[Object]}            [The best (highest weighted) terminal action, with it's roles filled in with the best binding of characters]
	 */
	var getBestTerminalFromActionList = function(actionList){
		//console.log("inside of getTerminalsFromActionList");
		if(actionList.length <= 0){
			//we shouldn't be getting in here with an empty actionList!
			return undefined;
		}
		if(actionList[0].actions !== undefined && actionList[0].actions.length > 0){
			//we are not at a terminal! Keep digging deeper!
			//And because we are only concerned with THE BEST, and the actionList should already be sorted,
			//it should just be a matter of looking at the first entry; no need to look at the rest of the list.
			return getBestTerminalFromActionList(actionList[0].actions);
		}
		else{
			//Ok, we're at the best terminal!
			var terminal = actionList[0];

			//BUT -- we need to get the 'best binding!'
			//There might be multiple best bindings!
			var potentialBestBindings = [];
			for(var i = 0; i < terminal.goodBindings.length; i += 1){
				//See if this goodBinding is in the running for being a bestBinding!
				if(terminal.goodBindings[i].weight$$ === terminal.weight){
					potentialBestBindings.push(terminal.goodBindings[i]);
				}
			}

			//Ok, pick one of the potentialBestBindings at random!
			var goodBindingIndex = _.random(0, potentialBestBindings.length-1);
			var bindingsToUse = potentialBestBindings[goodBindingIndex];
			//and NOW what we want to do is 'fill in' the action with this good binding!
			return bindActionEffects(terminal, bindingsToUse);
		}
	};

	//Given a volition object, returns the single 'best' action for that volition,
	//using the best binding. if multiple best bindings exist, just picks one at random.
	/**
	 * @method getAction 
	 * @description ensemble Interface function. Given a volition object, returns the single 'best' action for that volition using the best binding. If multiple best bindings exist, it will pick one at random.
	 * @param  {[String]} initiator          [The name of the character initiating the action]
	 * @param  {[String]} responder          [The name of the 'recipient of the action']
	 * @param  {[Object]} volition           [A registered volition object]
	 * @param  {[Array]} cast               [The cast of characters to be used for consideration of the filling in of roles.]
	 * @param  {[Number]} numActionsPerGroup [How many terminals from a single 'actionGroup' should be returned. Defaults to 1 if unspecified.]
	 * @return {[Object]}                    [Returns the best, bound action for this particular initiator, responder, and cast.]
	 */
	var getAction = function(initiator, responder, volition, cast, numActionsPerGroup){
		console.log("inside getAction");
		//console.log("This is the contents of the actionLibrary: " , actionLibrary);
		if(numActionsPerGroup === undefined){
			numActionsPerGroup = 1;
		}

		var actionList;
		var volitionInstance = volition.getFirst(initiator, responder);
		while((actionList === undefined || actionList.length === 0) && volitionInstance !== undefined){
			var acceptedObject = volition.isAccepted(initiator, responder, volitionInstance);
			var isAccepted = acceptedObject.accepted;
			var weight = volitionInstance.weight;
			actionList = getSortedActionsFromVolition(initiator, responder, volitionInstance, isAccepted, weight, numActionsPerGroup, cast);
			volitionInstance = volition.getNext(initiator, responder);
		}
		var boundAction = getBestTerminalFromActionList(actionList);
		return boundAction;
	};

	/**
	 * @method getActions 
	 * @memberOf ensemble
	 * @public
	 * @description Similar to getAction, but allows the user to specify the number of intents to draw from, and the number of actions that shold come from each intent.
	 * @param  {String} initiator - The name of the character initiating the action
	 * @param  {String} responder - The name of the recipient of the action
	 * @param  {Object} volition - The registered volition object.
	 * @param  {Array} cast - The pool of characters to be used for consideration for the filling in of roles.
	 * @param  {Number} numIntents - The total number of different intents to pull actions from.
	 * @param  {Number} numActionsPerIntent - How many actions should come from each intent.
	 * @param  {Number} numActionsPerGroup - How many terminals should come from any given 'action group'
	 * @return {Array} A list of terminals, with roles bound with characters, that represent what the initiator most wants to do with the responder.
	 */
	var getActions = function(initiator, responder, volition, cast, numIntents, numActionsPerIntent, numActionsPerGroup){
		//console.log("inside of getActions!");
		if(numActionsPerGroup === undefined) numActionsPerGroup = 1;

		var returnList = [];
		var actionList;
		var volitionInstance = volition.getFirst(initiator, responder);
		if(volitionInstance === undefined){
			//This means that this initiator has NO volitions towards this responder. Abort!
			var emptyList = [];
			return emptyList;
		}
		var intentsRepresented = 0;
		var numActionsFromThisIntent = 0;
		var thisIntentCountedYet = false;
		while(intentsRepresented < numIntents){
			thisIntentCountedYet = false;
			numActionsFromThisIntent = 0;
			var acceptedObject = volition.isAccepted(initiator, responder, volitionInstance);
			var isAccepted = acceptedObject.accepted;
			var weight = volitionInstance.weight;

			//This is a matter of philosophy that we may want to revisit someday.
			//Currently determines "numActionsPerIntent" things based on the 'high level structures' but can potentially lead to
			//LOTS of terminals.
			//might be more intuitive to only return the specified number of terminals.
			//i.e. The Question: is 'numActionsFromThisIntent' referring to terminals, or higher level structures?
			//Current Answer: higher level structures.
			actionList = getSortedActionsFromVolition(initiator, responder, volitionInstance, isAccepted, weight, numActionsPerGroup, cast);

			for(var i = 0; i < actionList.length; i += 1){
				returnList.push(util.clone(actionList[i]));
				//console.log("What does returnList look like at this point...? ", returnList);
				if(thisIntentCountedYet === false){
					intentsRepresented += 1;
					thisIntentCountedYet = true;
				}

				//console.log("num actions we are actually adding... " , numActionsWeAreActuallyAdding);

				//We've found an action from this intent, and have already added it to the return list.
				numActionsFromThisIntent += 1;
				if(numActionsFromThisIntent === numActionsPerIntent){
					//We've reached our quota for this intent--let's move on to the next intent, even if there are more actions left that could be added.
					break;
				}
			}
			volitionInstance = volition.getNext(initiator, responder);
			if(volitionInstance === undefined){
				break;
			}
		}


		//is grabAllTerminals needed here? Maybe not, since getSortedActionsFromVolition appears to only return terminals itself?
		var allTerminals = grabAllTerminals(returnList);
		var boundActions = sortAndBindTerminals(allTerminals);
		//var boundActions = extractAndSortTerminalsFromActionList(returnList);
		return boundActions;
	};

	//for each action in the action list, go through and find how many total terminal actions we have.
	var getNumberOfTerminalsReachablebyAnActionList = function(actionList){	
		var sum = 0;
		for(var i = 0; i < actionList.length; i += 1){
			sum += getNumberOfTerminalsReachablebyAnAction(actionList[i]);
		}
		return sum;
	}

	//action could be either a terminal or a non terminal!
	//we'll be calling this recursively!
	var getNumberOfTerminalsReachablebyAnAction = function(action){
		var sum = 0;
		if(action.leadsTo === undefined){
			//we are dealing with a terminal! return one!
			return 1;
		}
		else{
			for(var i = 0; i < action.leadsTo.length; i += 1){
				sum += getNumberOfTerminalsReachablebyAnAction(action.leadsTo[i]);
			}
			return sum;
		}
	}

	//This function takes an action list. That is, an array (or something) of actions.
	//Some of these actions are terminals. They should be grabbed!
	//However, some of these are, in fact, not terminals, but might LEAD to other
	//terminals. This function will also drill down into those non-terminals, and get
	//the terminals that are buried within.
	var grabAllTerminals = function(actionList){
		var terminalsFoundHere = [];
		var terminalsFoundDeeper;
		var deeperTerminalRecord;
		for(var i =0; i < actionList.length; i += 1){
			if(actionList[i].actions !== undefined){
				//Drill down further.
				terminalsFoundDeeper = grabAllTerminals(actionList[i].actions);
				if(terminalsFoundDeeper !== undefined){
					if(deeperTerminalRecord === undefined){
						deeperTerminalRecord = terminalsFoundDeeper;
					}
					else{
						deeperTerminalRecord = deeperTerminalRecord.concat(terminalsFoundDeeper);
					}
					//clear out our 'terminals found deeper' array
					terminalsFoundDeeper = [];
				}
			}
			else{
				//end of the road, actionList[i] is a terminal.
				terminalsFoundHere.push(actionList[i]);
			}
		}
		var allTerminals;
		if(deeperTerminalRecord !== undefined){
			allTerminals = terminalsFoundHere.concat(deeperTerminalRecord);
		}
		else{
			allTerminals = terminalsFoundHere;
		}
		return allTerminals;
	};

	//sortAndBindTerminals expects that a 'list' of actions be passed in
	//and that eeach of these actions should be terminals.
	//This function sorts them based on their volition score, finds the
	//best binding for them, and then updates the sorted array based on those bindings.
	//It returns an array of terminals which have been sorted and who have good bindings.
	var sortAndBindTerminals = function(terminalArray){
		var sortedTerminals = sortActionsByVolitionScore(terminalArray);
		for(var k = 0; k < sortedTerminals.length; k += 1){
			var bestBindings = getBestBindingFromTerminal(sortedTerminals[k]);
			sortedTerminals[k] = bindActionEffects(sortedTerminals[k], bestBindings);
		}
		return sortedTerminals;
	};

	/**
	 * @method getBestBindingFromTerminal 
	 * @description Given a terminal action, looks at it's list of good bindings and finds the one that matches the score of the action itself. If multiple ones do, picks one at random.
	 * @param  {[Object]} terminal [An Action]
	 * @return {[Object]}          [An object representing which bindings are the best ones to use for this action]
	 */
	var getBestBindingFromTerminal = function(terminal){
		//There might be multiple best bindings!
		var potentialBestBindings = [];
		for(var i = 0; i < terminal.goodBindings.length; i += 1){
			//See if this goodBinding is in the running for being a bestBinding!
			if(terminal.goodBindings[i].weight$$ === terminal.weight){
				potentialBestBindings.push(terminal.goodBindings[i]);
			}
		}

		//Ok, pick one of the potentialBestBindings at random!
		var goodBindingIndex = _.random(0, potentialBestBindings.length-1);
		var bindingsToUse = potentialBestBindings[goodBindingIndex];
		return bindingsToUse;
	};


	var actionLibraryInterface = {
		parseActions : parseActions,
		getAllActions : getAllActions,
		getActionFromName : getActionFromName,
		bindActionEffects : bindActionEffects,
		categorizeActionGrammar : categorizeActionGrammar,
		getStartSymbols : getStartSymbols,
		getNonTerminals : getNonTerminals,
		getTerminalActions : getTerminalActions,
		getActionHierarchyFromNonTerminal : getActionHierarchyFromNonTerminal,
		clearActionLibrary : clearActionLibrary,
		getActionHierarchyFromVolition : getActionHierarchyFromVolition,
		getSortedActionsFromVolition : getSortedActionsFromVolition,
		getBestTerminalFromActionList : getBestTerminalFromActionList,

		getAction : getAction,
		getActions : getActions,

		dumpActions : dumpActions
	};



	/* test-code */
	//actionLibraryInterface.bindActionEffects = bindActionEffects;
	actionLibraryInterface.getWorkingBindingCombinations = getWorkingBindingCombinations;
	actionLibraryInterface.startSymbolAlreadyExists = startSymbolAlreadyExists;
	/* end-test-code */

	return actionLibraryInterface;

});
/*global define */
/**
 * This class is the top level interface into ensemble.
 *
 *
 * @class ensemble
 */

define('js/ensemble/ensemble',["util", "underscore", "ruleLibrary", "actionLibrary", "socialRecord", "test", "validate"],
function(util, _, ruleLibrary, actionLibrary, socialRecord, test, validate) {


	/**
	 * @method loadBaseBlueprints
	 * @memberof ensemble
	 * @private
	 * 
	 * @description Loads a stock set of blueprints useful for testing. (relationship, networks, etc.)
	 *
	 * @param {Object} bp - a blueprint object.
	 * 
	 * @return {Object} An object with an interface to the loaded factories.
	 */
	var loadBaseBlueprints = function(bp) {
		socialRecord.clearEverything();
		return loadSocialStructure( bp );
	};


	/**
	 * @method loadFile
	 * @memberof ensemble
	 * @public
	 * 
	 * @description Will load in a file representing some data object for the ensemble world. This function will need to be called with your triggerRules, volitionRules, and socialSchema, among others.
	 *
	 * @param {Object} filename - The relative path to the data file.
	 * 
	 * @return {Object} A JSON object representing the parsed contents of the filename.
	 */
	var loadFile = function(filename) {

		var fileResults;

		if (!window.XMLHttpRequest) {
			console.log("Browser doesn't support XMLHttpRequest.");
			return false;
		}
		xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState==4 && xmlhttp.status==200) {
				fileResults = JSON.parse(xmlhttp.responseText);
			} else {
				console.log("xmlhttp not ready!");
				return false;
			}
		}

		xmlhttp.open("GET", filename, false); // false = synchronously
		xmlhttp.send();

		return fileResults;
	}


	/**
	* @method registerSocialType
	* @memberOf ensemble
	* @private
	* @description Register an individual type for use with ensemble.
	*
	* @param {Object} blueprint A blueprint specifying the parameters of this social type.
	*
	* @return {Object} A copy of the blueprint.
	*/
	var registerSocialType = function(blueprint) {
		var factory = {};
		factory.category = blueprint.category;
		factory.type = blueprint.type;
		factory.directionType = blueprint.directionType;
		factory.isBoolean = blueprint.isBoolean;
		factory.cloneEachTimeStep = blueprint.cloneEachTimeStep;
		factory.duration = blueprint.duration;
		factory.min = blueprint.minValue;
		factory.max = blueprint.maxValue;
		factory.defaultVal = blueprint.defaultValue;
		factory.actionable = blueprint.actionable;
		return factory;
	}

	var socialStructure;

	/**
	 * @method loadSocialStructure
	 * @memberOf ensemble
	 * @public
	 * @description Take an object specifying a set of social relation types, and generate a
	 * set of factories with interfaces into that specification. See
	 * sampleGame/data/schema.json for an example of structure.
	 *
	 * @param  {Object} data The object to load
	 * 
	 * @return {Object} An object with parameters for each category name specified in the data file.
	 */
	var loadSocialStructure = function(data) {
		var structure = {};

		var blueprints;
		try {
			if (typeof data === "string") {
				blueprints = (JSON.parse(data)).schema;
			} else if (typeof data === "object") {
				blueprints = data.schema;
			} else {
				console.log("unexpected value:", data);
				throw new Error("Error load social structure: unexpected data value: ", typeof data);
			}
		} catch (e) {
			throw new Error("JSON Error load social structure (blueprints): " + e);
		}
		if (blueprints === undefined) {
			throw new Error("Error: social structure data file must be JSON that defines a top-level key 'schema'");
		}
		var atLeastOneCategoryAllowsIntent = false;
		for (var i = 0; i < blueprints.length; i++) {
			var categoryBlueprint = blueprints[i];

			// Error Checking
			if (categoryBlueprint.actionable === true) {
				atLeastOneCategoryAllowsIntent = true;
			}
			if (structure[categoryBlueprint.category]) {
				throw new Error("DATA ERROR in ensemble.loadSocialStructure: the category '" + categoryBlueprint.category + "' is defined more than once.");
			}

			validate.blueprint(categoryBlueprint, "Examining blueprint  #" + i);

			socialRecord.registerDuration(categoryBlueprint);
			socialRecord.registerDefault(categoryBlueprint);
			socialRecord.registerDirection(categoryBlueprint);
			socialRecord.registerIsBoolean(categoryBlueprint);
			socialRecord.registerMaxValue(categoryBlueprint);
			socialRecord.registerMinValue(categoryBlueprint);

			// Create an interface for each type within this category.
			structure[categoryBlueprint.category] = {};
			for (var j = 0; j < categoryBlueprint.types.length; j++) {
				var type = categoryBlueprint.types[j].toLowerCase();
				var typeBlueprint = util.clone(categoryBlueprint);
				typeBlueprint.type = type;
				structure[categoryBlueprint.category][type] = registerSocialType(typeBlueprint);
			}

		}

		if (!atLeastOneCategoryAllowsIntent) {
			throw new Error("SCHEMA ERROR: A schema must include at least one category where actionable is true, otherwise there are no possible actions for characters to take.");
		}

		socialStructure = structure;
		validate.registerSocialStructure(socialStructure);
		return socialStructure;
	};

	/**
	 * @method getSocialStructure
	 * @memberOf ensemble
	 * @public
	 * @description Returns an object reference describing the social structure loaded into ensemble. 
	 *
	 * @return {Object} A dictionary with top level keys will be each of the social "categoryes" (a la "relationship", "network", etc.). Each of these contains a dictionary of its subtypes. 
	 */
	var getSocialStructure = function() {
		return socialStructure;
	}

	/**
	 * @method getGategoryDescriptors
	 * @memberOf ensemble
	 * @public
	 * @description Returns an object containing fields describing the properties of a given category registered with ensemble
	 *
	 * @param  {String} categoryName The social category to get information about.
	 *
	 * @return {Object} A dictionary with keys for each piece of metadata about the social category: "directionType" will be directed, undirected, or reciprocal; "isBoolean" will be true or false (false = numeric). 
	 */
	var getCategoryDescriptors = function(categoryName) {
		var descriptors = {};
		var c = socialStructure[categoryName];
		if (c === undefined) {
			return false;
		}
		// The details for every type within a category should be the same, so just go with the first one.
		for (var typeName in c) {
			var t = c[typeName];
			descriptors.directionType = t.directionType;
			descriptors.isBoolean = t.isBoolean;
			descriptors.cloneEachTimeStep = t.cloneEachTimeStep === undefined ? true : t.cloneEachTimeStep;
			descriptors.duration = t.duration;
			descriptors.min = t.min;
			descriptors.max = t.max;
			descriptors.defaultVal = t.defaultVal;
			return descriptors;
		}
		// If the category was somehow empty, also return false.
		return false;
	}

	/**
	 * @method getCategoryFromType
	 * @memberOf ensemble
	 * @public
	 * @description Returns the category name associated with a particular type. TODO: This method is unreliable if we allow the same type name to appear in multiple categoryes, which we currently do.
	 *
	 * @param  {String} type A type from a social scheme (i.e. "friends").
	 *
	 * @return {String} The name of the social category to which that type belongs (i.e. "relationships"), or false if none was found. 
	 */
	var getCategoryFromType = function(type) {
		for (var categoryName in socialStructure) {
			if (socialStructure[categoryName][type] !== undefined) {
				return categoryName;
			}
		}
		return false;
	}

	var isValidTypeForCategory = function(type, categoryName) {
		var cn = socialStructure[categoryName];
		if (cn === undefined) return false;
		if (cn[type] === undefined) return false;
		return true;
	}


	var getSortedTurnsTuple = function(tab) {
		var t0Val = tab[0];
		var t1Val = tab[1];
		if (t0Val === "START") {
			t0Val = 9999999999;
		}
		if (t0Val === "NOW") {
			t0Val = 0;
		}
		if (t1Val === "START") {
			t1Val = 9999999999;
		}
		if (t1Val === "NOW") {
			t1Val = 0;
		}
		if (t0Val > t1Val) {
			var tmp = tab[0];
			tab[0] = tab[1];
			tab[1] = tmp;
		}
		return tab;
	}

	var savedChars;

	/**
	 * @method addCharacters
	 * @public
	 * @memberOf ensemble
	 * 
	 * @description Load a character definition object.
	 *
	 * @param {Object} data A file defining the characters in this story. Should contain a single top-level key, "cast", which holds a dictionary of character identifiers, each containing an object with character metadata. If the object contains a key "name" with the printed name of the character, the getCharName function can be used to quickly return this.
	 *
	 * @return {Array}      An array of strings with all character keys (same as will be used in socialRecord entries, etc..
	 */
	var addCharacters = function(data) {
		// STUB: For the moment we aren't doing anything with this data,
		// other than returning an array of keys.
		var charData = data;
		var chars = charData.cast;
		savedChars = chars;
		return getCharacters();
	};

	/**
	 * @method getCharacters
	 * @public
	 * @memberOf ensemble
	 * Returns an array of character IDs for all registered characters.
	 *
	 * @return {Array}      An array of strings with all character keys (same as will be used in socialRecord entries, etc..
	 */
	var getCharacters = function() {
		return _.keys(savedChars);
	};

	/**
	 * @method getCharactersWithMetadata
	 * @public
	 * @memberOf ensemble
	 * Returns the full dictionary of all character info.
	 *
	 * @return {Object}      A dictionary with the full record of all registered characters.
	 */
	var getCharactersWithMetadata = function() {
		return util.clone(savedChars);
	};

	/**
	 * @method getCharData
	 * @public
	 * @memberOf ensemble
	 * Returns a specific piece of metadata for a registered character.
	 *
	 * @param {String} char The ID of a registered character.
	 * @param {String} key The metadata field requested.
	 *
	 * @return {Object}      The metadata value for the requested character and key, or undefined if no such key or character were found. The type of the return result is dependent on the type of the requested metadata field.
	 */
	var getCharData = function(char, key) {
		if (savedChars[char] === undefined) {
			return undefined;
		}
		return savedChars[char][key];
	};

	/**
	 * @method getCharName
	 * @public
	 * @memberOf ensemble
	 * Shorthand function to return the printed name of a registered character. getCharName("sarah") is identical to getCharData("sarah", "name"). Returns the character key if no "name" field was found, or undefined if the requested character ID was not found.
	 *
	 * @param {String} char The ID of a registered character.
	 *
	 * @return {String}      The printed name of the requested character.
	 */
	var getCharName = function(char) {
		var name = getCharData(char, "name");

		// If name is undefined, just return the character's ID.
		return name || char;
	};

	/**
	 * @method addProcessedRules
	 * @private
	 * @memberOf ensemble
	 * @description Takes a preprocessed rule object and metadata, validates it, and registers it. Note: addRules() should be called by outside modules, which does the preprocessing.
	 *
	 * @param {String} ruleType The key to identify this ruleset. If "trigger" or "volition", run extra validation code to verify these kinds of rules are constructed properly.
	 * @param {String} fileName Identifying info about the source of these rules, useful if we need to print error messages.
	 * @param {Object} rues An array of rule objects, each of which should specify a human-readable "name" key.
	 *
	 * @return {Array}      An array of strings, unique IDs for each rule added, in the form type_num (i.e. triggerRules_14). 
	 */
	var addProcessedRules = function(ruleType, fileName, rules) {

		var conditionValFunc;
		var effectValFunc;

		var ids = [];

		if (ruleType === "trigger" || ruleType === "volition") {
			conditionValFunc = ruleType === "trigger" ? validate.triggerCondition : validate.volitionCondition;
			effectValFunc = ruleType === "trigger" ? validate.triggerEffect : validate.volitionEffect;
			ruleType = ruleType + "Rules";
		}

		// Validate data.
		var i, j, rule, tab;
		for (i = 0; i < rules.length; i++) {

			rule = rules[i];
			if (rule.name === undefined) {
				console.log("Warning: " + ruleType + " Rule #" + i + " is missing a 'name'.");
			}
			//Store the 'origin' of this rule, so we'll always be able to know where it came from, and give it a unique ID.
			rule.origin = fileName;
			var newId = ruleType + "_" + util.iterator("rules");
			ids.push(newId);
			rule.id = newId;


			// Check conditions
			if (conditionValFunc !== undefined) {
				for (j = 0; j < rule.conditions.length; j++) {
					var condRef = rule.conditions[j];

					//Make uniform aspects of predicates that can be written in multiple valid ways.
					condRef = standardizePredicate(condRef);

					conditionValFunc(condRef, "Examining " + ruleType + " rule #" + i + ": '" + rule.name + "' Validating condition at position " + j);
					
				}
			}

			// Check effects
			if (effectValFunc !== undefined) {
				for (j = 0; j < rule.effects.length; j++) {
					var effectRef = rule.effects[j];
					//Make uniform aspects of predicates that can be written in multiple valid ways.
					effectRef = standardizePredicate(effectRef);

					effectValFunc(effectRef, "Examining " + ruleType + " rule #" + i + ": '" + rule.name + "' Validating effect at position " + j);
				}
			}			
		}

		if (rules.length > 0) {
			ruleLibrary.addRuleSet(ruleType, rules);
			return ids;
		} else {
			return [];
		}
	};

	
	//standardize a predicate (called before validation).
	var standardizePredicate = function(pred){

		//Convert string vlaues of "intentType" to a boolean
		//(after making sure that the string value used makes sense given the pred's
		//"isBoolean" value)
		var intentType = pred.intentType;
		var categoryDescriptors = getCategoryDescriptors(pred.category);
		if(typeof intentType === "string"){ // not every predicate has an intentType, only standardize this if it has it (and is a string, as if it is already a boolean our work is done for us.)
			if(intentType.toLowerCase() === "start"){
				//isBoolean better be true!
				if(!categoryDescriptors.isBoolean){
					//User specified a boolean specific intentType, but the predicate is numeric! Problem!
					console.log("problem predicate: " , pred);
					throw new Error("Error! predicate has a boolean-only intentType (" + intentType + ") but is numeric!");
				}
				else{
					//everything is ok! Let's standardize!
					pred.intentType = true;
				}
			}
			else if(intentType.toLowerCase() === "increase"){
				//isBoolean better be false!
				if(categoryDescriptors.isBoolean){
					//user specified a numeric specific intent type but the predicate is a boolean! 
					console.log("problem predicate: " , pred);
					throw new Error("Error loading in predicate -- it has a numeric-only intentType (" + intentType + ") but is a boolean!");
				}
				else{
					//Everything is ok! time to standardize!
					pred.intentType = true;
				}
			}
			else if(intentType.toLowerCase() === "stop"){
				//isBoolean better be true!
				if(!categoryDescriptors.isBoolean){
					//user specified a boolean specific intentType but the predicate is numeric!
					console.log("problem predicate: " , pred);
					throw new Error("Error loading in predicate -- it has a boolean specific intentType ( " + intentType + ") but is numeric!");
				}
				else{
					//Everything is ok! standardize.
					pred.intentType = false;
				}
			}
			else if(intentType.toLowerCase() === "decrease"){
				//isBoolean better be false.
				if(categoryDescriptors.isBoolean){
					//user specified a numeric specific intentType but the predicate is boolean.
					console.log("problem predicate: " , pred);
					throw new Error("Error loading in predicate -- it has a numeric specific intentType ( " + intentType + ") but is boolean!");
				}
				else{
					//Everything is ok. Standardize.
					pred.intentType = false;
				}
			}
		}

		// Sort turnsAgoBetween tuple, if present, low-hi.
		if (pred.turnsAgoBetween !== undefined) {
			pred.turnsAgoBetween = getSortedTurnsTuple(pred.turnsAgoBetween);
		}

		return pred;
	}

	
	/**
	 *@method addRules
	 *@memberof ensemble
	 *@public
	 * 
	 * @description Takes raw rules data, parses out metadata and verifies everything expected is there, then calls the private function addProcessedRules to validate and register these rules. This function should be the only one used to add rules.
	 * 
	 * TODO: To fully support custom rulesets, we will need to add another function to RuleLibrary: getRulesByKey(key) that takes in a key, and returns the ruleset specified by that key.
	 *
	 * @param {Object} data -- Stringified JSON or Object which should define top level keys "fileName", "ruleType", and "rules".
	 *
	 * @return {Array}      An array of strings, unique IDs for each rule added, in the form type_num (i.e. triggerRules_14). 
	 * 
	 */
	var addRules = function(data){
		var parsedData;
		var ruleType;
		var fileName;
		var rules;

		try {
			if (typeof data === "string") {
				parsedData = JSON.parse(data);
			} else if (typeof data === "object") {
				parsedData = data;
			} else {
				console.log("unexpected value:", data);
				throw new Error("Error adding rules: unexpected data value: ", typeof data);
			}
		} catch (e) {
			throw new Error("JSON Error loading rules: " + e);
		}
		console.log("parsedData", parsedData);

		fileName = parsedData.fileName;
		rules = parsedData.rules;
		ruleType = parsedData.type;

		if (rules === undefined) {
			throw new Error("Error: " + ruleType + " rules data file must include a top-level key 'rules'");
		}
		if (ruleType === undefined) {
			throw new Error("Error: " + ruleType + " rules data file must include a top-level key 'type' that is either 'trigger', 'volition', or a custom ruleset key.");
		}

		return addProcessedRules(ruleType, fileName, rules);

	};

	var getRules = function(ruleSet) {
		if (ruleSet === "trigger") {
			return ruleLibrary.getTriggerRules();
		}
		if (ruleSet === "volition") {
			return ruleLibrary.getVolitionRules();
		}
		console.log("No functionality yet for retrieving a ruleset that's neither trigger nor volition.");
		return [];
	}

	var setRuleById = function(label, rule) {

		var ruleSet = label.split("_")[0];

		// Ensure the new rule is valid.
		var results = validate.rule(rule);
		if (typeof results === "string") {
			// Validation failed.
			console.log("Tried to setRulesById for '" + label + "' but validation failed: " + results);
			return false;
		}

		// DISABLED check for existing rule, b/c this flags as true when updating a rule! What we actually need is a way for isRuleAlreadyInRuleSet to return the ID of the matching rule(s), so we could allow that in this case.
		// if (ruleLibrary.isRuleAlreadyInRuleSet(ruleSet, rule)) {
		// 	console.log("Tried to setRulesById for '" + label + "' but an identical rule already exists.");
		// 	return false;
		// }

		return ruleLibrary.setRuleById(label, rule);
	}

	// Public-facing function to access the socialRecord. Does verification on input. Internal functions should use socialRecord.get instead.
	var getSocialRecord = function(searchPredicate, mostRecentTime, lessRecentTime) {

		// TODO: Make sure operator is not + or -

		// Ensure time window. Set to 0 if undefined.
		mostRecentTime = mostRecentTime || 0;
		lessRecentTime = lessRecentTime || 0;

		// Convert turnsAgoBetween to time window.
		if (searchPredicate.turnsAgoBetween !== undefined) {
			mostRecentTime += searchPredicate.turnsAgoBetween[0];
			lessRecentTime += searchPredicate.turnsAgoBetween[1];
		}

		// Ensure proper time window ordering.
		if (mostRecentTime > lessRecentTime){
			var tmp = mostRecentTime;
			mostRecentTime = lessRecentTime;
			lessRecentTime = tmp;
		}

		// Ensure socialRecord has been initialized.
		if (socialRecord.getCurrentTimeStep() === -1) {
			socialRecord.setupNextTimeStep(0);
		}

		return socialRecord.get(searchPredicate, mostRecentTime, lessRecentTime);
	};

	//public facing function to put a character offstage.
	
	var setCharacterOffstage = function(characterName){
		socialRecord.putCharacterOffstage(characterName);
	};

	//public facing function to see if a character is offstage or not.
	var getIsCharacterOffstage = function(characterName){
		return(socialRecord.getIsCharacterOffstage(characterName));
	};

	//public facing function to place a character onstage.
	var setCharacterOnstage = function(characterName){
		socialRecord.putCharacterOnstage(characterName);
	};

	//public facing function to see if a character is onstage or not.
	var getIsCharacterOnstage	= function(characterName){
		var characterOffstage = socialRecord.getIsCharacterOffstage(characterName);
		return (!characterOffstage);
	};

	//public facing function to see if a character has been eliminated.
	var setCharacterEliminated = function(characterName){
		socialRecord.eliminateCharacter(characterName);
	};

	//public facing function to see if a character has been eliminated or not.
	var getIsCharacterEliminated  = function(characterName){
		socialRecord.getIsCharacterEliminated(characterName);
	};

	//public facing function to make two characters perform an action.
	var doAction = function(actionName, initiator, responder, registeredVolitions){
		actionLibrary.doAction(actionName, initiator, responder, registeredVolitions);
	};
	

	/**
	 * @method reset
	 * @public
	 * @memberOf ensemble
	 * @description Completely resets ensemble to a blank-slate state. 
	 *
	 */
	var reset = function() {
		// Clear all social structure info.
		socialStructure = undefined;

		// Clear all character info
		// For now, we aren't storing this anyway.

		// Clear the socialRecord History.
		socialRecord.clearEverything();

		// Clear all rules.
		ruleLibrary.clearRuleLibrary();
	};



	/***************************************************************/
	/* INTERFACE */
	/***************************************************************/

	/**
	 * @method init
	 * @public
	 * @memberOf ensemble
	 * @description initializes ensemble to be ready for use.
	 * @return {String} Returns a success message upon initialization.
	 *
	 */
	var init = function() {
		socialRecord.init();		
		return "Ok";
	};

	var ensembleInterface = {
		init					: init,
		loadSocialStructure		: loadSocialStructure,
		getSocialStructure		: getSocialStructure,
		getCategoryDescriptors		: getCategoryDescriptors,
		getCategoryFromType		: getCategoryFromType,
		isValidTypeForCategory		: isValidTypeForCategory,
		addCharacters			: addCharacters,
		getCharacters			: getCharacters,
		getCharactersWithMetadata : getCharactersWithMetadata,
		getCharData				: getCharData,
		getCharName				: getCharName,

		loadBaseBlueprints		: loadBaseBlueprints,
		loadFile				: loadFile,

		calculateVolition		: ruleLibrary.calculateVolition,
		runTriggerRules			: ruleLibrary.runTriggerRules,
		ruleToEnglish			: ruleLibrary.ruleToEnglish,
		predicateToEnglish		: ruleLibrary.predicateToEnglish,
		
		dumpSocialRecord		: socialRecord.dumpSocialRecord,
		dumpActionLibrary		: actionLibrary.dumpActions,
		set						: socialRecord.set,
		get						: getSocialRecord,
		setCharacterOffstage	: setCharacterOffstage,
		getIsCharacterOffstage	: getIsCharacterOffstage,
		setCharacterOnstage		: setCharacterOnstage,
		getIsCharacterOnstage	: getIsCharacterOnstage,
		setCharacterEliminated	: setCharacterEliminated,
		getIsCharacterEliminated : getIsCharacterEliminated,
		setupNextTimeStep		: socialRecord.setupNextTimeStep,
		getRegisteredDirection	: socialRecord.getRegisteredDirection,
		getAction				: actionLibrary.getAction,
		getActions				: actionLibrary.getActions,
		addActions				: actionLibrary.parseActions,
		addHistory				: socialRecord.addHistory,
		getSocialRecordCopyAtTimestep	: socialRecord.getSocialRecordCopyAtTimestep,
		getCurrentTimeStep		: socialRecord.getCurrentTimeStep,
		
		addRules				: addRules,
		getRules				: getRules,
		setRuleById				: setRuleById,
		getRuleById				: ruleLibrary.getRuleById,
		deleteRuleById			: ruleLibrary.deleteRuleById,

		doAction				: doAction,

		reset					: reset

	
	};

	/* test-code */
	/* end-test-code */

//EXPERIMENT: don't think we want these to be public.
	//addTriggerRules			: addTriggerRules,
	//addVolitionRules		: addVolitionRules,

	// Export interface to a global variable, "ensemble".
	ensemble = ensembleInterface;
	var event = document.createEvent('Event');
	event.initEvent('ensembleLoaded', true, true);
	document.dispatchEvent(event);

	return ensembleInterface;

});

require(["js/ensemble/ensemble"]);
}());