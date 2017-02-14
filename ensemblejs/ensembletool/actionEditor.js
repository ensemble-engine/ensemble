/*
Handles the ability to edit actions. Presents each "actionable" intent twice for each type (for "start dating" / "stop dating")
And for each of those, offers a starter "isAccept" and "isReject" answer.
*/

define(["ensemble", "socialRecord", "util", "jquery"], function(ensemble, socialRecord, util, $){

	
	var intentDisplay = $("#typesTabs");
	var authoringArea = $("#authoringArea");
	var intentTypeList = $("#intentTypeList")

	var init = function() {
		// Setup interface buttons.
		$("button#intentAreaButton").click(intentAreaButtonClick);
		$("button#authoringAreaButton").click(authoringareaButtonClick);
		intentTypeList.append("<li><a href='#tabstrigger'>Start Dating</a></li>");
		intentTypeList.append("<li><a href='#tabsvolition'>Stop Dating</a></li>")
/*
		intentDisplay.append("<ul>" +
  			"<li><a href='#tabstrigger'>Start Dating</a></li>" +
  			"<li><a href='#tabsvolition'>Stop Dating</a></li>" +
  		"</ul>");
  		*/

	}

	var intentAreaButtonClick = function() {
		console.log("INTENT AREA CLICK!")
		/*
		if (interfaceTimestep >= socialRecord.getCurrentTimeStep()) {
			return;
		}
		interfaceTimestep += 1;
		refresh();
		*/
	};

	var authoringareaButtonClick = function() {
		console.log("AUTHORING AREA CLICK!")
		/*
		if (interfaceTimestep <= 0) {
			return;
		}
		interfaceTimestep -= 1;
		refresh();
		*/
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
		refresh: refresh,
		intentAreaButtonClick : intentAreaButtonClick,
		authoringareaButtonClick : authoringareaButtonClick,
		reset: reset

	}

});

