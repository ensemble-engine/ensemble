// Module for showing alerts and messages in the ensemble Tool.

define(["jquery"], function($){

	var showAlert = function(msg) {
		$("#msgBlock").html(msg).fadeIn(250);
	}

	var showError = function(msg, details) {
		showAlert("<span class='error'>" + msg + "</span> " + (details || ""));
	}

	return {
		showAlert: showAlert,
		showError: showError
	}

});