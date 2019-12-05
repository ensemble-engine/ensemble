/*global define */
/**
* This class is the top level interface into ensemble. By including ensemble.js in your project,<BR><BR>
you should be given access to an ensemble singleton object, which you can then use to call each of these methods.<BR><BR>
Then you'll probably want to call ensemble.init(), ensemble.loadFile() for your schema, trigger rules, volition rules, characters, history, and actions.
*
*
* @class ensemble
*/

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
 * @description Will load in a JSON file that represents one of the following aspects of your social world: Volition Rules, Trigger Rules, Characters, Schema, Actions, History. This function needs to be called once for each file. It returns a JSON object representing the parsed contents of the file referenced via the passed in filename.
 *
 * @param {String} filename - The relative path to the data file.
 *
 * @example var rawSchema = ensemble.loadFile(data/schema.json) // Assuming that, relative to the file this function is being called from, there is a data directory with the file schema.json, the schema will be loaded into Ensemble, and rawSchema will have the contents of the json file.
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
 * @description Take a JSON object specifying a Schema, and generates a
 * set of factories with interfaces into that specification, allowing other aspects of ensemble
 * (history, rules, actions, etc.) to reference them. This should be called before loading in any
 * other aspects of ensemble (history, rules, actions, etc.).
 *
 * @param  {Object} data The JSON object to load, representing the social world's schema.
 * @example var rawSchema = ensemble.loadFile("data/schema.json");
var schema = ensemble.loadSocialStructure(rawSchema);
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
	var i;
	for (i = 0; i < blueprints.length; i++) {
		if (blueprints[i].actionable === true) {
			atLeastOneCategoryAllowsIntent = true;
			break;
		}
	}
	if (!atLeastOneCategoryAllowsIntent) {
		throw new Error("SCHEMA ERROR: A schema must include at least one category where actionable is true, otherwise there are no possible actions for characters to take.");
	}

	socialStructure = structure;
	for (i = 0; i < blueprints.length; i++) {
		loadBlueprint(blueprints[i], i);
	}

	validate.registerSocialStructure(socialStructure);
	return socialStructure;
};

/**
 * @method loadBlueprint
 * @memberOf ensemble
 * @private
 * @description Load a single schema blueprint. In most cases, you
 * should use loadSocialStructure to load a set at once and do
 * some checking on the set as a whole.
 *
 * @param	{Object}	categoryBlueprint	The blueprint object to load
 * @param	{Number}	When loading multiple blueprints, can pass an ID number to be printed if necessary for diagnostics.
 * 
 */
var loadBlueprint = function(categoryBlueprint, num) {

	// Error Checking
	if (socialStructure[categoryBlueprint.category]) {
		throw new Error("DATA ERROR in ensemble.loadSocialStructure: the category '" + categoryBlueprint.category + "' is defined more than once.");
	}

	validate.blueprint(categoryBlueprint, "Examining blueprint  #" + num);

	socialRecord.registerDuration(categoryBlueprint);
	socialRecord.registerDefault(categoryBlueprint);
	socialRecord.registerDirection(categoryBlueprint);
	socialRecord.registerIsBoolean(categoryBlueprint);
	socialRecord.registerMaxValue(categoryBlueprint);
	socialRecord.registerMinValue(categoryBlueprint);

	// Create an interface for each type within this category.
	socialStructure[categoryBlueprint.category] = {};
	for (var j = 0; j < categoryBlueprint.types.length; j++) {
		var type = categoryBlueprint.types[j].toLowerCase();
		var typeBlueprint = util.clone(categoryBlueprint);
		typeBlueprint.type = type;
		socialStructure[categoryBlueprint.category][type] = registerSocialType(typeBlueprint);
	}
}

/**
 * @method updateCategory
 * @memberOf ensemble
 * @private
 * @description Refresh the definition of a schema category. NOTE: This will not automatically check for conflicts with existing rules, social records, etc.: probably useful only in the context of a schema editor program that is taking care of that stuff.
 *
	 * @param  {String} categoryKey The social category to update.
	 * @param  {Object} blueprint	A new specification for this category, in the same format as blueprints passed into loadSocialStructure. If this is undefined, the old category will simply be deleted.
	 *
 */
