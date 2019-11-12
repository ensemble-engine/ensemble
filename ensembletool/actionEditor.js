/*
Handles the ability to edit actions. Presents each "actionable" intent twice for each type (for "start dating" / "stop dating")
And for each of those, offers a starter "isAccept" and "isReject" answer.
*/

define(["ensemble", "socialRecord", "util", "jquery"], function(ensemble, socialRecord, util, $){

	
	var intentDisplay = $("#typesTabs");
	var authoringArea = $("#authoringArea");
	var listOfActionsArea = $("#listOfActionsDiv");
	var actionEditorArea = $("#tabsActionEditor");

	var init = function() {
		// Setup interface buttons.
		var socialStructure = ensemble.getSocialStructure();
		console.log("Here is the social structure FROM INIT: " , socialStructure);
		
		//NOTE: WE PROBABLY WANT TO MOVE THE CONTENTS OF REFRESH INTO INIT;
		//REFRESH IS AN ARTIFACT OF AN INITIAL ATTEMPT THAT USED TO CALL 
		//actionEditor.init() IN THE WRONG PLACE.
		refresh();
		intentDisplay.tabs(
			{activate: function( event, ui ) {
				console.log("hi you clicked me!")
			}}).addClass( "ui-tabs-vertical ui-helper-clearfix" );
		

		$("button#intentAreaButton").click(intentAreaButtonClick);
		$("button#authoringAreaButton").click(authoringareaButtonClick);




		//intentTypeList.append("<li><a href='#tabstrigger'>Start Dating</a></li>");
		//intentTypeList.append("<li><a href='#tabsvolition'>Stop Dating</a></li>")
/*
		intentDisplay.append("<ul>" +
  			"<li><a href='#tabstrigger'>Start Dating</a></li>" +
  			"<li><a href='#tabsvolition'>Stop Dating</a></li>" +
  		"</ul>");
  		*/

	}

	var intentAreaButtonClick = function() {
		console.log("INTENT AREA CLICK!")
		var socialStructure = ensemble.getSocialStructure();
		console.log("Umm.. maybe this has made the socialStructure better? " , socialStructure);
		console.log("Um, I think this is what was clicked?" , event.target.parentElement.id);
		console.log("Uh, what about event? " , event);
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
		var socialStructure = ensemble.getSocialStructure();
		console.log("Umm.. maybe this has made the socialStructure better? " , socialStructure);
		/*
		if (interfaceTimestep <= 0) {
			return;
		}
		interfaceTimestep -= 1;
		refresh();
		*/
	};


	var refresh = function() {

		console.log("hello! You just clicked the action editor tab! ")
		var socialStructure = ensemble.getSocialStructure();
		console.log("Umm.. maybe this has made the socialStructure better? " , socialStructure);

		for(var categoryKey in socialStructure){
			var category = socialStructure[categoryKey];
			console.log("A CATEGORY: " , categoryKey)
			console.log("Here's a category " , category)
			for (var typeKey in category){
				console.log("A TYPE: " , typeKey)
				var type = category[typeKey]
				console.log("Here's a type" , type)
				var noWhiteSpaceTypeKey = typeKey.replace(/\s/g,'')
				var buttonID = "actionEditorButton-"+noWhiteSpaceTypeKey;
				console.log("Here is a button id? " + buttonID)
				listOfActionsArea.append("<div><div id="+buttonID+" class='actionEditorButton'>" + typeKey + "</div></div>");
				//listOfActionsArea.append("<button id="+buttonID+" class='actionEditorButton'>" +typeKey + "</div>");
				
				var myNewButton = $("#" + buttonID);
				myNewButton.button();
				myNewButton.click(intentAreaButtonClick);

				//<li><a href="#tabstrigger">Trigger</a></li>

			}
		}

		/*
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

		*/
	}

	return {
		init: init,
		refresh: refresh,
		intentAreaButtonClick : intentAreaButtonClick,
		authoringareaButtonClick : authoringareaButtonClick,

	}

});

