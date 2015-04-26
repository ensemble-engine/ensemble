/*global console, require, requirejs, document, Promise */
require.nodeRequire = window.requireNode;
requirejs.config({
	paths: {
		"domReady": "../jslib/domReady"
		// JS libraries
		,"jquery": "../jslib/jquery-2.1.0"
		,"jqueryUI": "../jslib/jquery-ui.min"

		,"test": "../js/tests/Tests"
		,"text": "../jslib/text"	// Lets require load plain text, used by jsx

		// Custom libraries
		,"underscore" : "../jslib/underscore-min"
		,"util": "../jslib/util"
		,"log": "../jslib/log"

		// CiF
		,"cif" : "../js/CiF/CiF"
		,"sfdb" : "../js/CiF/SFDB"
		,"ruleLibrary" : "../js/CiF/RuleLibrary"
		,"volition": "../js/CiF/Volition"
		,"validate": "../js/CiF/Validate"
		,"actionLibrary": "../js/CiF/ActionLibrary"

		// Tool
		,"historyViewer" : "historyViewer"
		,"rulesViewer" : "rulesViewer"
		,"rulesEditor" : "rulesEditor"
		,"messages" : "messages"
		,"ruleTester" : "ruleTester"
		// ,"ui" : "ui"


},

	// Shims let certain libraries that aren't built with the module pattern interface with require.js 
	// Basically they tell require.js what global variable the given library will try to export all its functionality to, so require.js can do with that what it will.
	shim : {
		"underscore" : {
			exports : "_"
		},
		"jqueryUI" : {
			exports : '$',
			deps	: ['jquery']
		}
	}
});

