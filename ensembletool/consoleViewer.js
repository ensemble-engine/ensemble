/*
This module handles the Ensemble Tool's console view, where commands can be typed to display info about the current social state.
*/

/*global console */

define(["ruleTester", "jquery", "underscore", "util"], function(ruleTester, $, _, util){

	// Configurable params
	var maxValidNumberOfIntents = 10;
	var maxValidNumberOfActionsPerIntent = 10;
	var maxActionsPerGroup = 1;

	// Internal variables
	var ensemble;
	var socialRecord;
	var characters;
	var socialStructure;
	var fullCharacters;
	var consoleHistory = [];
	var historyPos = -1;
	var storedVolitions;

	var init = function() {
		// Set up console command tooltips.
		$("#cmdSet").tooltip({content: "<p>Use <b>set</b> to change any social fact. Parameter order doesn't matter except for character order in directed facts:</p><ul><li><b>set(Bob, Al, friends)</b></li><li><b>set(bob, trust, al, 75)</b></li><li><b>set(happy, al)</b></li><li><b>set(carla, attracted to, bob, false)</b></li></ul>"});
		$("#cmdUnset").tooltip({content: "<p>Use <b>unset</b> to make a boolean value false:</p><ul><li><b>unset(al, happy)</b></li><li><b>unset(al, involved with, veronica)</b></li></ul>"});
		$("#cmdVolitions").tooltip({content: "<p>Use <b>volitions</b> to see the current ranked volitions from the first character to the second.</p><ul><li>volitions(al, bob)</b> :: <i>shows what changes in the social state Al most wants towards Bob</i></li><li>volitions(Carla)</b> :: <i>Shows Carla's volitions towards everyone else.</i></li></ul>"});
		$("#cmdNext").tooltip({content: "<p>Use <b>next</b> to advance the timestep.</p><ul><li><b>next()</b></li></ul>"});
		$("#cmdShow").tooltip({content: "<p>Use <b>show</b> to see all currently true info about a character.</p><ul><li><b>show(diane)</b></li></ul>"});
		$("#cmdActions").tooltip({content: "<p>Use <b>actions</b> to see an ordrered list of actions the first character wants to take towards the second.</p><ul><li><b>actions(al, diane)</b> :: <i>shows the actions Al wants to take towards Diane</i></li><li><b>actions(al)</b> :: <i>shows the actions Al wants to take towards everyone.</i></li></ul>"});
		$("#cmdDoAction").tooltip({content: "<p>Use <b>doAction</b> to perform an action from the first character to second. The social state will be updated to reflect the results of the actions. Use the <b>actions</b> command to get the numbers of potential actions.</p><ul><li><b>doAction(al, diane, 0)</b> :: <i>performs 'action 0' from Al to Diane</i></li><li><b>doAction(bob, jane, reminisce)</b> :: <i> Make Bob reminisce with Jane.</i></li></ul>"});

		document.getElementById("command").onkeyup = keyPress;
		document.getElementById("command").onchange = keyPress;

	}

	// Hook up the console's local variables to the main tool's data structure holding the current Ensemble state.
	var updateRefs = function(ensembleRef, socialRecordRef, charactersRef, fullCharactersRef, socialStructureRef) {
		ensemble = ensembleRef;
		socialRecord = socialRecordRef;
		characters = charactersRef;
		fullCharacters = fullCharactersRef;
		socialStructure = socialStructureRef;
	}


	// Show the results of a console command on the screen.
	var cmdLog = function(msg, notAnError) {
		var cr = $("#consoleResults");
		var classes = "ensemblelog" + (notAnError ? "" : " ensemblelogerror");
		cr.append("<p class='" + classes + "'>" + msg + "</p>");
		var t = $("#tabsConsole");
		t[0].scrollTop = t[0].scrollHeight;
	};


	// ****************************************************************
	// CONSOLE COMMANDS 
	// ****************************************************************

	// Handle the "next" console command (advance timestep)
	var doNext = function() {
		ensemble.setupNextTimeStep();
		var curr = socialRecord.getCurrentTimeStep();
		var logMsg = "ensemble timestep advanced to " + curr + ".<br/>";

		// Run Trigger rules.
		logMsg += runTriggerRules() + "<br/>";

		// Run volition rules.
		logMsg += runVolitionRules();

		return cmdLog(logMsg, true);
	}

	// Handle the "show" console command (display all true facts about the given character).
	var doShow = function(char) {
		var i, res, desc;
		var resultPrimary = ensemble.get({"first": char});
		var resultSecondary = ensemble.get({"second": char});
		var logMsg = "<table><tr><td>";
		for (i = 0; i < resultPrimary.length; i++) {
			res = resultPrimary[i];
			desc = ensemble.getCategoryDescriptors(res.category)
			logMsg += ensemble.predicateToEnglish(res).text;
			if (desc.directionType === "reciprocal") {
				logMsg += " (R)";
			}
			if (res.duration !== undefined && res.duration > 0) {
				logMsg += " (expires in " + res.duration + " turns)";
			}
			logMsg += "<br/>";
		}
		if (resultPrimary.length === 0) {
			logMsg += "<i>No entries with this character as 'first'</i>";
		}
		logMsg += "</td></tr><tr><td>";
		for (i = 0; i < resultSecondary.length; i++) {
			res = resultSecondary[i];
			desc = ensemble.getCategoryDescriptors(res.category)
			if (desc.directionType === "reciprocal") {
				continue;
			}
			logMsg += ensemble.predicateToEnglish(res).text + "<br/>";
		}
		if (resultSecondary.length === 0) {
			logMsg += "<i>No entries with this character as 'second'</i>";
		}
		logMsg += "</td></tr></table>"
		return cmdLog(logMsg, true);
	}

	// Handle the "volitions" console command (show current volitions from first character to second).
	var doVolitions = function(char1, char2) {
		var i;
		var logMsg = "<table>";
		if (storedVolitions === undefined) {
			storedVolitions = ensemble.calculateVolition(characters);
		}
		var vol = storedVolitions.getFirst(char1, char2);
		while (vol !== undefined) {
			// Show the person's reasons for taking this action.
			logMsg += "<tr><td><span class='volitionType'>" + ensemble.predicateToEnglish(vol).text + "</span></td><td><span class='volitionExplanation'>Because:<br/>";
			for (i = 0; i < vol.englishInfluences.length; i++) {
				var inf = vol.englishInfluences[i];
				logMsg += "<span title='" + inf.englishRule + "'>" + inf.ruleName + " (" + inf.weight + ")</span><br/>";
			}

			// Show the responder's reasons for accepting or rejecting.
			logMsg += "</span></td><td><span class='volitionExplanation'><b>" + char2 + " would ";
			var acceptedObj = storedVolitions.isAccepted(char1, char2, vol);
			logMsg += acceptedObj.accepted ? "<span class='accepted'>accept</span>" : "<span class='rejected'>reject</span>";
			logMsg += " (" + acceptedObj.weight + ")</b>, because:<br/>";
			if (acceptedObj.reasonsWhy.length > 0) {
				var reasons = acceptedObj.reasonsWhy[0].englishInfluences;
				for (i = 0; i < reasons.length; i++) {
					var reason = reasons[i];
					logMsg += "<span title='" + reason.englishRule + "'>" + reason.ruleName + " (" + reason.weight + ")</span><br/>";
				}
			} else {
				logMsg += "<i>default (no matching rules)</i>"
			}
			logMsg += "</td></tr>"

			// Retrieve the next volition and continue the while loop if it's not undefined.
			vol = storedVolitions.getNext(char1, char2);
		}
		logMsg += "</table>"
		return cmdLog(logMsg);
	}

	// Handle the "actions" console command (show the current actions that the first character wants to take towards the second.)
	var doActions = function(char1, char2){
		var i;
		var logMsg = "<table>";
		var actions = [];
		if (storedVolitions === undefined) {
			storedVolitions = ensemble.calculateVolition(characters);
		}

		//Right now, we specify a large number for maximum intents, and maximum actions per intent.
		actions = ensemble.getActions(char1, char2, storedVolitions, characters, maxValidNumberOfIntents, maxValidNumberOfActionsPerIntent, maxActionsPerGroup);

		//Go through each action, and add a row in a table to display to the user saying the name of the action
		//the effects that would transpire if they were to do it.
		for(i = 0; i < actions.length; i += 1){
			logMsg += "<tr><td><span class='actionType'> [" + i + "] " + char1 + " wants to " + actions[i].name + " with " + char2 + " (" + actions[i].weight + ") </span></td>";
			logMsg += "<td>Intent: " + actions[i].lineage.substr(0, actions[i].lineage.indexOf("-")) + "</td>";
			logMsg += "<td>This will become true:<BR><ul>";
			for(var j = 0; j < actions[i].effects.length; j += 1){
				var englishEffect = ensemble.predicateToEnglish(actions[i].effects[j]);
				logMsg += "<li>" + englishEffect.text;
			}
			logMsg += "</ul></td></tr>";
		}
		
		logMsg += "</table>";
		return cmdLog(logMsg);
	};

	// Handle the "doAction" console command, performing the given action from the first character to the second.
	var doDoAction = function(char1, char2, action, isAccepted){

		isAccepted = false;
		if(action.isAccept === undefined || action.isAccepted === true){
			isAccepted = true;
		}
		cmdLog("<b>" + char1 + "</b> is doing action <b>" + action.name + "</b> with <b>" +char2+ "</b> accepted: <b>" + isAccepted + "</b>", true);
		cmdLog("<b> CHANGED SOCIAL STATE: </b><BR>-----------------", true);
	
		//Let's grab the appropriate set of effects.
		var effects = action.effects;

		for(var i = 0; i < effects.length; i += 1){
			//Get information based on the category of the effect (such as the direction)
			var categoryName = effects[i].category;
			var d = ensemble.getCategoryDescriptors(categoryName);
			var directionType = d.directionType;

			//Helper string; if the value of the effect is false, say that the character does NOT have this state anymore.
			var notString;
			notString = "is now";
			if(effects[i].value === false && d.isBoolean){
				notString = "is no longer";
			}

			//Tack on a helpful note at the end of the console message if 
			//the 'effect' we are setting isn't actually a change from the current social state.
			var origValue = ensemble.get(effects[i]);
			var alreadyTrue;
			if(d.isBoolean){
				var alreadyTrue = origValue.length > 0;
			}
			var alreadyTrueString = "";
			if(alreadyTrue){
				alreadyTrueString = "(FYI, this was already true)";
			}

			//Actually update the socialRecord!
			ensemble.set(effects[i]);

			//Grab a reference to the new value, whatever it is
			//(i.e., we are letting ensemble to the adding/subtrating from the previous value for us.)
			var newValue = ensemble.get(effects[i]);
			var newNumber;
			if(!d.isBoolean){
				newNumber = newValue[0].value;
			}

			//Adding a little thing if we are dealing with a number.
			var newValueString = "";
			if(!d.isBoolean){
				newValueString = newNumber;
			}

			//Print out a message to the console letting the user know what changed.
			if(directionType === "undirected"){
				//only involves one person
				cmdLog("<b>" + effects[i].first + "</b> " + notString + " <b>" + effects[i].type + "</b> " + newValueString + " " + alreadyTrueString, true);
			}
			else if(directionType === "directed" || directionType === "reciprocal"){
				// it is directed or recipricol; involves two people
				cmdLog("<b>" + effects[i].first + "</b> " + notString + " <b>" + effects[i].type + "</b> " + newValueString + " <b> " +effects[i].second + "</b> " + alreadyTrueString, true);
			}
		}

		cmdLog("-----------------", true);

		//And now I guess I want to run the trigger rules?
		var logMsg = runTriggerRules() + "<br/>" + runVolitionRules();
		cmdLog(logMsg, true);
	};


	// ****************************************************************
	// CONSOLE OPERATIONS 
	// ****************************************************************

	// Take a raw string and attempt to process it as a console command, rejecting it or calling an appropriate function to actually carry out the results of a valid command.
	var processCommand = function(cmd) {

		var params;

		if (socialStructure === undefined) {
			return cmdLog("No social structure loaded.");
		}
		if (characters === undefined) {
			return cmdLog("No characters loaded.");
		}

		// Utility function for processCommand to show an error if the wrong number of a certain type of parameter was found.
		var foundInBounds = function(found, desc, min, max) {
			if (found.length < min || found.length > max) {
				var msg = "found " + found.length + " " + desc + " references (" + found.join(", ") + ") but expected ";
				if (min === max) {
					msg += min + ".";
				} else {
					msg += "between " + min + " and " + max + ".";
				}
				cmdLog(msg);				
				return false;
			}
			return found;
		}

		// Utility function "extract": returns an array of ordered matched items, removing them from the "params" array. Crash with an explanatory message if the wrong number of matches is found.
		var extract = function(matchList, desc, min, max) {
			var pos = 0;
			var found = [];
			while (pos < params.length) {
				if (matchList.indexOf(params[pos]) >= 0) {
					found.push(params[pos]);
					params.splice(pos, 1);
				} else {
					pos += 1;
				}
			}
			return foundInBounds(found, desc, min, max);
		}

		// Utility function charExtract is like extract, but specific to characters, allowing console user to type the printed name of a character and have that be recognized as a character ID.
		var charExtract = function(charDict, desc, min, max) {
			var pos = 0;
			var found = [];
			var charKeys = _.keys(charDict);
			while (pos < params.length) {
				var foundThisTime = 0;
				for (var i = 0; i < charKeys.length; i++) {
					//we want either their printed name OR their id name to be acceptable...
					if (charDict[charKeys[i]].name.toLowerCase() === params[pos] || charKeys[i].toLowerCase() === params[pos]) {
						found.push(charKeys[i]);
						params.splice(pos, 1);
						foundThisTime += 1;
					}
				}
				if (foundThisTime === 0) {
					pos += 1;
				}
			}
			return foundInBounds(found, desc, min, max);
		}

		// BEGIN processCommand

		// Echo the command typed to the console.
		cmdLog("&gt; <b>" + cmd + "</b>", true);

		var value = true;
		var chars;
		var logMsg;
		var i;

		// Get the command and its parameters.
		cmd = cmd.toLowerCase();
		params = cmd.split(/[(),;]/g);
		params = params.map(function(x){ return x.trim() });

		var command = params.shift();
		params = _.without(params, "");

		// command is now a string, the "verb" of the command (like "show"), and params is an array of parameters.

		// Process each possible command.
		if (command === "next") {	
			return doNext();
		}

		if (command === "dump") {
			console.log(socialRecord.dumpSocialRecord());
			return;
		}

		if (command === "show") {
			chars = charExtract(fullCharacters, "characters", 1, 1);
			if (!chars) return;
			return doShow(chars[0]);
		}

		if (command === "volitions") {
			chars = charExtract(fullCharacters, "characters", 1, 2);
			if (chars.length === 1) {
				// Run for every other character.
				for (var j = 0; j < characters.length; j++) {
					if (characters[j] === chars[0]){} // continue; // actually characters can have actions towarsd themselves now.
					processCommand("volitions(" + chars[0] + "," + characters[j] + ")"); 
				}
				return;
			}
			if (!chars) return;
			return doVolitions(chars[0], chars[1]);
		}

		if (command === "actions") {
			
			//This currently doesn't allow the user to specify 'numIntents' and 'numActionsPerIntent'
			//It makes the 'sorting' of actions a lot easier, and it also is less parameters for the user to keep track of.
			//Still, this might be something we'll want to revisit someday.
			
			//I think we can (and should) still extract the characters in the same way.
			chars = charExtract(fullCharacters, "characters", 1, 2);

			//And if only one character was specified, we'll re-run the command for every possible set of characters.
			if(chars.length === 1){
				//run for every other character.
				for (var j = 0; j < characters.length; j++){
					if (characters[j] === chars[0]) {} //continue; -- we actually WANT people to form actions towards each other!
					processCommand("actions(" + chars[0] + "," + characters[j] + ")");
				}
				return;
			}
			if (!chars) return;
			return doActions(chars[0], chars[1]);
		}

		if (command === "doaction"){

			//Grab the characters from the string.
			chars = charExtract(fullCharacters, "characters", 1, 2);
			if (!chars) return;
			var char1 = chars[0];
			var char2;
			if(chars.length < 2){
				//they only specified one character, assume they are referring to a 'self' action
				char2 = chars[0];
			}
			else{
				char2 = chars[1];
			}

			if (storedVolitions === undefined) {
				storedVolitions = ensemble.calculateVolition(chars);
			}

			//just get ALL the potential actions, by passing in the maximum possible values of everything.
			var potentialActions = ensemble.getActions(char1, char2, storedVolitions, characters, maxValidNumberOfIntents, maxValidNumberOfActionsPerIntent, maxActionsPerGroup);

			//Get the list of all possible action names that exist.
			var validEntries = [];
			for(var i = 0; i < potentialActions.length; i+= 1){
				validEntries.push(potentialActions[i].name.toLowerCase());
				validEntries.push(i.toString());
			}

			//So, this will catch two things:
			//1.) If they typed in a nonsense action that doesn't exist
			//2.) They typed in an 'action number' that is invalid (i.e. bigger than the numuber of actions the 
			//characters had volitions for.)
			var actionMatch = extract(validEntries, "recognized action", 1, 1);
			if (!actionMatch){
				return;
			} 
			var actionSearch = actionMatch[0];

			//So, at this point, we still don't actually quite know if they typed in 
			//an action name or an action number. However, we do know the list of all
			//acceptable names and numbers. Check to see if what they typed IS acceptable!
			var desiredAction;
			for(i = 0; i < potentialActions.length; i += 1){
				if(potentialActions[i].name.toLowerCase() === actionSearch || i.toString() === actionSearch){
					desiredAction = potentialActions[i];
					break; // if we got it, we got it! Get outta here!
				}
			}

			//And now we can actually hope to do the action!
			return doDoAction(char1, char2, desiredAction);
		}

		if (command === "unset") {
			value = false;
			command = "set";
		}

		if (command === "set") {

			// Look for one or two characters. Preserve the order.
			chars = charExtract(fullCharacters, "characters", 1, 2);

			if (!chars) return;

			// Reject commands with the same character multiple times.
			if (chars.length === 2 && chars[0] === chars[1]) {
				return cmdLog("Can't reference the same character twice.");
			}

			// Look for a type word and determine its category.
			var allTypes = [];
			for (var categoryName in socialStructure) {
				if (categoryName == "schemaOrigin") continue;
				var c = socialStructure[categoryName];
				for (var type in c) {
					allTypes.push(type);
				}
			}

			var typeMatch = extract(allTypes, "recognized social type", 1, 1);
			if (!typeMatch) return;
			var type = typeMatch[0];
			var categoryName = ensemble.getCategoryFromType(type);
			if (!categoryName) {
				return cmdLog("Did not recognize '" + type + "' as a registered type within a social scheme.");
			}
			var categoryDetails = ensemble.getCategoryDescriptors(categoryName);

			// If undirected, we should have found one character.
			if (categoryDetails.directionType === "undirected") {
				if (chars.length !== 1) {
					return cmdLog("Included more than one character, but " + categoryName + " '" + type + "' is undirected.");
				}
			} else {
				// Otherwise, is directed or reciprocal; requires two characters.
				if (chars.length !== 2) {
					return cmdLog("Included only one character, but " + categoryName + " '" + type + "' is " + categoryDetails.directionType + " and requires two.");
				}
			}

			// Look for booleans.
			var pos = 0;
			var bools = [];
			while (pos < params.length) {
				if (params[pos] === "true" || params[pos] === "false") {
					bools.push(params[pos] === "true" ? true : false);
					params.splice(pos, 1);
				} else {
					pos += 1;
				}
			}
			if (bools.length > 1) {
				return cmdLog("Found multiple booleans: " + bools.join(", ") + ". Only one boolean at a time is valid.");
			}
			if (bools.length === 1 && bools[0] === "false") {
				value = false;
			}

			// Look for numbers.
			var pos = 0;
			var numbers = [];
			while (pos < params.length) {
				var x = parseInt(params[pos]);
				if (!isNaN(x)) {
					numbers.push(x);
					params.splice(pos, 1);
				} else {
					pos += 1;
				}
			}
			if (numbers.length > 1) {
				return cmdLog("Found multiple numbers: " + numbers.join(", ") + ". Only one number at a time is valid.");
			}

			// Make sure the types we found are as expected.
			if (categoryDetails.isBoolean && numbers.length > 0) {
				return cmdLog("Oops: " + categoryName + " '" + type + "' is boolean, so a number is not valid here.");
			}
			if (!categoryDetails.isBoolean && bools.length > 0) {
				return cmdLog("Oops: " + categoryName + " '" + type + "' is numeric, so a boolean is not valid here.");
			}
			if (categoryDetails.isBoolean && bools.length === 0) {
				bools = [true];
			}
			if (!categoryDetails.isBoolean && numbers.length === 0) {
				return cmdLog("Oops: " + categoryName + " '" + type + "' is numeric, but we didn't see a number.");
			}

			// We should now have accounted for all params. Otherwise, we have too many.
			if (params.length > 0) {
				return cmdLog("Did not recognize extra params: " + params.join(", "));
			}

			if (numbers.length > 0) {
				value = numbers[0];
			}
			if (bools.length > 0) {
				value = bools[0];
			}

			var pred = {
				"category": categoryName,
				"type": type,
				"first": chars[0],
				"value": value
			};
			if (chars.length == 2) {
				pred.second = chars[1];
			}
			if (typeof value === "number") {
				pred.operator = "=";
			}
			var origValue = ensemble.get(pred);
			var alreadyTrue = origValue.length > 0;
			var result = ensemble.set(pred);
			if (alreadyTrue) {
				cmdLog("<span title='" + util.objToText(origValue[0]) + "'>OK; but this was already the case (hover for matching predicate).</span>", true)
			} else {
				cmdLog("OK.", true);			
			}
			
			logMsg = runTriggerRules() + "<br/>" + runVolitionRules();
			cmdLog(logMsg, true);
			ruleTester.update();
			return result;
		} else {
			cmdLog("Not a valid command.");
		}
	};
	
	// Handle a keypress on the console, which might be a letter, enter (to submit) or up/down arrow (to scroll through command history).
	var keyPress = function(e) {
		var raw = document.getElementById("command").value;
		var keyPressed = e.which;

		if (keyPressed === 38) { // up arrow
			if (historyPos >= 0) {
				$("#command").val(consoleHistory[historyPos]);
				if (historyPos > 0) historyPos--;
			}
		} else if (keyPressed === 40) { // down arrow
			if (historyPos >= 0 && historyPos < consoleHistory.length) {
				$("#command").val(consoleHistory[historyPos]);
				if (historyPos < consoleHistory.length) historyPos++;
			}
		} else if (keyPressed === 13) {	// ASCII 'enter'
			processCommand(raw);
			$("#command").val("");
			consoleHistory.push(raw);
			historyPos = consoleHistory.length - 1;
		}
	}

	var runVolitionRules = function() {
		var logMsg = "Recalculating volitions.";
		storedVolitions = ensemble.calculateVolition(characters);
		return logMsg;
	}

	var runTriggerRules = function() {
		var triggerResults = ensemble.runTriggerRules(characters);
		var logMsg = "Running trigger rules:";
		for (var i = 0; i < triggerResults.explanations.length; i++) {
			var exp = triggerResults.explanations[i];
			logMsg += "<br/>" + exp;
		}
		return logMsg;
	}

	var refreshVolitions = function() {
		storedVolitions = ensemble.calculateVolition(characters);
	}

	return {
		init: init,
		refreshVolitions: refreshVolitions,
		updateRefs: updateRefs,
		cmdLog: cmdLog
	}

});