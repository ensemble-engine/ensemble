/*global console */

define(["util", "underscore", "socialRecord", "ensemble", "validate", "messages", "ruleTester", "jquery"], function(util, _, socialRecord, ensemble, validate, messages, ruleTester, $){

	var showTestBindingsButton = false;

	var activeRule = {};
	var activeRuleType = "";

	var activeFile = "";
	var origActiveFile = ""; // Stores the active file as of the time this rule was loaded into the editor. If this has changed when we save, we need to update the original file, too.
	// The below is a dictionary storing an active file for each rule type.
	var activeFileRefByRuleType = {};

	// set on init, these are arrays of all files from which the loaded set of rules originated. Any rule's .origin field should be one of these.
	var ruleOriginsTrigger;
	var ruleOriginsVolition;

	var intentTypes = [];
	var allTypes = [];

	var undoHistory = [];
	var undoPosition = -1;
	var undoSize = 100;

	var rulesViewer;
	var saveRules; // When we init, store a reference to ensembleconsole.js saveRules function here.

	var init = function(refToViewer, _ruleOriginsTrigger, _ruleOriginsVolition, _saveRules) {
		rulesViewer = refToViewer;
		ruleOriginsTrigger = _ruleOriginsTrigger;
		ruleOriginsVolition = _ruleOriginsVolition;
		saveRules = _saveRules;
		buildIntentOptions();
		activeFileRefByRuleType = {};
	}

	// A dictionary assigning each key (a unique character binding in this rule) to a number (between 1 and 8). These numbers are used to color the background of the character field a distinct color for each binding.
	var charBindings = {};

	// Reverse looking up in the charBindings dictionary: we know a color index, we want to get the character that corresponds to.
	var getBindingFromColorIndex = function(num) {
		for (var key in charBindings) {
			if (charBindings[key] === num) {
				return key;
			}
		}
		console.log("couldn't find charBindings key matching " + num);
		return "";
	}


	var addCurrentToUndoHistory = function() {

		// Ensure the new rule is valid.
		var result = validate.rule(activeRule);
		if (typeof result === "string") {
			messages.showError("Canceling update: the resulting rule would be invalid.", result);
			activeRule = util.clone(undoHistory[undoPosition]);
			showRule();
			return;
		}

		// Add it to the end of the undo history and update our position.
		if (undoHistory.length > undoSize) {
			undoHistory.shift();
			undoPosition -= 1;
		}
		if (undoPosition < 0) {
			undoHistory.length = 0;
		} else {
			undoHistory.length = undoPosition + 1;
		}
		undoHistory.push(util.clone(activeRule));
		undoPosition += 1;
		updateRuleTester();
	}	

	var undo = function() {
		if (undoPosition > 0) {
			undoPosition -= 1;
			activeRule = util.clone(undoHistory[undoPosition]);
			showRule();
			updateRuleTester();
		}
	}
	var redo = function() {
		if (undoPosition < undoHistory.length - 1) {
			undoPosition += 1;
			activeRule = util.clone(undoHistory[undoPosition]);
			showRule();
			updateRuleTester();
		}
	}

	//if optSkipBackpu is true, it won't create a backup file.
	var save = function(optSkipBackup) {
		console.log("beginning saving process...", activeFile);
		var results = ensemble.setRuleById(activeRule.id, activeRule);
		if (!results) {
			messages.showAlert("Unable to save rule.");
		} else {
			$("#tabLiRulesViewer a").click();
			rulesViewer.show();
			messages.showAlert("Updated Rule " + activeRule.id + ".");
			if(activeFile === ""){
				return; // don't save if we aren't working with an actual file.
			}
			var ruleType = activeRule.id.split("_")[0];
			saveRules(ruleType, activeRule.origin, origActiveFile, optSkipBackup); // Note: we passed in a ref to this function in ensembleconsole.js on init.
		}
	}

	var deleteRule = function() {
		$("#dialogBox")
		.html("Are you sure you want to delete the rule <span style='color:rgb(255, 130, 41)'>" + activeRule.name + "</span> from the file <span style='color:rgb(255, 130, 41)'>" + activeRule.origin + "</span>? This operation cannot be undone.")
		.dialog({
			title: "Confirm Delete Rule",
			resizable: false,
			modal: true,
			width: "40%",
			buttons: {
				"Delete this rule": function() {
					console.log("Deleting.");
					var result = ensemble.deleteRuleById(activeRule.id);
					if (result === true) {
						$("#tabLiRulesViewer a").click();
						rulesViewer.show();
						messages.showAlert("Deleted rule " + activeRule.id + ".");
						saveRules(activeRuleType, activeRule.origin); // Note: we passed in a ref to this function in ensembleconsole.js on init.

					} else {
						messages.showAlert("Unable to delete rule " + activeRule.id + ".");
					}
					$( this ).dialog( "destroy" );
				},
				Cancel: function() {
					$( this ).dialog( "destroy" );
				}
			}
		});
	}

	var updateRuleTester = function() {
		var bindings = _.keys(charBindings);
		var characters = ensemble.getCharacters();
		ruleTester.update(bindings, characters, activeRule);		
	}


	var activateTestBindings = function() {
		if (!showTestBindingsButton) return;
		ruleTester.toggle();
		updateRuleTester();
	}


	// When given a rule object and its type (trigger or volition), create a local copy of it. This will be the editor's version of the rule, and we'll make all changes to this version.
	var loadRule = function(rule, type) {
		charBindings = {};
		util.resetIterator("rulesEdCharBindings");
		util.resetIterator("rulesEdNewChars");
		undoHistory = [];
		undoPosition = -1;
		var origin;
		activeRuleType = type;
		// Close the bindings window if open.
		ruleTester.hide(0);

		if (rule.origin === "__NEWRULE__") {
			if (activeFileRefByRuleType[rule.type] === undefined) {
				// TODO: If we don't have an activeFile set for this rule type, we need to ask the user what active file to use.
				var ruleOrigins = activeRuleType === "trigger" ? ruleOriginsTrigger : ruleOriginsVolition;
				if (ruleOrigins.length > 0) {
					activeFile = ruleOrigins[0];
				} else {
					getNewRulesFile();
				}
			} else {
				// otherwise, set the active file to the most recently used file for this rule type.
				activeFile = activeFileRefByRuleType[rule.type];

				activeRule.origin = activeFile;
			}
		}

		activeRule = util.clone(rule);
		if (activeRule.conditions === undefined || activeRule.conditions.length === 0) {
			newPredicate("conditions");
		}
		if (activeRule.effects === undefined || activeRule.effects.length === 0) {
			newPredicate("effects");
		}
		activeRule.origin = activeFile;
		addCurrentToUndoHistory();

		activeFile = activeRule.origin;
		origActiveFile = activeFile;
		activeFileRefByRuleType[rule.type] = activeFile;
		showRule();
	}

	// Build two arrays storing (in allTypes) all individual social types in the format "category_type" (i.e. "relationship_friends"), and (in intentTypes) the subset of the former where actionable is true. Technically, we should only need to do this when a new social schema package is loaded; for now we run whenever we load a new rule into the editor.
	var buildIntentOptions = function() {
		intentTypes = [];
		allTypes = [];
		var structure = ensemble.getSocialStructure();
		for (var categoryKey in structure) {
			var categoryRoster = structure[categoryKey];
			for (var typeKey in categoryRoster) {
				allTypes.push(categoryKey + "_" + typeKey);
				if (structure[categoryKey][typeKey].actionable === true) {
					intentTypes.push(categoryKey + "_" + typeKey);
				}
			}
		}
	}

	// Turns a single predicate of type effects or conditions into a set of HTML describing the predicate, tagged with the metadata we'll need to create editor components from elements of the description.
	var showPredicate = function(pred, type, ruleNum) {
		var j;
		var phrase;
		var desc = ensemble.predicateToEnglish(pred).diagram;
		var msg = "";
		var usedTimeOrderBit = false;

		for (j = 0; j < desc.length; j++) {
			phrase = desc[j];
			var classList = "ed" + phrase.label;
			if (phrase.label === "timeOrderStart") {
				msg += "<div>.</div>";
				msg += "<div class='timeOrderControls' id='timeControls_" + type + "_" + ruleNum + "'><div>↪</div>";
				usedTimeOrderBit = true;
			}
			if (phrase.label === "first" || phrase.label === "second") {
				classList += " edchar_" + phrase.text;
			}
			if (phrase.label === "beVerb" || phrase.label === "intentType") {
				if (["is", "was", "has", "has been", "did", "increase", "become", "more"].indexOf(phrase.text) >= 0) {
					classList += " edBePos";
				} else {
					classList += " edBeNeg";
				}
			}
			// Each phrase object has two keys, "text" and "label".
			if (phrase.text !== "") {
				msg += "<div class='" + classList+ "' data-rule-source='" + type + "_" + ruleNum + "'";
				if (phrase.label === "type") {
					msg += " data-type='" + phrase.meta + "_" + phrase.text + "'";
				}
				if (phrase.label === "first" || phrase.label === "second") {
					msg += " data-type='" + phrase.text + "'";
				}
				msg += ">" + phrase.text + "</div>";
			}
			if (phrase.label === "timeOrderEnd") {
				msg += "</div>";
			}
		}

		if (!usedTimeOrderBit) {
			msg += "<div>.</div>";
		}

		// Add the control for time-ordered rules, if appropriate.
		if (type === "conditions") {
			var clockClass = pred.turnsAgoBetween ? "clockOn" : "clockOff";
			msg += "<div class='clock " + clockClass + "' id='clock_" + type + "_" + ruleNum + "'><div></div></div>";
		}

		return msg;
	}

	// Used by showRule() to draw a group of rules in the editor. Currently the only two possible types are "conditions" and "effects".
	var addPredicateGroup = function(type, activeArea) {
		var msg;
		var i;
		var len = activeRule[type].length;

		for (i = 0; i < len; i++) {
			msg = showPredicate(activeRule[type][i], type, i);

			// Can only remove a predicate if there's more than one in this group.
			if (len > 1) {
				var removeTxt = "x";
				msg += "<div class='remove' data-rule-source='" + type + "_" + i + "'>" + removeTxt + "</div>";
			}

			msg += "<br clear='all'>";

			var predP = $("<p>", {
				class: "ed" + type + "P",
				html: msg
			});
			activeArea.append(predP);
		}

		var addText = "Add " + (type === "effects" ? "Effect" : "Condition");
		$("<p>", {
			class: "newPredicate",
			html: "<span data-rule-source='" + type+"_99" + "'>" + addText + "</span>"
		}).appendTo(activeArea);
	}

	// Take the rule in the module variable "activeRule" and show it in editable form on the interface.
	var showRule = function() {
		var area = $("#tabsEditor");
		area.html("");

		// Show rule-level controls.
		var ruleControls = $("<div/>", {
			class: "edRuleControls"
		});

		var possibleRuleOrigins = generateRuleOriginsMenu();
		var ruleOriginArea = $("<div/>", {
			id: "ruleOrigin",
			text: "Source File: "
		});
		ruleOriginArea.append(possibleRuleOrigins);
		ruleControls.append(ruleOriginArea);

		ruleControls.append($("<button/>", {
			id: "saveRule",
			class: "fileIOButton",
			text: "Update Rule"
		}));
		ruleControls.append($("<button/>", {
			id: "deleteRule",
			class: "fileIOButton",
			text: "Delete"
		}));		

		var btnClass = undoPosition > 0 ? "" : "inactiveButton";
		ruleControls.append($("<button/>", {
			id: "undoButton",
			class: btnClass,
			text: "Undo"
		}));

		btnClass = undoPosition < undoHistory.length-1 ? "" : "inactiveButton";
		ruleControls.append($("<button/>", {
			id: "redoButton",
			class: btnClass,
			text: "Redo"
		}));

		if (showTestBindingsButton) {
			ruleControls.append($("<button/>", {
				id: "testBindings",
				text: "Test Rule"
			}));
		}


		area.append(ruleControls);

		// Show Rule Name.
		var ruleName = $("<input/>").attr({
			type: "text",
			class: "edRuleName",
			value: activeRule.name
		});
		var ruleNameLabel = $("<span>", {html: "Name:" });
		var ruleNameP = $("<p>", {
			class: "edRuleNameP"
		});
		var ruleTypeLabel = $("<div/>", {
			class: "ruleTypeLabel",
			html: activeRuleType + " Rule"
		});

		ruleNameP.append(ruleTypeLabel).append(ruleNameLabel).append(ruleName);
		area.append(ruleNameP);

		// Show Conditions.
		var conditionsArea = $("<div>", {
			class: "conditionsArea"
		});	
		var whenThis = $("<p>", {
			class: "conditionsLabel",
			html: activeRuleType === "volition" ? "When this is true:" : "When this is true:"
		});
		conditionsArea.append(whenThis);
		activeArea = conditionsArea;
		addPredicateGroup("conditions", activeArea);
		area.append(conditionsArea);

		// Show Effects.
		var effectsArea = $("<div>", {
			class: "effectsArea"
		});
		var effectArrow = $("<p>", {
			class: "effectsArrow",
			html: "&#8618;"
		});
		effectsArea.append(effectArrow);
		var thisShouldHappen = $("<p>", {
			class: "effectsLabel",
			html: activeRuleType === "volition" ? "These character volitions are altered:" : "Make this true:"
		});
		effectsArea.append(thisShouldHappen);
		// effectsArea.append("<br clear='all'>")
		var activeArea = effectsArea;
		addPredicateGroup("effects", activeArea);
		area.append(effectsArea);

		// OK, now that we've created all the elements, let's style them with instrumented jQuery UI components!
		replaceWithClickable(".edconditionsP .edbeVerb", beVerbToggle);
		replaceWithClickable(".edintentType", intentTypeToggle);
		var allowableTypes, dirArray;
		if (activeRuleType === "volition") {
			allowableTypes = intentTypes;
			dirArray = ["more than", "exactly", "less than"];
		} else {
			allowableTypes = allTypes;
			dirArray = ["more", "exactly", "less"];
			replaceWithClickable(".edeffectsP .edbeVerb", beVerbToggle);
		}
		replaceWithTypeMenu(".edtype", allowableTypes, changeIntent);
		replaceWithSimpleMenu(".edconditionsP .eddirection", ["more than", "exactly", "less than"], changeDirection, "direction");
		replaceWithSimpleMenu(".edeffectsP .eddirection", dirArray, changeDirection, "direction");
		replaceWithLinkedText(".edfirst, .edsecond");
		replaceWithSimpleMenu(".edweight", ["+10", "+5", "+3", "+2", "+1", "+0", "-1", "-2", "-3", "-5", "-10"], changeWeight, "weight");
		replaceWithTextEntry(".edvalue", "value");

		replaceWithTextEntry(".edmoreRecent", "moreRecent"); 
		appendWithTimeButtons(".edmoreRecent", "moreRecent");
		replaceWithTextEntry(".edlessRecent", "lessRecent");
		appendWithTimeButtons(".edlessRecent", "lessRecent");

		replaceWithClickable(".newPredicate span", newPredicate);
		replaceWithClickable(".remove", removePred);

		// Add time-ordered rule toggle.
		addTimeOrderedToggle(".clock");

		$("#undoButton").click(undo);
		$("#redoButton").click(redo);

		$("#saveRule").click(save);
		$("#deleteRule").click(deleteRule);
		$("#testBindings").click(activateTestBindings);

		$(".edRuleName").on("input", changeRuleName);
	}

	// If the predicate is a time ordered rule, the clock should delete it and hide the order area. Otherwise, it should add a timeOrdered predicate and show the order area.
	var addTimeOrderedToggle = function(selector) {
		$(selector).each(function() {
			var predId = $(this).attr('id').split("_"); // clock_conditions_0
			var connectedControlBlock = $("#timeControls_"+predId[1]+"_"+predId[2]);
			if (connectedControlBlock.length > 0) {
				console.log("click should delete and hide control block.");
				$(this).on("click", {"type": predId[1], "num": predId[2]}, deleteTimeAndHideControl);
			} else {
				console.log("click should add and show control block.");
				$(this).on("click", {"type": predId[1], "num": predId[2]}, addTimeAndShowControl);
			}
		});
	}

	var deleteTimeAndHideControl = function(event) {
		var type = event.data.type;
		var num = event.data.num;
		deleteField("turnsAgoBetween", type, num);
		showRule();
		addCurrentToUndoHistory();
	}

	var addTimeAndShowControl = function(event) {
		var type = event.data.type;
		var num = event.data.num;
		changeField("turnsAgoBetween", type, num, [1, 2]);		
		showRule();
		addCurrentToUndoHistory();
	}

	// Replace all matching components with a clickable toggle button.
	var replaceWithClickable = function(selector, func) {
		$(selector).each(function() {
			var that = $(this);
			var el = $("<button>", {
				click: function(){ updateRuleAndRedraw(that, func) },
				html: that.html()
			});
			that.html(el);
		});
	}

	// Replace all matching components with a linked text input box.
	var replaceWithLinkedText = function(selector) {
		$(selector).each(function() {
			var that = $(this);
			var binding = that.html();
			var inputEl = $("<input>", {
				type: "text",
				class: "edCharName",
				val: that.html()
			});

			// Do we recognize this character?
			if (charBindings[binding] === undefined) {
				charBindings[binding] = util.iterator("rulesEdCharBindings");
			}
			var colorIndex = charBindings[binding];
			var lightStyle = "charHighlight" + colorIndex + "Light";
			var darkStyle = "charHighlight" + colorIndex + "Dark";
			inputEl.addClass(lightStyle);

			var personIcon = $("<div>", {
				class: "personIcon",
				html: "<div class='personBody " + darkStyle + "'></div><div class='personHead " + darkStyle + "'></div>"
			})

			that.html(inputEl);
			that.append(personIcon);
			inputEl.on("keyup", onCharNameKeyPress); // NOTE: event should be "input" if we want to capture all changes i.e. copy/paste
			inputEl.on("blur", onCharNameConfirm);

			personIcon.on("click", onPersonIconClick);

		});
	}

	var makeNewRulesFile = function(rawFileName) {
		var fnParts = rawFileName.split(".");
		// Remove .json suffix if specified
		if (fnParts[fnParts.length-1] === "json") {
			fnParts.length = fnParts.length - 1;
		}
		if (rawFileName.length > 64) {
			"File name is too long: please use a shorter file name.";
			return false;
		}
		// TODO Check if file already exists.
		var newFileName = fnParts.join(".");

		activeRule.origin = newFileName;
		activeFile = newFileName;

		var ruleOrigins = activeRuleType === "trigger" ? ruleOriginsTrigger : ruleOriginsVolition;
		activeFileRefByRuleType[activeRuleType] = activeFile;
		ruleOrigins.push(newFileName);
		$("#ruleOriginSelect").replaceWith(generateRuleOriginsMenu());

		//We're going to save the new file automatically once it is created.
		save();

		return newFileName;
	}

	var getNewRulesFile = function(placeCalled) {
		console.log("Called from: ", placeCalled);
		$("#dialogBox")
		.html('<p>Enter name for a new file for <b>' + activeRuleType + '</b> rules.</p><p><form><input type="text" name="newRulesFile" id="newRulesFile" value="" style="width:100%" class="text ui-widget-content ui-corner-all"><input type="submit" tabindex="-1" style="position:absolute; top:-1000px"></form>');
		var dialog = $("#dialogBox").dialog({
			title: "New Rules File",
			resizable: false,
			modal: true,
			width: 350,
			buttons: {
				"Create File": function() {
					makeNewRulesFile($("#newRulesFile").val());
					$(this).dialog("destroy");
					$("#tabLiRulesEditor a").click(); // attempt to take us directly to the new rule.
				},
				Cancel: function() {
					//In addition to doing this, it would be great if we could also delete the 'temporary' rule we were kind of in the process of working with...
					//I believe the rule to remove should be in "activeRule" variable.
					$(this).dialog("destroy"); //remove the dialog box
					//The temporary rule really only exists when you are starting a new file from the 'rules viewer' screen. If starting a new file from the rule editor window, we don't want to do the following.
					if(placeCalled !== "fromMenu"){
						activeFileRefByRuleType[activeRuleType] = undefined;
						ensemble.deleteRuleById(activeRule.id); //we created a 'temporary' rule when we pushed the new rule button, but destroy it. 
						$("#tabLiRulesViewer a").click(); // navigate back to rules viewer page
					}
				}
			},
		});
		dialog.find("form").on( "submit", function( event ) {
			event.preventDefault();
			makeNewRulesFile($("#newRulesFile").val());
			$(this).dialog("destroy");
		});
	}

	var generateRuleOriginsMenu = function() {
		var ruleOrigins = activeRuleType === "trigger" ? ruleOriginsTrigger : ruleOriginsVolition;
		var menuOpts = ruleOrigins.map(function(o) {
			return "<option value='" + o + "'>" + o + ".json" + "</option>";
		});
		menuOpts.push("<option value='__NEW__'>(New File)</option>");
		var menu = $("<select>", {
			id: "ruleOriginSelect",
			name: "ruleOriginSelect",
			change: function() {
				var selInd = $(this)[0].selectedIndex;
				var selection = $(this).context[selInd].value;
				if (selection === "__NEW__") {
					getNewRulesFile("fromMenu");
				} else {
					console.log("changing activeFile to ", activeFile);
					activeFile = selection;
					activeRule.origin = activeFile;
				}
			}
		});
		for (var i = 0; i < menuOpts.length; i++) {
			menu.append(menuOpts[i]);
		}
		menu.val(activeFile);
		return menu;
	}

	// Replace all matching components with a drop-down menu.
	var replaceWithSimpleMenu = function(selector, options, func, type) {
		$(selector).each(function() {
			var that = $(this);
			var origVal = that.html();
			var id = type + that.data("rule-source");
			var el = $("<select>", {
				id: id,
				name: id,
				change: function(){
					var selInd = $(this)[0].selectedIndex;
					var selection = $(this).context[selInd].value;
					updateRuleAndRedraw(that, func, selection);
				 }
			});
			for (var i = 0; i < options.length; i++) {
				el.append("<option value='" + options[i] + "'>" + options[i] + "</option>");
			}
			that.html(el);
			$("#"+id).val(origVal);
		})
	}

	var appendWithTimeButtons = function(selector, whichField) {
		$(selector).each(function() {
			var that = $(this);
			var id = whichField + that.data("rule-source");
			// var id = type + that.data("rule-source");
			var buttons = "<span class='timeButtons'><span class='timeNowButton' id='" + id + "NOW'>NOW</span><span class='timeStartButton' id='" + id + "START'>START</span></span>";
			that.append(buttons);
			$("#"+id+"START").click(function() {
				$("#" + whichField + that.data("rule-source")).val("START").trigger("blur");
			});
			$("#"+id+"NOW").click(function() {
				$("#" + whichField + that.data("rule-source")).val("NOW").trigger("blur");
			});
		});
	}


	// Replace all matching components with a text-entry field.
	var replaceWithTextEntry = function(selector, type) {
		$(selector).each(function() {
			var that = $(this);
			var val = that.html();
			if ((type === "moreRecent" || type === "lessRecent") && val === "0") {
				val = "NOW";
			}
			var id = type + that.data("rule-source");
			var inputEl = $("<input>", {
				type: "text",
				id: id,
				name: id,
				val: val
			});

			that.html(inputEl);
			inputEl.on("blur", onValueChangeConfirm);
		});
	}

	var onValueChangeConfirm = function() {
		var val = $(this).val().trim();
		var $parent = $(this).parent();
		var source = $parent.data("rule-source").split("_");
		var isMoreRecent = $parent.hasClass("edmoreRecent");
		var isLessRecent = $parent.hasClass("edlessRecent");
		if (val === "" && !isMoreRecent) { 
			return;
		}

		var field = "value";
		var oldVal = activeRule[source[0]][source[1]][field];		
		if (isMoreRecent || isLessRecent) {
			var valOfOther;
			field = "turnsAgoBetween";
			if (isMoreRecent) {
				valOfOther = $parent.parent().find(".edlessRecent").children("input").val();
				val = [val, valOfOther];
			} else {
				valOfOther = $parent.parent().find(".edmoreRecent").children("input").val();
				val = [valOfOther, val];
			}
			val[0] = val[0].toUpperCase();	
			val[1] = val[1].toUpperCase();	
			if (val[0] !== "NOW" && val[0] !== "START") {
				val[0] = parseInt(val[0]);
			}
			if (val[1] !== "NOW" && val[1] !== "START") {
				val[1] = parseInt(val[1]);
			}
			if (isNaN(val[0]) || isNaN(val[1])) {
				activeRule[source[0]][source[1]].value = oldVal;
				$(this).val(oldVal)
					.focus();
			}
			// Need to swap into proper order?
			var tMoreRecent = val[0];
			var tLessRecent = val[1];
			if (tMoreRecent === "NOW") tMoreRecent = 0;
			if (tLessRecent === "NOW") tLessRecent = 0;
			if (tMoreRecent === "START") tMoreRecent = Infinity;
			if (tLessRecent === "START") tLessRecent = Infinity;
			// TODO: It's awkward visually to have these values swap in the editor, but predicateToEnglish expects them to be in the proper order. 
			if (tMoreRecent > tLessRecent) {
				var t;
				t = val[0];
				val[0] = val[1];
				val[1] = t;
			}

		} else {
			val = parseInt(val);		
		}
		changeField(field, source[0], source[1], val);

		var result = validate.rule(activeRule);
		if (typeof result === "string") {
			// New rule is invalid, probably because entered value doesn't make sense as value for this rule: reset the input field.
			activeRule[source[0]][source[1]].value = oldVal;
			$(this).val(oldVal)
				.focus();
		} else {
			showRule();
			addCurrentToUndoHistory();
		}
	}


	// Replace all matching components with a drop down menu for selecting a social type, categorizing by class.
	var replaceWithTypeMenu = function(selector, options, func) {
		$(selector).each(function() {
			var that = $(this);
			var id = that.data("rule-source")
			var el = $("<select>", {
				id: id,
				name: id,
				change: function(){
					var selInd = $(this)[0].selectedIndex;
					var selection = $(this).context[selInd].value;
					updateRuleAndRedraw(that, func, selection);
				 }
			});
			var whichTypes = id.split("_")[0] === "effects" ? options : allTypes;
			var currentGroup = "";

			var groupCode = ""
			for (var i = 0; i < whichTypes.length; i++) {
				var className = whichTypes[i].split("_")[0];
				if (currentGroup !== className) {
					if (currentGroup !== "") {
						groupCode += "</optgroup>";
						el.append(groupCode);
						groupCode = "";
					}
					groupCode += "<optgroup label='" + className + "'>";
					currentGroup = className;
				}
				// var isSelected = activeRule[className]
				groupCode += "<option value='" + whichTypes[i] + "'>" + whichTypes[i].split("_")[1] + "</option>";
			}
			groupCode += "</optgroup>";
			el.append(groupCode);
			that.html(el);
			// Show correct one selected.
			$("#"+id).val($(that).data("type"))

		});
	}



	// For a linked text field,
	var onCharNameKeyPress = function(e) {
		// Treat an enter as a confirm.
		var keyPressed = e.which;
		if (keyPressed === 13) {
			onCharNameConfirm.call(this);
		}

		 // whenever the field changes, also update all other linked texts fields. DISABLED for now.
		// var val = $(this).val();
		// var origVal = $(this).parent().data("type");
		// $(".edchar_" + origVal).each(function() {
		// 	$(this).children("input").val(val);
		// })
	}

	// For a linked text field, when the field is confirmed (loses focus), update the predicate for each occurrence of that name.
	var onCharNameConfirm = function() {
		var val = $(this).val().trim();
		if (val === "") { 
			return;
		}

		var source = $(this).parent().data("rule-source").split("_");
		var isFirst = $(this).parent().hasClass("edfirst");
		updateRoleName(source[0], source[1], isFirst, val);

		var result = validate.rule(activeRule);
		if (typeof result === "string") {
			// New rule is invalid.
			$(this).val("")
				.css({"background-color": "white"})
				.focus();
		} else {
			showRule();
			addCurrentToUndoHistory()
		}
	}

	// When the person icon in a name field is clicked, advance it to the next character who does not already appear in this rule.
	var onPersonIconClick = function() {


		var relatedInput = $(this).parent().children("input");
		var container = relatedInput.parent();
		var binding = relatedInput.val().trim();
		var numBindings = _.keys(charBindings).length;

		var rs = container.data("rule-source").split("_");
		var thisType = rs[0];
		var thisPos = rs[1];
		var thisPred = activeRule[thisType][thisPos];
		var isFirst = container.hasClass("edfirst");

		var colorIndex = charBindings[binding];
		if (colorIndex === undefined) {
			// If the field was empty, start with the first character.
			console.log("resetting colorIndex");
			colorIndex = 0;
		}

		// Get the next character.
		colorIndex += 1;

		// If we've reached the end of the number of unique characters in this rule, remove the color so the user can type in a new character name.
		if (colorIndex > numBindings) {
			console.log("colorIndex > numBindings, so new:")
			relatedInput
				.val("")
				.css({"background-color": "white"})
				.focus();
			container.children(".personIcon").children(".personHead, .personBody").css({"background-color": "black"});
			var origVal = container.data("type");
			var cl = "edchar_" + origVal;
			container.removeClass(cl);
			container.data("type", "");
			return;
		}

		var newChar = getBindingFromColorIndex(colorIndex);
		relatedInput.val(newChar);
		console.log("setting val to " + newChar);

		// If this character already appears in this rule, skip ahead.
		if (( isFirst  && thisPred.second === newChar ) || 
			( !isFirst && thisPred.first === newChar )) {
			console.log("-->but this char already appears in the predicate, so skipping ahead.");
			onPersonIconClick.call(this);
			return;
		}

		// Otherwise, confirm (as if we'd just typed this in. 
		console.log("confirming.");
		onCharNameConfirm.call(relatedInput);

	}

	// Extract the location in the original predicate of a editor component, call the appropriate update function with that data, and redraw the editor interface to show the updated predicate.
	var updateRuleAndRedraw = function(el, func, optSelection) {
		var ruleSource = $(el).data("rule-source").split("_");
		var predType = ruleSource[0];
		var predNum = parseInt(ruleSource[1]);
		func(predType, predNum, optSelection);
		showRule();
		addCurrentToUndoHistory()
	}

	// Return a character binding for a newly created predicate or binding slot that will 
	var getOrMakeAppropriateBinding = function(position, optPredicate) {
		var charBindingsLen = _.keys(charBindings).length;
		// Is this the first position? Go with the first character in our store.
		if (position === 1 && charBindingsLen >= 1) {
			return getBindingFromColorIndex(1);
		}
		// Is this the second position? If we didn't provide an optional predicate, go with the second character, if available.
		if (position === 2) {
			if (!optPredicate && charBindingsLen >= 2) {
				return getBindingFromColorIndex(2);
			}
			// If we did provide a predicate, choose the first character who isn't in the first position.
			if (optPredicate) {
				var candidate = optPredicate.first;
				var i = 1;
				while (candidate === optPredicate.first) {
					candidate = getBindingFromColorIndex(i);
					i += 1;
				}
				if (candidate !== undefined) {
					return candidate;
				}
			}
		}
		// Otherwise, make up a new character name.
		var baseName = "someone";
		if (charBindings[baseName]) {
			baseName = "other";
			if (charBindings[baseName]) {
				baseName += " (" + util.iterator("rulesEdNewChars") + ")";
			}
		}
		charBindings[baseName] = util.iterator("rulesEdCharBindings");
		return baseName;
	}


	// Create a new template predicate (either an effect or condition) and add it to activeRule. Generate appropriate templates from the active social schema package.
	var newPredicate = function(predType, predNum) {
		var whichTypeList = predType === "effects" ? intentTypes : allTypes;
		var typeInfo = whichTypeList[0].split("_");
		var categoryName = typeInfo[0];
		var type = typeInfo[1];
		var desc = ensemble.getCategoryDescriptors(categoryName);

		var newPred = {};
		newPred.category = categoryName;
		newPred.type = type;
		newPred.first = getOrMakeAppropriateBinding(1);
		if (desc.directionType !== "undirected") {
			newPred.second = getOrMakeAppropriateBinding(2);
		}

		if (predType === "effects") {
			if (activeRuleType === "volition") {
				newPred.weight = 5;
				newPred.intentType = true;			
			}
		}
		if (desc.isBoolean === true || (activeRuleType === "volition" && predType === "effects")) {
			newPred.value = true;
		} else {
			newPred.value = desc.defaultVal;
		}

		if (activeRule[predType] === undefined) {
			activeRule[predType] = [];
		}
		activeRule[predType].push(newPred);
	}

	// Remove a predicate from the activeRule.
	var removePred = function(predType, predNum) {
		activeRule[predType].splice(predNum, 1);
	}

	// Update the "type" of a predicate in the activeRule. This might entail some alterations to the predicate such as adding/removing the operator field.
	var changeIntent = function(predType, predNum, selection) {
		var categoryName = selection.split("_")[0];
		var type = selection.split("_")[1];
		var oldcategory = activeRule[predType][predNum].category;
		activeRule[predType][predNum].category = categoryName;
		activeRule[predType][predNum].type = type;
		// If we've changed value type, give a new default.
		var descriptors = ensemble.getCategoryDescriptors(categoryName)
		var newIsBoolean = descriptors.isBoolean;
		var newDirType = descriptors.directionType;
		var oldDirType = ensemble.getCategoryDescriptors(oldcategory).directionType;

		if (activeRuleType === "volition" && predType === "effects") {
			activeRule[predType][predNum].value = true;
			activeRule[predType][predNum].operator = undefined;
		} else if (newIsBoolean && typeof activeRule[predType][predNum].value !== "boolean") {
			activeRule[predType][predNum].value = true;
			activeRule[predType][predNum].operator = undefined;
		} else if (! newIsBoolean && typeof activeRule[predType][predNum].value === "boolean") {
			activeRule[predType][predNum].value = descriptors.defaultVal;
			if (predType === "conditions") {
				activeRule[predType][predNum].operator = ">";
			} else if (activeRuleType !== "volition") {
				activeRule[predType][predNum].operator = "+";
			}
		}

		// If we're changing to undirected, remove second.
		if (newDirType === "undirected" && newDirType !== oldDirType) {
			activeRule[predType][predNum].second = undefined;
		}

		// If we're changing to directed or reciprocal, add a second.
		if (newDirType !== "undirected" && newDirType !== oldDirType) {
			activeRule[predType][predNum].second = getOrMakeAppropriateBinding(2, activeRule[predType][predNum]);
		}
	}

	// Update the direction field of a predicate in activeRule.
	var changeDirection = function(predType, predNum, selection) {
		var op;
		if (selection === "more than") {
			op = ">";
		} else if (selection === "less than") {
			op = "<";
		} else if (selection === "more") {
			op = "+";
		} else if (selection === "less") {
			op = "-";
		} else {
			op = "=";
		}
		activeRule[predType][predNum].operator = op;
	}

	// Update the weight field of a predicate in activeRule.
	var changeWeight = function(predType, predNum, selection) {
		var sel = parseInt(selection)
		activeRule[predType][predNum].weight = sel;
	}

	// Update the value field of a predicate in activeRule.
	var changeField = function(field, predType, predNum, selection) {
		activeRule[predType][predNum][field] = selection;
	}

	var deleteField = function(field, predType, predNum) {
		delete activeRule[predType][predNum][field];
	}

	// Update a boolean field of a predicate in activeRule.
	var beVerbToggle = function(predType, predNum) {
		activeRule[predType][predNum].value = !activeRule[predType][predNum].value;
	}

	// Update the intentType field of a predicate in activeRule.
	var intentTypeToggle = function(predType, predNum) {
		activeRule[predType][predNum].intentType = !activeRule[predType][predNum].intentType;
	}

	// Update the role name field of a predicate in activeRule.
	var updateRoleName = function(predType, predNum, isFirst, val) {
		var whichRole = isFirst ? "first" : "second";
		activeRule[predType][predNum][whichRole] = val;
	}

	var changeRuleName = function() {
		var newName = $(this).val();
		activeRule.name = newName;
	}




	return {
		init: init,
		loadRule: loadRule,
		save : save
	}

});