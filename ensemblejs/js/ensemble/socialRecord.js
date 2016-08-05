/**
* This is the class socialRecord
* @class  socialRecord
* @private
*/
define(["underscore", "util", "jquery", "test"], function(_, util, $, test) {

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
	 * @memberOf ensemble
	 * @public
	 * @description return the value of currentTimeStep.
	 * @example console.log("The currentTimestep is : " , ensemble.getCurrentTimestep());
	 * @return {Int} the currentTimeStep stored in the socialRecord
	 */
	var getCurrentTimeStep = function(){
		return currentTimeStep;
	};
	
	/**
	 * @method  dumpSocialRecord
	 * @description A debugging function. Dumps the whole socialRecord object to the console, to enable reviewing of both the current state of the simulation, and its history.
	 * @public
	 @example ensemble.dumpSocialRecord();
	 * @memberOf ensemble
	 */
	var dumpSocialRecord = function() {
		console.log("socialRecord:", socialRecord);
	};


	/**
	 * @method getSocialRecordCopyAtTimestep
	 * @memberOf ensemble
	 * @public

	 * @description Returns a copy of the socialRecord at the given timestep.
	 *
	 * @param  {Number} timeStep The timestep to retrieve. If undefined, assume the current timestep.
	 * @example var historyAtTimestepTwo = ensemble.getSocialRecordCopyAtTimestep(2);
	 * @return {Object} A copy of an socialRecord timeslice, an array of predicate objects.
	 *
	 * 
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

	var getSocialRecordCopy = function() {
		return util.clone(socialRecord);
	}
	
	var registerMaxValue = function (predicate) {
		maxValues[predicate.category] = predicate.maxValue !== undefined ? predicate.maxValue : 100;
	};

	var getRegisteredMaxValue = function (predicate) {
		if (predicate === undefined || predicate.category === undefined) {
			console.log("Error: this predicate had no category.", predicate);
		}
		return maxValues[predicate.category];
	};	
	
	var registerMinValue = function (predicate) {
		minValues[predicate.category] = predicate.minValue !== undefined ? predicate.minValue : 0;
	};

	var getRegisteredMinValue = function (predicate) {
		return minValues[predicate.category];
	};

	var registerDuration = function (predicate) {
		durations[predicate.category] = predicate.duration;
	};

	var getRegisteredDuration = function (predicate) {
		return durations[predicate.category];
	};

	var registerDirection = function (predicate) {
		directions[predicate.category] = predicate.directionType;
	};

	/**
	 * @method getRegisteredDirection
	 * @public
	 * @memberOf ensemble
	 * @description Given a predicate with a category specified, checks to see what "direction" is associated with the category (undirected, directed, or reciprocal)
	 * @param {Object} predicate An ensemble predicate that, at the very least, has a category defined.
	 * @example var directionType = ensemble.getRegisteredDirection(myPredicate);
	 * @return {String} Returns a success message upon initialization.
	 *
	 */
	var getRegisteredDirection = function (predicate) {
		return directions[predicate.category];
	};

	var registerDefaultValue = function (predicate) {
		defaultValues[predicate.category] = predicate.defaultValue;
	};

	var getRegisteredDefaultValue = function (predicate) {
		return defaultValues[predicate.category];
	};

	var registerIsBoolean = function(predicate){
		isBooleans[predicate.category] = predicate.isBoolean;
	};

	var getRegisteredIsBoolean = function(predicate){
		return isBooleans[predicate.category];
	};

/**
* @description  Catches the socialRecord's currentTimeStep up to the timeStep specified.
*
* @method setUpNextTimeStep
* @memberof ensemble
* @return {int} The current timestep. 
* @example ensemble.setupNextTimeStep(10); // sets the current timestep of the social history to 10.
* @example ensemble.setupNextTimeStep(); // increments the current timestep by one.
* @param {Number} timeStep The timeStep to catch up the socialRecord to. If omitted, assumes the currentTimeStep + 1.
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
						var newRec = util.clone(socialRecord[i-1][k]);
						socialRecord[i].push(newRec);
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
		if (searchValue === "any") {
			return true;
		}
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
					if (socialRecordPredicate.isActive === false) {
						continue;
					}
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
	 * @description  Load backstory/starting history into Ensemble. This function takes a history definition object (such as that which is returned from a call to loadFile) and uses it to initializing the starting state of the social record.
	 * @public
	 * @memberOf ensemble
	 @example var rawHistory = ensemble.loadFile("data/history.json");
 var history = ensemble.addHistory(rawHistory);
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
				pred.origin = content.source_file;
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
 * @example var predicateToSet = {"category":"trait", "type":"kind", "first":"Bob", "value":"true"};
 ensemble.set(predicateToSet); // will give the character Bob the trait "kind".
 * @param {Object} setPredicate - the predicate that we would like to save to the socialRecord
 */
	var set = function(setPredicate) {
		var pattern = {};
		pattern.category = setPredicate.category;
		pattern.type = setPredicate.type;
		pattern.first = setPredicate.first;
		pattern.second = setPredicate.second;
		pattern.origin = setPredicate.origin;

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
			if (socialRecordPredicate.isActive === undefined && setPredicate.isActive !== undefined) {
				socialRecordPredicate.isActive = setPredicate.isActive;
			}
			socialRecordPredicate.id = util.iterator("socialRecords");
			socialRecord[timeStep].push(socialRecordPredicate);
		} else if (searchResult.length === 1) {
			socialRecordPredicate = searchResult[0];
			socialRecordPredicate.id = util.iterator("socialRecords");
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
			recipPredicate.isActive = setPredicate.isActive;
			recipPredicate.id = util.iterator("socialRecords");

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
	 * @method setById
	 * @memberOf ensemble
	 * @private
	 * @description A means to update a social record by ID. Primarily meant to be used by the uathoring tool
	 */
	var setById = function(id, newRecord) {
		if (id === undefined || id === null) {
			return false;
		}
		for (var timeStep = 0; timeStep < socialRecord.length; timeStep++) {
			for (var j = 0; j < socialRecord[timeStep].length; j++) {
				if (socialRecord[timeStep][j].id === id) {
					socialRecord[timeStep][j] = newRecord;
					return true;
				}
			}
		}
		return false;
	}

/**
 * @method clearHistory
 * @memberOf ensemble
 * @public
 * @description Clears out the history of the socialRecord, and sets the current timestep back to the start. Note that all registered things from blueprints, such as
 * defaultValues and directions, are NOT removed, so there is no need to re-register
 * @example ensemble.clearHistory(); // all entries in the social record have now been removed, and the currentTimeStep has been reinitialized.
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
		getSocialRecordCopy: getSocialRecordCopy,
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
		setById					: setById,
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