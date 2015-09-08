var stateInformation = {
 "loveToHeroCloseness" : "NA",
 "loveToHeroAttraction" : "NA",
 "heroToLoveCloseness" : "NA",
 "heroToLoveAttraction" : "NA",
 "loveToRivalCloseness" : "NA",
 "loveToRivalAttraction" :"NA",
 "heroStrength" : "NA",
 "heroIntelligence" : "NA"
};

var gameVariables = {
	"gameOver" : false,
	"endingText" : "NA",
	"turnNumber" : 0,
	"numIntents" : 2,
	"numActionsPerIntent" : 5
};

var move = function(){
	
	var elem = document.getElementById("hero");
	var left = 0;

	function frame() {
		left++; // update parameters
		elem.style.left = left + 'px';
		if (left == 100) {
			clearInterval(id);
		}
	}

	var id = setInterval(frame, 10); // draw every 10ms
};

var setUpLoversAndRivalsInitialState = function(){
	//update our local copies of these variables, and display them.
	updateLocalStateInformation();
	displayStateInformation();
};

var updateLocalStateInformation = function(){
	//First, let's grab the data we'll want to display.
	var loveToHeroClosenessPred = {
		"category" : "feeling",
		"type" : "closeness",
		"first" : "love",
		"second" : "hero"
	};
	var loveToRivalClosenessPred = {
		"category" : "feeling",
		"type" : "closeness",
		"first" : "love",
		"second" : "rival"
	};
	var heroToLoveClosenessPred = {
		"category" : "feeling",
		"type" : "closeness",
		"first" : "hero",
		"second" : "love"
	};
	var loveToHeroAttractionPred = {
		"category" : "feeling",
		"type" : "attraction",
		"first" : "love",
		"second" : "hero"
	};
	var heroToLoveattractionPred = {
		"category" : "feeling",
		"type" : "attraction",
		"first" : "hero",
		"second" : "love"
	};
	var loveToRivalAttractionPred = {
		"category" : "feeling",
		"type" : "attraction",
		"first" : "love",
		"second" : "rival"
	};
	var heroIntelligencePred = {
		"category" : "attribute",
		"type" : "intelligence",
		"first" : "hero"
	};
	var heroStrengthPred = {
		"category" : "attribute",
		"type" : "strength",
		"first" : "hero"
	};

	//Get love to hero closeness.
	var results = ensemble.get(loveToHeroClosenessPred);
	stateInformation.loveToHeroCloseness = results[0].value;

	//Get love to rival closeness
	results = ensemble.get(loveToRivalClosenessPred);
	stateInformation.loveToRivalCloseness= results[0].value;

	//Get hero to Love closeness
	results = ensemble.get(heroToLoveClosenessPred);
	stateInformation.heroToLoveCloseness = results[0].value;

	//get love to hero attraction
	results = ensemble.get(loveToHeroAttractionPred);
	stateInformation.loveToHeroAttraction = results[0].value;

	//get love to rival attraction
	results = ensemble.get(loveToRivalAttractionPred);
	stateInformation.loveToRivalAttraction = results[0].value;

	//get hero to love attraction
	results = ensemble.get(heroToLoveattractionPred);
	stateInformation.heroToLoveAttraction = results[0].value;

	//get hero intelligence.
	results = ensemble.get(heroIntelligencePred);
	stateInformation.heroIntelligence = results[0].value;

	//get hero strength.
	results = ensemble.get(heroStrengthPred);
	stateInformation.heroStrength = results[0].value;
};

