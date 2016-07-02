// Module for showing alerts and messages in the ensemble Tool.

define(["jquery"], function($){

	var init = function() {
		// Click to disable message block.
		$("#msgBlock").click(function(){
			$(this).stop(true,true).fadeOut();
		});
	}

	var showAlert = function(msg) {
		$("#msgBlock").html(msg).fadeIn(250);
	}

	var showError = function(msg, details) {
		showAlert("<span class='error'>" + msg + "</span> " + (details || ""));
	}

	return {
		init: init,
		showAlert: showAlert,
		showError: showError
	}

});