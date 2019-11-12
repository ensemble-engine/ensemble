define(["ensemble", "socialRecord", "util", "jquery"], function(ensemble, socialRecord, util, $){

	var interfaceTimestep;
	var timeStepDisplay = $("#timestep");
	var historyTableArea = $("#sfdbtable");

	var init = function() {
		// Setup interface buttons.
		$("button#timeStepForward").click(stepForward);
		$("button#timeStepBack").click(stepBack);
		$("button#resetSFDBHistory").click(reset);
	}

	var stepForward = function() {
		if (interfaceTimestep >= socialRecord.getCurrentTimeStep()) {
			return;
		}
		interfaceTimestep += 1;
		refresh();
	};

	var stepBack = function() {
		if (interfaceTimestep <= 0) {
			return;
		}
		interfaceTimestep -= 1;
		refresh();
	};

	var reset = function() {
		socialRecord.clearHistory();
		interfaceTimestep = undefined;
		refresh();
	};


	var refresh = function(newTimeStep) {
		if (newTimeStep !== undefined) {
			interfaceTimestep = newTimeStep;
		}
		if (interfaceTimestep === undefined) {
			interfaceTimestep = socialRecord.getCurrentTimeStep();
		}
		timeStepDisplay.html(interfaceTimestep);
		var socialRecordSlice = socialRecord.getSocialRecordCopyAtTimestep(interfaceTimestep);
		var table = "<table class='sfdb'>";
		for (var i = 0; i < socialRecordSlice.length; i++) {
			var pred = socialRecordSlice[i];
			var desc = ensemble.predicateToEnglish(pred).text;
			// Was this true on prior timestep?
			var wasTrueLastTurn = pred.timeHappened !== interfaceTimestep;
			var descClass = wasTrueLastTurn ? "" : "newEntry";
			var rowClass = pred.isActive === false ? "inactive": "";
			var predObj = util.objToText(pred);
			table += "<tr class='" + rowClass + "'><td><span title='" + predObj + "' class='" + descClass + "'>" + desc + "</span></td></tr>"
		}
		table += "</table>";
		historyTableArea.html(table);
	}

	return {
		init: init,
		stepForward: stepForward,
		stepBack: stepBack,
		refresh: refresh,
		reset: reset

	}

});

