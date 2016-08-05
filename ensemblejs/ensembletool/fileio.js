/* global require, process */

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
		var arrayOfAllFiles = fs.readdirSync(schemaDir);
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
		var backupFiles = fs.readdirSync(backupPath);
		// Only consider files in this directory as counting towards the maximum if they start with the master filename and end with .json
		backupFiles = backupFiles.filter(function(f) {
			return f.split("_")[0] === ruleFile && f.substr(f.length - 5) === ".json";
		});
		if (backupFiles.length > maxBackupFiles) {
			// Since our timestamp will make files sort alphabetically by earliest to latest, we can get the oldest file by just getting the first entry in the sorted file list.
			backupFiles.sort();
			var oldestFileName = backupFiles[0];
			// "unlink" means delete
			fs.unlinkSync(backupPath + "/" + oldestFileName);
		}

		// Copy the current version of the rules file to the backup folder, giving it a named timestamp.
		// console.log("copying '" + origFilePath + "' to '" + backupFilePath);		
		var f = fs.readFileSync(origFilePath);
		fs.writeFileSync(backupFilePath, f);
	};

	// Take a rules type (like "volition" etc.) and a filename, and write out all the rules ensemble has of that type and matching that filename origin to the file in question.
	var writeRulesForFileToDisk = function(ruleType, rules, ruleFile) {
		
		// Create a human-readable JSON string encoding the rules in the proper format.
		// TODO: vary the format based on the type.
		var preparedRulesObj = {};
		preparedRulesObj.fileName = ruleFile;
		preparedRulesObj.type = ruleType;
		preparedRulesObj.rules = rules;
		// Convert to a string, using tabs to keep human readable.
		var serializedRules = JSON.stringify(preparedRulesObj, null, '\t');

		// Write the serialized rules to disk.
		var path = lastPath + "/" + ruleFile + ".json";
		if (fs !== undefined) {
			fs.writeFileSync(path, serializedRules);
			// console.log("writing to '" + path + "':");
		}
	}

	// Save a subset of rules from a particular type and specified origin file back out to that file on disk. Delegate to backupRulesFile() to handle backing up the original file first, and writeRulesForFileToDisk() to do the file i/o.
	var saveRules = function(ruleType, rules, ruleFile, optOrigActiveFile, optSkipBackup) {

		if(!optSkipBackup){
			backupRulesFile(ruleFile);
		}

		if (ruleType === "triggerRules") {
			ruleType = "trigger";
		}

		writeRulesForFileToDisk(ruleType, rules, ruleFile);

		// If we've moved a rule from one active file to another, we need to update the old file, too (to remove the moved file).
		if (optOrigActiveFile !== undefined && optOrigActiveFile.trim() !== "" && optOrigActiveFile != ruleFile) {
			// console.log("optOrigActiveFile is " + optOrigActiveFile + " and is different from ruleFile: " + ruleFile + ", so let's back it up too.")
			backupRulesFile(optOrigActiveFile);
			writeRulesForFileToDisk(ruleType, rules, optOrigActiveFile);
		}
	}

	return {
		init: init,
		enabled: enabled,
		loadSchemaFromFolder: loadSchemaFromFolder,
		saveRules: saveRules,
		getLastPath: getLastPath
	}

});