var displayStateInformation = function(){
	document.getElementById("closenessHeroToLoverNumber").innerHTML = stateInformation.heroToLoveCloseness;
	document.getElementById("closenessLoverToHeroNumber").innerHTML = stateInformation.loveToHeroCloseness;
	document.getElementById("closenessLoverToRivalNumber").innerHTML = stateInformation.loveToRivalCloseness;
	document.getElementById("attractionHeroToLoverNumber").innerHTML = stateInformation.heroToLoveAttraction;
	document.getElementById("attractionLoverToHeroNumber").innerHTML = stateInformation.loveToHeroAttraction;
	document.getElementById("attractionLoverToRivalNumber").innerHTML = stateInformation.loveToRivalAttraction;
	document.getElementById("heroStrengthNumber").innerHTML = stateInformation.heroStrength;
	document.getElementById("heroIntelligenceNumber").innerHTML = stateInformation.heroIntelligence;
};

var setupCharacterPositions = function(widthOfField){
	var hero = document.getElementById("hero");
	var love = document.getElementById("love");
	var rival = document.getElementById("rival");

	//Get love to hero closeness.
	var loveToHeroCloseness = stateInformation.loveToHeroCloseness;

	//Get love to rival closeness
	var loveToRivalCloseness = stateInformation.loveToRivalCloseness;

	//Get hero to Love closeness
	var heroToLoveCloseness = stateInformation.heroToLoveCloseness;


	//store the width of field information
	stateInformation.widthOfField = widthOfField;

	//console.log("Hero to love: " + heroToLoveCloseness + " love to hero: " + loveToHeroCloseness + " love to rival: " + loveToRivalCloseness);

	//Actually reposition the characters based on their closeness values.
	//The love's position is an amalgamation of things.
	var lovePosition = (widthOfField/2) + loveToRivalCloseness - loveToHeroCloseness; // starts in middle, pulled in both directions.
	
	hero.style.left = heroToLoveCloseness + 'px';
	love.style.left = lovePosition + "px";
	rival.style.left = widthOfField + "px"; // rival never moves.
};

var moveAllCharacters = function() {
	console.log("inside of moveAllCharacters");

	//Takes a little bit of computation!
	var loveDestination = (stateInformation.widthOfField/2 - stateInformation.loveToHeroCloseness*1.5 + stateInformation.loveToRivalCloseness*2.5);
	moveByCharacterName("hero", stateInformation.heroToLoveCloseness);
	moveByCharacterName("love", loveDestination);
};

var moveByCharacterName = function(name, destination){
	console.log("moveByCharacterName name: " , name);
	console.log("moveByCharacterName destination: " , destination);
	var elem = document.getElementById(name);
	var startPos = parseInt(elem.style.left, 10); // start off with their current left position.
	var currentPos = startPos;
	console.log("startPos " , startPos);
	console.log("elem " , elem);

	function frame() {
		if(startPos > destination){ // we are moving backwards.
			console.log("decrementing...");
			currentPos -= 1;
		}
		else if (startPos < destination){ // we are moving forwards.
			currentPos += 1;
			console.log("incrementing...");
		}
		elem.style.left = currentPos + 'px';
		if (currentPos == destination) {
			clearInterval(id);
		}
	}

	var id = setInterval(frame, 10); // draw every 10ms

};

//Fills in all of the actionList divs with buttons corresponding to the actions the player can take
//by calling individual instances of populateActionList
var populateActionLists = function(storedVolitions, cast){
	//populate the action list of hero to love:
	populateActionList("hero", "love", storedVolitions, cast);
	populateActionList("hero", "rival", storedVolitions, cast);
	populateActionList("hero", "hero", storedVolitions, cast);
};

