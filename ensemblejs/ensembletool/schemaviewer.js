/*
This module handles the viewer and editor for the currently loaded social schema. 
*/

/*global console */

define(["ensemble", "jquery"], function(ensemble, $){

	var socialStructure;

	var init = function() {
		
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

		$(".schemaCategory").click(editSchemaCategory);
	}

	var editSchemaCategory = function() {
		var category = $(this).attr("id").split("_")[1]; // i.e. "cat_trait"
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
			$("#schemaEdNormTypes").append("<input class='schemaEdType' id='schemaEd_" + type + "' value='" + type + "'/> ");
		});

		// Set change handlers for form UI
		$("#editorShowDuration").change(function() {
			if (this.checked) {
				$("#editorDurationNumArea").show();
			} else {
				$("#editorDurationNumArea").hide();
				// TODO: Set model to have no duration
			}
		});


		// Create and show the Schema Editor dialog box.
		var editor = $("#schemaEditForm").dialog({
			title: "Edit Schema Category",
			resizable: false,
			modal: true,
			width: 550,
			buttons: {
				"Save Changes": function() {
					alert("Not yet implemented.");
				},
				Cancel: function() {
					$(this).dialog("destroy");
				}
			}
		});

		initSchemaEdTooltips();
	}

	return {
		init: init,
		show: show
	}

});