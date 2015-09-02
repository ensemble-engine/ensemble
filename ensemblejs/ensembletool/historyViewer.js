define(["ensemble", "sfdb", "util", "jquery"], function(ensemble, sfdb, util, $){

	var interfaceTimestep;
	var timeStepDisplay = $("#timestep");
	var historyTableArea = $("#sfdbtable");

	var stepForward = function() {
		if (interfaceTimestep >= sfdb.getCurrentTimeStep()) {
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
		sfdb.clearHistory();
		interfaceTimestep = undefined;
		refresh();
	};


	var refresh = function(newTimeStep) {
		if (newTimeStep !== undefined) {
			interfaceTimestep = newTimeStep;
		}
		if (interfaceTimestep === undefined) {
			interfaceTimestep = sfdb.getCurrentTimeStep();
		}
		timeStepDisplay.html(interfaceTimestep);
		var sfdbSlice = sfdb.getSFDBCopyAtTimestep(interfaceTimestep);
		var table = "<table class='sfdb'>";
		for (var i = 0; i < sfdbSlice.length; i++) {
			var pred = sfdbSlice[i];
			var desc = ensemble.predicateToEnglish(pred).text;
			// Was this true on prior timestep?
			var wasTrueLastTurn = pred.timeHappened !== interfaceTimestep;
			var descClass = wasTrueLastTurn ? "" : "newEntry";
			var predObj = util.objToText(pred);
			table += "<tr><td><span title='" + predObj + "' class='" + descClass + "'>" + desc + "</span></td></tr>"
		}
		table += "</table>";
		historyTableArea.html(table);
	}

	return {
		stepForward: stepForward,
		stepBack: stepBack,
		refresh: refresh,
		reset: reset

	}

});

