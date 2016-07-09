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
			exp += "<p class='schemaHeader'><span class='categoryName'>" + categoryName + "</span> <span class='categoryInfo'>" + direction + ", " + dataType + (duration !== "" ? ", " + duration : "") + "</span></p>";
			var c = socialStructure[categoryName];
			exp += "<p class='schemaTypes'>";
			var types = [];
			for (var typeName in c) {
				types.push("<span class='schemaType'>" + typeName + "</span>");
			}
			var typeList = types.join(" &bull; ");
			exp += typeList + "<br/>"
		}

		$("#infoOnSocialTypes").html(exp);
	}

	return {
		init: init,
		show: show
	}

});