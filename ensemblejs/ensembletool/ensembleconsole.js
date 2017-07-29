/*
Main entry function for the Ensemble Tool.
Startup happens in init() function below.

Individual tabs of the tool are broken out into their own modules:
	consoleViewer.js		Console Tab
	historyViewer.js		Social Record Viewer Tab
	rulesViewer.js			Rules Viewer Tab
	rulesEditor.js			Rules Editor Tab
	actionEditor.js 		Action Editor Tab
	--> ruleTester.js		Rule diagnostic panel ("Test Rule" button)
	schemaviewer.js			Schema Viewer and Editor

A few other modules help the tool function:
	fileio.js				Loading/saving files
	messages.js				Pop-up messages and errors
*/

/*global console, require, requirejs, document */
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

		// ensemble
		,"ensemble" : "../js/ensemble/ensemble"
		,"socialRecord" : "../js/ensemble/SocialRecord"
		,"ruleLibrary" : "../js/ensemble/RuleLibrary"
		,"volition": "../js/ensemble/Volition"
		,"validate": "../js/ensemble/Validate"
		,"actionLibrary": "../js/ensemble/ActionLibrary"

		// Tool
		,"historyViewer" : "historyViewer"
		,"rulesViewer" : "rulesViewer"
		,"rulesEditor" : "rulesEditor"
		,"actionEditor" : "actionEditor"
		,"consoleViewer" : "consoleViewer"
		,"schemaViewer" : "schemaViewer"
		,"messages" : "messages"
		,"ruleTester" : "ruleTester"
		,"fileio" : "fileio"

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

