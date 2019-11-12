/*
This module handles the Ensemble Tool's rule editor view, a rather complex mode that converts rule predicates into editable form fields, and allows editing them to alter/create/delete rules.

The public interface for this module is the "loadRule" function. The module's functionality is split between a "view" object and a "controller" object.
*/

/*global console */

define(["util", "underscore", "socialRecord", "ensemble", "validate", "messages", "ruleTester", "fileio", "jquery"], function(util, _, socialRecord, ensemble, validate, messages, ruleTester, fileio, $){

	var showTestBindingsButton = true;

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

	// A dictionary assigning each key (a unique character binding in this rule) to a number (between 1 and 8). These numbers are used to color the background of the character field a distinct color for each binding.
	var charBindings = {};

	// INIT STUFF

	var init = function(refToViewer, _ruleOriginsTrigger, _ruleOriginsVolition) {
		rulesViewer = refToViewer;
		ruleOriginsTrigger = _ruleOriginsTrigger;
		ruleOriginsVolition = _ruleOriginsVolition;
		activeFileRefByRuleType = {};
		refresh();
	}

	var refresh = function() {
		buildIntentOptions();
		view.showActiveRule();
	}

	// Build two arrays storing (in allTypes) all individual social types in the format "category_type" (i.e. "relationship_friends"), and (in intentTypes) the subset of the former where actionable is true. Technically, we should only need to do this when a new social schema package is loaded; for now we run whenever we load a new rule into the editor.
	var buildIntentOptions = function() {
		intentTypes = [];
		allTypes = [];
		var structure = ensemble.getSocialStructure();
		for (var categoryKey in structure) {
			if (categoryKey === "schemaOrigin") continue;
			var categoryRoster = structure[categoryKey];
			for (var typeKey in categoryRoster) {
				allTypes.push(categoryKey + "_" + typeKey);
				if (structure[categoryKey][typeKey].actionable === true) {
					intentTypes.push(categoryKey + "_" + typeKey);
				}
			}
		}
	}

	// When given a rule object and its type (trigger or volition), create a local copy of it. This will be the editor's version of the rule, and we'll make all changes to this version.
	var loadRule = function(rule, type) {
		charBindings = {};
		util.resetIterator("rulesEdCharBindings");
		util.resetIterator("rulesEdNewChars");
		undoHistory = [];
		undoPosition = -1;
		activeRuleType = type;
		// Close the bindings window if open.
		ruleTester.hide(0);

		activeRule = util.clone(rule);

		activeFile = activeRule.origin;
		origActiveFile = activeFile;
		activeFileRefByRuleType[rule.type] = activeFile;

		if (activeRule.conditions === undefined || activeRule.conditions.length === 0) {
			controller.addPredicate("conditions");
		}
		if (activeRule.effects === undefined || activeRule.effects.length === 0) {
			controller.addPredicate("effects");
		}
		
		controller.addCurrentToUndoHistory();

		view.showActiveRule();
	}


	var view = {

		// Turns a single predicate of type effects or conditions into a set of HTML describing the predicate, tagged with the metadata we'll need to create editor components from elements of the description.
		showPredicate: function(pred, type, ruleNum) {
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
		},

		clearActiveRule: function() {
			$("#tabsEditor").html("No Rule Loaded.");
		},

		// Take the rule in the module variable "activeRule" and show it in editable form on the interface.
		showActiveRule: function() {
			if (activeRule.id === undefined) return;
			var area = $("#tabsEditor");
			area.html("");

			// Show rule-level controls.
			var ruleControls = $("<div/>", {
				class: "edRuleControls"
			});

			var possibleRuleOrigins = view.generateRuleOriginsMenu();
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
			this.addPredicateGroup("conditions", activeArea);
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
			var activeArea = effectsArea;
			this.addPredicateGroup("effects", activeArea);
			area.append(effectsArea);

			// OK, now that we've created all the elements, let's style them with instrumented jQuery UI components! For each unique type of data (binary toggle button, free text field, etc.) we have a specific function that makes an editor component for it: replaceWithClickable, replaceWithTypeMenu, and so forth. Connect the portion of each predicate to the appropriate generator, and responder function for when this field is edited.

			var allowableTypes, dirArray;
			if (activeRuleType === "volition") {
				allowableTypes = intentTypes;
				dirArray = ["more than", "exactly", "less than"];
			} else {
				allowableTypes = allTypes;
				dirArray = ["more", "exactly", "less"];
				this.replaceWithClickable(".edeffectsP .edbeVerb", controller.beVerbToggle);
			}
			
			this.replaceWithClickable(".edconditionsP .edbeVerb", controller.beVerbToggle);
			this.replaceWithClickable(".edintentType", controller.intentTypeToggle);
			this.replaceWithTypeMenu(".edtype", allowableTypes, controller.changeIntent);
			this.replaceWithSimpleMenu(".edconditionsP .eddirection", ["more than", "exactly", "less than"], controller.changeDirection, "direction");
			this.replaceWithSimpleMenu(".edeffectsP .eddirection", dirArray, controller.changeDirection, "direction");
			this.replaceWithLinkedText(".edfirst, .edsecond");
			this.replaceWithSimpleMenu(".edweight", ["+10", "+5", "+3", "+2", "+1", "+0", "-1", "-2", "-3", "-5", "-10"], controller.changeWeight, "weight");
			this.replaceWithTextEntry(".edvalue", "value");

			this.replaceWithTextEntry(".edmoreRecent", "moreRecent"); 
			this.appendWithTimeButtons(".edmoreRecent", "moreRecent");
			this.replaceWithTextEntry(".edlessRecent", "lessRecent");
			this.appendWithTimeButtons(".edlessRecent", "lessRecent");

			this.replaceWithClickable(".newPredicate span", controller.addPredicate);
			this.replaceWithClickable(".remove", controller.removePredicate);

			// Add time-ordered rule toggle.
			this.addTimeOrderedToggle(".clock");

			// Finally, establish handlers for various other buttons and fields.
			$("#undoButton").click(controller.undo);
			$("#redoButton").click(controller.redo);

			$("#saveRule").click(controller.updateActiveRule);
			$("#deleteRule").click(view.deleteRuleDialog);
			$("#testBindings").click(view.activateTestBindings);

			$(".edRuleName").on("input", controller.changeRuleName);
		},

		// Extract the location in the original predicate of a editor component, call the appropriate update function with that data, and redraw the editor interface to show the updated predicate.
		updateRuleAndRedraw: function(el, func, optSelection) {
			var ruleSource = $(el).data("rule-source").split("_");
			var predType = ruleSource[0];
			var predNum = parseInt(ruleSource[1]);
			func(predType, predNum, optSelection);
			view.showActiveRule();
			controller.addCurrentToUndoHistory();
		},

		// Used by showActiveRule() to draw a group of rules in the editor. Currently the only two possible types are "conditions" and "effects".
		addPredicateGroup: function(type, activeArea) {
			var msg;
			var i;
			var len = activeRule[type].length;

			for (i = 0; i < len; i++) {
				msg = this.showPredicate(activeRule[type][i], type, i);

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
		},


		// If the predicate has a time ordered component, clicking the clock icon should delete it and hide the order area. Otherwise, it should add a timeOrdered predicate and show the order area.
		addTimeOrderedToggle: function(selector) {
			var that = this;
			$(selector).each(function() {
				var predId = $(this).attr('id').split("_"); // clock_conditions_0
				var connectedControlBlock = $("#timeControls_"+predId[1]+"_"+predId[2]);
				if (connectedControlBlock.length > 0) {
					$(this).on("click", {"type": predId[1], "num": predId[2]}, that.deleteTimeAndHideControl);
				} else {
					$(this).on("click", {"type": predId[1], "num": predId[2]}, that.addTimeAndShowControl);
				}
			});
		},
		addTimeAndShowControl: function(event) {
			var type = event.data.type;
			var num = event.data.num;
			controller.changeField("turnsAgoBetween", type, num, [1, 2]);		
			view.showActiveRule();
			controller.addCurrentToUndoHistory();
		},
		deleteTimeAndHideControl: function(event) {
			var type = event.data.type;
			var num = event.data.num;
			controller.deleteField("turnsAgoBetween", type, num);
			view.showActiveRule();
			controller.addCurrentToUndoHistory();
		},

		/* GENERATE EDITOR COMPONENT FUNCTIONS */
		// Turn a binary value into a clickable toggle button.
		replaceWithClickable: function(selector, func) {
			$(selector).each(function() {
				var that = $(this);
				var el = $("<button>", {
					click: function(){ view.updateRuleAndRedraw(that, func) },
					html: that.html()
				});
				that.html(el);
			});
		},

		// Replace all matching components with a linked text input box (used for named actors in a predicate, which we want to stay consistent across the entire rule).
		replaceWithLinkedText: function(selector) {
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
				inputEl.on("keyup", controller.onCharNameKeyPress); // NOTE: event should be "input" if we want to capture all changes i.e. copy/paste
				inputEl.on("blur", controller.onCharNameConfirm);

				personIcon.on("click", controller.onPersonIconClick);

			});
		},

		// Replace all matching components with a drop-down menu.
		replaceWithSimpleMenu: function(selector, options, func, type) {
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
						view.updateRuleAndRedraw(that, func, selection);
					 }
				});
				for (var i = 0; i < options.length; i++) {
					el.append("<option value='" + options[i] + "'>" + options[i] + "</option>");
				}
				that.html(el);
				$("#"+id).val(origVal);
			})
		},

		// Replace all matching components with a text-entry field.
		replaceWithTextEntry: function(selector, type) {
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
				inputEl.on("blur", controller.onValueChangeConfirm);
			});
		},

		// Replace all matching components with a drop down menu for selecting a social type, categorizing by class.
		replaceWithTypeMenu: function(selector, options, func) {
			$(selector).each(function() {
				var that = $(this);
				var id = that.data("rule-source")
				var el = $("<select>", {
					id: id,
					name: id,
					change: function(){
						var selInd = $(this)[0].selectedIndex;
						var selection = $(this).context[selInd].value;
						view.updateRuleAndRedraw(that, func, selection);
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
		},

		// Add time-ordered rules controls
		appendWithTimeButtons: function(selector, whichField) {
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
		},

		// Make a drop-down menu showing all possible origin files for this type of rule, plus the option to create a new file. The user can use this to move the active rule to another file.
		generateRuleOriginsMenu: function() {
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
						view.newRulesFileDialog();
					} else {
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
		},

		// Show a dialog handling the situation where the user is making a new source file for rules. We might have called this by trying to create a New Rule and having no place to put it, or by changing the location of an existing rule to a New File.
		newRulesFileDialog: function(onCreate, onCancel) {
			$("#dialogBox")
			.html('<p>Enter name for a new file for <b>' + activeRuleType + '</b> rules.</p><p><form><input type="text" name="newRulesFile" id="newRulesFile" value="" style="width:100%" class="text ui-widget-content ui-corner-all"><input type="submit" tabindex="-1" style="position:absolute; top:-1000px"></form>');
			var dialog = $("#dialogBox").dialog({
				title: "New Rules File",
				resizable: false,
				modal: true,
				width: 350,
				buttons: {
					"Create File": function() {
						controller.makeNewRulesFile($("#newRulesFile").val());
						$(this).dialog("destroy");
						if (onCreate) {
							onCreate(activeRule.origin, activeRuleType, activeRule);
						}
					},
					Cancel: function() {
						$(this).dialog("destroy"); //remove the dialog box
						if (onCancel) {
							onCancel();
						}
					}
				},
			});
			dialog.find("form").on( "submit", function( event ) {
				event.preventDefault();
				controller.makeNewRulesFile($("#newRulesFile").val());
				$(this).dialog("destroy");
			});
		},

		// Show a dialog handling the situation where the user wants to delete the active rule.
		deleteRuleDialog: function() {
			$("#dialogBox")
			.html("Are you sure you want to delete the rule <span style='color:rgb(255, 130, 41)'>" + activeRule.name + "</span> from the file <span style='color:rgb(255, 130, 41)'>" + activeRule.origin + "</span>? This operation cannot be undone.")
			.dialog({
				title: "Confirm Delete Rule",
				resizable: false,
				modal: true,
				width: "40%",
				buttons: {
					"Delete this rule": function() {
						controller.deleteActiveRule();
						$( this ).dialog( "destroy" );
					},
					Cancel: function() {
						$( this ).dialog( "destroy" );
					}
				}
			});
		},

		// Handle clicking the "Test Rule" function (most of this functionality is in the ruleTester.js file).
		activateTestBindings: function() {
			if (!showTestBindingsButton) return;
			ruleTester.toggle();
			controller.updateRuleTester();
		}

	}



	var controller = {

		// Handle the user changing a value in an editor field.
		onValueChangeConfirm: function() {
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

			// For time-ordered rules, ensure the entered values are sensible and in the right format.
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

			// Now, do the actual change.
			controller.changeField(field, source[0], source[1], val);

			// Ensure that the changed rule is valid, and revert the edited field to the old value if not.
			var result = validate.rule(activeRule);
			if (typeof result === "string") {
				// New rule is invalid, probably because entered value doesn't make sense as value for this rule: reset the input field.
				activeRule[source[0]][source[1]].value = oldVal;
				$(this).val(oldVal)
					.focus();
			} else {
				view.showActiveRule();
				controller.addCurrentToUndoHistory();
			}
		},

		// Create a new predicate (either an effect or condition) and add it to activeRule. Generate appropriate defaults from the active social schema package.
		addPredicate: function(predType) {
			var whichTypeList = predType === "effects" ? intentTypes : allTypes;
			var typeInfo = whichTypeList[0].split("_");
			var categoryName = typeInfo[0];
			var type = typeInfo[1];

			var desc = ensemble.getCategoryDescriptors(categoryName);

			var newPred = {};
			newPred.category = categoryName;
			newPred.type = type;
			newPred.first = controller.getOrMakeAppropriateBinding(1);
			if (desc.directionType !== "undirected") {
				newPred.second = controller.getOrMakeAppropriateBinding(2);
			}

			if (predType === "effects") {
				if (activeRuleType === "volition") {
					newPred.weight = 5; // TODO magic number
					newPred.intentType = true;			
				}
			}

			// Volition conditions, trigger conditions, and trigger effects have "value" field, but voltion effects do not
			if ( !( predType === "effects" && activeRuleType === "volition" ) ) {
				newPred.value = desc.isBoolean || desc.defaultVal;
			}

			if (activeRule[predType] === undefined) {
				activeRule[predType] = [];
			}
			activeRule[predType].push(newPred);
		},

		// Remove a predicate from the activeRule.
		removePredicate: function(predType, predNum) {
			activeRule[predType].splice(predNum, 1);
		},

		// Update the "type" of a predicate in the activeRule. This might entail some alterations to the predicate such as adding/removing various fields. (I.e. if we're changing from boolean to numeric, we need an operator field.)
		changeIntent: function(predType, predNum, selection) {
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
			} else if (! newIsBoolean && (!activeRule[predType][predNum].value || typeof activeRule[predType][predNum].value === "boolean")) {
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
				activeRule[predType][predNum].second = controller.getOrMakeAppropriateBinding(2, activeRule[predType][predNum]);
			}
		},

		// Update the direction field of a predicate in activeRule.
		changeDirection: function(predType, predNum, selection) {
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
		},

		// Update the weight field of a predicate in activeRule.
		changeWeight: function(predType, predNum, selection) {
			var sel = parseInt(selection)
			activeRule[predType][predNum].weight = sel;
		},

		// Update the value field of a predicate in activeRule.
		changeField: function(field, predType, predNum, selection) {
			activeRule[predType][predNum][field] = selection;
		},

		// Update a boolean field of a predicate in activeRule.
		beVerbToggle: function(predType, predNum) {
			activeRule[predType][predNum].value = !activeRule[predType][predNum].value;
		},

		// Update the intentType field of a predicate in activeRule.
		intentTypeToggle: function(predType, predNum) {
			activeRule[predType][predNum].intentType = !activeRule[predType][predNum].intentType;
		},

		// Update the role name field of a predicate in activeRule.
		changeRoleName: function(predType, predNum, isFirst, val) {
			var whichRole = isFirst ? "first" : "second";
			activeRule[predType][predNum][whichRole] = val;
		},

		// Change the free-text rule name field.
		changeRuleName: function() {
			var newName = $(this).val();
			activeRule.name = newName;
		},

		// Delete a field from a predicate.
		deleteField: function(field, predType, predNum) {
			delete activeRule[predType][predNum][field];
		},


		// Handle the user pressing keys in a role name field.
		onCharNameKeyPress: function(e) {
			// Treat an enter as a confirm.
			var keyPressed = e.which;
			if (keyPressed === 13) {
				controller.onCharNameConfirm.call(this);
			}

			 // whenever the field changes, also update all other linked texts fields. (Disabled for now, because it means you can't make a new role name. Would be nice to have an ability to auto-rename a role, but requires more UI thinking.)
			// var val = $(this).val();
			// var origVal = $(this).parent().data("type");
			// $(".edchar_" + origVal).each(function() {
			// 	$(this).children("input").val(val);
			// })
		},

		// For a linked text field, when the field is confirmed (loses focus), update the predicate for each occurrence of that name.
		onCharNameConfirm:  function() {
			var val = $(this).val().trim();
			if (val === "") { 
				return;
			}

			var source = $(this).parent().data("rule-source").split("_");
			var isFirst = $(this).parent().hasClass("edfirst");
			controller.changeRoleName(source[0], source[1], isFirst, val);

			var result = validate.rule(activeRule);
			if (typeof result === "string") {
				// New rule is invalid.
				$(this).val("")
					.css({"background-color": "white"})
					.focus();
			} else {
				view.showActiveRule();
				controller.addCurrentToUndoHistory();
			}
		},

		// When the person icon in a name field is clicked, advance it to the next character who does not already appear in this rule.
		onPersonIconClick: function() {

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

			var newChar = controller.getBindingFromColorIndex(colorIndex);
			relatedInput.val(newChar);
			console.log("setting val to " + newChar);

			// If this character already appears in this rule, skip ahead.
			if (( isFirst  && thisPred.second === newChar ) || 
				( !isFirst && thisPred.first === newChar )) {
				console.log("-->but this char already appears in the predicate, so skipping ahead.");
				controller.onPersonIconClick.call(this);
				return;
			}

			// Otherwise, confirm (as if we'd just typed this in. 
			console.log("confirming.");
			controller.onCharNameConfirm.call(relatedInput);

		},

		// Return an appropriate character binding for a newly created predicate or binding slot.
		getOrMakeAppropriateBinding: function(position, optPredicate) {
			var charBindingsLen = _.keys(charBindings).length;
			// Is this the first position? Go with the first character in our store.
			if (position === 1 && charBindingsLen >= 1) {
				return controller.getBindingFromColorIndex(1);
			}
			// Is this the second position? If we didn't provide an optional predicate, go with the second character, if available.
			if (position === 2) {
				if (!optPredicate && charBindingsLen >= 2) {
					return controller.getBindingFromColorIndex(2);
				}
				// If we did provide a predicate, choose the first character who isn't in the first position.
				if (optPredicate) {
					var candidate = optPredicate.first;
					var i = 1;
					while (candidate === optPredicate.first) {
						candidate = controller.getBindingFromColorIndex(i);
						i += 1;
					}
					if (candidate !== undefined && candidate !== "") {
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
		},

		// Reverse looking up in the charBindings dictionary: we know a color index, we want to get the character that corresponds to.
		getBindingFromColorIndex: function(num) {
			for (var key in charBindings) {
				if (charBindings[key] === num) {
					return key;
				}
			}
			console.log("couldn't find charBindings key matching " + num);
			return "";
		},

		// Updates the active rule in Ensemble.
		//if optSkipBackup is true, it won't create a backup file.
		updateRule: function(ruleId, rule, optSkipBackup) {
			var results = ensemble.setRuleById(ruleId, rule);
			if (!results) {
				messages.showAlert("Unable to save rule.");
			} else {
				$("#tabLiRulesViewer a").click();
				rulesViewer.show();
				messages.showAlert("Updated Rule " + ruleId + ".");
				if(fileio.enabled()){
					if (activeFile === "") {
						// Perhaps we're toggling a rule on/off.
						activeFile = rule.origin;
						origActiveFile = activeFile;
					}
					var ruleType = ruleId.split("_")[0];
					controller.saveRulesToDisk(ruleType, rule.origin, optSkipBackup);
					return; // don't save if we aren't working with an actual file.
				}
			}
		},

		updateActiveRule: function(optSkipBackup) {
			if (activeRule.id !== undefined) {
				controller.updateRule(activeRule.id, activeRule, optSkipBackup);
			}
			// activeRule = {}
		},

		// Prepare to save the rules in the active file to disk. (The dirty work is passed off to the fileio module.)
		saveRulesToDisk: function(ruleType, ruleOrigin, optSkipBackup) {
			if (ruleType === "triggerRules") {
				ruleType = "trigger";
			}
			if (ruleType === "volitionRules") {
				ruleType = "volition";
			}
			var rulesOfThisType = ensemble.getRules(ruleType);
			var filteredRules = rulesOfThisType.filter(function(rule) {
				return rule.origin === ruleOrigin;
			});
			fileio.saveRules(ruleType, filteredRules, ruleOrigin, origActiveFile, optSkipBackup); 
		},

		// Set up a new rules file (type based on the active rule). When we're finished we'll call updateActiveRule which will in turn save the rules and the new file to disk.
		makeNewRulesFile: function(rawFileName) {
			var fnParts = rawFileName.split(".");
			// Remove .json suffix if specified
			if (fnParts[fnParts.length-1] === "json") {
				fnParts.length = fnParts.length - 1;
			}
			if (rawFileName.length > 64) {
				// TODO: allow this to generate an appropriate error msg
				//"File name is too long: please use a shorter file name.";
				return false;
			}
			// TODO Check if file already exists.
			var newFileName = fnParts.join(".");

			activeRule.origin = newFileName;
			activeFile = newFileName;

			var ruleOrigins = activeRuleType === "trigger" ? ruleOriginsTrigger : ruleOriginsVolition;
			activeFileRefByRuleType[activeRuleType] = activeFile;
			ruleOrigins.push(newFileName);
			$("#ruleOriginSelect").replaceWith(view.generateRuleOriginsMenu());

			//We're going to save the new file automatically once it is created.
			controller.updateActiveRule();

			return newFileName;
		},

		// Delete the active rule.
		deleteActiveRule: function() {
			var result = ensemble.deleteRuleById(activeRule.id);
			if (result === true) {
				$("#tabLiRulesViewer a").click();
				rulesViewer.show();
				messages.showAlert("Deleted rule " + activeRule.id + ".");
				controller.saveRulesToDisk(activeRuleType, activeRule.origin);
				view.clearActiveRule();
			} else if (activeRule.id !== undefined) {
				messages.showAlert("Unable to delete rule " + activeRule.id + ".");
			}
		},

		// Update the information in the "Test Rule" window.
		updateRuleTester: function() {
			ruleTester.update(_.keys(charBindings), ensemble.getCharacters(), activeRule);		
		},

		// Run whenever we do an action we'd like to be undo-able. Assuming the rule state is valid, add it to the history; otherwise revert back to the last valid history step.
		addCurrentToUndoHistory: function() {
			// Ensure the new rule is valid.
			var result = validate.rule(activeRule);
			if (typeof result === "string") {
				messages.showError("Canceling update: the resulting rule would be invalid.", result);
				activeRule = util.clone(undoHistory[undoPosition]);
				view.showActiveRule();
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
			controller.updateRuleTester();
		},	

		undo: function() {
			if (undoPosition > 0) {
				undoPosition -= 1;
				activeRule = util.clone(undoHistory[undoPosition]);
				view.showActiveRule();
				controller.updateRuleTester();
			}
		},
		redo: function() {
			if (undoPosition < undoHistory.length - 1) {
				undoPosition += 1;
				activeRule = util.clone(undoHistory[undoPosition]);
				view.showActiveRule();
				controller.updateRuleTester();
			}
		}
	}

	var getActiveFile = function(ruleType) {
		return activeFileRefByRuleType[ruleType];
	}

	var getKnownFiles = function(ruleType) {
		if (ruleType === "trigger") {
			return ruleOriginsTrigger;
		} else if (ruleType === "volition") {
			return ruleOriginsVolition;
		} else {
			console.log("Tried to request rule files for unknown type '" + ruleType + "'.");
			return [];
		}
	}

	var setActiveRule = function(rule, ruleType) {
		activeRule = rule;
		activeRuleType = ruleType;
	}

	return {
		init: init,
		refresh: refresh,
		loadRule: loadRule,
		updateRule: controller.updateRule,
		setActiveRule: setActiveRule,
		getActiveFile: getActiveFile,
		getKnownFiles: getKnownFiles,
		deleteActiveRule: controller.deleteActiveRule,
		updateActiveRule: controller.updateActiveRule,
		newRulesFileDialog: view.newRulesFileDialog,
		addPredicate: controller.addPredicate
	}

});