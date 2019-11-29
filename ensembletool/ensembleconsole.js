/*
Main entry function for the Ensemble Tool.
Startup happens in init() function below.

Individual tabs of the tool are broken out into their own modules:
	consoleViewer.js		Console Tab
	historyViewer.js		Social Record Viewer Tab
	rulesViewer.js			Rules Viewer Tab
	rulesEditor.js			Rules Editor Tab
	--> ruleTester.js		Rule diagnostic panel ("Test Rule" button)
	actionEditor.js 		Action Editor Tab
	schemaviewer.js			Schema Viewer and Editor

A few other modules help the tool function:
	fileio.js				Loading/saving files
	messages.js				Pop-up messages and errors
*/

(function(){

	const {ipcRenderer} = require("electron"); // so that we can send events to the main process

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
				historyViewer.refresh(ensemble.getCurrentTimeStep());
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
		// send the main process an openFolder event;
		// it'll pop a file open dialog and send us back the path to the user-selected folder
		ipcRenderer.send("openFolder");

		// once the user has selected a folder and confirmed their selection by clicking OK...
		ipcRenderer.on("folderData", function(event, paths) {
			loadPackage(paths[0]); // we're sent the user-selected paths as an array, but there should only ever be one
		}, false);
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
		consoleViewer.updateRefs(characters, fullCharacters, socialStructure); // TODO this also needs to happen when a new schema is loaded.
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
		const allActions = ensemble.addActions(actions);
		const myActions = allActions.filter((a) => a.effects !== undefined); // per ActionLibrary.getTerminalActions!
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

	function makeJSONFilePromise(path) {
		return new Promise((resolve, reject) => {
			const req = new XMLHttpRequest();
			req.onreadystatechange = function() {
				if (req.readyState === XMLHttpRequest.DONE) {
					try {
						resolve(JSON.parse(req.responseText));
					} catch(err) {
						reject(err);
					}
				}
			};
			req.open('GET', path);
			req.send();
		});
	}

	var init = function() {
		messages.init();
		ensemble.init();
		fileio.init();
		rulesViewer.init();
		historyViewer.init();
		schemaViewer.init();
		consoleViewer.init();
		

		if (autoLoad === false && !fileio.enabled()) {
			autoLoad = true; // let's have it use autoload when using the webpage version of the console.
		}

		if (autoLoad) {
			Promise.all([
				makeJSONFilePromise('defaultdata/schema.json'),
				makeJSONFilePromise('defaultdata/volitionRules.json'),
				makeJSONFilePromise('defaultdata/triggerRules.json'),
				makeJSONFilePromise('defaultdata/history.json'),
				makeJSONFilePromise('defaultdata/cast.json'),
				makeJSONFilePromise('defaultdata/actions.json')
			]).then(([schema, volitionRules, triggerRules, history, cast, actions]) => {
				loadSchema(schema);
				loadRules(volitionRules);
				loadRules(triggerRules);
				ensemble.addHistory(history, "testAuto");
				loadCast(cast);
				loadActions(actions);
				rulesEditor.init(rulesViewer, ruleOriginsTrigger, ruleOriginsVolition);
				consoleViewer.cmdLog("Autoloaded default schema.", true);
				actionEditor.init();
				updateConsole();
			});
		}
	}

	init();

})();
