// Module for showing alerts and messages in the CiF Tool.

define(["jquery"], function($){

	var showAlert = function(msg) {
		$("#msgBlock").html(msg).fadeIn(250);
	}

	return {
		showAlert: showAlert
	}

});