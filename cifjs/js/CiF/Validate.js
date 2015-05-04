/**
 * This is the class Validate, for verification of predicates and other data.
 *
 */

define(["util", "underscore", "jquery", "sfdb"], 
function(util, _, $, sfdb) {

	var allowedDirTypes = ["directed", "undirected", "reciprocal"];
	var allowedOpsConditions = [">", "<", "="];
	var allowedOpsEffects = ["+", "-", "="];
	var allowedTurnConstants = ["now", "start"];

	var socialStructure;
	/**
	 * @method registerSocialStructure
	 * @memberOf Validate
	 * @description Store a local copy of the registered social structure, to check predicates for validity. Called by cif.loadSocialStructure. Shouldn't be needed by end users.
	 *
	 * @param  {Object} ss     A reference to the social schema registered in cif.
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

		// Skip SFDBLabel predicates for now.
		if (predicate.class === "SFDBLabel" || predicate.class === "SFDBLabelUndirected") return false;

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

		if (isTypeWrong(pred, "class", "string", true)) {
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

			if (isTypeWrong(pred, "allowIntent", "boolean", false)) return msg;
			delete pred.allowIntent;

			delete pred.isBoolean;
		} else {// if type is not blueprint

			// Lookup details about this predicate.
			if (socialStructure[pred.class] === undefined) {
				return "class '" + pred.class + "' is not a registered social scheme category.";
			}
			if (socialStructure[pred.class][pred.type] === undefined) {
				console.log("pred.class", pred.class, "pred.type", pred.type);
				console.log("socialStructure", socialStructure);
				return "found class " + pred.class + " type " + pred.type + " but that type does not appear to be registered for that class.";
			}
			var descriptors = socialStructure[pred.class][pred.type];
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
				return "key second: '" + pred.second + "' found but class '" + predicate.class + "' is undirected";
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
					return "'value' was '" + pred.value + "' which seems to be of type '" + typeof pred.value + "' but class '" + predicate.class + "' specifies isBoolean false";
				}
				if (!isBool && isNaN(pred.value)) {
					return "'value' was '" + pred.value + "' which is not a number: class '" + predicate.class + "' specifies numeric value";
				}
				if (isBool && typeof pred.value !== "boolean" && pred.value !== undefined) {
					return "'value' was '" + pred.value + "' which seems to be of type '" + typeof pred.value + "' but class '" + predicate.class + "' specifies isBoolean true";
				}
				if (!isBool) {
					if (typeof descriptors.max === "number" && pred.value > descriptors.max) {
						return "'value' was '" + pred.value + "' but that exceeds max of '" + descriptors.max + "' for class '" + predicate.class + "'";
					}
					if (typeof descriptors.min === "number" && pred.value < descriptors.min) {
						return "'value' was '" + pred.value + "' but that's below min of '" + descriptors.min + "' for class '" + predicate.class + "'";
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

					if (isTypeWrong(pred, "intentDirection", "boolean", true)) return msg;
					delete pred.intentDirection;

					delete pred.value
				}
			}
		}

		delete pred.class;

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