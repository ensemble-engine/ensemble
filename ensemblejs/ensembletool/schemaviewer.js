/*
This module handles the viewer and editor for the currently loaded social schema. 
*/

/*global console */

define(["ensemble", "rulesEditor", "rulesViewer", "historyViewer", "util", "jquery"], function(ensemble, rulesEditor, rulesViewer, historyViewer, util, $){

	var socialStructure;
	var editorCategory;
	var recordsForActiveCategory = {};

	var defaultCategoryName = "New Category";

	var proposedCategory;

	var init = function() {
		// Set up editor change events.
		$("#editorCategoryName").change(function() {
			var newVal = this.value;
			if (proposedCategory === editorCategory) {
				proposedCategory = newVal;
			}
			findAndReplace("category", editorCategory, newVal);
		})

		// Set change handlers for form UI
		// --> Changing duration
		$("#editorShowDuration").change(function() {
			if (this.checked) {
				$("#editorDurationNumArea").show();
			} else {
				$("#editorDurationNumArea").hide();
				// TODO: Set model to have no duration
			}
		});

		// --> Creating a new Type
		// (note: deleting a type is triggered off dynamically created form elements, so we set it up farther down.)
		$("#schemaEdNewType").click(function() {
			var html = $("<div/>", {
				html: "<input id='newTypeInput' />"
			});
			$(html).dialog({
				title: "Create New " + editorCategory + " Type",
				modal: true,
				buttons: {
					"Create": function() {
						var newType = $("#newTypeInput").val();
						addType(newType);
						$(this).dialog("destroy");
					},
					"Cancel": function() {
						$(this).dialog("destroy");
					}
				}
			});
		});

		// --> Changing Direction
		$("input[name=edDirectionType]").change(function() {
			console.log(this.value);
			if (countConflictingRecords() > 0) {
				rejectChange("change the direction of");
				return;
			}
		});
	}

	var initSchemaEdTooltips = function() {
		$("#schemaEditForm label").tooltip();
	}

	var show = function(_socialStructure) {
		socialStructure = _socialStructure;

		// Generate explanatory text.
		var exp = "";
		for (var categoryName in socialStructure) {
			var d = ensemble.getCategoryDescriptors(categoryName);
			var direction = d.directionType;
			var dataType = d.isBoolean ? "boolean" : "numeric";
			var duration = d.duration > 0 ? "duration " + d.duration : "";
			if (!d.isBoolean) {
				dataType += " " + d.min + "-->" + d.max + " (default " + d.defaultVal + ")";
			}
			if (d.duration === 0) {
				duration = "single turn";
			}
			var thisBlock = "<div class='schemaHeader'><span class='categoryName'>" + categoryName + "</span> ";
			if (d.actionable) {
				thisBlock += "<span class='categoryInfo categoryActionable'>actionable</span>, ";
			}
			thisBlock += "<span class='categoryInfo'>" + direction + ", " + dataType + (duration !== "" ? ", " + duration : "") + "</span></div>";
			var c = socialStructure[categoryName];
			thisBlock += "<div class='schemaTypes'>";
			var types = [];
			for (var typeName in c) {
				types.push("<span class='schemaType'>" + typeName + "</span>");
			}
			var typeList = types.join(" &bull; ");
			thisBlock += typeList;
			thisBlock += "</div><div class='editIcon'><div class='edit1'>&nbsp;</div><div class='edit2'>&nbsp;</div></div>"
			var catClass = "schemaCategory existingCategory";
			if (d.actionable) {
				catClass += " actionable";
			}
			exp += "<div class='" + catClass + "' id='cat_" + categoryName + "'>" + thisBlock + "</div>";
		}
		// Add "New Schema Category" button
		exp += "<div class='schemaCategory'><div class='schemaHeader'><span id='categoryNew'>+ New</span></div><div class='editIcon'><div class='edit1'>&nbsp;</div><div class='edit2'>&nbsp;</div></div></div>"; 
		$("#infoOnSocialTypes").html(exp);

		// Show/Hide edit icon on hover.
		$(".schemaCategory").hover(function() {
			$(this).children(".editIcon").show();
		}, function() {
			$(this).children(".editIcon").hide();
		});

		$(".existingCategory").click(function() {
			editSchemaCategory($(this).attr("id").split("_")[1]); // i.e. "cat_trait"
		});

		$("#categoryNew").click(newSchemaCategory);
	}

	var newSchemaCategory = function() {
		// Make a new category with default options. The editor will display different buttons because "proposedCategory" has been set.

		$("#editorCategoryName").val("New Category Name");
		var categoryBlueprint = {
			category: defaultCategoryName,
			isBoolean: true,
			directionType: "directed",
			types: ["default type"],
			defaultValue: false,
			actionable: false
		};
		ensemble.loadBlueprint(categoryBlueprint, 0);
		editorCategory = defaultCategoryName;
		proposedCategory = defaultCategoryName;
		saveToDiskAndRefresh(""); // Will trigger showing editor
	}

	var editSchemaCategory = function(category) {
		editorCategory = category;
		var cat = socialStructure[category];
		var catDescriptors = ensemble.getCategoryDescriptors(category);

		var newCategoryMode = (proposedCategory === category);

		// Populate form with this category's values.
		// ==> Category Name
		$("#editorCategoryName").val(category);

		// ==> Direction
		var correctDirectionButton;
		if (catDescriptors.directionType === "directed") {
			correctDirectionButton = "dirDir";
		} else if (catDescriptors.directionType === "undirected") {
			correctDirectionButton = "dirUn";
		} else {
			correctDirectionButton = "dirRecip";
		}
		$("#" + correctDirectionButton).prop("checked", true);

		// ==> isBoolean, default, min, max
		var correctIsBooleanButton = catDescriptors.isBoolean ? "isBooleanT" : "isBooleanF";
		$("#" + correctIsBooleanButton).prop("checked", true);
		if (catDescriptors.isBoolean) {
			var correctDefaultValButton = catDescriptors.defaultVal ? "defaultValT" : "defaultValF";
			$("#" + correctDefaultValButton).prop("checked", true);
			$("#edDefBoolean").show();
			$("#editorDefaultValue").hide();
			$("#schemaEdMinMax").hide();
		} else {
			$("#edDefBoolean").hide();
			$("#editorDefaultValue").show().val(catDescriptors.defaultVal);
			$("#schemaEdMinMax").show();
			$("#editorMin").val(catDescriptors.min);
			$("#editorMax").val(catDescriptors.max);
		}

		// ==> Duration
		if (catDescriptors.duration === undefined) {
			$("#editorShowDuration").prop("checked", false);
			$("#editorDurationNumArea").hide();
		} else {
			$("#editorShowDuration").prop("checked", true);
			$("#editorDurationNumArea").prop("value", catDescriptors.duration);
			if (catDescriptors.duration !== undefined) {
				$("#editorDuration").val(catDescriptors.duration);
			} else {
				$("#editorDuration").val(3); // some generic starting value.
			}
		}

		// ==> Actionable
		if (catDescriptors.actionable) {
			$("#editorActionable").prop("checked", true);
		}

		// Generate editable field for each category type
		var types = Object.keys(cat);
		$("#schemaEdNormTypes").html("");
		types.forEach(function(type) {
			$("#schemaEdNormTypes").append("<input class='schemaEdType' id='schemaEd_" + type + "' value='" + type + "'/><span class='edTypeDelete' id='schemaEdDelete_" + type + "'>x</span>");
		});

		// Setup handlers for generated items.
		$(".schemaEdType").mouseover(function() {
			lookupCategoryRecords(category, this.value);
		});
		$(".schemaEdType").mouseout(function() {
			if (!$(this).is(':focus')) {
				lookupCategoryRecords(category);
			}
		});
		$(".schemaEdType").focus(function() {
			lookupCategoryRecords(category, this.value);
		});
		$(".schemaEdType").blur(function() {
			lookupCategoryRecords(category);
		});
		$(".schemaEdType").change(function() {
			var newVal = this.value;
			var oldVal = this.id.split("_")[1];
			findAndReplace("type", oldVal, newVal);
		});
		$(".edTypeDelete").mouseover(function() {
			var val = this.id.split("_")[1];
			lookupCategoryRecords(category, val);

		});
		$(".edTypeDelete").mouseout(function() {
			lookupCategoryRecords(category);
		});
		$(".edTypeDelete").click(function() {
			var typeToDelete = this.id.split("_")[1];
			deleteTypeConfirm(typeToDelete);
		});

		// Look up matching records.
		lookupCategoryRecords(category);

		// Create and show the Schema Editor dialog box, if it's not already open.
		if ($(".ui-dialog").length === 0) {
			var buttons;
			if (newCategoryMode) {
				buttons = {
					"Cancel": function() {
						ensemble.updateCategory(proposedCategory);
						editorCategory = undefined;
						$(this).dialog("destroy");
						saveToDiskAndRefresh("");
					},
					"Save": function() {
						proposedCategory = undefined;
						$(this).dialog("destroy");
					}
				}
			} else {
				buttons = {
					"Delete": function() {
						if (countConflictingRecords() > 0) {
							rejectChange("delete");
							return;
						}
						var that = this;
						$("<div/>", {html: "Are you sure you want to delete the category '" + editorCategory + "'? This operation cannot be undone."}).dialog({
							title: "Confirm Delete",
							modal: true,
							buttons: {
								"Cancel": function() {
									$(this).dialog("destroy");
								},
								"Delete": function() {
									ensemble.updateCategory(editorCategory);
									editorCategory = undefined;
									$(that).dialog("destroy");
									$(this).dialog("destroy");
									saveToDiskAndRefresh("");
								}
							}
						});
						
					},
					"Close": function() {
						// TODO: Check to see if there are any input fields with focus that have not been resolved.
						$(this).dialog("destroy");
					}
				};
			}
			$("#schemaEditForm").dialog({
				title: "Edit Schema Category",
				dialogClass: "no-close", // don't show default close bttn
				resizable: false,
				modal: true,
				width: 550,
				buttons: buttons
			});
		}

		initSchemaEdTooltips();
	}

	// Ask Ensemble to get a list of all records for the given category.
	var lookupCategoryRecords = function(category, optType) {
		var pred = { "category": category };
		if (optType) {
			pred.type = optType;
		}
		recordsForActiveCategory.trigger = ensemble.filterRules("trigger", pred);
		recordsForActiveCategory.volition = ensemble.filterRules("volition", pred);
		recordsForActiveCategory.actions = ensemble.filterActions({ "category": category, "type": optType} );
		pred.value = "any"
		recordsForActiveCategory.socialRecords = ensemble.get(pred, -1000, 1000); // get all records, not just those at most recent timestep
		updateExamples(category);
	}

	// Show an example for each of the schema items this category might be involved with. (Punt the work to the updateExample function below.)
	var updateExamples = function(category) {
		updateExample("trigger", "trigger rules", category, function(rule) {
			return rule.name;
		});
		updateExample("volition", "volition rules", category, function(rule) {
			return rule.name;
		});
		updateExample("socialRecords", "social records", category, function(record) {
			return "At time " + record.timeHappened + ": " + ensemble.predicateToEnglish(record).text;
		});
		updateExample("actions", "actions", category, function(action) {
			return action.name;
		});
	}

	// Show an example for a particular schema item.
	var updateExample = function(itemType, itemName, category, toEnglishFunc) {
		var items = recordsForActiveCategory[itemType];
		var el = $("#" + itemType + "Example");
		var noMatch = "No matching <span class='edMatchType'>" + itemName + "</span>."
		if (items && items.length > 0) {
			var sampleItem = items[0];
			if (items.length === 1 && itemType === "socialRecords" && !sampleItem.first) {
				el.html(noMatch);
				return; // Don't show an empty (i.e. default false) predicate as an example
			}
			var allItems = items.map(toEnglishFunc).map(function(item) {
				return "&bull; " + item;
			}).join("<br>");
			el.html("<span class='edSampleMatch'>" + toEnglishFunc(sampleItem) + "</span> and <span class='edOthers'><span id='edCat_" + itemType + "_" + category + "' title='' class='edHowMany'>" + (items.length-1) + " other</span> <span class='edMatchType'>" + itemName + "</span>");
			$("#edCat_" + itemType + "_" + category).tooltip({content: "<p class='tooltipRuleExamples'>" + allItems + "</p>"});
		} else {
			el.html(noMatch);
		}
	}

	var findAndReplace = function(key, oldVal, newVal) {
		var category = socialStructure[editorCategory];
		var descriptors = ensemble.getCategoryDescriptors(editorCategory);

		// TODO Validation of new value.
		if (oldVal.trim() === newVal.trim()) {
			return;
		}

		if (key === "type") {
			category[newVal] = category[oldVal];
			delete category[oldVal];
			category[newVal].type = newVal;
		}
		var categoryNameToEdit = editorCategory;
		if (key === "category") {
			editorCategory = newVal;
		}

		// Update schema in Ensemble
		var blueprint = newBlueprint(descriptors, editorCategory, category);
		ensemble.updateCategory(categoryNameToEdit, blueprint);

		// Update matching rules
		["trigger", "volition"].forEach(function(ruleSet) {
			recordsForActiveCategory[ruleSet].forEach(function(rule) {
				rule.conditions.forEach(function(condition) {
					if (condition[key] === oldVal) {
						condition[key] = newVal;
					}
				});
				rule.effects.forEach(function(effect) {
					if (effect[key] === oldVal) {
						effect[key] = newVal;
					}
				});
				var result = ensemble.setRuleById(rule.id, rule);
			});
		});

		// Update matching social records
		recordsForActiveCategory.socialRecords.forEach(function(record) {
			record[key] = newVal;
			ensemble.setSocialRecordById(record.id, record);
		});

		// Update matching actions
		recordsForActiveCategory.actions.forEach(function(action) {
			action.conditions.forEach(function(condition) {
				if (condition[key] === oldVal) {
					condition[key] = newVal;
				}
			});
			action.effects.forEach(function(effect) {
				if (effect[key] === oldVal) {
					effect[key] = newVal;
				}
			});
			action.influenceRules.forEach(function(rule) {
				if (rule[key] === oldVal) {
					rule[key] = newVal;
				}
			});
			var result = ensemble.setActionById(action.id, action);
		});

		saveToDiskAndRefresh("Name changed.");
	}

	var saveToDiskAndRefresh = function(msg) {
		// TODO: Trigger an update to all affected files.

		// Refresh the editor.
		socialStructure = ensemble.getSocialStructure();
		if (editorCategory) {
			editSchemaCategory(editorCategory); // refresh view
		}
		show(socialStructure);
		rulesEditor.refresh(); // TODO: It would be nice if we didn't have
		rulesViewer.show();    // to do this by hand from here.
		historyViewer.refresh();

		$("#editorMsg").stop(true, true).html(msg).show().fadeOut(3000);
	}

	var addType = function(typeName) {
		typeName = typeName.trim();
		if (socialStructure[editorCategory][typeName]) {
			showRejectMsg("Not Created", "Already a type with this name.");
			return;
		}
		var descriptors = ensemble.getCategoryDescriptors(editorCategory);
		socialStructure[editorCategory][typeName] = util.clone(descriptors);
		socialStructure[editorCategory][typeName].type = typeName;

		// Update schema in Ensemble
		var blueprint = newBlueprint(descriptors, editorCategory, socialStructure[editorCategory]);
		ensemble.updateCategory(editorCategory, blueprint);

		saveToDiskAndRefresh("New type added.");
	}

	var deleteType = function(typeName) {
		var descriptors = ensemble.getCategoryDescriptors(editorCategory);
		delete socialStructure[editorCategory][typeName];

		// Update schema in Ensemble
		var blueprint = newBlueprint(descriptors, editorCategory, socialStructure[editorCategory]);
		ensemble.updateCategory(editorCategory, blueprint);

		saveToDiskAndRefresh("Type deleted.");
	}

	var countConflictingRecords = function() {
		return recordsForActiveCategory.trigger.length + recordsForActiveCategory.volition.length + (recordsForActiveCategory.socialRecords.length-1) + recordsForActiveCategory.actions.length;
	}

	var deleteTypeConfirm = function(typeName) {
		// Make sure nothing uses this type.
		lookupCategoryRecords(editorCategory, typeName);
		if (countConflictingRecords() > 0) {
			rejectChange("delete the type '" + typeName + "' from");
			return;
		}
		// Don't allow the last type to be deleted, since Ensemble expects any category to have at least one type.
		if (Object.keys(socialStructure[editorCategory]).length <= 1) {
			showRejectMsg("Can't Delete", "You can't delete the last type from a category.");
			return;
		}
		// For now, since we're requiring people to delete all references to the type first, we don't need a confirmation.
		// $("<div/>", {html: "Are you sure you want to delete the type '" + typeName + "' from the category '" + editorCategory + "'?"}).dialog({
		// 	title: "Confirm Delete Type",
		// 	modal: true,
		// 	buttons: {
		// 		"Delete": function() {
		// 			deleteType(typeName);
		// 			$(this).dialog("destroy");
		// 		},
		// 		"Cancel": function() {
		// 			$(this).dialog("destroy");
		// 		}
		// 	}
		// });
		deleteType(typeName);
	}

	var showRejectMsg = function(msgHeader, msgBody) {
		$("<div/>", {html: msgBody}).dialog({
			title: msgHeader,
			modal: true,
			buttons: {
				"Ok": function() {
					$(this).dialog("destroy");
				}
			}
		});
	}

	var rejectChange = function(attemptedAction) {
		var numTrigger = recordsForActiveCategory.trigger.length;
		var numVolition = recordsForActiveCategory.volition.length;
		var numSocialRecords = recordsForActiveCategory.socialRecords.length;
		var numActions = recordsForActiveCategory.actions.length;
		var reasons = [];
		if (numTrigger > 0) reasons.push(numTrigger + " trigger rules");
		if (numVolition > 0) reasons.push(numVolition + " volition rules");
		if (numSocialRecords > 1) reasons.push(numSocialRecords + " social records"); // TODO it's "1" b/c of bug where a default gets returned
		if (numActions > 0) reasons.push(numActions + " actions");
		var msg = "You can't " + attemptedAction + " the category '" + editorCategory + "' because your schema still references it:<br><br>" + reasons.join("; ") + "<br><br>Delete all related records and try again.";
		showRejectMsg("Can't Delete", msg);
	}

	var newBlueprint = function(descriptors, catName, category) {
		return {
			"category": catName,
			"isBoolean": descriptors.isBoolean,
			"directionType": descriptors.directionType,
			"duration": descriptors.duration,
			"defaultValue": descriptors.defaultVal, // hmm
			"actionable": descriptors.actionable,
			"maxValue": descriptors.max, // well
			"minValue": descriptors.min, // yep
			"types": Object.keys(category)
		}
	}

	return {
		init: init,
		show: show
	}

});