var updateCategory = function(categoryKey, blueprint) {
	delete socialStructure[categoryKey];
	if (blueprint) {
		loadBlueprint(blueprint, 0);
	}
	// TODO: Technically, if the name of the category changes, this is leaving behind old duration, direction, default etc. values in the socialRecord internals. I don't believe this harms anything, but it's a bit messy.
}

/**
 * @method getSocialStructure
 * @memberOf ensemble
 * @public
 * @description Returns an object reference describing the social structure loaded into ensemble. 
 * @example ensemble.getSocialStructure();
 * @return {Object} A dictionary with top level keys will be each of the social "categories" (a la "relationship", "network", etc.). Each of these contains a dictionary of its subtypes. 
 */
var getSocialStructure = function() {
	return socialStructure;
}

/**
 * @method getSchema
 * @memberOf ensemble
 * @public
 * @description Returns an object describing the active social structure in the same format as the original file: 
 * @return {Array} An array of objects, one for each category, with a field "types" with all the type name for that category, etc. (see format for loadSocialStructure)
 */
var getSchema = function() {
	var schemaItems = [];
	for (var catKey in socialStructure) {
		if (catKey === "schemaOrigin") {
			continue;
		}
		var item = {};
		item = getCategoryDescriptors(catKey);
		item.category = catKey;
		item.types = Object.keys(socialStructure[catKey]);
		
		// TODO: Standardize field names between external files and internal representation, so the below isn't necessary.
		item.defaultValue = item.defaultVal;
		delete item.defaultVal;
		item.maxValue = item.max;
		delete item.max;
		item.minValue = item.min;
		delete item.min;

		schemaItems.push(item);
	}
	return schemaItems;
}


/**
 * @method getCategoryDescriptors
 * @memberOf ensemble
 * @public
 * @description Returns an object containing fields describing the properties of a given category registered with ensemble
 *
 * @param  {String} categoryName The social category to get information about.
 * @example var categoryDescriptors = ensemble.getCategoryDescriptors("traits");
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
		// TODO: I believe cloneEachTimeStep is deprecated in favor of duration: 0. Verify and refactor.
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


//TODO: This method is unreliable if we allow the same type name to appear in multiple categoryes, which we currently do.
//@method getCategoryFromType
//@memberOf ensemble
//@public
//@description Returns the category name associated with a particular type. 
//
// @param  {String} type A type from a social scheme (i.e. "friends").
//
// @return {String} The name of the social category to which that type belongs (i.e. "relationships"), or false if none was found. 
//
var getCategoryFromType = function(type) {
	for (var categoryName in socialStructure) {
		if (socialStructure[categoryName][type] !== undefined) {
			return categoryName;
		}
	}
	return false;
}

/**
 * @method isValidTypeForCategory
 * @memberOf ensemble
 * @public
 * @description Given a type and a category name, checks to see if the type is in fact specified by the scema as being a potential type for that category.
 * @param {String} type The Type to validate existing inside of the specified category.
 * @param  {String} categoryName The social category to verify the type's membership of.
 * @example if(ensemble.isValidTypeForCategory("kindness", "trait"){
//do stuff if kindness is a type of trait in your schema.
}
 * @return {Boolean} True if the type is in the category, false otherwise.
 */
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
 * @description Load from file the characters 
 *
