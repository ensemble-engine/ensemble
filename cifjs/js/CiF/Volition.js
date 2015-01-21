/*global console, define */
/*jshint sub:true*/
/*
 * This is the class Volition, for caching and accessing calculated volitions for characters in CiF, using an Iterator pattern.
 *
 * Basic usage of this module: store a calculated volition using the saveVolitions function
 *
 * The internal format for a volitions objects should be structured like this:
 * 		{
			"Simon": {
				"Monica": [
					{ "class": "network", "type": "buddy", "intentDirection": true, "weight": 20 },
					{ "class": "relationship", "type": "involved with", "intentDirection": true, "weight": 19 }
				]
			},
			"Monica": {
				"Simon": [
					{ "class": "network", "type": "romance", "intentDirection": false, "weight": 12 }
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


define(["util", "underscore", "test"], function(util, _, test) {

	var volitionCache = {};
	var cachePositions = {};

	/**
	 * Get the highest-weighted volition in a given set, for a particular pair of characters, or return undefined if no such volition can be found.
	 *
	 * @param  {String} key    The identifier for a volition set.
	 * @param  {String} from   Identifier for the "from" character.
	 * @param  {String} to     Identifier for the "to" character.
	 *
	 * @return {Object}        A volition predicate, with keys "class", "network", "type", "intentDirection", and "weight". (Or undefined if there are no volotions for this pair of characters.)
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
	 * @return {Object}        A volition predicate, with keys "class", "network", "type", "intentDirection", and "weight". (Or undefined if there are no more volitions for this pair of characters.)
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
			if (thisV["class"] === predicate["class"] &&
				thisV["type"] === predicate["type"] &&
				thisV["intentDirection"] === predicate["intentDirection"]) {
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