/* global require, process, console */

define([], function(){

	var fs;
	var lastPath; // Store the last path we opened a file from, so we know where to save files back to.
	var maxBackupFiles = 10;

	var getLastPath = function() {
		return lastPath;
	}


	var init = function() {
		try {
			fs = require('fs');
		} catch (e) {
			// If running in webbrowser, ignore.
		}
	}

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

	// Return true if we're in an environment with file i/o (we won't be if running in a standard web browser, for instance)
	var enabled = function() {
		return fs !== undefined;
	}

	// Retrieve, filter, and catalogue a list of schema files from a given directory, and return their contents in a labeled object. 
	var loadSchemaFromFolder = function(schemaDir, callback) {

		// Set up our return object.
		var pkg = {
			rules: []
		};
		
		// Remember the most recently opened folder.
		lastPath = schemaDir;

		// Get an array of all files found in this directory.
		var arrayOfAllFiles = getFilesInFolder(schemaDir);
		for(var i = 0; i < arrayOfAllFiles.length; i+=1){
			var nameOfFile = arrayOfAllFiles[i];
			arrayOfAllFiles[i] = schemaDir + "/" + nameOfFile;
		}

		// Use Javascript Promises to load all files, then run a function once they're all processed.
		loadAllFilesFromFolder(arrayOfAllFiles).then(function(files) {
			// "files" is now an array of objects, the parsed contents of the files.

			// First find the schema definition, since none of the other files make sense if this isn't here.
			var i;
			var schemaPos = -1;
			for (i = 0; i < files.length; i++) {
				if (files[i].schema !== undefined) {
					if (schemaPos !== -1) {
						throw new Error("More than one schema file detected: files '" + files[schemaPos].source_file + "' and '" + files[i].source_file + "'. You can have only one file with a top level key of 'schema'.");
					}
					schemaPos = i;
				}
			}
			if (schemaPos >= 0) {
				pkg.schema = files[schemaPos];
			} else {
				throw new Error("No schema file found.");
			}

			// Remove the schema file from the file list, then add any other matching file found to our return object.
			files.splice(schemaPos, 1);
			for (i = 0; i < files.length; i++) {
				var content = files[i];
				if (content.cast !== undefined) {
					pkg.cast = content;
				} else if (content.history !== undefined) {
					pkg.history = content;
				} else if (content.rules !== undefined) {
					try {
						pkg.rules.push(content);
					} catch(e) {
						throw new Error("Problem loading rules. " + e);
					}
				} else if (content.actions !== undefined) {
					pkg.actions = content;
				} else {
					throw new Error("Unrecognized file '" + content.source_file + "': should have found a top level key of 'schema', 'cast', 'history', 'actions', or 'rules'.");
				}
			}

			// Now run the callback function we passed in with the catalogued object. (This function is defined in ensembleconsole.loadPackage.)
			callback(pkg);	

		}, function(error) {
			throw new Error(error);
		});
	}

	// This is used by loadSchemaFromFolder above to filter a list of valid files from a directory. Specifically, reject backups, and anything else that doesn't look like a schema file.
	var loadAllFilesFromFolder = function(allFilesInFolder) {
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

					// Ignore files that don't appear to BE json (the line below will throw an error to be caught below if the file isn't json).
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

	// Create a timestamped backup file for the given ruleFile, deleting old backups if there are more than maxBackupFiles of them for this file.
	var backupRulesFile = function(ruleFile) {

		// If we don't have filesystem access (perhaps because we're running in a browser), skip.
		if (!enabled()) {
			return;
		}

		//Make this path that we've found equal to 'lastPath'
		//Also might be helpful with setting a 'default' schema package location.
		var path2 = process.execPath;
		path2 = path2.split("ensemble Tool")[0];

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

		// Create a backup folder for the current schema package, if none exists
		if (!fs.existsSync(backupPath)) {
			fs.mkdirSync(backupPath);
			// console.log("Making folder at ", backupPath);
		}

		// Cycle backup files if we have too many.
		var backupFiles = getFilesInFolder(backupPath);
		// Only consider files in this directory as counting towards the maximum if they start with the master filename and end with .json
		backupFiles = backupFiles.filter(function(f) {
			return f.split("_")[0] === ruleFile && f.substr(f.length - 5) === ".json";
		});
		if (backupFiles.length > maxBackupFiles) {
			// Since our timestamp will make files sort alphabetically by earliest to latest, we can get the oldest file by just getting the first entry in the sorted file list.
			backupFiles.sort();
			var oldestFileName = backupFiles[0];
			deleteFile(backupPath + "/" + oldestFileName);
		}

		// Copy the current version of the rules file to the backup folder, giving it a named timestamp.
		// console.log("copying '" + origFilePath + "' to '" + backupFilePath);		
		var f = fs.readFileSync(origFilePath);
		saveFile(backupFilePath, f);
	};

	// Take a rules type (like "volition" etc.) and a filename, and write out all the rules ensemble has of that type and matching that filename origin to the file in question.
	var writeFileToDisk = function(fileType, data, fileName) {
		
		// Create a human-readable JSON string encoding the rules in the proper format.
		// TODO: strip out unnecessary info.
		var dataObj = {};
		if (fileType === "trigger" || fileType === "volition") {
			dataObj.fileName = fileName;
			dataObj.type = fileType;
			dataObj.rules = data;
		} else if (fileType === "schema") {
			// Single key schema, array of objects
			dataObj.schema = data;
		} else if (fileType === "actions") {
			dataObj.fileName = fileName; // TODO this shouldn't have path...
			dataObj.actions = data;
		} else if (fileType === "history") {
			// Single key history w/ array of objects.
			// Each object has key pos (timestamp) and data.
			// data is an array of objects.
			dataObj.history = [];
			for (var key in data) {
				// scrub runtime fields from record. 
				data[key].forEach(function(pred) {
					delete pred.origin;
					delete pred.id;
					delete pred.timeHappened;
				});
				dataObj.history.push({
					"pos": parseInt(key, 0),
					"data": data[key]
				});
			}
		}
		console.log("dataObj:", dataObj);
		// Convert to a string, using tabs to keep human readable.
		var serializedRules = JSON.stringify(dataObj, null, '\t');

		// Ensure we have a full path.
		if (fileName.indexOf(".json") < 0) {
			fileName = lastPath + "/" + fileName + ".json";
		}

		// Write the serialized data to disk.
		saveFile(fileName, serializedRules);
	}

	// Basic function abstracting saving a file.
	var saveFile = function(fileName, contents) {
		if (enabled()) {
			fs.writeFileSync(fileName, contents);
			console.log("writing to '" + fileName + "'");
		}
	}

	var getFilesInFolder = function(folder) {
		var files = fs.readdirSync(folder);
		return files.filter(function(f) { 
			return f !== ".DS_Store";
		});
	}

	var deleteFile = function(fileName) {
		fs.unlinkSync(fileName);
	}

	var clearFolder = function(folder) {
		getFilesInFolder(folder).forEach(function(file) {
			var filePath = folder + "/" + file;
			console.log(filePath);
			deleteFile(filePath);
		});
	}

	// Save a subset of rules from a particular type and specified origin file back out to that file on disk. Delegate to backupRulesFile() to handle backing up the original file first, and writeFileToDisk() to do the file i/o.
	var saveRules = function(ruleType, rules, ruleFile, optOrigActiveFile, optSkipBackup) {

		if(!optSkipBackup){
			// TODO: support various paths, or take out for editor updates.
			backupRulesFile(ruleFile);
		}

		if (ruleType === "triggerRules") {
			ruleType = "trigger";
		}

		writeFileToDisk(ruleType, rules, ruleFile);

		// If we've moved a rule from one active file to another, we need to update the old file, too (to remove the moved file).
		if (optOrigActiveFile !== undefined && optOrigActiveFile.trim() !== "" && optOrigActiveFile != ruleFile) {
			// console.log("optOrigActiveFile is " + optOrigActiveFile + " and is different from ruleFile: " + ruleFile + ", so let's back it up too.")
			backupRulesFile(optOrigActiveFile);
			writeFileToDisk(ruleType, rules, optOrigActiveFile);
		}
	}

	return {
		init: init,
		enabled: enabled,
		loadSchemaFromFolder: loadSchemaFromFolder,
		saveRules: saveRules,
		getLastPath: getLastPath,
		saveFile: saveFile,
		getFilesInFolder: getFilesInFolder,
		clearFolder: clearFolder
	}

});