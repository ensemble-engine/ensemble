// load JSON files used by various tests

function makeFilePromise(path) {
	return new Promise((resolve, reject) => {
		const req = new XMLHttpRequest();
		req.onreadystatechange = function() {
			if (req.readyState === XMLHttpRequest.DONE) {
				try {
					resolve(req.responseText);
				} catch(err) {
					reject(err);
				}
			}
		};
		req.open('GET', path);
		req.send();
	});
}

let filePromises = [
	// basic ones
	makeFilePromise('data/testActions.json'),
	makeFilePromise('data/testHistory.json'),
	makeFilePromise('data/testSocial.json'),
	makeFilePromise('data/testState.json'),
	makeFilePromise('data/testTriggerRules.json'),
	makeFilePromise('data/testVolitionRules.json'),
	// weird ones
	makeFilePromise('data/samsVolition.json'),
	makeFilePromise('data/rpgSchema.json'),
	makeFilePromise('data/rpgActions.json'),
	// testActionsGrammar 1 (un-numbered)
	makeFilePromise('data/testActionsGrammar.json')
];
// testActionsGrammar 2-17
for (let i = 2; i <= 17; i++) {
	filePromises.push(makeFilePromise(`data/testActionsGrammar${i}.json`));
}

Promise.all(filePromises).then(files => {
	[
		// basic ones
		testActions, testHistory, testSocial, testState, testTriggerRules, testVolitionRules,
		// weird ones
		samsVolition, rpgSchema, rpgActions,
		// testActionsGrammar 1-17
		testActionsGrammar, testActionsGrammar2, testActionsGrammar3,
		testActionsGrammar4, testActionsGrammar5, testActionsGrammar6,
		testActionsGrammar7, testActionsGrammar8, testActionsGrammar9,
		testActionsGrammar10, testActionsGrammar11, testActionsGrammar12,
		testActionsGrammar13, testActionsGrammar14, testActionsGrammar15,
		testActionsGrammar16, testActionsGrammar17
	] = files;

	console.log("Beginning tests-main.js main function.");
	//try{
		ensemble.init();
		socialRecord.init();

		ensembleUnitTests.runTests();
		socialRecordUnitTests.runTests();
		ruleLibraryUnitTests.runTests();
		volitionUnitTests.runTests();
		validateUnitTests.runTests();
		actionLibraryUnitTests.runTests();
		externalApplicationTest.runTests();

 //console.log("my thing blah blah blah!");

	//}
	//catch(e) {
	//     $("#testResults").append("<div class='testFileHeader' style='color:red;'>Crashed During Testing!!</div>");
	//	 console.log(e);
	//}
	
	/*
	abstractPredicate.runTests();
	sfdb.runTests();
	ruleLibrary.runTests();
	volition.runTests();
	ensemble.runTests();
*/

	var state = JSON.parse(testState); // from external file, loaded in "define" above

	// var socialState = ensemble.init();
	// dayton.init(socialState, "mainWindow");
	//game.init(state);
	//var ui = UI.init(state);
});
