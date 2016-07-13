/*global define */
/**
 * This class is the top level interface into ensemble.
 *
 *
 * @class ensemble
 */

define(["util", "underscore", "ruleLibrary", "actionLibrary", "socialRecord", "test", "validate"],
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
			var representativeType = Object.keys(c)[0];
			descriptors.actionable = c[representativeType].actionable;
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

	/**
	 *@method filterRules
	 *@memberof ensemble
	 *@public
	 * 
	 * @description When given a ruleset and an object specifying search criteria, return only the rules from the ruleset that match. The object passed in is the same as a search object you'd use with ensemble.get() i.e., { category: "traits" }. All rules having any conditions or effects that match the request are returned.
	 *
	 * @param {String} ruleSet -- The ruleset to search (probably "trigger" or "volition").
	 *
	 * @param {Object} criteria -- Currently supports a single key-value pair matching one aspect of a predicate.
	 * @return {Array}      An array of matching rules. 
	 * 
	 */
	var filterRules = function(ruleSet, criteria) {
		return getRules(ruleSet).filter(function(rule) {
			var matchFound;
			for (var key in criteria) {
				matchFound = false;
				if (rule.conditions) {
					for (var i = 0; i < rule.conditions.length; i++) {
						if (rule.conditions[i][key] === criteria[key]) {
							matchFound = true;
							break;
						}
					}
				}
				if (!matchFound && rule.effects) {
					for (var i = 0; i < rule.effects.length; i++) {
						if (rule.effects[i][key] === criteria[key]) {
							matchFound = true;
							break;
						}
					}
				}
				// Must find at least one match for each search term.
				if (!matchFound) {
					break;
				}
			}
			return matchFound;
		});
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

	//a shortcut to set an array of predicates at once.
	var setPredicates = function(predicateArray){
		for(var i = 0; i < predicateArray.length; i += 1){
			socialRecord.set(predicateArray[i]);
		}
	}

	//constructs a search predicate for you, then calls getSocialRecord
	var getValue = function(first, second, category, type, mostRecentTime, lessRecentTime){
		var searchPredicate = {};
		searchPredicate.first = first;
		searchPredicate.second = second;
		searchPredicate.category = category;
		searchPredicate.type = type;
		var returnArray = getSocialRecord(searchPredicate, mostRecentTime, lessRecentTime);
		var returnObject = returnArray[0];
		var value = returnObject.value;
		return value;
	};

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
		getValue				: getValue,
		setPredicates			: setPredicates,
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
		clearHistory			: socialRecord.clearHistory,
		getSocialRecordCopyAtTimestep	: socialRecord.getSocialRecordCopyAtTimestep,
		getCurrentTimeStep		: socialRecord.getCurrentTimeStep,
		
		addRules				: addRules,
		getRules				: getRules,
		filterRules				: filterRules,
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