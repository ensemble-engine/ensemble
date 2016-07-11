/*
This module handles the viewer and editor for the currently loaded social schema. 
*/

/*global console */

define(["ensemble", "jquery"], function(ensemble, $){

	var socialStructure;

	var init = function() {

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
		var html = "<div id='schemaEditForm'>";
		html += "<div><label for='editorCategoryName'>Category Name</label> <input id='editorCategoryName' type='text' value='" + category + "'/></div>";
		html += "<div><label for='editorIsBoolean'>Data Type</label> <input type='radio' id='isBooleanT' name='isBoolean' value='T'>True/False <input type='radio' id='isBooleanF' name='isBoolean' value='F'>Number</div>";
		html += "<div><label for='editorDirection'>Direction</label> <input type='radio' id='dirUn' name='directionType' value='undirected'>Undirected <input type='radio' id='dirDir' name='directionType' value='directed'>Directed <input type='radio' id='dirRecip' name='directionType' value='reciprocal'>Reciprocal</div>";
		html += "<div><label for='editorDefaultValue'>Default</label> ";
		if (catDescriptors.isBoolean) {
			html += "<input type='radio' id='defaultValT' name='defaultValue' value='T'>True <input type='radio' id='defaultValF' name='defaultValue' value='F'>False";
		} else {
			html += "<input id='editorDefaultValue' type='text' value='" + catDescriptors.defaultVal + "'/>"
		}
		html += "</div>";

		// min/max
		if (!catDescriptors.isBoolean) {
			html += "<div><label for='editorMin'>Min/Max</label> <input id='editorMin' type='text' value='" + catDescriptors.min + "'/> <input id='editorMax' type='text' value='" + catDescriptors.max + "'/></div>";
		}

		// Duration
		html += "<div><label for='editorShowDuration'>Duration?</label> <input id='editorShowDuration' type='checkbox'/> <span id='editorDurationNumArea'><input id='editorDuration' type='text' value='" + (catDescriptors.duration || 3) + "'/></span></div>";

		// actionable
		html += "<div><label for='editorActionable'>Actionable?</label> <input id='editorActionable' type='checkbox'/></div>";

		// Types
		html += "<div><label>Types</label> ";
		var types = Object.keys(cat);
		types.forEach(function(type) {
			html += "<input class='schemaEdType' id='schemaEd_" + type + "' value='" + type + "'/> ";
		});
		html += "<span class='schemaEdType schemaEdNewType'>(new)</span> ";
		html += "</div>"

		$("#dialogBox").html(html);

		// Set proper values
		var correctIsBooleanButton = catDescriptors.isBoolean ? "isBooleanT" : "isBooleanF";
		$("#" + correctIsBooleanButton).prop("checked", true);

		var correctDirectionButton;
		if (catDescriptors.directionType === "directed") {
			correctDirectionButton = "dirDir";
		} else if (catDescriptors.directionType === "undirected") {
			correctDirectionButton = "dirUn";
		} else {
			correctDirectionButton = "dirRecip";
		}
		$("#" + correctDirectionButton).prop("checked", true);

		if (catDescriptors.isBoolean) {
			var correctDefaultValButton = catDescriptors.defaultVal ? "defaultValT" : "defaultValF";
		}
		$("#" + correctDefaultValButton).prop("checked", true);

		if (catDescriptors.duration === undefined) {
			$("#editorShowDuration").prop("checked", false);
			$("#editorDurationNumArea").hide();
		} else {
			$("#editorShowDuration").prop("checked", true);
			$("#editorDurationNumArea").prop("value", catDescriptors.duration);
		}
		if (catDescriptors.actionable) {
			$("#editorActionable").prop("checked", true);
		}

		$("#editorShowDuration").change(function() {
			if (this.checked) {
				$("#editorDurationNumArea").show();
			} else {
				$("#editorDurationNumArea").hide();
				// TODO: Set model to have no duration
			}
		});

		var editor = $("#dialogBox").dialog({
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
		})
	}

	return {
		init: init,
		show: show
	}

});