//Fills the actionList div with buttons corresponding to the actions the player can take.
var populateActionList = function(initiator, responder, storedVolitions, cast){
	var char1 = initiator;
	var char2 = responder;
	
	//Num intents to look at: 5
	//Num actions per intent: 2 (for now!)
	//console.log("storedVolitions before getting possible actions... " , storedVolitions.dump());
	var possibleActions = ensemble.getActions(char1, char2, storedVolitions, cast, gameVariables.numIntents, gameVariables.numActionsPerIntent);
	console.log("Possible Actions From " + char1 + " to " + char2 + ": ", possibleActions);

	var divName = "actionList_" + char1 + "_" + char2;
	var actionList = document.getElementById(divName);

	//Let's make a button for each action the hero wants to take!
	for(var i = 0; i < possibleActions.length; i += 1){
		//Make a new button
		var action = possibleActions[i];

		//If the character doesn't have a strong volition to do this action,
		//don't include it in the action list.
		if(action.weight < 0){
			continue;
		}
		var buttonnode= document.createElement('input');
		buttonnode.setAttribute('type','button');
		buttonnode.setAttribute('name',action);
		buttonnode.setAttribute('value',action.displayName);
		buttonnode.actionToPerform = action;
		buttonnode.cast = cast;
		buttonnode.onclick = actionButtonClicked;
		//buttonnode.attachEvent('onclick', actionButtonClicked2);


		actionList.appendChild(buttonnode);
	}

	//Write a little message if there were no possible actions.
	if(actionList.innerHTML === ""){
		actionList.innerHTML = "<i>No Actions Available</i>";
	}

};

var actionButtonClicked = function(){
	//Clean away all of the other actions -- they made their choice!
	clearActionList();

	//Play some SICK ANIMATION (like a text bubble flashing!)
	//playInstantiationAnimation();

	//CHANGE THE SOCIAL STATE -- social physics baby!!!
	var effects = this.actionToPerform.effects; // should be an array of effects.
	for(var i = 0; i < effects.length; i += 1){
		ensemble.set(effects[i]);
	}

	//RUN SOME TRIGGER RULES based on the new state!
	ensemble.runTriggerRules(this.cast);

	//Print out if the action was 'accepted' or rejected!
	var statusArea = document.getElementById("statusMessage");
	var acceptMessage = this.actionToPerform.displayName + " successful!";
	if(this.actionToPerform.isAccept !== undefined && this.actionToPerform.isAccept === false){
		acceptMessage = this.actionToPerform.displayName + " failed!";
	}
	statusArea.innerHTML = acceptMessage;

	//Re-draw the people (maybe even by having them MOVE to their new positions...)
	//Also re-draw any debug/state informaton we want.
	updateLocalStateInformation();
	displayStateInformation();
	moveAllCharacters();

	//set up next turn.
	var event = document.createEvent('Event');
	event.initEvent('nextTurn', true, true);
	document.dispatchEvent(event);
};

var clearActionList = function(){
	//We're first going to make the entire action list disappear, so as not to distract the player from
	//the beautiful instantiations.
	var actionArea = document.getElementById("actionArea");
	actionArea.style.visibility = "hidden";

	//Now we're actually going to remove the actions from the actionLists, because with the new socialState,
	//characters will likely want to take new actions towards each other.
	var heroToLoveActionList = document.getElementById("actionList_hero_love");
	heroToLoveActionList.innerHTML = "";
	var heroToRivalActionList = document.getElementById("actionList_hero_rival");
	heroToRivalActionList.innerHTML = "";
	var heroToHeroActionList = document.getElementById("actionList_hero_hero");
	heroToHeroActionList.innerHTML = "";
};

//Checks to see if the game is over!
var checkForEndConditions = function(){
	if(stateInformation.loveToRivalCloseness >= 90){
		//uh oh, we lose!
		gameVariables.gameOver = true;
		gameVariables.endingText = "Game Over! Your Love is in the arms of your Rival!";
	}
	if(stateInformation.loveToHeroCloseness >= 90 && stateInformation.heroToLoveCloseness >= 90){
		gameVariables.gameOver = true;
		gameVariables.endingText = "Game Over! Your Love is sufficiently interested in you for you to feel good about yourself!";
	}
};

//There are certain things that we might need to 'refresh' again (the visibility of the action list,
//the state of dialogue bubbles, etc.)
var cleanUpUIForNewTurn = function(){
	var actionArea = document.getElementById("actionArea");
	actionArea.style.visibility = "visible";

	var turnNumberArea = document.getElementById("turnNumberPlace");
	turnNumberArea.innerHTML = gameVariables.turnNumber;
};