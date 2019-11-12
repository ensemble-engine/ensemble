// This code deals with the "Test Bindings" feature of the ensemble authoring tool.
/*global console, define */

define(["ensemble", "jquery", "util"], function(ensemble, $, util){

	var characters = [];
	var bindings = [];
	var rule;

	// Create a double-sided dictionary.
	var Dsd = function(dict) {
		this.reversePrefix = "REV_";
		this.dict = {};
		for (var key in (dict || {})) {
			this.dict[key] = dict[key];
			this.dict[this.reversePrefix + dict[key]] = key;
		}
	}
	Dsd.prototype = {
		constructor: Dsd,
		get: function(key) {
			return this.dict[key];
		},
		getRev: function(key) {
			return this.get(this.reversePrefix + key);
		},
		set: function(key, val) {
			this.dict[key] = val;
			this.dict[this.reversePrefix + val] = key;
		},
		clear: function(key) {
			var oldVal = this.dict[key];
			delete this.dict[key]
			delete this.dict[this.reversePrefix + oldVal];
		},
		show: function() {
			return this.dict;
		}
	}

	// A dictionary mapping character names to bindings.
	// get(bob) = x
	// getRev(x) = bob
	var castToBindings = new Dsd();

	var show = function(dur) {
		var d = dur === undefined ? 500 : dur;
		$("#bindTest").fadeIn({"duration": d, "easing": "swing"});
	}

	var hide = function(dur) {
		var d = dur === undefined ? 500 : dur;
		$("#bindTest").fadeOut({"duration": d, "easing": "swing"});
	}

	var toggle = function() {
		$("#bindTest").toggle(500);
	}

	var getBoundCharacter = function(role) {
		// If there's already a character bound to this role, return it.
		var char;
		char = castToBindings.getRev(role);
		if (char !== undefined) {
			return char;
		}
		// Otherwise, return the first character not bound to any role, if possible.
		for (var i = 0; i < characters.length; i++) {
			char = characters[i]
			if (castToBindings.get(char) === undefined) {
				castToBindings.set(char, role);
				// console.log("castToBindings", castToBindings.show());
				return char;
			}
		}
		return "";
	}

	var updateBinding = function() {
		var selInd = $(this)[0].selectedIndex;
		var whichChar = $(this).context[selInd].value;
		var whichBinding = $(this).attr("id").split("_")[1];

		// now associate the new character with this binding.
		castToBindings.set(whichChar, whichBinding);

		makeUpdateDetails();
	}

	var makeCharactersMenu = function(role) {
		var el = $("<select>", {
			id: "bindMenu_" + role,
			name: "bindMenu_" + role,
			change: updateBinding
		});
		for (var i = 0; i < characters.length; i++) {
			el.append("<option value='" + characters[i] + "'>" + characters[i] + "</option>");
		}
		return el;
	}

	var makeBindOptions = function() {
		var bindOptions = $("<ul>", {
			id: "bindOptions" 
		});
		for (var i = 0; i < bindings.length; i++) {
			var role = bindings[i];
			// Ensure this role actually exists in the rule right now.
			// (It might not if we're holding over roles from the editor.)
			var roleFound = false;
			for (var j = 0; j < rule.conditions.length; j++) {
				var c = rule.conditions[j];
				if (c.first === role || c.second === role) {
					roleFound = true;
					break;
				}
			}
			if (!roleFound) {
				continue;
			}
			var bindLine = $("<li>", {
				html: "<span class='bindCharName'>\"" + role + "\"</span> was "
			});
			var menu = makeCharactersMenu(role);
			var nextChar = getBoundCharacter(role);
			if (nextChar === "") {
				throw new Error("Not enough characters to test this rule.");
			}
			menu.val(nextChar);

			bindLine.append(menu);
			bindOptions.append(bindLine);
		}
		return bindOptions;
	}

	var makeBindConditions = function() {
		var bindConditions = $("<ul>", {
			id: "bindConditions" 
		});
		var anyFailed = false;
		for (var i = 0; i < rule.conditions.length; i++) {
			var c = rule.conditions[i];
			var pred = util.clone(c);
			pred.first = castToBindings.getRev(pred.first);
			if (pred.second) {
				pred.second = castToBindings.getRev(pred.second);			
			}
			var result = ensemble.get(pred);
			var predIsTrue = result.length > 0;
			var desc = ensemble.predicateToEnglish(pred);
			if (!predIsTrue) {
				anyFailed = true;
			}
			var resultLine = $("<li>", {
				class: predIsTrue ? "bindTrueItem" : "bindFalseItem",
				html: (predIsTrue ? " " : " NOT TRUE that ") + desc.text
			});
			bindConditions.append(resultLine);
		}
		if (anyFailed) {
			bindConditions.addClass("bindFailed");
		} else {
			bindConditions.addClass("bindSucceeded");
		}
		return bindConditions;
	}


	var makeUpdateDetails = function() {
		$("#bindTest").html("<p class='bindHeader'>For the rule <span class='bindRuleName'>\"" + rule.name + "\"</span></p>");
		$("#bindTest").append("<p class='bindIfHeader'>If, right now,</p>");

		var bindOptions = makeBindOptions();
		$("#bindTest").append(bindOptions)

		$("#bindTest").append("<p class='bindThenHeader'>Then:</p>");

		var bindConditions = makeBindConditions();

		$("#bindTest").append(bindConditions)
		var didSucceed = $("#bindConditions").hasClass("bindSucceeded");
		var effectsWord = rule.effects.length > 1 ? "Effects" : "Effect"
		var resultText = didSucceed ? effectsWord+" would happen" : effectsWord+" would NOT happen";
		$("#bindTest").append($("<p>", {
			class: "bindResult " + (didSucceed ? "bindResultTrue" : "bindResultFalse"),
			html: resultText
		}));

		$("#bindTest").append($("<p>", {
			class: "bindClose",
			html: "Close"
		}));
		$(".bindClose").click(hide);
	}

	var update = function(_bindings, _characters, _rule) {
		// If cast and bindings haven't changed from last time, keep same castToBindings.
		var sameSituation = true;
		if (_bindings === undefined && _characters === undefined ) {
			sameSituation = true;
		} else if (_bindings.length !== bindings.length || _characters.length !== characters.length) {
			sameSituation = false;
		} else {
			for (var i = 0; i < _bindings.length; i++) {
				if (bindings[i] !== _bindings[i]) {
					sameSituation = false;
					break;
				}
			}
			for (var i = 0; i < _characters.length; i++) {
				if (characters[i] !== _characters[i]) {
					sameSituation = false;
					break;
				}
			}
		}
		if (_rule !== undefined) {
			rule = _rule;
		}
		if (!sameSituation) {
			bindings = _bindings;
			characters = _characters;
			castToBindings = new Dsd();
		}
		if ($("#bindTest").is(":visible")) {
			makeUpdateDetails();
		}
	}


	return {
		update: update,
		show: show,
		hide: hide,
		toggle: toggle
	}

});