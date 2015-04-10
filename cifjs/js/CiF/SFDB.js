/**
* This is the class SFDB
* @class  SFDB
* @private
*/
define(["underscore", "util", "jquery", "test"], function(_, util, $, test) {

	var sfdb = [];
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
	 * @memberof SFDB
	 * @description gets the length of the sfdb object.
	 * @private
	 * @return {[int]} [length of the sfdb object]
	 */
	var getLength = function () {
		return sfdb.length;
	};

	/**
	 * @function getLengthAtTimeStep 
	 * @description Given a timestep, returns the length of the array at the index represented by that timestep in the sfdb.
	 * @param  {[int]} timestep [The timestep to get the length of. Should be >= 0]
	 * @return {[int]}          [the length of the array that resides at sfdb[timestep]]
	 * @private
	 */
	var getLengthAtTimeStep = function(timestep){
		if(timestep < 0){
			console.log("ERROR in getLengthAtTimeStep -- tried to get the length of a negative timestep");
		}
		else{
			return sfdb[timestep].length;
		}
	};

	/**
	 * @method getCurrentTimeStep
	 * @description return the value of currentTimeStep.
	 * @return {[int]} [the currentTimeStep stored in the sfdb]
	 */
	var getCurrentTimeStep = function(){
		return currentTimeStep;
	};
	
	/**
	 * @method  dumpSFDB
	 * @description Debugging function: Dumps the whole SFDB object to the console.
	 * @public
	 * @memberOf CiF
	 */
	var dumpSFDB = function() {
		console.log("sfdb:", sfdb);
	};

	/**
	 * Returns a copy of the sfdb at the given timestep.
	 *
	 * @param  {Number} timeStep The timestep to retrieve.
	 *
	 * @return {Object} A copy of an SFDB timeslice, an array of predicate objects.
	 */
	var getSFDBCopyAtTimestep = function(timeStep) {
		if (timeStep === undefined) {
			timeStep = currentTimeStep;
		}
		var slice = util.clone(sfdb[timeStep]);
		if (slice === undefined) {
			slice = [];
		}
		return slice;
	}
	
	var registerMaxValue = function (predicate) {
		if (maxValues[predicate.class] === undefined) {
			maxValues[predicate.class] = predicate.maxValue !== undefined ? predicate.maxValue : 100;
		}
	};

	var getRegisteredMaxValue = function (predicate) {
		if (predicate === undefined || predicate.class === undefined) {
			console.log("Error: this predicate had no class.", predicate);
		}
		return maxValues[predicate.class];
	};	
	
	var registerMinValue = function (predicate) {
		if (minValues[predicate.class] === undefined) {
			minValues[predicate.class] = predicate.minValue !== undefined ? predicate.minValue : 0;
		}
	};

	var getRegisteredMinValue = function (predicate) {
		return minValues[predicate.class];
	};

	var registerDuration = function (predicate) {
		if (durations[predicate.class] === undefined) {
			durations[predicate.class] = predicate.duration;
		}
	};

	var getRegisteredDuration = function (predicate) {
		return durations[predicate.class];
	};

	var registerDirection = function (predicate) {
		if (directions[predicate.class] === undefined) {
			directions[predicate.class] = predicate.directionType;
		}
	};

	var getRegisteredDirection = function (predicate) {
		return directions[predicate.class];
	};

	var registerDefaultValue = function (predicate) {
		if (defaultValues[predicate.class] === undefined) {
			defaultValues[predicate.class] = predicate.defaultValue;
		}
	};

	var getRegisteredDefaultValue = function (predicate) {
		return defaultValues[predicate.class];
	};

	var registerIsBoolean = function(predicate){
		if(isBooleans[predicate.class] === undefined){
			isBooleans[predicate.class] = predicate.isBoolean;
		}
	};

	var getRegisteredIsBoolean = function(predicate){
		return isBooleans[predicate.class];
	};

/**
* @description  Catches the SFDB's currentTimeStep to the timeStep specified.
*
* @method setUpNextTimeStep
* @memberof CiF
* @return {int} The current timestep. 
* @param {Number} timeStep - the timeStep to catch up the SFDB to. If omitted, assumes the currentTimeStep + 1.
*/
	var setupNextTimeStep = function (timeStep) {
		if (currentTimeStep === -1) {
			currentTimeStep += 1;
		}
		
		if (timeStep === undefined) {
			timeStep = currentTimeStep + 1;
		}
		var currentSFDBEntry = currentTimeStep;

		// If this given timestep in the sfdb doesn't exist yet, fill it in with an empty array.
		if(sfdb[currentTimeStep] === undefined ){
			sfdb[currentTimeStep] = [];
		}

		for (var i = currentTimeStep + 1; i <= timeStep ; i += 1) {

			//sfdb[i] = util.clone(sfdb[i-1]); OLD WAY, changed to no longer clone things we aren't supposed to in the first place.
			sfdb[i] = [];
			if(sfdb[i-1] !== undefined){
				for(var k = 0; k < sfdb[i-1].length; k += 1){
					if(getRegisteredDuration(sfdb[i-1][k]) !== 0 ){
						//ONLY clone if the duration is 0.
						//Otherwise we are dealing with something like an SFDB label, and we don't want to copy it
						//to this new timestep.
						sfdb[i].push(util.clone(sfdb[i-1][k]));
					}
				}
			}


			// code to handle the expiring of statuses
			// if at a given timeStep, an element in the sfdb has a duration timer,
			// decrement it, and if necessary reverse the status value and delete the duration timer
			for (var j = 0 ; j < sfdb[i].length; j++ ){
				if (getRegisteredIsBoolean(sfdb[i][j])) {
					if (sfdb[i][j].duration !== undefined) {
						sfdb[i][j].duration -= 1;
						if (sfdb[i][j].duration <= 0) {
							delete sfdb[i][j].duration;
							// We set it to false; if we just delete it, the old true value gets cloned over.
							if (sfdb[i][j].value !== false) {
								sfdb[i][j].value = false;
								sfdb[i][j].timeHappened = timeStep;
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
		// Rewind the SFDB, clearing out what was in it after the point we are rewinding to
		else if (timeStep < currentTimeStep) {
			for (var i = currentTimeStep; i > timeStep ; i -= 1) {
				sfdb[i] = [];
			}
			currentTimeStep = timeStep;
		}
		return currentTimeStep;
	};

	// Helper function for newGet(). Checks whether two predicates have a compatible value, taking into account an optional operator and passed-in expected values.
	var checkValueMatch = function(sfdbValue, searchValue, operator) {
		if (typeof searchValue === "boolean" && sfdbValue !== searchValue) {
			return false;
		}
		else if (operator === "=" && sfdbValue !== searchValue) {
			return false;
		}
		else if (operator === ">" && sfdbValue <= searchValue) {
			return false;
		}
		else if (operator === "<" && sfdbValue >= searchValue) {
			return false;
		}
		// Either the values match, or we have a numeric class but no operator, in which case we count this as a match (we're probably trying to get the current value of this predicate.)
		return true;
	}

	var matchedResults;
	var matchedResultsStrings;

	// Helper function for newGet(). Adds a matching predicate to the module array matchedResults, either as a new object or a reference to a point in the SFDB, and ensuring no duplicate predicates are added.
	var addResult = function(predicateRef, value, addAsReference) {

		var matchResult;

		if (addAsReference) {
			// Simply add the reference to this predicate in the SFDB.
			matchResult = predicateRef;
		} else {
			// We're matching a predicate that doesn't exist in the SFDB because it's representing a default value.
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

	// Helper function used by sfdb.get to see if the given predicate matches a default value.
	var checkForDefaultMatch = function(searchPredicate, defaultValue, searchValue, isBooleanPred) {
		var matchesDefault;
		if (searchPredicate.value !== undefined) {

			matchesDefault = checkValueMatch(defaultValue, searchValue, searchPredicate.operator || "="); // assume a check for equality if no operator
			if (matchesDefault) {
				addResult(searchPredicate, defaultValue, false);
			}
		}

		// If the search predicate is numeric and did not provide a value, we want to add an entry to the SFDB with the default value, and return a reference to that.
		else if (searchPredicate.value === undefined && !isBooleanPred && defaultValue !== undefined)  {
			var tempPred = util.clone(searchPredicate);
			tempPred.value = defaultValue;
			sfdb[currentTimeStep].push(tempPred);
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
	* @description  Search the SFDB for a desired searchPredicate within a provided time period. We assume that mostRecentTime and leastRecentTime exist and are formatted properly. 
	*
	* @method get
	* @memberof CiF
	* @param {Object} searchPredicate - a predicate we want to search the SFDB for
	* @param {Number} mostRecentTime - the lower bound time that we want to look within (turns ago: 2 = currentTimeStep-2)
	* @param {Number} leastRecentTime - the upper bound time that we want to look within (turns ago: 2 = currentTimeStep-2)
	* @param {Bool} useDefaultValue - If true, then if the searchPredicate is not explicitly found in the sfdb it will check the searchPredicate against the predicate's default value. If false, it will not. Defaults to true.
	* @return {Array} matchedResults	the array holding the found predicates which match the query
	*/
	//cif.get() should be called by public, this should only be used internally.
	var get = function(searchPredicate, mostRecentTime, lessRecentTime, useDefaultValue) {

		var searchValue = searchPredicate.value;
		var defaultValue = defaultValues[searchPredicate.class];
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
		mostRecentTime = currentTimeStep - mostRecentTime;
		lessRecentTime = currentTimeStep - lessRecentTime;

		var foundAnySFDBTimesteps = false;

		// Look through each defined SFDB time step in the given range.
		for (var i = lessRecentTime ; i <= mostRecentTime ; i += 1) {
			if(sfdb[i] !== undefined) {

				foundAnySFDBTimesteps = true;
				// Consider each predicate at this SFDB timestep.
				for (var j = 0 ; j < sfdb[i].length ; j += 1) {
					var sfdbPredicate = sfdb[i][j];

					// Skip any predicates that don't match the search predicate's specification. 

					if (searchPredicate.class !== undefined && searchPredicate.class !== sfdbPredicate.class) {
						continue;
					}
					if (searchPredicate.type !== undefined && searchPredicate.type !== sfdbPredicate.type) {
						continue;
					}
					if (searchPredicate.first !== undefined && searchPredicate.first !== sfdbPredicate.first) {
						continue;
					}
					if (searchPredicate.second !== undefined && searchPredicate.second !== sfdbPredicate.second) {
						continue;
					}

					// If we made it to here, we found a match of the search predicate's pattern (although the value may not match up.)
					foundPatternMatch = true;

					// We don't want to assume "=" as operator, b/c then we won't match checks for existing SFDB values.
					var doesValueMatch = checkValueMatch(sfdbPredicate.value, searchValue, searchPredicate.operator);

					if (doesValueMatch) {
						addResult(sfdbPredicate, searchValue, true);
					}
				}

				// In the case that we found no pattern matches for this predicate (meaning the SFDB has no record of this information), see if the default value should indicate a positive result anyway.
				if ( !foundPatternMatch ) {
					checkForDefaultMatch(searchPredicate, defaultValue, searchValue, isBooleanPred);
				}
				foundPatternMatch = false;

			} // end if(sfdb[i] !== undefined)

		} // end for (var i = lessRecentTime

		// In the case where the whole SFDB was empty, we never got a chance to check for default values, so do it here.
		if (!foundAnySFDBTimesteps) {
			checkForDefaultMatch(searchPredicate, defaultValue, searchValue, isBooleanPred);
		}

		return matchedResults;
	};

	/**
	 * @method addHistory 
	 * @description  Take a history definition object, and load it into CiF. See sampleGame/data/history.json for an example.
	 * @public
	 * @memberOf CiF
	 * @return {object} A Parsed JSON file representing the history that was just loaded in.
	 * @param  {object} content - A javascript object detailing the social history to populate the sfdb with.
	 */
	var addHistory = function(content) {
		var history = content.history;
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
 * @memberof SFDB
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
 * @description Allows a predicate to be saved to the SFDB at the current timeStep. Handles stored predicate updating as well as storing new predicates
 *
 * @method set
 * @memberof CiF
 * @public
 * @param {Object} setPredicate - the predicate that we would like to save to the SFDB
 */
	var set = function(setPredicate) {
		var pattern = {};
		pattern.class = setPredicate.class;
		pattern.type = setPredicate.type;
		pattern.first = setPredicate.first;
		pattern.second = setPredicate.second;

		var value = setPredicate.value;
		var operator = setPredicate.operator;

		var isBooleanPred = getRegisteredIsBoolean(setPredicate);
		var isReciprocal = getRegisteredDirection(setPredicate) === "reciprocal";
		var defaultValue = defaultValues[pattern.class];
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

		// Get a reference to an SFDB record.
		var sfdbPredicate;
		var searchResult = get(pattern, 0, 0, false);
		if (searchResult.length === 0) {
			sfdbPredicate = pattern;
			sfdbPredicate.value = defaultValue;
			sfdb[timeStep].push(sfdbPredicate);
		} else if (searchResult.length === 1) {
			sfdbPredicate = searchResult[0];
		} else {
			console.log("bad predicate: ", setPredicate);
			throw new Error("Expected any pattern get to the SFDB to return either an existing record or make a new one w/the default value and return that.")			
		}

		sfdbPredicate.timeHappened = timeStep;
		sfdbPredicate.duration = duration;

		if (operator === undefined || operator === "=") {
			// Straight update.
			sfdbPredicate.value = value;
		} else {
			// Offset.
			if (operator === "+") {
				sfdbPredicate.value += value;
			} else if (operator === "-") {
				sfdbPredicate.value -= value;
			}
		}

		// Verify new value is valid.
		if (!isBooleanPred) {
			if (sfdbPredicate.value > max) {
				sfdbPredicate.value = max;
			}
			if (sfdbPredicate.value < min) {
				sfdbPredicate.value = min;
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
				sfdb[timeStep].push(rPred);
			}

			rPred.timeHappened = sfdbPredicate.timeHappened;
			rPred.duration = sfdbPredicate.duration;
			rPred.value = sfdbPredicate.value;

		}

	}

/**
 * Clears out the history of the SFDB. Note that all registered things from blueprints, such as
 * defaultValues and directions, are NOT removed, so there is no need to re-register
 *
 * @method clearHistory
 * @memberof SFDB
 */
	var clearHistory = function(){
		sfdb = [];
		currentTimeStep = -1;
	};

/**
 * Clears out EVERYTHING from the SFDB. This means the entire social history, and also data that came from
 * our factory blueprints, including defaultValues and directions. After calling this, predicates need to be re-registered
 *
 * @method clearEverthing
 * @memberof SFDB
 */
	var clearEverything = function(){
		sfdb = [];
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
	 * Prints out the contents of the sfdb's history at a given timeStep. If no timeStep is specified,
	 * prints out the conents of the sfdb at the current time step
	 *
	 * @method sfdbHistoryToString
	 * @memberof SFDB
	 * @param timeStep 			an integer representing the timeStep we want to see the contents of the sfdb at. Assume current time step if undefined.
	 * @return historyString 	A string representing the contents of the sfdb at the specified point in history
	 */
	var sfdbHistoryToString = function(timeStep){
		if(timeStep === undefined){
			timeStep = currentTimeStep;
		}

		var historyString = "******SFDB At Time " + timeStep + "********\n";

		for(var i = 0; i < sfdb[timeStep].length; i += 1){
			historyString += "<PREDICATE " + i + ">\n";
			historyString += "class: " + sfdb[timeStep][i].class + "\n";
			historyString += "type: " + sfdb[timeStep][i].type + "\n";
			historyString += "first: " + sfdb[timeStep][i].first + "\n";
			historyString += "second: " + sfdb[timeStep][i].second + "\n";
			historyString += "value: " + sfdb[timeStep][i].value + "\n";
			historyString += "timeHappened: " + sfdb[timeStep][i].timeHappened + "\n";
			historyString += "---------------------------\n";
		}

		historyString += "Total Length: " + sfdb[timeStep].length + "\n";
		historyString += "******************************";
		return historyString;

	};

	var sfdbFullHistoryToString = function(){
		var returnString = "";
		for(var i = 0; i < sfdb.length; i += 1){
			returnString += sfdbHistoryToString(i);
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
		for(var i = 0; i < sfdb[currentTimeStep].length; i += 1){
			var socialFact = sfdb[currentTimeStep][i];
			if(getRegisteredDirection(socialFact) === "undirected"){
				if(socialFact.first === characterName || socialFact.second === characterName){
					indicesToRemove.push(i);
				}
			}
		}

		for(var j = indicesToRemove.length - 1; j >= 0; j -= 1){
			sfdb[currentTimeStep].splice(indicesToRemove[j], 1);
		}
	};

	var removeDirectedSocialFacts = function(characterName){
		//TODO: Validate that characterName is an actual character in the system.
		var indicesToRemove = [];
		for(var i = 0; i < sfdb[currentTimeStep].length; i +=1){
			var socialFact = sfdb[currentTimeStep][i];
			if(getRegisteredDirection(socialFact) === "directed"){
				if(socialFact.first === characterName || socialFact.second === characterName){
					//This means that we are dealing with someone who has a directed attribute to or from the 'name' character.
					indicesToRemove.push(i); // store for removal later; removing now would mess up our pass through the array.
				}
			}
		}

		for(var j = indicesToRemove.length - 1; j >= 0; j -= 1){
			//We want to go backwards, so as not to disrupt the ordering of the indexes we've marked for removal.
			sfdb[currentTimeStep].splice(indicesToRemove[j], 1);
		}
	};

	var removeReciprocalSocialFacts = function(characterName){
		//TODO: Validate that characterName is an actual character in the system.
		var indicesToRemove = [];
		for(var i = 0; i < sfdb[currentTimeStep].length; i += 1){
			var socialFact = sfdb[currentTimeStep][i];
			if(getRegisteredDirection(socialFact) === "reciprocal"){
				if(socialFact.first === characterName || socialFact.second === characterName){
					//Anything that involves this character is going to be removed.
					indicesToRemove.push(i);
				}
			}
		}

		for(var j = indicesToRemove.length - 1; j >= 0; j -= 1){
			//we want to go backwards, so as not to disrupt the ordering of the indexes we've marked for removal.
			sfdb[currentTimeStep].splice(indicesToRemove[j], 1);
		}
	};

	var getOffstageCharacters = function(){
		return offstageCharacters;
	};

	var getEliminatedCharacters = function(){
		return eliminatedCharacters;
	};

	//TODO: this is now redundant with cif.get()
	var publicGet = function (predicate, earliestTime, latestTime) {
		return get(predicate, earliestTime, latestTime, true);
	};

	var init = function(initialTimeStep) {
		if (initialTimeStep !== undefined) {
			currentTimeStep = initialTimeStep;
		}
		//offstageCharacters = [];

	};

	var sfdbInterface = {
		init: init,
		dumpSFDB: dumpSFDB,
		getSFDBCopyAtTimestep: getSFDBCopyAtTimestep,

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
		sfdbHistoryToString 	: sfdbHistoryToString,
		sfdbFullHistoryToString	: sfdbFullHistoryToString,
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
	sfdbInterface.currentTimeStep = currentTimeStep;
	sfdbInterface.getLength = getLength;
	sfdbInterface.getCurrentTimeStep = getCurrentTimeStep;
	sfdbInterface.getLengthAtTimeStep = getLengthAtTimeStep;
	/* end-test-code */

	//public things removed and turned 'private'
	//getLength 				: getLength,

	return sfdbInterface;


});