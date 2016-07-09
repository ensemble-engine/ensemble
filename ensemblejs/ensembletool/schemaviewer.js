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
			thisBlock += typeList + "</div>";
			var catClass = "schemaCategory";
			if (d.actionable) {
				catClass += " actionable";
			}
			exp += "<div class='" + catClass + "'>" + thisBlock + "</div>";
		}

		$("#infoOnSocialTypes").html(exp);
	}

	return {
		init: init,
		show: show
	}

});