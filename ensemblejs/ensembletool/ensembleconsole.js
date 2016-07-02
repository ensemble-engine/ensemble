/*
Main entry function for the Ensemble Tool.
Startup happens in init() function below.
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
		,"consoleViewer" : "consoleViewer"
		,"messages" : "messages"
		,"ruleTester" : "ruleTester"
		,"fileio" : "fileio"
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

requirejs(["ensemble", "socialRecord", "actionLibrary", "historyViewer", "rulesViewer", "rulesEditor", "consoleViewer", "ruleTester", "fileio", "jquery", "util", "text!../data/socialData.json", "text!../data/ensemble-test-chars.json", "text!../data/testState.json", "text!../data/testTriggerRules.json", "text!../data/testVolitionRules.json", "text!../data/consoleDefaultActions.json", "messages", "jqueryUI", "domReady!"], 
function(ensemble, socialRecord, actionLibrary, historyViewer, rulesViewer, rulesEditor, consoleViewer, ruleTester, fileio, $, util, sampleData, sampleChars, testSfdbData, testTriggerRules, testVolitionRules, testActions, messages){

	var autoLoad = false;	// Load sample schema package on launch.

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
		}
	});

	// Activate tabs to switch between rulesets in Rules pane.
	$("#rulesTabs").tabs({
		activate: function(event, ui) {
			var tabName = ui.newTab[0].innerText;
			$("#newRuleButton").html("New " + tabName + " Rule");
		}
	}).addClass( "ui-tabs-vertical ui-helper-clearfix" );

	// "Load New Schema" button
	$("button#loadSchema").click(function() {
		if (!fileio.enabled()) {
			messages.showAlert("File I/O is only possible in the standalone Ensemble app.");
			return;
		}
		loadPackage();
		$("#loadSchema").blur();
	});

	// ****************************************************************
	// UTILITY FUNCTIONS
	// ****************************************************************

	var updateConsole = function() {
		consoleViewer.updateRefs(ensemble, socialRecord, characters, fullCharacters, socialStructure); // TODO this also needs to happen when a new schema is loaded.
	}

	var resetTool = function() {
		ensemble.reset();
		ruleOriginsTrigger = [];
		ruleOriginsVolition = [];
		historyViewer.reset();
		rulesViewer.show();
	}

	// Load a folder containing a set of schema package files from disk into the editor and into ensemble.
	var loadPackage = function() {
		var chooser = document.querySelector('#fileDialog');

		// The "change" event is triggered from the querySelector when the user has selected a file object (in this case, restricted to a folder by the "nwdirectory" flag in the #fileDialog item in ensembleconsole.html) and confirmed their selection by clicking OK.
		chooser.addEventListener("change", function(evt) {
			resetTool();
			var pkg;
			try {
				pkg = fileio.loadSchemaFromFolder(this.value, function(pkg) {
					loadSchema(pkg.schema);
					if (pkg.cast) {
						loadCast(pkg.cast);
					}
					if (pkg.history) {
						loadHistory(pkg.history);
					}
					if (pkg.rules) {
						// Should be an array of contents of rules files.
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
				consoleViewer.cmdLog(e);
				return;
			}

		}, false);
		chooser.click();  

	};


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

		// Generate explanatory text.
		var exp = "";
		for (var categoryName in socialStructure) {
			var d = ensemble.getCategoryDescriptors(categoryName);
			var direction = d.directionType;
			var dataType = d.isBoolean ? "boolean" : "numeric";
			var duration = d.duration > 0 ? "duration " + d.duration : "";
			if (!d.isBoolean) {
				dataType += " " + d.min + "-->" + d.max + " (default " + d.defaultVal + ")";
			}
			if (d.duration === 0) {
				duration = "single turn";
			}
			exp += "<p class='schemaHeader'><span class='categoryName'>" + categoryName + "</span> <span class='categoryInfo'>" + direction + ", " + dataType + (duration !== "" ? ", " + duration : "") + "</span></p>";
			var c = socialStructure[categoryName];
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


	// Take a history definition object, and load it into ensemble.
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
			ensemble.setupNextTimeStep(historyAtTime.pos);
			for (var j = 0; j < historyAtTime.data.length; j++) {
				var pred = historyAtTime.data[j];
				try {
					ensemble.set(pred);
				} catch(e) {
					messages.showError("invalid history file! double check  predicate on console");
					console.log("invalid predicate in history:", pred);
					return;
				}
			}
		}
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

		if (autoLoad === false && !fileio.enabled()) {
			autoLoad = true; // let's have it use autoload when using the webpage version of the console.
		}

		if (autoLoad) {
			loadSchema(JSON.parse(sampleData));
			loadRules(JSON.parse(testVolitionRules));
			loadRules(JSON.parse(testTriggerRules));
			loadHistory(JSON.parse(testSfdbData));
			loadCast(JSON.parse(sampleChars));
			loadActions(JSON.parse(testActions));
			rulesEditor.init(rulesViewer, ruleOriginsTrigger, ruleOriginsVolition);
			consoleViewer.cmdLog("Autoloaded default schema.", true);
		}

		consoleViewer.init();
		updateConsole();
	}


	init();


});