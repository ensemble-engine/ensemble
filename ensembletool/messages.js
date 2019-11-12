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


	var dialog = function(title, message, options, buttons) {
		var showCancel = options && options.cancel === true;
		if (showCancel) {
			buttons.Cancel = function() {
				$(this).dialog("destroy");
			}
		}
		$("<div/>", {id: "modalDialog", html: message}).dialog({
			title: title,
			modal: true,
			buttons: buttons
		});
	}

	var getFileDialog = function() {
		// We need to do this awkward thing to clear any handlers assigned to the file dialog the last time we used it.
		var oldChooser = document.querySelector('#fileDialog');
		var newChooser = oldChooser.cloneNode(true);
		oldChooser.parentNode.replaceChild(newChooser, oldChooser);
		return newChooser;		
	}

	return {
		init: init,
		showAlert: showAlert,
		showError: showError,
		dialog: dialog,
		getFileDialog: getFileDialog
	}

});