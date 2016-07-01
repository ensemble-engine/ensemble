/* global require */

define([], function(){

	var fs;
	var lastPath; // Store the last path we opened a file from, so we know where to save files back to.

	var init = function() {
		try {
			fs = require('fs');
		} catch (e) {
			// If running in webbrowser, ignore.
		}
	}

	var loadSchemaFromFolder = function(schemaDir, callback) {
		lastPath = schemaDir;

		var arrayOfAllFiles = fs.readdirSync(schemaDir);
		for(var i = 0; i < arrayOfAllFiles.length; i+=1){
			var nameOfFile = arrayOfAllFiles[i];
			arrayOfAllFiles[i] = schemaDir + "/" + nameOfFile;
		}
		var pkg = {
			rules: []
		};

		// Need to make sure we load all files, then process them in the right order: schema first, then everything else. We'll use fancy new Javascript Promises to do this.
		// http://www.html5rocks.com/en/tutorials/es6/promises/		
		loadAllFilesFromFolder(arrayOfAllFiles).then(function(files) {
			// "files" is now an array of objects, the parsed contents of the files. First find the schema definition.
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
				console.log("loading schema: ", files[schemaPos].source_file);
				pkg.schema = files[schemaPos];
			} else {
				throw new Error("No schema file found.");
			}

			// Remove the schema file from the file list.
			files.splice(schemaPos, 1);

			// Now, process the rest of the files. The order here should not matter.
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

			callback(pkg);	

		}, function(error) {
			throw new Error(error);
		});
	}

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

	return {
		init: init,
		loadSchemaFromFolder: loadSchemaFromFolder
	}

});