@example var rawCast = ensemble.loadFile("data/cast.json"); 
var cast = ensemble.addCharacters(rawCast);

 * @param {Object} data A file defining the characters in this story. Should contain a single top-level key, "cast", which holds a dictionary of character identifiers, each containing an object with character metadata. If the object contains a key "name" with the printed name of the character, the getCharName function can be used to quickly return this.
 *
 * @return {Array}      An array of strings with all character keys.
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
 * @description Returns an array of character IDs for all registered characters.
 * @example myCharacters = ensemble.getCharacters();
 * @return {Array}      An array of strings with all character keys (same as will be used in socialRecord entries, etc..
 */
var getCharacters = function() {
	return _.keys(savedChars);
};

/**
 * @method getCharactersWithMetadata
 * @public
 * @memberOf ensemble
 * @description Returns the full dictionary of all character info.
 * @example myCharacters = ensemble.getCharactersWithMetadata();
 * @return {Object}      A dictionary with the full record of all registered characters.
 */
var getCharactersWithMetadata = function() {
	return util.clone(savedChars);
};

/**
 * @method getCharData
 * @public
 * @memberOf ensemble
 * @description Returns a specific piece of metadata for a registered character.
 *
 * @param {String} char The ID of a registered character.
 * @param {String} key The metadata field requested.
 * @exampe var bobNickname = ensemble.getCharData("bob", "name");
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
 * @description Shorthand function to return the printed name of a registered character. getCharName("sarah") is identical to getCharData("sarah", "name"). Returns the character key if no "name" field was found, or undefined if the requested character ID was not found.
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



//TODO: To fully support custom rulesets, we will need to add another function to RuleLibrary: getRulesByKey(key) that takes in a key, and returns the ruleset specified by that key.
/**
 *@method addRules
 *@memberof ensemble
 *@public
 * 
 * @description Takes raw rules data, parses out metadata and verifies the data is structured correctly, then calls the private function addProcessedRules to validate and register these rules into ensemble. This function should be the only one used to add rules. It should be called for each separate rule file that needs to be loaded in. You should expect to call this function at least twice: once for volition rules, and once for trigger rules.
 * 
 *
 @example var rawTriggerRules = ensemble.loadFile("data/triggerRules.json");
var triggerRules = ensemble.addRules(rawTriggerRules);
		
var rawVolitionRules = ensemble.loadFile("data/volitionRules.json");
var volitionRules = ensemble.addRules(rawVolitionRules);
 * @param {Object} data Stringified JSON or Object which should define top level keys "fileName", "ruleType", and "rules".
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


/**
 *@method getRules
 *@memberof ensemble
 *@public
 * 
 * @description Given a string representation of a rule set (either "trigger" or "volition"), returns
 * all of the rules that are registered to that rule set. At present there is no functionalit for 
 * rules outside of these two rulesets. This function is intended for reviewing what rules have been
 * registered to ensemble. 
 * 
 *
 * @example var triggerRules = ensemble.getRules("trigger");
 * @example var volitionRules = ensemble.getRules("volition");
 * @param {String} The ruleset you wish to collect all of the rules from. "trigger" or "volition" are the only accepted answers.
 *
 * @return {Object} A collection of rules registered to the specified rule set.
 * 
 */
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
 * @param {String} ruleSet The ruleset to search (probably "trigger" or "volition").
 *
 * @param {Object} criteria Currently supports a single key-value pair matching one aspect of a predicate.
 * 
 * @example var ruleSet = "volition";
var criterea = {"type":"kind"};
var filteredRules = ensemble.filterRules(ruleSet, criterea);
 * @return {Array}      An array of matching rules. 
 * 
 */
var filterRules = function(ruleSet, criteria) {
	var itemsToFilter = getRules(ruleSet);
	var predicateArrays = ["conditions", "effects"];
	return _filter(itemsToFilter, predicateArrays, criteria);
}

/**
 *@method filterActions
 *@memberof ensemble
 *@public
 * 
 * @description When given an object specifying search criteria, return only the actions that match the given terms. The object passed in is the same as a search object you'd use with ensemble.get() e.g., { "category": "traits" }. All actions having any conditions, effects, or influenceRules that match the request are returned.
 *
 * @param {Object} criteria Currently supports a single key-value pair matching one aspect of a predicate.
 * @example var criteria = {"type": "kind"}; 
var filteredActions = ensemble.filterActions(criteria)
 *@return {Array}      An array of matching actions. 
 * 
 */
var filterActions = function(criteria) {
	var itemsToFilter = actionLibrary.getAllActions();
	var predicateArrays = ["conditions", "effects", "influenceRules"];
	return _filter(itemsToFilter, predicateArrays, criteria);
}

// Internal function used by filterRules and filterActions. Given an array of records and a list of fields to check, iterates through records in those fields excluding any that don't match the given criteria.
var _filter = function(set, fields, criteria) {
	return set.filter(function(record) {
		var matchFound;
		for (var key in criteria) {
			matchFound = false;
			var fieldPos = 0;
			while (!matchFound && fieldPos < fields.length) {
				var field = fields[fieldPos];
				if (record[field]) {
					for (var i = 0; i < record[field].length; i++) {
						if (record[field][i][key] === criteria[key]) {
							matchFound = true;
							break;
						}
					}
				}
				fieldPos += 1;
			}
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

	/**
* @description A shortcut to set a full array of predicates (useful to be called with the effects array of a rule!)
*
* @method setPredicates
* @memberof ensemble
* @param {String} predicateArray an array of predicates to be added to the social record.
@example ensemble.setPredicates(myTriggerRule.effects);
*/
var setPredicates = function(predicateArray){
	for(var i = 0; i < predicateArray.length; i += 1){
		socialRecord.set(predicateArray[i]);
	}
}

/**
* @description constructs a search predicate for you, then calls getSocialRecord
*
* @method getValue
* @memberof ensemble
* @param {String} first the name of the character to occupy the "first" role in our search predicate.
* @param {String} second the name of the character to occupy the "second" role in our search predicate.
* @param {String} category the category from our social schema that the social record of interest is from.
* @param {String} type the specific type of the specified category that we are interested in learning the value of.
* @param {Int} mostRecentTime establishes the upper bound of the window into the history to look. 0 (or undefined) means the current timestep.
* @param {Int} lessRecentTime establishes the lower bound of the window into the history to look. undefined will simply only look at the current timestep.
@example var predicateValue = ensemble.getValue("bob", "carol", "relationship", "dating", 0, 0); 
*@return {Number or Boolean} the value of the specified type between the specified characters. Could either be a number of boolean, as the value might be referring to a boolean type or a numeric one.
*/
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
/**
* @description  Search the socialRecord for a desired searchPredicate within a provided time period. 
If mostRecentTime and leastRecentTime exist but are formatted improperly 
(i.e., mostRecentTime is a higher number than lessRecentTime), 
then the function will automatically swap the vaues between the two. If msotRecentTime and lessRecentTime
are not provided, the system will only look at the current timestep.
*
* @method get
* @memberof ensemble
* @param {Object} searchPredicate  a predicate we want to search the socialRecord for
* @param {Number} mostRecentTime  the lower bound time that we want to look within (turns ago: 2 = currentTimeStep-2)
* @param {Number} leastRecentTime  the upper bound time that we want to look within (turns ago: 2 = currentTimeStep-2)
* @param {Bool} useDefaultValue  If true, then if the searchPredicate is not explicitly found in the socialRecord it will check the searchPredicate against the predicate's default value. If false, it will not. Defaults to true.
* @example var searchPredicate =  {"category" : "trait", "type":"kind", "first":"x", "value":"true"};
var matchedRecords = ensemble.getSocialRecord(searchPredicate, 2, 5);
*@return {Array} matchedResults	the array holding the found predicates which match the query
*/
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



/**
 * @method setCharacterOffstage
 * @public
 * @memberOf ensemble
 * @description public facing function to put a character offstage. A character being offstage means that they will not have volition rules computed for them, nor are they eligible to take actions (or be acted upon).
 * @param characterName the name of the character to put off stage.
 * @example ensemble.setCharacterOffstage("bob");
 */
var setCharacterOffstage = function(characterName){
	socialRecord.putCharacterOffstage(characterName);
};

/**
 * @method setCharacterOffstage
 * @public
 * @memberOf ensemble
 * @description public facing function to see if a character is offstage or not.
 * @param characterName the name of the character to verify their presence on the stage.
 * @example var isBobOffstage = ensemble.getIsCharacterOffstage("bob");
 * @return {Boolean} true if the character is offstage, false otherwise.
 */
//
var getIsCharacterOffstage = function(characterName){
	return(socialRecord.getIsCharacterOffstage(characterName));
};

/**
 * @method setCharacterOffstage
 * @public
 * @memberOf ensemble
 * @description public facing function to place a character onstage.
 * @param characterName the name of the character to place on stage.
  Characters are considered "on stage" by default; this function should 
  only need to be called if a character had been manually placed off stage,
   but now needs return to it.
 * @example  ensemble.setCharacterOnstage("bob");
 */
var setCharacterOnstage = function(characterName){
	socialRecord.putCharacterOnstage(characterName);
};


/**
 * @method getIsCharacterOnStage
 * @public
 * @memberOf ensemble
 * @description public facing function to check if a character is on stage.
 * @param characterName the name of the character to verify if they are on stage.
 * @example  var isBobOnstage = ensemble.getIsCharacterOnstage("bob");
 * @return {Boolean} true if the character is on stage, false otherwise.
 */
var getIsCharacterOnstage	= function(characterName){
	var characterOffstage = socialRecord.getIsCharacterOffstage(characterName);
	return (!characterOffstage);
};


/**
 * @method getIsCharacterOnStage
 * @public
 * @memberOf ensemble
 * @description public facing fuction to make a character eliminated. Eliminated characters are completely ignored by the system.
 * @param characterName the name of the character to verify if they are on stage.
 * @example  ensemble.setCharacterEliminated("bob"); // Bob is now eliminated.
 */
var setCharacterEliminated = function(characterName){
	socialRecord.eliminateCharacter(characterName);
};

//
/**
 * @method getIsCharacterEliminated
 * @public
 * @memberOf ensemble
 * @description public facing function to see if a character has been eliminated or not.
 * @param characterName the name of the character to verify if they are eliminated.
 * @example  var isBobEliminated = ensemble.getIsCharacterEliminated("bob");
 * @return {Boolean} true if the character is eliminated, false otherwise.
 */
var getIsCharacterEliminated  = function(characterName){
	socialRecord.getIsCharacterEliminated(characterName);
};

//public facing function to perform a bound action.
/**
 * @method doAction
 * @private
 * @memberOf ensemble
 * @description Performs a bound action.
 * @param boundAction The boundAction to perform, as returned by ensemble.getAction(..) or ensemble.getActions(..).
 */
var doAction = function(boundAction){
	actionLibrary.doAction(boundAction);
};


/**
 * @method reset
 * @public
 * @memberOf ensemble
 * @description Clear out the history and the rules currently loaded into Ensemble. 
 CAUTION: once you call this, you will have to reload in more rules/history, 
 or else calculating volition or running trigger rules will do nothing!
 * @example ensemble.reset();
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
 * @description initializes ensemble to be ready for use. This should be the first thing called before any other usage of ensemble.
 * @example var loadResult = ensemble.init(); // loadResult should be "Ok";
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
	getSchema				: getSchema,
	loadBlueprint			: loadBlueprint,
	getCategoryDescriptors		: getCategoryDescriptors,
	getCategoryFromType		: getCategoryFromType,
	isValidTypeForCategory		: isValidTypeForCategory,
	updateCategory			: updateCategory,
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
	getAllActions			: actionLibrary.getAllActions,
	addActions				: actionLibrary.parseActions,
	addHistory				: socialRecord.addHistory,
	clearHistory			: socialRecord.clearHistory,
	getSocialRecordCopyAtTimestep	: socialRecord.getSocialRecordCopyAtTimestep,
	getSocialRecordCopy		: socialRecord.getSocialRecordCopy,
	getCurrentTimeStep		: socialRecord.getCurrentTimeStep,
	
	addRules				: addRules,
	getRules				: getRules,
	filterRules				: filterRules,
	filterActions			: filterActions,
	setRuleById				: setRuleById,
	getRuleById				: ruleLibrary.getRuleById,
	deleteRuleById			: ruleLibrary.deleteRuleById,

	setActionById			: actionLibrary.setActionById,
	doAction				: doAction,
	setSocialRecordById		: socialRecord.setById,
	

	reset					: reset,

	// validate functions
	validateRule: validate.rule,
	validateTriggerCondition: validate.triggerCondition,
	validateTriggerEffect: validate.triggerEffect,
	validateVolitionCondition: validate.volitionCondition,
	validateVolitionEffect: validate.volitionEffect,
	validateBlueprint: validate.blueprint,
	validateAction: validate.action,
};

/* test-code */
/* end-test-code */

//EXPERIMENT: don't think we want these to be public.
//addTriggerRules			: addTriggerRules,
//addVolitionRules		: addVolitionRules,

return ensembleInterface;