requirejs(["cif", "sfdb", "actionLibrary", "historyViewer", "rulesViewer", "rulesEditor", "ruleTester", "jquery", "util", "text!../data/socialData.json", "text!../data/cif-test-chars.json", "text!../data/testState.json", "text!../data/testTriggerRules.json", "text!../data/testVolitionRules.json", "text!../data/consoleDefaultActions.json", "text!../data/Schema80K.json", "text!../data/Volition80K.json", "text!../data/SFDB80K.json", "text!../data/Chars80K.json", "messages", "jqueryUI", "domReady!"], 
function(cif, sfdb, actionLibrary, historyViewer, rulesViewer, rulesEditor, ruleTester, $, util, sampleData, sampleChars, testSfdbData, testTriggerRules, testVolitionRules, testActions, Schema80K, Volition80K, SFDB80K, Chars80K, messages){

	var autoLoad = false;	// Load sample schema on launch.
	var is80KTest = true;

	var socialStructure;
	var characters;
	var fullCharacters;
	var skipBackup = "skip"; // helper variable to skip backuping up files when creating a new rule.

	var maxBackupFiles = 10;
	var maxValidNumberOfActions = 10; // The maximum number of actions that are printed between pairs of characters.
	var maxValidNumberOfIntents = 10;
	var maxValidNumberOfActionsPerIntent = 10;
	var maxActionsPerGroup = 1;

	// stores the origins of all loaded rules.
	// For now, we assume that the fileName field within the rule matches the filename of the file it came from. TODO: possible to do this automatically?
	var ruleOriginsTrigger = [];
	var ruleOriginsVolition = [];


	// ****************************************************************
	// UI SETUP
	// ****************************************************************

	// Refresh the history view pane whenever we switch to it.
	$("#tabs").tabs({
		activate: function( event, ui ) {
			if (ui.newPanel[0].id === "tabsSfdb") {
				historyViewer.refresh(sfdb.getCurrentTimeStep());
			}
		}
	});

	// Activate tabs to switch between rulesets in Rules pane.
	$("#rulesTabs").tabs({
		activate: function(event, ui) {
			var tabName = ui.newTab[0].innerText;
			$("#newRuleButton").html("New " + tabName + " Rule");
		}
	}).addClass( "ui-tabs-vertical ui-helper-clearfix" );

	// Set up console command tooltips.
	$("#cmdSet").tooltip({content: "<p>Use <b>set</b> to change any social fact. Parameter order doesn't matter except for character order in directed facts:</p><ul><li><b>set(Bob, Al, friends)</b></li><li><b>set(bob, trust, al, 75)</b></li><li><b>set(happy, al)</b></li><li><b>set(carla, attracted to, bob, false)</b></li></ul>"});
	$("#cmdUnset").tooltip({content: "<p>Use <b>unset</b> to make a boolean value false:</p><ul><li><b>unset(al, happy)</b></li><li><b>unset(al, involved with, veronica)</b></li></ul>"});
	$("#cmdVolitions").tooltip({content: "<p>Use <b>volitions</b> to see the current ranked volitions from the first character to the second.</p><ul><li>volitions(al, bob)</b> :: <i>shows what changes in the social state Al most wants towards Bob</i></li><li>volitions(Carla)</b> :: <i>Shows Carla's volitions towards everyone else.</i></li></ul>"});
	$("#cmdNext").tooltip({content: "<p>Use <b>next</b> to advance the timestep.</p><ul><li><b>next()</b></li></ul>"});
	$("#cmdShow").tooltip({content: "<p>Use <b>show</b> to see all currently true info about a character.</p><ul><li><b>show(diane)</b></li></ul>"});
	$("#cmdActions").tooltip({content: "<p>Use <b>actions</b> to see an ordrered list of actions the first character wants to take towards the second.</p><ul><li><b>actions(al, diane)</b> :: <i>shows the actions Al wants to take towards Diane</i></li><li><b>actions(al)</b> :: <i>shows the actions Al wants to take towards everyone.</i></li></ul>"});
	$("#cmdDoAction").tooltip({content: "<p>Use <b>doAction</b> to perform an action from the first character to second. The social state will be updated to reflect the results of the actions. Use the <b>actions</b> command to get the numbers of potential actions.</p><ul><li><b>doAction(al, diane, 0)</b> :: <i>performs 'action 0' from Al to Diane</i></li><li><b>doAction(bob, jane, reminisce)</b> :: <i> Make Bob reminisce with Jane.</i></li></ul>"});

	// Setup interface buttons.
	$("button#loadSchema").click(function(){
		if (fs === undefined) {
			alert("File I/O is only possible in the standalone CiF app.");
		} else {
			loadPackage();
		}
	});
	$("button#timeStepForward").click(historyViewer.stepForward);
	$("button#timeStepBack").click(historyViewer.stepBack);
	$("button#resetSFDBHistory").click(historyViewer.reset);

	// Handle clicking on the "New Rule" button: create a new stub rule, register it with CiF, load it into the editor, and switch to that tab.
	var newRule = function() {
		var type = $("#tabstrigger").is(":visible") ? "trigger" : "volition";

		var newRule = {};
		newRule.name = "New " + util.iCap(type) + " Rule";
		newRule.conditions = [];
		newRule.effects = [];
		
		var ruleWrapper = {};
		ruleWrapper.fileName = "__NEWRULE__";
		ruleWrapper.rules = [newRule];
		ruleWrapper.type = type;
		
		//BEN START HERE
		var newIds = cif.addRules(ruleWrapper);
		var cifRule = cif.getRuleById(newIds[0]);
		if(cifRule === false){
			//Something bad happened where the rule apparantly wasn't added correctly. Abort and show an error.
			messages.showError("Canceling New Rule: Error adding empty new rule to CiF");
			return;
		}
		var newLoadedRule = cif.getRuleById(newIds[0]);
		rulesEditor.loadRule(newLoadedRule, type);
		

		//BEN ALSO START HERE!
		//Try to programmatically click the 'update rule eset button' here...
		//pass in 'true' to signify we should opt out of making a backup file.
		rulesEditor.save(skipBackup);
		$("#tabLiRulesEditor a").click();
	};

	$("#newRuleButton").click(newRule);

	// Handle message block.
	$("#msgBlock").click(function(){
		$(this).stop(true,true).fadeOut();
	});

	// ****************************************************************
	// UTILITY FUNCTIONS
	// ****************************************************************

	// Show the results of a console command on the screen.
	var cmdLog = function(msg, notAnError) {
		var cr = $("#consoleResults");
		var classes = "ciflog" + (notAnError ? "" : " ciflogerror");
		cr.append("<p class='" + classes + "'>" + msg + "</p>");
		var t = $("#tabsConsole");
		t[0].scrollTop = t[0].scrollHeight;
	};

	// Return a string uniquely identifying this date and time with minute accuracy, to be part of a filename timestamp, a la:
	// 14-03-26-1130
	var getDateTimeStamp = function() {
		var d = new Date();
		var stamp = (d.getFullYear() - 2000) + "-";
		var m = d.getMonth() + 1;
		stamp += (m < 10 ? ("0" + m) : m) + "-";
		var day = d.getDate();
		stamp += (day < 10 ? ("0" + day) : day) + "-";
		var h = d.getHours();
		stamp += (h < 10 ? ("0" + h) : h);
		var min = d.getMinutes();
		stamp += (min < 10 ? ("0" + min) : min);
		return stamp;
	};


	// ****************************************************************
	// SAVE / LOAD
	// ****************************************************************

	var fs;
	try {
		fs = require('fs');
	} catch (e) {
		// If running in webbrowser, ignore.
	}

	// Create a timestamped backup file for the given ruleFile, deleting old backups if there are more than maxBackupFiles of them for this file.
	var backupRulesFile = function(ruleFile) {

		// If we don't have filesystem access (perhaps because we're running in a browser), skip.
		if (fs === undefined) {
			return;
		}

		//Make this path that we've found equal to 'lastPath'
		//Also might be helpful with setting a 'default' schema location.
		var path2 = process.execPath;
		console.log("PATH: " , path2);
		path2 = path2.split("CiF Tool")[0];
		console.log("nicer path: " , path2);

		var path = lastPath;
		var backupFolderName = "_bak_" + ruleFile;
		var backupPath = path + "/" + backupFolderName;
		var origFilePath = path + "/" + ruleFile + ".json";
		var backupFilePath = backupPath + "/" + ruleFile + "_" + getDateTimeStamp() + ".json";

		// If we can't find the original ruleFile, bail.
		if (!fs.existsSync(origFilePath)) {
			console.log("Can't create backup file for '" + origFilePath + "' because can't find the original file.");
			return;
		}

		// Create a backup folder for the current schema, if none exists
		if (!fs.existsSync(backupPath)) {
			fs.mkdirSync(backupPath);
			// console.log("Making folder at ", backupPath);
		}

		// Cycle backup files if we have too many.
		var backupFiles = fs.readdirSync(backupPath);
		// Only consider files in this directory as counting towards the maximum if they start with the master filename and end with .json
		backupFiles = backupFiles.filter(function(f) {
			return f.split("_")[0] === ruleFile && f.substr(f.length - 5) === ".json";
		});
		if (backupFiles.length > maxBackupFiles) {
			// Since our timestamp will make files sort alphabetically by earliest to latest, we can get the oldest file by just getting the first entry in the sorted file list.
			backupFiles.sort();
			var oldestFileName = backupFiles[0];
			// console.log("More than maxBackupFiles files (" + maxBackupFiles + "), so deleting oldest file: " + oldestFileName);
			// "unlink" means delete
			fs.unlinkSync(backupPath + "/" + oldestFileName);
		}

		// Copy the current version of the rules file to the backup folder, giving it a named timestamp.
		// console.log("copying '" + origFilePath + "' to '" + backupFilePath);		
		var f = fs.readFileSync(origFilePath);
		fs.writeFileSync(backupFilePath, f);
	};


	// Take a rules type (like "volition" etc.) and a filename, and write out all the rules CiF has of that type and matching that filename origin to the file in question.
	var writeRulesForFileToDisk = function(ruleTypeShort, ruleFile) {
		
		var rules = cif.getRules(ruleTypeShort);

		// Filter rules to only contain rules from the target file.
		var filteredRules = rules.filter(function(rule) {
			return rule.origin === ruleFile;
		});

		// console.log(filteredRules.length + " matching rules from this file");

		// Create a human-readable JSON string encoding the rules in the proper format.
		var preparedRulesObj = {};
		preparedRulesObj.fileName = ruleFile;
		preparedRulesObj.type = ruleTypeShort;
		preparedRulesObj.rules = filteredRules;
		// Convert to a string, using tabs to keep human readable.
		var serializedRules = JSON.stringify(preparedRulesObj, null, '\t');

		// Write the serialized rules to disk.
		var path = lastPath + "/" + ruleFile + ".json";
		if (fs !== undefined) {
			fs.writeFileSync(path, serializedRules);
			// console.log("writing to '" + path + "':");
		}
	};


	// Save a subset of rules from a particular type and specified origin file back out to that file on disk. Delegate to backupRulesFile() to handle backing up the original file first, and writeRulesForFileToDisk() to do the file i/o.
	// NOTE: must be defined before we call rulesEditor.init()
	var saveRules = function(ruleType, ruleFile, optOrigActiveFile, optSkipBackup) {

		if(optSkipBackup !== skipBackup){
			backupRulesFile(ruleFile);
		}

		var ruleTypeShort;
		if (ruleType === "triggerRules" || ruleType === "trigger") {
			ruleTypeShort = "trigger";
		} else {
			ruleTypeShort = "volition";
		}

		writeRulesForFileToDisk(ruleTypeShort, ruleFile);

		// If we've moved a rule from one active file to another, we need to update the old file, too (to remove the moved file).
		if (optOrigActiveFile !== undefined && optOrigActiveFile.trim() !== "" && optOrigActiveFile != ruleFile) {
			// console.log("optOrigActiveFile is " + optOrigActiveFile + " and is different from ruleFile: " + ruleFile + ", so let's back it up too.")
			backupRulesFile(optOrigActiveFile);
			writeRulesForFileToDisk(ruleTypeShort, optOrigActiveFile);
		}
	};

	var loadAllFilesFromFolder = function(allFilesInFolder) {
		//var files = allFilesInFolder.split(";"); -- fix for when node.js broke, but they seem to have fixed it.
		var files = allFilesInFolder;
		return new Promise(function(resolve, reject) {
			var fileContents;
			try {
				fileContents = [];
				for (var i = 0; i < files.length; i++) {
					var filename = files[i];
					// Ignore files without a .json extension.
					var ext = filename.slice(filename.indexOf(".")+1,filename.length);
					if (ext.toLowerCase() !== "json") {
						console.log("Skipping '" + filename + "' because does not appear to have .json extension.");
						continue;	// i.e. next file
					}

					// Ignore files that don't appear to BE json.
					var content = JSON.parse(fs.readFileSync(filename, 'utf-8'));

					// Ignore files that appear to be backup files.
					if(filename.indexOf("_bak_") > -1){
						console.log("Skipping '" + filename + "' because it appears to be a backup file.");
						continue;
					}

					content.source_file = filename;
					fileContents.push(content);
					console.log("Adding '"+filename+"'; fileContents now ", fileContents);
				}

				resolve(fileContents);
		    } catch(e) {
				reject(Error(e));
		    }

		});
	}


	var lastPath; // Store the last path we opened a file from, so we know where to save files back to.

	// Load a folder containing a set of schema files from disk into the editor and into CiF.
	var loadPackage = function() {
		console.log("inside of loadPackage");
		var chooser = document.querySelector('#fileDialog');

		// The "change" event is triggered from the querySelector when the user has selected a file object (in this case, restricted to a folder by the "nwdirectory" flag in the #fileDialog item in cifconsole.html) and confirmed their selection by clicking OK.
		chooser.addEventListener("change", function(evt) {

			// Due to annoying bug noted at link below, we have to do string-munging to get the folder selected. Also complicated by forward vs backslashes in paths on Mac vs Windows.
			// https://github.com/nwjs/nw.js/issues/2961
			// Based on the above URL, it would appear that they have now fixed this issue.
		/*
			var listOfAllFiles = this.value;
			console.log("Here is listOfAllFiles: ", listOfAllFiles);
			var firstFile = listOfAllFiles.split(";")[0];
			var posOfLastSlash = firstFile.lastIndexOf("/");
			if (posOfLastSlash < 0) {
				posOfLastSlash = firstFile.lastIndexOf("\\");
			}
			*/
			//var schemaDir = firstFile.substr(0,posOfLastSlash);
			var schemaDir = this.value;
			// Finally! Now we can save:
			lastPath = schemaDir;
			cif.reset();
			ruleOriginsTrigger = [];
			ruleOriginsVolition = [];
			historyViewer.reset();
			rulesViewer.show();

			var arrayOfAllFiles = fs.readdirSync(schemaDir);
			for(var i = 0; i < arrayOfAllFiles.length; i+=1){
				var nameOfFile = arrayOfAllFiles[i];
				arrayOfAllFiles[i] = schemaDir + "/" + nameOfFile;
			}

			// Need to make sure we load all files, then process them in the right order: schema first, then everything else. We'll use fancy new Javascript Promises to do this.
			// http://www.html5rocks.com/en/tutorials/es6/promises/		
			loadAllFilesFromFolder(arrayOfAllFiles).then(function(files) {
				// "files" is now an array of objects, the parsed contents of the files. First find the schema definition.

				var schemaPos = -1;
				for (var i = 0; i < files.length; i++) {
					if (files[i].schema !== undefined) {
						if (schemaPos !== -1) {
							throw new Error("More than one schema file detected: files '" + files[schemaPos].source_file + "' and '" + files[i].source_file + "'. You can have only one file with a top level key of 'schema'.");
						}
						schemaPos = i;
					}
				}
				if (schemaPos >= 0) {
					console.log("loading schema: ", files[schemaPos].source_file);
					loadSchema(files[schemaPos]);
				} else {
					cmdLog("No schema file found.");
					console.log("here are the values of files: ", files);
					return;
				}

				// Remove the schema file from the file list.
				files.splice(schemaPos, 1);

				// Now, process the rest of the files. The order here should not matter.
				for (var i = 0; i < files.length; i++) {
					var content = files[i];
					if (content.cast !== undefined) {
						loadCast(content);
					} else if (content.history !== undefined) {
						loadHistory(content)
					} else if (content.rules !== undefined) {
						try {
							loadRules(content);
						} catch(e) {
							cmdLog("Problem loading rules. " + e);
						}
					} else if (content.actions !== undefined) {
						loadActions(content);
					} else {
						cmdLog("Unrecognized file '" + content.source_file + "': should have found a top level key of 'schema', 'cast', 'history', 'actions', or 'rules'.");
					}
				}

				// Update the editor's rule origins.
				rulesEditor.init(rulesViewer, ruleOriginsTrigger, ruleOriginsVolition, saveRules);
				cmdLog("Schema loaded.", true);

			}, function(error) {
				console.log("Is this the error message I'm getting at?")
				cmdLog("Error " + error);
				console.log("Was this the error I just saw? " ,  error);
			});

		}, false);
		chooser.click();  

	};



	// ****************************************************************
	// INIT / REGISTRATION
	// ****************************************************************


	// Take a schema definition object, register it with CiF, and display its details in the UI.
	var loadSchema = function(schema) {

		try {
			socialStructure = cif.loadSocialStructure(schema);	
		} catch(e) {
			messages.showError(e);
			return;
		}

		// Generate explanatory text.
		var exp = "";
		for (var className in socialStructure) {
			var d = cif.getClassDescriptors(className);
			var direction = d.directionType;
			var dataType = d.isBoolean ? "boolean" : "numeric";
			var duration = d.duration > 0 ? "duration " + d.duration : "";
			if (!d.isBoolean) {
				dataType += " " + d.min + "-->" + d.max + " (default " + d.defaultVal + ")";
			}
			if (d.duration === 0) {
				duration = "single turn";
			}
			exp += "<p class='schemaHeader'><span class='className'>" + className + "</span> <span class='classInfo'>" + direction + ", " + dataType + (duration !== "" ? ", " + duration : "") + "</span></p>";
			var c = socialStructure[className];
			exp += "<p class='schemaTypes'>";
			var types = [];
			for (var typeName in c) {
				types.push("<span class='schemaType'>" + typeName + "</span>");
			}
			var typeList = types.join(" &bull; ");
			exp += typeList + "<br/>"
		}

		$("#infoOnSocialTypes").html(exp);
	};


	// Take a cast definition object, register it with CiF and store it locally, and display its details in the UI.
	var loadCast = function(cast) {

		characters = cif.addCharacters(cast);
		fullCharacters = cif.getCharactersWithMetadata();

		// Generate labels
		var txt = "<ul>";
		for (var charPos in characters) {
			txt += "<li>" + fullCharacters[characters[charPos]].name + "</li>"
		}
		txt += "</ul>";

		$("#characterList").html(txt);

	};


	// Take a history definition object, and load it into CiF.
	var loadHistory = function(content) {
		var history = content.history;
		var lastPos = -9999999999;
		for (var i = 0; i < history.length; i++) {
			// TODO add more error checking to look for out-of-order history steps, etc.
			var historyAtTime = history[i];
			if (historyAtTime.pos <= lastPos) {
				messages.showError("Tried to load a history file but timeStep " + historyAtTime.pos + " came after timeStep " + lastPos + "; history files must declare timesteps sequentially.");
				return;
			}
			lastPos = historyAtTime.pos;
			cif.setupNextTimeStep(historyAtTime.pos);
			for (var j = 0; j < historyAtTime.data.length; j++) {
				var pred = historyAtTime.data[j];
				try {
					cif.set(pred);
				} catch(e) {
					messages.showError("invalid history file! double check  predicate on console");
					console.log("invalid predicate in history:", pred);
					return;
				}
			}
		}
	};


	// Take a rules definition object, load it into CiF, and display it in the appropriate UI tab.
	var loadRules = function(rules) {
		cif.addRules(rules);
		if (rules.type === "trigger") {
			ruleOriginsTrigger.push(rules.fileName);
			rulesViewer.show("trigger");
		}
		if (rules.type === "volition") {
			ruleOriginsVolition.push(rules.fileName);
			rulesViewer.show("volition");
		}
	};


	// Take an action definition object, load it into CiF, and display in UI.
	var loadActions = function(actions){
		actionLibrary.parseActions(actions);
		var myActions = actionLibrary.getTerminalActions();
		// Generate labels
		var txt = "<ul>";
		for (var actionPos in myActions) {
		// Can be replaced with something more complex later
			txt += "<li>" + myActions[actionPos].name + "</li>";
		}
		txt += "</ul>";
		$("#actionList").html(txt);
	};

	cif.init();
	rulesViewer.init();

	if (autoLoad === false && fs === undefined) {
		autoLoad = true; // let's have it use autoload when using the webpage version of the console.
	}

	if (autoLoad) {
		if (is80KTest) {
			loadSchema(JSON.parse(Schema80K));
			loadRules(JSON.parse(Volition80K));
			loadHistory(JSON.parse(SFDB80K));
			loadCast(JSON.parse(Chars80K));
		} else {
			loadSchema(JSON.parse(sampleData));
			loadRules(JSON.parse(testVolitionRules));
			loadRules(JSON.parse(testTriggerRules));
			loadHistory(JSON.parse(testSfdbData));
			loadCast(JSON.parse(sampleChars));
		}
		loadActions(JSON.parse(testActions));
		rulesEditor.init(rulesViewer, ruleOriginsTrigger, ruleOriginsVolition, saveRules);
		cmdLog("Autoloaded default schema.", true);
	}
	else{
		//ask the user to specify a schema.
		console.log("ello, ello!");
		loadPackage();
	}

	var storedVolitions;


	// ****************************************************************
	// CIF INTERFACE FUNCTIONS
	// ****************************************************************


	var runTriggerRules = function() {
		var triggerResults = cif.runTriggerRules(characters);
		var logMsg = "Running trigger rules:";
		for (var i = 0; i < triggerResults.explanations.length; i++) {
			var exp = triggerResults.explanations[i];
			logMsg += "<br/>" + exp;
		}
		return logMsg;
	}

	var runVolitionRules = function() {
		var logMsg = "Recalculating volitions.";
		storedVolitions = cif.calculateVolition(characters);
		return logMsg;
	}


	// ****************************************************************
	// CIF CONSOLE
	// ****************************************************************

	var consoleHistory = [];
	var historyPos = -1;


	// Handle the "next" console command (advance timestep)
	var doNext = function() {
		cif.setupNextTimeStep();
		var curr = sfdb.getCurrentTimeStep();
		var logMsg = "CiF timestep advanced to " + curr + ".<br/>";

		// Run Trigger rules.
		logMsg += runTriggerRules() + "<br/>";

		// Run volition rules.
		logMsg += runVolitionRules();

		return cmdLog(logMsg, true);
	}

	// Handle the "show" console command (display all true facts about the given character).
	var doShow = function(char) {
		var i, res, desc;
		var resultPrimary = cif.get({"first": char});
		var resultSecondary = cif.get({"second": char});
		var logMsg = "<table><tr><td>";
		for (i = 0; i < resultPrimary.length; i++) {
			res = resultPrimary[i];
			desc = cif.getClassDescriptors(res.class)
			logMsg += cif.predicateToEnglish(res).text;
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
			desc = cif.getClassDescriptors(res.class)
			if (desc.directionType === "reciprocal") {
				continue;
			}
			logMsg += cif.predicateToEnglish(res).text + "<br/>";
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
			storedVolitions = cif.calculateVolition(characters);
		}
		var vol = storedVolitions.getFirst(char1, char2);
		while (vol !== undefined) {
			// Show the person's reasons for taking this action.
			logMsg += "<tr><td><span class='volitionType'>" + cif.predicateToEnglish(vol).text + "</span></td><td><span class='volitionExplanation'>Because:<br/>";
			for (i = 0; i < vol.englishInfluences.length; i++) {
				var inf = vol.englishInfluences[i];
				logMsg += "<span title='" + inf.englishRule + "'>" + inf.ruleName + " (" + inf.weight + ")</span><br/>";
			}

			// Show the responder's reasons for accepting or rejecting.
			logMsg += "</span></td><td><span class='volitionExplanation'><b>" + char2 + " would ";
			var acceptedObj = storedVolitions.isAccepted(char1, char2, vol);
			logMsg += acceptedObj.accepted ? "<span class='accepted'>accept</span>" : "<span class='rejected'>reject</span>";
			logMsg += " (" + acceptedObj.weight + ")</b>, because:<br/>";
			console.log("rw", acceptedObj, acceptedObj.reasonsWhy);
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
		//console.log("Doing actions for " + char1 + " and " + char2 + " with numIntents: " + numIntents + " actionsPerIntent: " + numActionsPerIntent + " numActionsPerGroup " + numActionsPerGroup);
		var i;
		var logMsg = "<table>";
		var actions = [];
		if (storedVolitions === undefined) {
			storedVolitions = cif.calculateVolition(characters);
		}

		//Right now, we specify a large number for maximum intents, and maximum actions per intent.
		actions = getActionList(char1, char2, storedVolitions, maxValidNumberOfIntents, maxValidNumberOfActionsPerIntent, maxActionsPerGroup);

		//Go through each action, and add a row in a table to display to the user saying the name of the action
		//the effects that would transpire if they were to do it.
		for(i = 0; i < actions.length; i += 1){
			logMsg += "<tr><td><span class='actionType'> [" + i + "] " + char1 + " wants to " + actions[i].name + " with " + char2 + " (" + actions[i].weight + ") </span></td>";
			logMsg += "<td>Intent: " + actions[i].lineage.substr(0, actions[i].lineage.indexOf("-")) + "</td>";
			logMsg += "<td>This will become true:<BR><ul>";
			for(var j = 0; j < actions[i].effects.length; j += 1){
				var englishEffect = cif.predicateToEnglish(actions[i].effects[j]);
				logMsg += "<li>" + englishEffect.text;
			}
			logMsg += "</ul></td></tr>";
		}
		
		logMsg += "</table>";
		console.log("logMsg: " + logMsg);
		return cmdLog(logMsg);
	};

	// Handle the "doAction" console command, performing the given action from the first character to the second.
	var doDoAction = function(char1, char2, action, isAccepted){
		//Print out some nice things to the console letting the user know what action is taking place
		isAccepted = false;
		if(action.isAccept === undefined || action.isAccepted === true){
			isAccepted = true;
		}
		cmdLog("<b>" + char1 + "</b> is doing action <b>" + action.name + "</b> with <b>" +char2+ "</b> accepted: <b>" + isAccepted + "</b>", true);
		cmdLog("<b> CHANGED SOCIAL STATE: </b><BR>-----------------", true);
	

		//Let's grab the appropriate set of effects.
		var effects = action.effects;

		for(var i = 0; i < effects.length; i += 1){
			//Get information based on the class of the effect (such as the direction)
			var className = effects[i].class;
			var d = cif.getClassDescriptors(className);
			var directionType = d.directionType;

			//Helper string; if the value of the effect is false, say that the character does NOT have this state anymore.
			var notString;
			notString = "is now";
			if(effects[i].value === false && d.isBoolean){
				notString = "is no longer";
			}

			//Tack on a helpful note at the end of the console message if 
			//the 'effect' we are setting isn't actually a change from the current social state.
			var origValue = cif.get(effects[i]);
			var alreadyTrue;
			if(d.isBoolean){
				var alreadyTrue = origValue.length > 0;
			}
			var alreadyTrueString = "";
			if(alreadyTrue){
				alreadyTrueString = "(FYI, this was already true)";
			}

			//Actually update the sfdb!
			cif.set(effects[i]);

			//Grab a reference to the new value, whatever it is
			//(i.e., we are letting cif to the adding/subtrating from the previous value for us.)
			var newValue = cif.get(effects[i]);
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
		logMsg = runTriggerRules() + "<br/>" + runVolitionRules();
		cmdLog(logMsg, true);
	};


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
					if (charDict[charKeys[i]].name.toLowerCase() === params[pos]
						|| charKeys[i].toLowerCase() === params[pos]) {
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
		var res;
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
			console.log(sfdb.dumpSFDB());
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
			var validNumbers = [];
			
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
				storedVolitions = cif.calculateVolition(chars);
			}

			//just get ALL the potential actions, by passing in the maximum possible values of everything.
			var potentialActions = getActionList(char1, char2, storedVolitions, maxValidNumberOfIntents, maxValidNumberOfActionsPerIntent, maxActionsPerGroup)
			//console.log("Okay! Here are potentialActions -- these should be the only valid things entered, yeah?", potentialActions);

			//Get the list of all possible action names that exist.
			//var actionNames = [];
			//var actions = actionLibrary.getAllActions();
			var validEntries = [];
			for(var i = 0; i < potentialActions.length; i+= 1){
				//actionNames.push(actions[i].name.toLowerCase());
				validEntries.push(potentialActions[i].name.toLowerCase());
				validEntries.push(i.toString());
			}

			//console.log("Here are the valid entries someone can type in!", validEntries);

			//So, this will catch two things:
			//1.) If they typed in a nonsense action that doesn't exist
			//2.) They typed in an 'action number' that is invalid (i.e. bigger than the numuber of actions the 
			//characters had volitions for.)
			//var actionMatch = extract(allCandidates, "recognized action", 1, 1);
			var actionMatch = extract(validEntries, "recognized action", 1, 1);
			console.log("This is what actionMatch looks like: ", actionMatch);
			if (!actionMatch){
				return;
			} 
			var actionSearch = actionMatch[0];

			//So, at this point, we still don't actually quite know if they typed in 
			//an action name or an action number. However, we do know the list of all
			//acceptable names and numbers. Check to see if what they typed IS acceptable!
			//var nameIndex = potentialActions.indexOf(actionSearch);
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

			// Look for a type word and determine its class.
			var allTypes = [];
			for (var className in socialStructure) {
				var c = socialStructure[className];
				for (var type in c) {
					allTypes.push(type);
				}
			}

			var typeMatch = extract(allTypes, "recognized social type", 1, 1);
			if (!typeMatch) return;
			var type = typeMatch[0];
			var className = cif.getClassFromType(type);
			if (!className) {
				return cmdLog("Did not recognize '" + type + "' as a registered type within a social scheme.");
			}
			var classDetails = cif.getClassDescriptors(className);

			// If undirected, we should have found one character.
			if (classDetails.directionType === "undirected") {
				if (chars.length !== 1) {
					return cmdLog("Included more than one character, but " + className + " '" + type + "' is undirected.");
				}
			} else {
				// Otherwise, is directed or reciprocal; requires two characters.
				if (chars.length !== 2) {
					return cmdLog("Included only one character, but " + className + " '" + type + "' is " + classDetails.directionType + " and requires two.");
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
			if (classDetails.isBoolean && numbers.length > 0) {
				return cmdLog("Oops: " + className + " '" + type + "' is boolean, so a number is not valid here.");
			}
			if (!classDetails.isBoolean && bools.length > 0) {
				return cmdLog("Oops: " + className + " '" + type + "' is numeric, so a boolean is not valid here.");
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
				"class": className,
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
			var origValue = cif.get(pred);
			var alreadyTrue = origValue.length > 0;
			var result = cif.set(pred);
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

	var getActionList = function(char1, char2, storedVolitions, numberOfIntents, numActionPerIntent, numActionsPerGroup){
		//Ok... because we want consistency, what we are going to do is GET the best action always, but then
		//ALSO do more if numActions is > 1. we'll then compare the two, and make sure that the best action is 
		//the 'first' entry in the list of best actions. Perfect, right?
		//var actions = [];
		//var bestAction = cif.getAction(char1, char2, storedVolitions, characters);


		var bestActions = cif.getActions(char1, char2, storedVolitions, characters, numberOfIntents, numActionPerIntent, numActionsPerGroup);


		//I think we might need to reverse sort these guys.

		/*
		if(numberOfActions > 1){
			//I think it makes the most sense to just get a *slew* of actions, and then pair it down based on score.
			//UGH, does it? No, of course not. It makes more sense to let the user specify each attribute, if they want.
			actions = cif.getActions(char1, char2, storedVolitions, characters, numberOfIntents, numActionPerIntent, numActionsPerGroup);
			if(actions[0].name !== bestAction.name){
				//Uh oh, ok. we'll have to do a little bit of re-sorting here!
				for(var swapIndex = 1; swapIndex < actions.length; swapIndex += 1){
					if(actions[swapIndex].name === bestAction.name){
						//Ok, we found where we need to swap!
						var tempAction = actions[0];
						actions[0] = actions[swapIndex];
						actions[swapIndex] = tempAction;
					}
				}
			}
		}
		
		else{ // ok, we are dealing with an easy case. Thank goodness.
			actions[0] = bestAction;
		}
		*/
		return bestActions;
	}
	
	// Handle a keypress on the console, which might be a letter, enter (to submit) or up/down arrow (to scroll through command history).
	var keyPress = function(e) {
		var raw = document.getElementById("command").value;
		var keyPressed = e.which;

		// If key pressed was enter, process.
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
		}
		if (keyPressed === 13) {	// ASCII 'enter'
			processCommand(raw);
			$("#command").val("");
			consoleHistory.push(raw);
			historyPos = consoleHistory.length - 1;
		}
	}
	document.getElementById("command").onkeyup = keyPress;
	document.getElementById("command").onchange = keyPress;

	// Handle a keypress on the rule filter text box, forwarding to the function within rulesViewer that filters the view accordingly.
	var ruleFilterKey = function(e) {
		var raw = document.getElementById("inputRuleFilter").value;
		rulesViewer.filterWithout("tabstrigger", raw);
		rulesViewer.filterWithout("tabsvolition", raw);
	}
	document.getElementById("inputRuleFilter").onkeyup = ruleFilterKey;
	document.getElementById("inputRuleFilter").onchange = ruleFilterKey;






});