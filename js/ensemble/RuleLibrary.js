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

define(["socialRecord", "volition", "underscore", "util", "log", "test"], function(socialRecord, volition, _, util, log, test) {

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
		if (rules === undefined) return;
		for (var i = 0 ; i < rules.length ; i += 1) {
			//ASK -- leaving this in fow now until the 'additive addRuleSet' issue is resolved
			if(rules[i].conditions === undefined){
				throw new Error("runRules called for ruleSet '" + ruleSet + "' (length " + rules.length + ") but there are no conditions in rule " + i + ".");
			}
			if (rules[i].isActive === false) {
				continue;
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
 * @description  Run the socialRecord's appropriate trigger rules with a given cast. The effects of trigger rules are always applied to the current timestep.
 *
 * @method runTriggerRules
 * @memberof ensemble
 * @param {Array} cast - the array of cast members
 * @param {Object} params A means of passing down additional debugging information, as well as alter the default behavior of calculating volition. The key/value pairs for params are: <BR>
  <b>timestep (Number):</b> This tells ensemble to consider the number assigned to the 'timestep' attribute as the "current turn" for the purposes of volition calculation.
@example var params = {}; params.timestep = 3;
 var cast = ["Bob", "Carol", "Xander"];
 var triggerResults = ensemble.runTriggerRules(cast, params); //the act of calling runTriggerRules has now changed the state.
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
 * @description Calculate the volitions of each character in the given cast. Each character in the cast will form volitions for every other character in the cast, for each intent.
 *
 * @method calculateVolition
 * @memberof ensemble
 * @param {Array} cast An array of the cast of characters to calculate volition for.
  @param {Object} params A means of passing down additional debugging information, as well as alter the default behavior of calculating volition. The key/value pairs for params are: <BR>
  <b>timestep (Number):</b> This tells ensemble to consider the number assigned to the 'timestep' attribute as the "current turn" for the purposes of volition calculation.
 * @example var storedVolitions = ensemble.calculateVolition(cast); 
 *@return {Object} A dictionary containing the cast and their volitions
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
				console.log("Warning! You are adding the rule '" + 
					set[i].id + "' (" + predicateToEnglish(set[i]).text + "), from " + set[i].origin + ", but that rule is identical to one already loaded.", set[i]);
			}
			addRule(key, set[i]); 

			// Set up a cross-reference so we can look up rules by ID.
			var rule = set[i];
			if (rule.id) {
				var lastPos = ruleLibrary[key].length - 1;
				ruleIndexes[key][rule.id] = lastPos;
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

	/**
	 *@method ruleToEnglish
	 *@memberof ensemble
	 *@public
	 * 
	 * @description Given a rule, return a string that is a rough english description of what the rule is by converting each of its 
	 component predicates to english.
	 *
	 * @param {Object} rule An ensemble rule (likely either a volition rule or a trigger rule) that you would like to be roughly converted into english.
     * @example var englishRule = ensemble.ruleToEnglish(myRule);
	 *@return {String}      A string with an english description of the contents of the rule.
	 * 
	 */
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
	 *@method predicatetoEnglish
	 *@memberof ensemble
	 *@public
	 * 
	 * @description Given a predicate (such as you might find in the conditions or effects of a rule)
	 * return an english description of it.
	 *
	 * @param {Object} pred An ensemble predicate that you would like to be roughly converted into english.
     * @example var englishPredicate = ensemble.predicateToEnglish(myPredicate);
	 *@return {String}      A string with an english description of the contents of the predicate.
	 * 
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
			if (pred.weight === 0) directionWord = "unchanged";
			else directionWord = pred.weight > 0 ? "more" : "less";
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
		if (label === undefined) return false;
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