requirejs(["ensemble", "socialRecord", "actionLibrary", "historyViewer", "rulesViewer", "rulesEditor", "actionEditor", "consoleViewer", "schemaViewer", "ruleTester", "fileio", "jquery", "util", "text!../data/socialData.json", "text!../data/ensemble-test-chars.json", "text!../data/testState.json", "text!../data/testTriggerRules.json", "text!../data/testVolitionRules.json", "text!../data/consoleDefaultActions.json", "messages", "jqueryUI", "domReady!"], 
function(ensemble, socialRecord, actionLibrary, historyViewer, rulesViewer, rulesEditor, actionEditor, consoleViewer, schemaViewer, ruleTester, fileio, $, util, sampleData, sampleChars, testSfdbData, testTriggerRules, testVolitionRules, testActions, messages){

	var autoLoad = false;	// Load sample schema package on launch.

	// These module variables will hold the active schemata info.
	var socialStructure;
	var characters;
	var fullCharacters;

	// stores the origins of all loaded rules.
	// For now, we assume that the fileName field within the rule matches the filename of the file it came from. TODO: possible to do this automatically?
	var ruleOriginsTrigger = [];
	var ruleOriginsVolition = [];

	// ****************************************************************
	// TABBED INTERFACE SETUP
	// ****************************************************************

	// Refresh the history view pane whenever we switch to it.
	$("#tabs").tabs({
		activate: function( event, ui ) {
			if (ui.newPanel[0].id === "tabsSfdb") {
				historyViewer.refresh(socialRecord.getCurrentTimeStep());
			}
			if (ui.newPanel[0].id === "tabsConsole") {
				consoleViewer.refreshVolitions();
			}
			if (ui.newPanel[0].id === "tabsActionEditor"){
				//actionEditor.refresh();
			}
			console.log("The new ui panel is: " , ui.newPanel[0].id);
		}
	});

	// Activate tabs to switch between rulesets in Rules pane.
	$("#rulesTabs").tabs({
		activate: function(event, ui) {
			var tabName = ui.newTab[0].innerText;
			$("#newRuleButton").html("New " + tabName + " Rule");
		}
	}).addClass( "ui-tabs-vertical ui-helper-clearfix" );

	//Activate tabs to switch between intent types in Action Editor panel.
	/*
	$("#typesTabs").tabs({
		activate: function(event, ui) {
			//console.log("XXXXX umm... I guess I showed up? Action Editor panel got clicked on?");
			console.log("XXXXX")
			var tabName = ui.newTab[0].innerText;
			//$("#newRuleButton").html("New " + tabName + " Rule");
		}
	}).addClass( "ui-tabs-vertical ui-helper-clearfix" );
	*/

	// "Load New Schema" button wrapper
	$("button#loadSchema").click(function() {
		if (!fileio.enabled()) {
			messages.showAlert("File I/O is only possible in the standalone Ensemble app.");
			return;
		}
		selectAndLoadPackage();
		$("#loadSchema").blur();
	});

	$("button#newSchema").click(function() {
		newPackage();
		$("#newSchema").blur();
	})

	// Create a new schema.
	var newPackage = function() {
		// Create dialog asking for schema folder
		messages.dialog("Select New Schema Folder", "Select an empty folder to be the root for a new schema.", {cancel: true}, {
			"OK": function() {
				var chooser = messages.getFileDialog();
				chooser.addEventListener("change", function() {
					var folder = this.value;
					var numFiles = fileio.getFilesInFolder(folder).length;
					if (numFiles > 0) {
						messages.dialog("Confirm Folder Wipe", "This folder contains " + numFiles + " file(s) that will be erased if you start a new schema in it. Are you sure?", {cancel: true}, {
							"Confirm": function() {
								fileio.clearFolder(folder);
								createBlankSchema(folder);
								$("#modalDialog").dialog("destroy");
							}
						});
					} else {
						createBlankSchema(folder);
					}
					$("#modalDialog").dialog("destroy");
				}, false);
				chooser.click();
			}
		});
	}

	// Handle loading a new schema package. 
	var selectAndLoadPackage = function() {
		var chooser = messages.getFileDialog();

		// The "change" event is triggered from the querySelector when the user has selected a file object (in this case, restricted to a folder by the "nwdirectory" flag in the #fileDialog item in ensembleconsole.html) and confirmed their selection by clicking OK.
		chooser.addEventListener("change", function() {
			loadPackage(this.value);
		}, false);
		chooser.click();  

	};

	var loadPackage = function(folder) {
		try {
			resetTool();
			// We'll let the fileio module deal with the nitty gritty of loading in the files in the schemata, passing in a callback function. If the load is successful, the callback will have a "pkg" variable that's an object with keys for each part of the schemata. For each matching part found, we'll load the data into Ensemble and the editor.
			fileio.loadSchemaFromFolder(folder, function(pkg) {
				loadSchema(pkg.schema);
				socialStructure.schemaOrigin = pkg.schema.source_file;
				if (pkg.cast) {
					loadCast(pkg.cast);
				}
				if (pkg.history) {
					ensemble.addHistory(pkg.history);
				}
				if (pkg.rules) {
					// Should be an array, one rules object for each rules file found.
					pkg.rules.forEach(function(ruleObj) {
						loadRules(ruleObj);
					});
				}
				if (pkg.actions) {
					loadActions(pkg.actions);
				}

				rulesEditor.init(rulesViewer, ruleOriginsTrigger, ruleOriginsVolition);
				updateConsole();
				consoleViewer.cmdLog("Schema loaded.", true);
			});
		} catch(e) {
			consoleViewer.cmdLog("Error loading schema: " + e);
			return;
		}
	}

	var createBlankSchema = function(folder) {
		// Delete everything from target folder.
		var blankSchema = '{"schema":[{"category":"schema category example","isBoolean": true,"directionType":"directed", "types": ["example type"], "actionable": true}]}';
		fileio.saveFile(folder + "/schema.json", blankSchema);

		var blankHistory = '{"history":[]}';
		fileio.saveFile(folder + "/history.json", blankHistory);

		var blankCast = '{"cast":{"Character 1":{"name": "Character 1"},"Character 2":{"name": "Character 2"}}}';
		fileio.saveFile(folder + "/cast.json", blankCast);

		var blankActions = '{"fileName":"actions.json","actions":[]}';
		fileio.saveFile(folder + "/actions.json", blankActions);
		
		// Load this new empty schema.
		loadPackage(folder);
	}

	// ****************************************************************
	// UTILITY FUNCTIONS
	// ****************************************************************

	// Shortcut for sending details to the console.
	var updateConsole = function() {
		consoleViewer.updateRefs(ensemble, socialRecord, characters, fullCharacters, socialStructure); // TODO this also needs to happen when a new schema is loaded.
	}

	// Reset everything in the tool, including Ensemble, back to its initial state.
	var resetTool = function() {
		ensemble.reset();
		ruleOriginsTrigger = [];
		ruleOriginsVolition = [];
		historyViewer.reset();
		rulesViewer.show();
	}


	// ****************************************************************
	// ENSEMBLE I/O 
	// ****************************************************************

	// Take a schema definition object, register it with ensemble, and display its details in the UI.
	var loadSchema = function(schema) {

		try {
			socialStructure = ensemble.loadSocialStructure(schema);	
		} catch(e) {
			messages.showError(e);
			return;
		}

		schemaViewer.show(socialStructure);

	};


	// Take a cast definition object, register it with ensemble and store it locally, and display its details in the UI.
	var loadCast = function(cast) {

		characters = ensemble.addCharacters(cast);
		fullCharacters = ensemble.getCharactersWithMetadata();

		// Generate labels
		var txt = "<ul>";
		for (var charPos in characters) {
			txt += "<li>" + fullCharacters[characters[charPos]].name + "</li>"
		}
		txt += "</ul>";

		$("#characterList").html(txt);

	};


	// Take a rules definition object, load it into ensemble, and display it in the appropriate UI tab.
	var loadRules = function(rules) {
		ensemble.addRules(rules);
		if (rules.type === "trigger") {
			ruleOriginsTrigger.push(rules.fileName);
			rulesViewer.show("trigger");
		}
		if (rules.type === "volition") {
			ruleOriginsVolition.push(rules.fileName);
			rulesViewer.show("volition");
		}
	};


	// Take an action definition object, load it into ensemble, and display in UI.
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

	// ****************************************************************
	// INIT 
	// ****************************************************************

	var init = function() {
		messages.init();
		ensemble.init();
		fileio.init();
		rulesViewer.init();
		historyViewer.init();
		schemaViewer.init();
		

		if (autoLoad === false && !fileio.enabled()) {
			autoLoad = true; // let's have it use autoload when using the webpage version of the console.
		}

		if (autoLoad) {
			loadSchema(JSON.parse(sampleData));
			loadRules(JSON.parse(testVolitionRules));
			loadRules(JSON.parse(testTriggerRules));
			ensemble.addHistory(JSON.parse(testSfdbData), "testAuto");
			loadCast(JSON.parse(sampleChars));
			loadActions(JSON.parse(testActions));
			rulesEditor.init(rulesViewer, ruleOriginsTrigger, ruleOriginsVolition);
			consoleViewer.cmdLog("Autoloaded default schema.", true);
			actionEditor.init();
		}

		consoleViewer.init();
		updateConsole();
	}


	init();


});