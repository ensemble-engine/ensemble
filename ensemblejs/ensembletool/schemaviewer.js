/*
This module handles the viewer and editor for the currently loaded social schema. 
*/

/*global console */

define(["ensemble", "rulesEditor", "rulesViewer", "jquery"], function(ensemble, rulesEditor, rulesViewer, $){

	var socialStructure;
	var editorCategory;
	var recordsForActiveCategory = {};

	var init = function() {
		// Set up editor change events.
		$("#editorCategoryName").change(function() {
			var newVal = this.value;
			findAndReplace("category", editorCategory, newVal);
		})

		// Set change handlers for form UI
		$("#editorShowDuration").change(function() {
			if (this.checked) {
				$("#editorDurationNumArea").show();
			} else {
				$("#editorDurationNumArea").hide();
				// TODO: Set model to have no duration
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
			var catClass = "schemaCategory";
			if (d.actionable) {
				catClass += " actionable";
			}
			exp += "<div class='" + catClass + "' id='cat_" + categoryName + "'>" + thisBlock + "</div>";
		}
		// Add "New Schema Category" button
		exp += "<div class='schemaCategory'><div class='schemaHeader'><span class='categoryNew'>+ New</span></div><div class='editIcon'><div class='edit1'>&nbsp;</div><div class='edit2'>&nbsp;</div></div></div>"; 
		$("#infoOnSocialTypes").html(exp);

		// Show/Hide edit icon on hover.
		$(".schemaCategory").hover(function() {
			$(this).children(".editIcon").show();
		}, function() {
			$(this).children(".editIcon").hide();
		});

		$(".schemaCategory").click(function() {
			editSchemaCategory($(this).attr("id").split("_")[1]); // i.e. "cat_trait"
		});
	}

	var editSchemaCategory = function(category) {
		editorCategory = category;
		var cat = socialStructure[category];
		var catDescriptors = ensemble.getCategoryDescriptors(category);

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

		// Look up matching records.
		lookupCategoryRecords(category);
		updateExamples(category);

		// Create and show the Schema Editor dialog box, if it's not already open.
		if ($(".ui-dialog").length === 0) {
			$("#schemaEditForm").dialog({
				title: "Edit Schema Category",
				dialogClass: "no-close", // don't show default close bttn
				resizable: false,
				modal: true,
				width: 550,
				buttons: {
					// "Save Changes": function() {
					// 	alert("Not yet implemented.");
					// },
					"Close": function() {
						// TODO: Check to see if there are any input fields with focus that have not been resolved.
						$(this).dialog("destroy");
					}
				}
			});
		}

		initSchemaEdTooltips();
	}

	// Ask Ensemble to get a list of all records for the given category.
	var lookupCategoryRecords = function(category) {
		recordsForActiveCategory.trigger = ensemble.filterRules("trigger", { "category": category} );
		recordsForActiveCategory.volition = ensemble.filterRules("volition", { "category": category} );
		recordsForActiveCategory.socialRecords = ensemble.get({"category": category});
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
			console.log("record", record);
			return "At time " + record.timeHappened + ": " + ensemble.predicateToEnglish(record).text;
		});
		$("#actionsExample").html("?? matching actions.");
	}

	// Show an example for a particular schema item.
	var updateExample = function(itemType, itemName, category, toEnglishFunc) {
		var items = recordsForActiveCategory[itemType];
		var el = $("#" + itemType + "Example");
		if (items && items.length > 0) {
			var sampleItem = items[0];
			var allItems = items.map(toEnglishFunc).map(function(item) {
				return "&bull; " + item;
			}).join("<br>");
			el.html("<span class='edSampleMatch'>" + toEnglishFunc(sampleItem) + "</span> and <span class='edOthers'><span id='edCat_" + itemType + "_" + category + "' title='' class='edHowMany'>" + (items.length-1) + " other</span> <span class='edMatchType'>" + itemName + "</span>");
			$("#edCat_" + itemType + "_" + category).tooltip({content: "<p class='tooltipRuleExamples'>" + allItems + "</p>"});
		} else {
			el.html("No matching <span class='edMatchType'>" + itemName + "</span>.");
		}
	}

	var findAndReplace = function(key, oldVal, newVal) {
		var oldName = editorCategory;
		var category = socialStructure[oldName];
		var descriptors = ensemble.getCategoryDescriptors(oldName);

		// TODO Validation of new value.

		// Update schema in Ensemble
		var blueprint = newBlueprint(descriptors, newVal, category);
		ensemble.updateCategory(oldName, blueprint);

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

		// TODO: Trigger an update to all affected files.

		// Refresh the editor.
		socialStructure = ensemble.getSocialStructure();
		editSchemaCategory(newVal); // refresh view
		show(socialStructure);
		rulesEditor.refresh(); // TODO: It would be nice if we didn't have
		rulesViewer.show();    // to do this by hand from here.

	}

	var newBlueprint = function(descriptors, newName, category) {
		return {
			"category": newName,
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