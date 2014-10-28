/*
actionLibrary -- parses and stores data pertaining to actions 
(i.e. things that the characters can engage in to alter the social state)

TODO: Many of these functions will begin to fall apart when we start getting into "instantiations."
TODO: Connected to above ^^^ there are presently some severe assumptions with regards to the initiator/responder, first/second dynamic that will need to be revisited for 3 (or more) person actions.

@class ActionLibrary
 */

define(["util", "underscore", "validate", "volition", "ruleLibrary"],
function(util, _, validate, volition, ruleLibrary, testSocial, testActions) {
	var actions = []; //An array containing all of the actions available in this social world.

	//Experimenting with having a 'grammar' to define the actions of the world.
	var startSymbols = [];
	var nonTerminals = [];
	var terminalActions = [];

	var getAllActions = function(){
		return actions;
	};

	var getStartSymbols = function(){
		return startSymbols;
	};

	var getNonTerminals = function(){
		return nonTerminals;
	};

	var getTerminalActions = function(){
		return terminalActions;
	};

	var clearActionLibrary = function(){
		actions = [];
		startSymbols = [];
		nonTerminals = [];
		terminalActions = [];
	};

	var parseActions = function(data){
		var parsedActions;
		var fileName;
		var actionsToCategorize = [];
		//console.log("here is the value of data...", data);

		try {
			if (typeof data === "string") {
				parsedActions = (JSON.parse(data)).actions;
				fileName = (JSON.parse(data)).fileName;
			} else if (typeof data === "object") {
				parsedActions = data.actions;
				fileName = data.fileName;
			} else {
				console.log("unexpected value:", data);
				throw new Error("Error parseActions: unexpected data value: ", typeof data);
			}
		} catch (e) {
			throw new Error("JSON Error parseActions " + e);
		}
		if (parsedActions === undefined) {
			throw new Error("Error: social structure data file must be JSON that defines a top-level key 'socialStructure'");
		}
		for (var i = 0; i < parsedActions.length; i++) {
			var action = parsedActions[i];
			action.fileName = fileName;

			// Error Checking
			// ////#CODEREVIEW: add validation that there can't be two different actions that have the same intent defined.
			validate.action(action, "Examining action  #" + i);

		//}

		
		//for(var j = 0; j < parsedActions.length; j += 1){
			if(actionAlreadyExists(action)){
				console.error("Error! The action " + action.name + " is already defined!" );
				continue;
			}
			actions.push(util.clone(action));
			actionsToCategorize.push(action);
		}
		//actions = util.clone(parsedActions);
		categorizeActionGrammar(actionsToCategorize);
		return actions;
	};

	var actionAlreadyExists = function(potentialNewAction){
		for(var i = 0; i < actions.length; i += 1){
			if(actions[i].name === potentialNewAction.name){
				//uh oh, is already exists!
				return true;
			}
		}
	};

	/**
	 * @method categorizeActionGrammar
	 * @description This method takes in an unsorted list of actions (in the style returned from the parseActions method) and, based on the properties of these actions, determines if they are 'start', 'terminal' or 'non-terminal' actions and stores them in teh appropriate array of actionLibrary
	 * @param  {[array]} actionPool [Contains an unsorted list of all of the action termainals and non terminals]
	 */
	var categorizeActionGrammar = function(actionPool){
		var currentAction;
		for(var i = 0; i < actionPool.length; i += 1){
			currentAction = util.clone(actionPool[i])
			if(actionPool[i].intent !== undefined){
				startSymbols.push(currentAction);
			}
			if(actionPool[i].leadsTo !== undefined){
				nonTerminals.push(currentAction); // so start terminals ALSO end up here. Maybe that's good? Can change into an else-if if not!
			}
			if(actionPool[i].effects !== undefined){
				terminalActions.push(currentAction);
			}
		}

	};

	//#CODEREVIEW : Write this preamble!
	var getSortedActionsFromVolition = function(initiator, responder, registeredVolition, isAccepted, weight, numActionsPerGroup, cast){
		//console.log("Inside of getSortedactionsFromVolition");

		var actions = getTerminalActionsFromVolition(initiator, responder, registeredVolition, isAccepted, weight, numActionsPerGroup, cast);
		var sortedActions = sortActionsByVolitionScore(actions);
		return sortedActions;

	};

	var sortActionsByVolitionScore = function(actions){
		//TODO: WRITEME!
		//
		
		//ok, so... umm... what?
		//What do we need to do?
		//We need to look inside of each action array that we'll have in here, and then sort them
		//based on their 'weight' attribute. I think. I think maybe it is just as easy as that!
		//the only problem is that we don't know how deep it goes! So we...
		//
		//NEED RECURSION AGAIN!
		//I've been wielding its dark art a lot, lately.
		
		//console.log("This is what actions look like inside of sort actions by volition score: ", actions);

/*
		for(var i = 0; i < actions.length; i += 1){
			var nextActions = actions[i].actions;
			if(nextActions !== undefined){
				sortActionsByVolitionsScore(actions[i].actions);
			}			
		}
		*/
		var descSortedActions = _.sortBy(actions, "weight");
		actions = descSortedActions.reverse(); // now all of our actions are sorted, sweet!
		//console.log("Maybe this is all sorted now? " , descSortedActions);

		//And, uh, I guess now we want to do the same as we drill downwards?
		for(var i = 0; i < actions.length; i += 1){
			var nextActions = actions[i].actions;
			if(nextActions !== undefined){
				actions[i].actions = sortActionsByVolitionScore(nextActions);
			}

			//let's try sorting the 'good bindings' by their weight$$ property.
			if(actions[i].goodBindings !== undefined){
				var descSortedBindings = _.sortBy(actions[i].goodBindings, "weight$$");
				actions[i].goodBindings = descSortedBindings.reverse();
			}
		}

		return actions;
	};

	/**
	 * //TODO: Double check that this method stil works? I think it might be obsolete...
	 * @method getActionsFromVolition
	 * @description Given information about a specific intent/volition, returns an array of all actions that adjust that volition
	 * @param  {Object} volition [An object that specifies a volition a character wants to take towards another character.]
	 * @return {[]}          [An array representing all of the actions that the 'first' character as specified in the volition parameter wants to take towards the 'second' character in the volition parameter.]
	 */
	var getActionsFromVolition = function(volition){
		var relatedActions = [];
		var actionIntent;
		for(var i = 0; i < actions.length; i +=1){
			actionIntent = actions[i].intent;
			if(actionIntent.class === volition.class &&
				actionIntent.type === volition.type &&
				actionIntent.intentDirection === volition.intentDirection){
					//it appears that this is an action pertaining to this volition!
					relatedActions.push(util.clone(actions[i]));
			}
		}
		return relatedActions;
	};

	//I'm gonna hold off on writing an official description for now, but in general, this is what I'm hoping for:
	//We get some voition (like start dating)
	//From this volition, we know whehter it is going to be accepted or not. That will be important in determining what terminals we are interested in.
	/**
	 * @method getTerminalActionsFromVolition
	 * @description This method takes the names of the initiator and responder of an action and a registered volition 
	 * between them, and will go through the entire grammar for the intnet specified in the volition and return all 
	 * terminal actions that are appropriate (are of the correct accept/reject polarity, have all conditions met, etc.)
	 * The number of actions returned per action group is determined by numActionsPerGroup. 
	 * Cast indicates the characters to use for role binding.
	 * @param  {[String]} initiator          [The name of the initiator of the action.]
	 * @param  {[String]} responder          [The name of the responder of the action.]
	 * @param  {[Object]} registeredVolition [The registered volition between the initiator and responder]
	 * @param  {[Number]} numActionsPerGroup [The number of terminal actions to return per 'action group.' They will ultimately be sorted by salience; i.e. if this number is 1, then only the most salient terminal action per action group will be returned. If 2, the top two salient terminal actions, etc.]
	 * @param  {[Array]} cast               [The characters to be used in the role binding process]
	 * @return {[Array]}                    [An Array of potential actions that can be carried out from the initiator to the responder]
	 */
	var getTerminalActionsFromVolition = function(initiator, responder, volition, isAccepted, weight, numActionsPerGroup, cast){
		//var volition = registeredVolition.getFirst(initiator, responder);
		//var acceptedObject = registeredVolition.isAccepted(initiator, responder, volition);
		//var weight = volition.weight;
		//console.log("^^^^^^^^^ weight is: " + weight);
		//var isAccepted = acceptedObject.accepted;
		var actionIntent;
		var goodTerminals = [];
		var returnTerminalList = [];
		var potentialTerminal;
		//#CODREVIEW -- probably only need uniqueBindings or initialGoodBindings
		var uniqueBindings = {};
		uniqueBindings["initiator"] = initiator;
		uniqueBindings["responder"] = responder;
		//This name is a little misleading, as we don't know yet if the binding is good or bad,
		//but we DO know that this binding has to take place, so I think it works...
		var initialGoodBindings = {
			"initiator" : initiator,
			"responder" : responder
		};

		//first, we need to find the 'start' action based on the volition
		for(var i = 0; i < startSymbols.length; i += 1){
			actionIntent = startSymbols[i].intent;
			if(actionIntent.class === volition.class &&
				actionIntent.type === volition.type &&
				actionIntent.intentDirection === volition.intentDirection){
					//it appears that this is an action pertaining to this volition!
					var rootAction = util.clone(startSymbols[i]);
					rootAction.goodBindings = [];
					rootAction.goodBindings.push(initialGoodBindings);
					rootAction.weight = weight; // This is the 'base' score that came from our microtheories equivalent.
					goodTerminals = getTerminalActionsFromNonTerminal(rootAction, isAccepted, numActionsPerGroup, uniqueBindings, cast);
					if(goodTerminals === undefined){ // this means we didn't find any good actions!
						console.log("found no valid actions for init: " + initiator + ", respond: " + responder + ", for volition " , volition);
						return;
					}

					//#CODEREVIEW: Maybe just return goodTerminals right here.
					
					returnTerminalList = goodTerminals; //Ok, so, it said temp temp temp, but actually I think this is pretty much exactly what we want!


					//TEMP TEMP
					//return goodTerminals; // just for debugging help.

					//We want the return array to be a dictionary/associative array with index entries
					//equal to the names of the nonTerminal actions that got us to the terminals.
					//I don't think we need this anymore, in all honesty. We do checks for this when we are actually finding the good termiansl (hence, them being considered "good" !).
					/*
					for(var j = 0; j < goodTerminals.length; j += 1){
						potentialTerminal = goodTerminals[j];
						if(potentialTerminal.isAccept === isAccepted){
							returnTerminalList.push(potentialTerminal);
						}
					}
					*/

					//Now, actually push in the terminal actions.
					/*
					for (var key in goodTerminals){
						if (goodTerminals.hasOwnProperty(key)){
							for(var k = 0; k < goodTerminals[key].length; k += 1){
								potentialTerminal = goodTerminals[key][k];
								if(potentialTerminal.isAccept === isAccepted){
									if(returnTerminalList[key] === undefined){
										returnTerminalList[key] = [];
									}
									returnTerminalList[key].push(potentialTerminal);
								}
							}
						}
					}
					*/
			}
		}

		return returnTerminalList;
	};

	/**
	 * @method getTerminalActionsFromNonTerminal
	 * @description Returns an array that contains all of the terminal actions that you can reach from a given nonTerminal action.
	 * @param  {[Object]} nonTerminal [A 'non-terminal object that theoretically has a "leadsTo" field defined. This leadsTo field may lead to terminals or nonTerminals. If nonTerminals, this function is called recursively until terminals are reached.']
	 * @return {[Array]}             [An Array of all of the non-terminals you can reach from the provided nonTerminal]
	 */
	var getTerminalActionsFromNonTerminal = function(nonTerminal, isAccepted, actionsPerGroup, uniqueBindings, cast){
		var returnList = [];
		var terminalsAtThisLevel = false;
		var currentUniqueBindings = uniqueBindings;
		var startingWeight = nonTerminal.weight;
		actionsPerGroup = actionsPerGroup || 1; //By default, assume you want the MOST salient action per group (as opposed to, say, the top TWO salient actions)
		isAccepted = typeof isAccepted !== 'undefined' ? isAccepted : true;
		if(nonTerminal.leadsTo === undefined){
			//we don't know what to do here! Uh, end of the road? Return?
			return;
		}

		//TODO: WHAT IF: We just did the check for 'goodness' here? That seems like it might be better.
		//TODO: Maybe we should just rename this function to something like 'getTerminals'
		//TODO: Let's finish the function first, and then we can worry about refactoring it later.
		currentUniqueBindings = getUniqueActionBindings(nonTerminal, uniqueBindings);
		//#CODEREVIEW -- why is cast passed in twice here? Ah, because one is available and one is all. But "all" never changes, so insead of passing in a clone, how about just a reference.
		var nonTerminalWorkingBindingCombinations = getWorkingBindingCombinations(nonTerminal, util.clone(uniqueBindings), util.clone(cast), util.clone(nonTerminal.goodBindings), util.clone(cast));
		if(nonTerminalWorkingBindingCombinations.length <= 0){
			//Oops, there is no possible combination of cast members that make this work! So no point in going down this path anymore!
			//console.log("At a non-terminal, we didn't find any possible combinations to make it work! Aborting this path.");
			return;
		}

		//#CODEREVIEW: I don't think we ever use oldGoodBindings -- kill it!
		//#CODEREVIEW: We also don't have to CLONE nonTerminalWorkingBindingCombinations -- just assign it!
		var oldGoodBindings = util.clone(nonTerminal.goodBindings);
		nonTerminal.goodBindings = util.clone(nonTerminalWorkingBindingCombinations);

		//So, now at this point, where I have all of the 'good bindings' at this level... I guess what I want to do
		//is go through all of the influence rules, for each binding, and re-score them?
		//The starting score should come from the 'parent' element.
		//oh, wait, it has it already I think, because we don't have any children yet. OK.
		computeInfluenceRuleWeight(nonTerminal);


		//console.log("$$$$$ Here is my terminal action before going into the 'I found a terminal action' thing!", nonTerminal);

		//#CODEREVIEW -- do we need this terminalActionsParentObject? Why not just keep on using nonTerminal instead?
		var terminalActionParentObject = {};
		terminalActionParentObject.name = nonTerminal.name;
		terminalActionParentObject.weight = nonTerminal.weight;
		terminalActionParentObject.goodBindings = nonTerminal.goodBindings;
		terminalActionParentObject.actions = [];
		var potentialActionsToReturn = [];
		//#CODEREVIEW: Maybe think about breaking this for-loop into it's own function?
		for(var i = 0; i < nonTerminal.leadsTo.length; i += 1){
			var actionName = nonTerminal.leadsTo[i];
			//We're going through each one of the 'leads to' thingies!
			//If these lead-to things are terminals, then great, I guess we're done?
			//
			//TODO: Intead of having to recompute this every time, it would be cool to 
			//actually construct something that kept track of this structure... using associative arrays 
			//I suppose? Maybe pointers? Hmmmm..
			//#CODEREVIEW -- fix the name of this fuction/remove extraneous functions with similar names.
			var terminalAction = getTerminalActionFromNameGeneric(actionName, terminalActions);


			if(terminalAction !== undefined){
				terminalsAtThisLevel = true;
				terminalAction.goodBindings = util.clone(nonTerminal.goodBindings);
				//console.log("$$$$$ Here is my terminal action before going into the 'I found a terminal action' thing!", terminalAction);

				currentUniqueBindings = getUniqueActionBindings(terminalAction, uniqueBindings);
				//TODO: Do a similar thing at the nonterminal level, but for now let's just get it working here first.
				var workingBindingCombinations = getWorkingBindingCombinations(terminalAction, util.clone(currentUniqueBindings), util.clone(cast), util.clone(terminalAction.goodBindings), util.clone(cast));
				
				//#CODEREVIEW: this clone seems unnecessary -- maybe just assign them.
				terminalAction.goodBindings = util.clone(workingBindingCombinations);
				//console.log("Working binding combinations: ", workingBindingCombinations);
				//we found a terminal symbol! Great, let's add it to the list!
				//Let's do some checks to make sure that the action that we're looking at is good.
				//This means checking it's conditions, and checking if it's "isAccept" matches what we want.
				if(!actionIsAppropriate(terminalAction, isAccepted, currentUniqueBindings)){
					//oops, either the conditions or the isAccept didn't pass! Let's move along...
					//console.log("how many times do you see me? inappropriate action: " , terminalAction);
					continue;
				}
				if(terminalAction.name === "actualFriends4Degrees"){
					//console.log("ok, here we are at mr. problem...");
				}
				//In "traditional CiF" we would only want one of these things. The most salient.
				//But here we have the power to take the X most salient, if we so desire.
				//TODO: (Of course) there is a LOT of thinking that has to go into how conditions work with all of this stuff... I'm kind of dreading that a little big!
				
				//So, ok... here is what I'm going to do... I'm going to change all of this
				//returnList manipulation, into creating a new 'action object' thingy, which will
				//have an action array, and it is THAt array that will under go manipulation.

/*
				//'original working'
				if(returnList[nonTerminal.name] === undefined){
					returnList[nonTerminal.name] = []; // make it a little array?
					if(terminalAction.salience === undefined){
						terminalAction.salience = computeActionSalience(terminalAction);
					}
					returnList[nonTerminal.name].push(terminalAction);
				}
*/

				//AND FINE, I'm caving in! Let's compute influence rules for this terminal action, too!
				computeInfluenceRuleWeight(terminalAction);

				//#CODEREVIEW: Get rid of salience code? Just comment it out maybe. We shouldn't have code executing that isn't doing anything.
				//#CODEREVIEW: AH, ok! Change all of these things that are looking at salience to instead look at influence rule weight instead.
				if(terminalActionParentObject.actions === undefined || terminalActionParentObject.actions.length <= 0){
					terminalActionParentObject.actions = [];
					if(terminalAction.salience === undefined){
						terminalAction.salience = computeActionSalience(terminalAction);
					}
					terminalActionParentObject.actions.push(terminalAction);
				}
				else{
					if(terminalAction.salience === undefined){
						terminalAction.salience = computeActionSalience(terminalAction);
					}
					var actionListLength = terminalActionParentObject.actions.length; // want to store this, because we'll be adjusting the length inside of the loop
					for(var salienceIndex = actionListLength; salienceIndex > 0; salienceIndex -= 1){
						if(terminalActionParentObject.actions[salienceIndex-1].salience >= terminalAction.salience){
							//it's time to stop. use the length to decide if we should even bother adding it or not, I guess.
							if(salienceIndex === actionListLength && actionListLength >= actionsPerGroup){
								//This new guy isn't even good enough to make the list, ignore it and stop going through the list!
							}
							else{
								//ok, cool, our new guy is bigger. Let's put him in.
								terminalActionParentObject.actions.splice(salienceIndex, 0, terminalAction);
								//And now check to see if anything needs to be removed.
								if(terminalActionParentObject.actions.length > actionsPerGroup){
									terminalActionParentObject.actions.splice(actionsPerGroup, terminalActionParentObject.actions.length - actionsPerGroup);
								}
							}
							break;
						}
						//If we've made it to here, that implies that we've found a new most salience thing
						//but let's wrap it an if just in case.
						if( (salienceIndex-1) === 0 && terminalAction.salience > terminalActionParentObject.actions[salienceIndex-1].salience){
							//we found a new 'most salience' thing, so put it at the front of the list!
							terminalActionParentObject.actions.splice(salienceIndex - 1, 0, terminalAction);
							//And now check to see if anything needs to be removed.
							if(terminalActionParentObject.actions.length > actionsPerGroup){
								terminalActionParentObject.actions.splice(actionsPerGroup, terminalActionParentObject.actions.length - actionsPerGroup);
							}
							break; // We're at the end of the loop, but let's break anywya just because.
						}
					}

				}
				/* //'original working'
				else{
					//ok, here we want to do a chck for this guy's salience, in case we don't have it yet.
					if(terminalAction.salience === undefined){
						terminalAction.salience = computeActionSalience(terminalAction);
					}

					//And now here we want to do a special thing where we figure out the relative salience?
					
					var actionListLength = returnList[nonTerminal.name].length; // want to store this, because we'll be adjusting the length inside of the loop
					//for(var salienceIndex = 0; salienceIndex < actionListLength; salienceIndex += 1){
					for(var salienceIndex = actionListLength; salienceIndex > 0; salienceIndex -= 1){
						//Ok, so we're starting at the end and going backwards.
						//It's possible that the new terminal one has a salience that's SO LOW we just ignore it
						//--that would be if the 'first' one we look at (i.e. the one already at the end of the list) is bigger than it.
						//--In which case we just stop.
						//If it is bigger than the first one, then we know it is going to be ON the list, and then it is just a matter of
						//keeping on going until you find the perfect spot for it to go.
						if(returnList[nonTerminal.name][salienceIndex-1].salience > terminalAction.salience){
							//it's time to stop. use the length to decide if we should even bother adding it or not, I guess.
							if(salienceIndex === actionListLength && actionListLength >= actionsPerGroup){
								//This new guy isn't even good enough to make the list, ignore it and stop going through the list!
							}
							else{
								//ok, cool, our new guy is bigger. Let's put him in.
								returnList[nonTerminal.name].splice(salienceIndex, 0, terminalAction);
								//And now check to see if anything needs to be removed.
								if(returnList[nonTerminal.name].length > actionsPerGroup){
									returnList[nonTerminal.name].splice(actionsPerGroup, returnList[nonTerminal.name].length - actionsPerGroup);
								}
							}
							break;
						}
						//If we've made it to here, that implies that we've found a new most salience thing
						//but let's wrap it an if just in case.
						if( (salienceIndex-1) === 0 && terminalAction.salience > returnList[nonTerminal.name][salienceIndex-1].salience){
							//we found a new 'most salience' thing, so put it at the front of the list!
							returnList[nonTerminal.name].splice(salienceIndex - 1, 0, terminalAction);
							//And now check to see if anything needs to be removed.
							if(returnList[nonTerminal.name].length > actionsPerGroup){
								returnList[nonTerminal.name].splice(actionsPerGroup, returnList[nonTerminal.name].length - actionsPerGroup);
							}
							break; // We're at the end of the loop, but let's break anywya just because.
						}
					}
				}
				*/
				
			}
			else{ // Ah, we must be dealing with another non-terminal! let's DIG DEEPER!
				//TODO: Have there be some kind of nice functionality to double check against the inclusion of loops (probably doesn't belong here though)
				
				//#CODEREVIEW: This code is pretty much exactly repeated elsewhere in this function. Make it it's own function, maybe passing in special parametrs as needed.
				var nonTerminalAction = getTerminalActionFromNameGeneric(actionName, nonTerminals);
				nonTerminalAction.goodBindings = nonTerminal.goodBindings;
				nonTerminalAction.weight = nonTerminal.weight;
				//nonTerminalAction.conditions = nonTerminal.conditions;
				currentUniqueBindings = getUniqueActionBindings(nonTerminalAction, uniqueBindings);
				if(!actionIsAppropriate(nonTerminalAction, isAccepted, currentUniqueBindings)){
					//oops, either the conditions or the isAccept didn't pass! Let's move along...
					//console.log("how many times do you see me? inappropriate action: " , terminalAction);
					continue;
				}

				var diggingDeeperActions = getTerminalActionsFromNonTerminal(nonTerminalAction, isAccepted, actionsPerGroup, util.clone(currentUniqueBindings), util.clone(cast));
				if(diggingDeeperActions === undefined || diggingDeeperActions.length <= 0){
					continue; // oops! This 'leads to' led to something that had no valid bindings! Better move on!
				}
				
				nonTerminalAction.actions = [];
				for(var ddActionIndex = 0; ddActionIndex < diggingDeeperActions.length; ddActionIndex += 1){
					var thingToAdd = diggingDeeperActions[ddActionIndex];
					nonTerminalAction.actions.push(util.clone(thingToAdd));
				}

				//#CODEREVIEW: We don't use this anymore.
				var nonTerminalActionObject = {};

				//BEN START HERE: Ok, I think this is where the issue is... I don't think that 
				//we actually have the chance to 'augment it later' -- by this point it should already be
				//'augmented -- the act of calling 'digging deeper actions' was our chance to get the weight,
				//but we didn't store it BECUASE we are still using the archaic return list for salience.
				//I think if we convert the 'salience area' to use the 'modern' format for return lists,
				//all of this (goodBindings and weight) will become a lot easier.
				//Yeah, totally, and then we'll change 
				//nonTerminalActionObject.weight = diggingDeeperActions.weight (or whatever)
				//in fact, maybe we actually want to move all of this stuff over to the salience area?
				//Noo.. no no no... it is important that we have them here too!
				
				/*
				
				// 'Worked' as of 9/25 10am -- but fell apart when the tree had more than 4 levels to it.
				nonTerminalActionObject.name = actionName;
				nonTerminalActionObject.weight = diggingDeeperActions[0].weight; // and we'll augment this later.
				nonTerminalActionObject.goodBindings = nonTerminalAction.goodBindings;
				nonTerminalActionObject.conditions = nonTerminalAction.conditions;
				nonTerminalActionObject.actions = [];
				*/
			


				//Great! we just (potentially) grabbed a lot more terminal actions! Let's go through them one by one and add them to our return list!
				//for(var j = 0; j < diggingDeeperActions[actionName].length; j += 1){
				//#CODEREVIEW - This doesn't get used at all! Get rid of it!
				for(var j = 0; j < diggingDeeperActions.length; j += 1){
				
					//Add to the child the 'good combinations' discovered by the parent...
					//diggingDeeperActions[actionName][j].goodBindings = util.clone(nonTerminal.goodBindings);
					
					/*
					//9-22 4pm WORKED, but didn't have enough space for enough information. Going to change that...
					if(returnList[actionName] === undefined){
						returnList[actionName] = [];
					}
					returnList[actionName].push(diggingDeeperActions[actionName][j]);
					*/
				
					/*
					//9/25 10AM -- 'worked' until we had 4 layers worth of actions. Then got weird and broken.
					for(var k = 0; k < diggingDeeperActions[j].actions.length; k += 1){
						nonTerminalActionObject.actions.push(diggingDeeperActions[j].actions[k]);
					}
					*/
					

				}
				//So, we also added in this lines...
				//returnList.push(util.clone(nonTerminalActionObject));
				returnList.push(util.clone(nonTerminalAction));
			}

		}

		if(terminalsAtThisLevel === true){
			//returnList.push(util.clone(terminalActionParentObject.actions)); //what is life like if we only return the TERMINALS here?
			//returnList = util.clone(terminalActionParentObject.actions);
			for(var terminalsToPushUpIndex = 0; terminalsToPushUpIndex < terminalActionParentObject.actions.length; terminalsToPushUpIndex += 1){
				returnList.push(util.clone(terminalActionParentObject.actions[terminalsToPushUpIndex]));
			}
		}

		//If we've gotten here, we must have gotten everything we need!
		return returnList;

	};

	/**
	 * @method computeActionsSalience
	 * @description Takes an action as a parameter. If it's salience score is undefined, computes a new salience score based on it's conditions.
	 * @param  {[Object]} terminalAction [An action that should come at the 'end' of the action tree (i.e. it should have effects associated with it). This actions conditions are used to compute salience.]
	 * @return {[Number]}                [The number representing the salience of this particular action.]
	 */
	var computeActionSalience = function(terminalAction){
		var returnValue;
		var multiplier = 5; // Maybe this should live in some constants thing? Or, better yet, be something that the user can specify?
		if(terminalAction.salience !== undefined){
			returnValue = terminalAction.salience;
		}
		else{
			var numConditions = terminalAction.conditions.length;
			if(numConditions === undefined){
				numConditions = 0;
			}
			var salienceCalculation = numConditions * multiplier;
			returnValue = salienceCalculation;
		}
		return returnValue;
	};

	//old bindings is an array of bindings, new bindings is a single binding.
	//Goes through the old binding array, goes through each key, sees if it matches
	//the same key in new bindings (note: new bindings might have additional roles that
	//old bindings lacks, but that's ok). If we find a match, then we return the
	//weight$$ value in that particular binding.
	//Theoretically this SHOULD always find a match. If it doesn't, then wrong values were passed in/the
	//function wasn't used in the correct context. 
	//SEEMS TO BE OBSOLETE NOW
	var findWeightFromPreviousBinding = function(newBindings, oldBindings){
		var mismatchFound = false;
		for(var i = 0; i < oldBindings.length; i += 1){
			for (var role in oldBindings[i]){
				if(oldBindings[i][role] !== newBindings[role]){
					//Oops, this binding doesn't work!
					mismatchFound = true;
					break;
				}
			}
			if(mismatchFound === false){
				//we found the perfect binding!
				return oldBindings.weight$$;
			}
			else{
				mismatchFound = false; // reset for the next loop...
			}
		}
	};

	//MYU OLD INFLUENCE RULE CODE, but separated out (because I think other things were calling it!)
	//Going to change all instances of 'nonTerminal' to 'action', because I think any action can actually
	//be passed through this now.
	var computeInfluenceRuleWeight = function(action){
		var bestWeightFoundSoFar = -999999;
		for(var goodBindingIndex = 0; goodBindingIndex < action.goodBindings.length; goodBindingIndex += 1){
			var tempGoodBindings = action.goodBindings[goodBindingIndex];
			//var oldWeight = findWeightFromPreviousBinding(tempGoodBindings, oldGoodBindings);
			var oldWeight = tempGoodBindings.weight$$;
			if(oldWeight === undefined){
				//This should only happen at the 'top level' I think.
				oldWeight = action.weight; // This should be equal to the 'starting volition'
			}
			var scoreFromInfluenceRules = evaluateActionInfluenceRules(action, tempGoodBindings);
			//console.log("Getting here! Here is score from influence rules! " , scoreFromInfluenceRules);
			//I'm starting to get a little doubtful that this is going to work. Oh, unless... unless the score LIVEs inside of the good bindings?
			//Sure, the score can live there, but the 'BEST' score should also live at the level of the influence rule itself... yah?
			//AND DON'T FORGET! The score is adjusted by what has come before it, too!
			//var candidateWeight = startingWeight + scoreFromInfluenceRules;
			var candidateWeight = oldWeight + scoreFromInfluenceRules;
			if(candidateWeight > bestWeightFoundSoFar){
				//We've found a new best candidate!
				action.weight = candidateWeight;
				bestWeightFoundSoFar = candidateWeight;
			}

			action.goodBindings[goodBindingIndex].weight$$ = candidateWeight;
			
		}
	}

	//Function that checks all of the various things that can make an action "not appropriate"
	//e.g. it is an "accept" action when we are looking for reject action.
	//Or it doesn't pass the conditions.
	//Because at this point we don't know if we are dealing with a terminal or a non-terminal, we 
	//have to look at the fields this action contains to figure out what kind of checks to do.
	/**
	 * @method actionIsAppropriate
	 * @description actionIsAppropriate checks various qualities that would make an action "not appropriate", such as an action being marked as an "accept" action when we are looking for a reject action.
	 * @param  {[Object]}  action         [The method uses properties of this action, such as isAccept and goodBindings, to confirm if the action is still appropriate.]
	 * @param  {Boolean} isAccepted     [A boolean representing the type of action we are looking for -- true for an accept action, false for a reject action.]
	 * @param  {[Object]}  uniqueBindings [All of the unique roles that have been defined for the action tree.]
	 * @return {[Boolean]}                 [Returns true if the action is still appropriate, false otherwise. Returning false here halts continuation down the action tree, as this being false means all subsequent actions will also be false.]
	 */
	var actionIsAppropriate = function(action, isAccepted, uniqueBindings){
		if(action.isAccept !== undefined){
			if(isAccepted !== action.isAccept){
				return false; // oops, looking for one truth value but found another!
			}
		}
		//If we get to this point, and the action has no "goodBindings" associated with it,
		//that means that there is no combination of characters that exists that satisfies all 
		//of the conditions that have been specified by this point in the "action tree." Therefore,
		//there is no point in going further.
		if(action.goodBindings.length <= 0){
			return false; // if there are no good bindings here, the action is not appropriate?
		}
		return true;
	};



	//#CODEREVIEW: Consolodate these three functions. Maybe create a separate 'isTerminal' function that returns a boolean?
	/**
	 * @method getActionFromNameGeneric
	 * @description Given the name of an action, searches through a provided array to find the corresponding action object and returns it.
	 * @param  {string} actionName [The name of the action we are hunting for in the provided array.]
	 * @return {object}            [An object representing all relevant information pertaining to the requested action. Returns undefined if no such action exists.]
	 */
	var getTerminalActionFromNameGeneric = function(actionName, actionArray){
		for(var i = 0; i < actionArray.length; i += 1){
			if(actionArray[i].name === actionName){
				return util.clone(actionArray[i]);
			}
		}
		return undefined;
	};

	/**
	 * @method getTerminalActionFromName
	 * @description Given the name of an action, searches through the terminal action array to find the corresponding action object and returns it.
	 * @param  {string} actionName [The name of the action we are hunting for in the actions array.]
	 * @return {object}            [An object representing all relevant information pertaining to the requested action. Returns undefined if no such action exists.]
	 */
	var getTerminalActionFromName = function(actionName){
		for(var i = 0; i < terminalActions.length; i += 1){
			if(terminalActions[i].name === actionName){
				return util.clone(actions[i]);
			}
		}
		return undefined;
	};

	/**
	 * @method getActionFromName
	 * @description Given the name of an action, searches through the action array to find the corresponding action object and returns it.
	 * @param  {string} actionName [The name of the action we are hunting for in the actions array.]
	 * @return {object}            [An object representing all relevant information pertaining to the requested action. Returns undefined if no such action exists.]
	 */
	var getActionFromName = function(actionName){
		for(var i = 0; i < actions.length; i += 1){
			if(actions[i].name === actionName){
				return util.clone(actions[i]);
			}
		}
		return undefined;
	};

	//#CODEREVIEW: I think this doAction is obsolete -- double check that it still works with the freshly written 'getAction' function.
	/**
	 * @method performAction
	 * @description performAction has the 'initiator' character perform the action 'actionName' towards the responder. If the responder's volition is above a certain threshold, the action's "acceptEffects" will transpire. Otherwise, the "rejectEffects" will occur.
	 * @param  {[string]} actionName The name of the action to perform.
	 * @param  {[string]} initiator  The name of the character that is performing the action.
	 * @param  {[string]} responder  The name of the character that is having the action performed on them.
	 * @param  {object} registeredVolitions Our volition cache.
	 */
	var doAction = function(actionName, initiator, responder, registeredVolitions){
		//First, we have to find our action based on the name.
		var action = getActionFromName(actionName);

		if(action === undefined){
			console.error("Instructed to perform action " + actionName + " but that is not defined in the actionLibrary.");
		}

		//Now let's fill in the 'blank' roles with actual character names.
		//This will be done by assuming that whatever role is specified in the 'intent'
		//for 'first' is going to be the initiator, and 'second' is going to be the responder.
		action = bindActionEffects(initiator, responder, action);

		//Now we have to see if the action is accepted or rejected.
		var isAccepted = registeredVolitions.isAccepted(initiator, responder, action.intent);

		//And now, based on if it is accepted or rejected, we want to do either the accept or reject effects.
		console.log("is Accepted", isAccepted);
		if(isAccepted.accepted){
			setActionEffects(action.acceptEffects, initiator, responder);
		}
		else{
			setActionEffects(action.rejectEffects, initiator, responder);
		}
	};

	//#CODEREVIEW: This is definitely obsolete. Get rid of it.
	/**
	 * POSSIBLY OBSOLETE
	 * @method bindActionEffects
	 * @description Takes the roles specified in the 'intent' of an action, assumes that 'first' is the initiator and that 'second' is the responder, and then replaces the key that was used in the first/second slot throughout all of the effects of the action.
	 * @param  {string} initiator the name of the initiator of the action
	 * @param  {string} responder the name of the responder of the action
	 * @param {object} actionObject An object representing all of the pertinent information about an action.
	 * @return {object}           [the object that was passed in, but with roles  (such as 'x' and 'y') replaced with character's names in all of the effects]
	 */
	var bindActionEffects = function(initiator, responder, actionObject){
		var bindingLegend = [];
		bindingLegend[actionObject.intent.first] = initiator;
		bindingLegend[actionObject.intent.second] = responder;
		for(var i = 0; i < actionObject.acceptEffects.length; i += 1){
			//Replace all of the "x"s and "y"s and what have you with actual character names.
			actionObject.acceptEffects[i].first = bindingLegend[actionObject.acceptEffects[i].first];
			actionObject.acceptEffects[i].second = bindingLegend[actionObject.acceptEffects[i].second];
		}
		for(i = 0; i < actionObject.rejectEffects.length; i += 1){
			actionObject.rejectEffects[i].first = bindingLegend[actionObject.rejectEffects[i].first];
			actionObject.rejectEffects[i].second = bindingLegend[actionObject.rejectEffects[i].second];
		}
		return actionObject;
	};

	//#CODEREVIEW: Give this a better name so that we know this is the 'real' bindActionEffects
	//PHEW... OK... yes, Ben Start Here indeed...
	//When did I write this?
	var bindActionEffects2 = function(actionObject, bindingsToUse){
		console.log("inside of bindActionEffects2! BEN START HERE!");
		for(var i = 0; i < actionObject.effects.length; i += 1){
			actionObject.effects[i].first = bindingsToUse[actionObject.effects[i].first];
			actionObject.effects[i].second = bindingsToUse[actionObject.effects[i].second];
		}
		return actionObject;
	};

	/**
	 * @method getUniqueActionBindings
	 * @description Given an action (actionObject) and an object representing all of the unique roles we've encountered thus far (uniqueBindings), go through the roles specified in the action and, if not already present in the uniqueBindings object, add them to it!
	 * @param  {[Object]} actionObject   [An action object. This method goes through it's first and second roles of each of it's conditions, and adds any new roles it finds to the unique bindings object]
	 * @param  {[Object]} uniqueBindings [An object representing all of the unique roles found by this point in the action chain. If undefined, this method will create a new one.]
	 * @return {[Object]}                [An object containing all of the unique roles used by this point in the action chain.]
	 */
	var getUniqueActionBindings = function(actionObject, uniqueBindings){
		//If we don't have a uniqueBindings object passed in, create a new one.
		//#CODEREVIEW: We should probably just assume that uniqueBindings is already defined, so we don't need this check.
		if(uniqueBindings === undefined){
			uniqueBindings = {};
		}

		//Go through all of the conditions and check them for new roles
		var conditions = actionObject.conditions;
		for (var i = 0 ; i < conditions.length ; i += 1) {
			var predicate = conditions[i];			//store the current condition in a temp

			//if the dictionary does not have an entry for the current predicate's first, initialize it
			if (uniqueBindings[predicate.first] === undefined) {
				uniqueBindings[predicate.first] = "";		//possible optimization to change the initialization to zero
			}
			//and the same for the second entry in there is a second character in the predicate
			if (predicate.second !== undefined) {
				if (uniqueBindings[predicate.second] === undefined) {
					uniqueBindings[predicate.second] = "";
				}
			}
		}

		return uniqueBindings;
	};

/**
 * @method getWorkingBindingCombinations
 * @description This method figures out potential combinations of characters that will satisfy all of the conditions
 * that have been specified by this point in the action tree. Actions passed into the function through the 'action' parameter
 * are assumed to have a field called "goodBindings" that represent working combinations of characters to roles found through 
 * previous calls to this function. These good bindings will be updated in this function as new roles are discovered (e.g a new role 
 * that appeared later on down the action tree). Additionally, as new conditions are found, old combinations of bindings that
 * used to work may no longer work; this function will accomadate that as well. This method uses recursion.
 * @param  {[Object]} action               [The action we are finding valid combinations of bindings for. Assumes it has both a conditions array and a goodBindings array.]
 * @param  {[Object]} uniqueBindings       [A list of the roles that need to be filled. Some roles, such as initiator and responder, should be pre-populated with the initiator and responder of the action.]
 * @param  {[Array} availableCastMembers [The cast members to use in filling in roles. As a character can only fulfill one role at a time, characters are 'removed' from the cast once they are assigned a role.]
 * @param  {[Array]} combinationsToUse    [Although the action parameter will have all of the potential combinations, due to the recursive nature of this function, it is important to specify which set of combinations we want to use. In general, when this function is called non-recursively, this parameter should include all of the 'goodBindings' found in the action. When called recursively, you shoudl only pass in a single binding at a time.s]
 * @return {[Array]}                      [An array of all valid character-role combinations for the given action]
 */
var getWorkingBindingCombinations = function(action, uniqueBindings, availableCastMembers, combinationsToUse, allCastMembers){
		var returnArray = [];
		var newCombinationsToUse = [];


		//We want to do the following for each of our existing 'good' Combinations.
		//NOTE: This should only be > 1 when called from the outside. When called recursively, combinationsToUse should only consist of a single combination.	
		for(var workingCombinationIndex = 0; workingCombinationIndex < combinationsToUse.length; workingCombinationIndex += 1){
		
			//#CODEREVIEW - get rid of this test.
			if(action.name === "BOND" && workingCombinationIndex === 1){
				//console.log("At our problem child...");
			}

			newCombinationsToUse = []; // kinda weird, but we want to zero it out each time, because we only ever want it to have one entry.
			newCombinationsToUse.push(util.clone(combinationsToUse[workingCombinationIndex]));
			availableCastMembers = util.clone(allCastMembers);

			//I feel like we need to do something here to re-populate availableCastMembers with 
			//the people previously spliced out from the previous uniqueBindings?
			
			//We want to start off by filling in the roles stored in 'uniqueBindings' with the roles
			//that we've found that work from the previous combinations discovered.
			for (var role in combinationsToUse[workingCombinationIndex]){
				var characterName = combinationsToUse[workingCombinationIndex][role];
				if( characterName !== ""){
					//a character has been specified to work in this role (could be initiator, responder, or something else)
					//remove them from the available cast members, but make sure that they are 'lodged' in the unique bindings.
					//We remove them from the available cast members, because it means this character should be unavailable for any other role.
					// if availableCastMembers.indexOf(characterName) >= 0
					// //#CODEREVIEW - do the above.
					var castIndex = $.inArray(characterName, availableCastMembers);
					if( castIndex !== -1){
						availableCastMembers.splice(castIndex, 1);
					}

					//And just as the initiator and responder roles have already been clearly defined earlier,
					//inside of uniqueBidings, let's do the same for this new role...
					uniqueBindings[role] = characterName;
				}
			}

			//Used to help us find out if there are any roles that still need to be specified
			//Even though we just went through previous combinations to fill in roles, there could
			//still be some unspecified if this new action has introduced NEW roles.
			var isFilled = true;
			var emptyKey = "";

			//find an unbound key in the uniqueBindings dictionary
			for (var key in uniqueBindings) {
				if (uniqueBindings[key] === "") {
					emptyKey = key;
					isFilled = false;
					break;
				}
			}

			//All of the roles are filled. We can check to see if the conditions of this action
			//evaluate to true with this particular combination of roles and characters.
			if(isFilled === true){

				//Replace placeholder variables in conditions with actual character names.
				var boundConditions = ruleLibrary.doBinding(uniqueBindings, util.clone(action.conditions));

				//Find out if the conditions are true with this particular set of characters in these roles.
				var evaluationResult = ruleLibrary.evaluateConditions(boundConditions);

				if(evaluationResult === true){
					//Awesome! It's true! Push it on to our return array for later!
					//console.log("BOOYAH!!!!! Found a working combination: ", uniqueBindings);
					returnArray.push(util.clone(uniqueBindings));
				}
				else{
					//console.log("FAILURE FAILURE. not even going to bother printing the combination.");
				}
			}
			else{ // uniqueBindings is not totally filled in yet.
				//time to recurse.
				for(var i = 0; i < availableCastMembers.length; i += 1){
					uniqueBindings[emptyKey] = availableCastMembers[i];	// place an available cast member into the empty slot in the dictionary
					var updatedCastMembers = util.clone(availableCastMembers);
					updatedCastMembers.splice(i, 1);	// the updated cast has the currently assigned member removed for the recursion
					var potentialCombinations = getWorkingBindingCombinations(action, uniqueBindings, updatedCastMembers, newCombinationsToUse, allCastMembers);
					
					//Depending on where we are in the recursion chain, there's a chance that potentialCombinations
					//might have a length > 1. At least I think that's the case. If not, better safe than sorry, yeah?
					for(var k = 0; k < potentialCombinations.length; k += 1){
						returnArray.push(util.clone(potentialCombinations[k]));
					}
				}
				//If we've gotten here, we want to 'clear out' the uniqueBindings slot of the current 'emptyKey'
				//Because we want it to be clear for when we pop back up to the previous level of recursion.
				uniqueBindings[emptyKey] = "";
			}
		}
		return returnArray;
	};

	//#CODEREVIEW: The name is confusing (cif.set ? actually 'setting' some property of the action's effects? it is the former!) Also, this probably should live inside of the cif file, gets an action passed in.	
	/**
	 * @method setActionEffects 
	 * @description Given an 'effectSet' that came from an action (either the acceptEffects or rejectEffects) go through each one and set it into the sfdb. This function assumes that the effectSet bieng passed in has already been bound (that is to say, that there aren't generic 'roles' in the first and second slots, but actual character names.)
	 * 
	 * @param {[]} effectSet The effects to enact that came from the action -- either it's 'acceptEffects' or rejectEffects.
	 * @param {[string]} initiator [the name of the initiator of the action]
	 * @param {[string]} responder [the name of the responder of the action]
	 */
	var setActionEffects = function(effectSet, initiator, responder){
		for(var i = 0; i < effectSet.length; i += 1){
			//cif.set(effectSet[i]);
		}
	};

	var bindActionCondition = function(conditions, bindingToUse){
		for(var i = 0; i < conditions.length; i += 1){
			if(conditions[i].first !== undefined){
				conditions[i].first = bindingToUse[conditions[i].first];
			}
			if(conditions[i].second !== undefined){
				conditions[i].second = bindingToUse[conditions[i].second];
			}
		}
		return conditions;
	};

	//Given a binding, goes througha all of the influence rules of an action
	//and keeps a running sum of their effects. Then returns that sum.
	var evaluateActionInfluenceRules = function(action, bindingToUse){
		var volitionSum = 0;

		for(var i = 0; i < action.influenceRules.length; i += 1){
			var rule = action.influenceRules[i];
			var boundConditions = bindActionCondition(util.clone(rule.conditions), bindingToUse);
			var isRuleTrue = ruleLibrary.evaluateConditions(boundConditions);
			if(isRuleTrue === true){
				volitionSum += rule.weight;
			}

		}
		return volitionSum;
	};

	//Returns the 'best' terminal based on an actionList (where an actionList is presumambly)
	//a list of potential actions that has been computed given a certain cast. Everything should
	//already be sorted already, so it's just an easy matter of finding the 'first' thing in every
	//action list until we find one with no other actions -- then that means that we're at the 
	//best terminal!
	var getBestTerminalFromActionList = function(actionList){
		console.log("inside of getTerminalsFromActionList");
		if(actionList.length <= 0){
			//we shouldn't be getting in here with an empty actionList!
			return undefined;
		}
		if(actionList[0].actions !== undefined && actionList[0].actions.length > 0){
			//we are not at a terminal! Keep digging deeper!
			//And because we are only concerned with THE BEST, and the actionList should already be sorted,
			//it should just be a matter of looking at the first entry; no need to look at the rest of the list.
			return getBestTerminalFromActionList(actionList[0].actions);
		}
		else{
			//Ok, we're at the best terminal!
			var terminal = actionList[0];

			//BUT -- we need to get the 'best binding!'
			//There might be multiple best bindings!
			var potentialBestBindings = [];
			for(var i = 0; i < terminal.goodBindings.length; i += 1){
				//See if this goodBinding is in the running for being a bestBinding!
				if(terminal.goodBindings[i].weight$$ === terminal.weight){
					potentialBestBindings.push(terminal.goodBindings[i]);
				}
			}

			//Ok, pick one of the potentialBestBindings at random!
			var goodBindingIndex = _.random(0, potentialBestBindings.length-1);
			var bindingsToUse = potentialBestBindings[goodBindingIndex];
			//and NOW what we want to do is 'fill in' the action with this good binding!
			return bindActionEffects2(terminal, bindingsToUse);
		}
	};

	//Given a volition object, returns the single 'best' action for that volition,
	//using the best binding. if multiple best bindings exist, just picks one at random.
	var getAction = function(initiator, responder, volition, cast, numActionsPerGroup){
		console.log("inside getAction");
		//console.log("This is the contents of the actionLibrary: " , actionLibrary);
		if(numActionsPerGroup === undefined){
			numActionsPerGroup = 1;
		}

		var actionList;
		var volitionInstance = volition.getFirst(initiator, responder);
		while(actionList === undefined || actionList.length === 0){
			var acceptedObject = volition.isAccepted(initiator, responder, volitionInstance);
			var isAccepted = acceptedObject.accepted;
			var weight = volitionInstance.weight;
			actionList = getSortedActionsFromVolition(initiator, responder, volitionInstance, isAccepted, weight, numActionsPerGroup, cast);
			volitionInstance = volition.getNext(initiator, responder);
			//#CODEREVIEW -- move this if check into the while condition.
			if(volitionInstance === undefined){
				break;
			}
		}
		var boundAction = getBestTerminalFromActionList(actionList);
		return boundAction;
	};


	var getActions = function(initiator, responder, volition, cast, numIntents, numActionsPerIntent, numActionsPerGroup){
		console.log("inside of getActions!");
		if(numActionsPerGroup === undefined) numActionsPerGroup = 1;

		var returnList = [];
		var actionList;
		var volitionInstance = volition.getFirst(initiator, responder);
		var intentsRepresented = 0;
		var numActionsFromThisIntent = 0;
		var thisIntentCountedYet = false;
		while(intentsRepresented < numIntents){
			thisIntentCountedYet = false;
			numActionsFromThisIntent = 0;
			var acceptedObject = volition.isAccepted(initiator, responder, volitionInstance);
			var isAccepted = acceptedObject.accepted;
			var weight = volitionInstance.weight;
			actionList = getSortedActionsFromVolition(initiator, responder, volitionInstance, isAccepted, weight, numActionsPerGroup, cast);
			
			//var terminalsToAdd = extractAndSortTerminalsFromActionList(actionList);

			for(var i = 0; i < actionList.length; i += 1){
				returnList.push(util.clone(actionList[i]));
				console.log("What does returnList look like at this point...? ", returnList);
				if(thisIntentCountedYet === false){
					intentsRepresented += 1;
					thisIntentCountedYet = true;
				}

				//We've found an action from this intent, and have already added it to the return list.
				numActionsFromThisIntent += 1;
				if(numActionsFromThisIntent === numActionsPerIntent){
					//We've reached our quota for this intent--let's move on to the next intent, even if there are more actions left that could be added.
					break;
				}
			}
			volitionInstance = volition.getNext(initiator, responder);
			if(volitionInstance === undefined){
				break;
			}
		}

		//Perhaps at this point, we should sort the list based on the volition score?
		//And, also, perhaps actually return the terminals, instead of the parent action?
		//Or, uh, maybe not? Because right now they are sorted by the desire of the VOLITIONS themselves? 
		//And so the argument could be made that they are *already* sorted, even if one of them with a lower volition score gets a 'higher' total score after the influence rules of the game take place.
		//I think that this is the kind of thing that is likely going to change a lot from use case to use case. So, for the most basic version, I thnk what we'll do is this:
		//	Return an array of fully bound terminals, sorted in volition order, but not necessarily in total influence rule order.
		//	Cases to check (we'll want a unit test for each one of these): 
		//		1.) 1 action per volition (easy)
		//		2.) 2 actions per volition, multiple terminals from the same parent (e.g. laughTerminal1, laughTerminal2)
		//		3.) 2 actions per volition, terminals from separate parents (e.g. laughTerminal1, bondTerminal1)
		//		4.) 3 actions per volition, combining both 2 and 3 (laughTerminal1, laughTerminal2, bondTerminal1)
		//		5.) 3+ actions per volition (hopefully solving #4 should solve this as well).
		//var boundAction = getBestTerminalFromActionList(returnList);
		var boundActions = extractAndSortTerminalsFromActionList(returnList);
		return boundActions;
	};

	var extractAndSortTerminalsFromActionList = function(actionList){
		console.log("inside of extractAndSortTerminalsFromActionList!");
		var allTerminals = [];
		for(var i = 0; i < actionList.length; i += 1){
			//Any given 'entry' in this list might have multiple actions, if 'numActionsPerGroup was > 1' in previous calls.
			var currentAction = actionList[i];
			for(var j = 0; j < actionList[i].actions.length; j += 1){
				//Umm... are the actions bound at this point? I'm not sure if they are. We might have to 
				//do something special here.
				//These are now bound at this point yet -- we will have to do that eventually!
				//BEN: START HERE, please.
				allTerminals.push(actionList[i].actions[j]);
			}
		}

		//Sort them based on their score.
		var sortedTerminals = sortActionsByVolitionScore(allTerminals);
		for(var k = 0; k < sortedTerminals.length; k += 1){
			var bestBindings = getBestBindingFromTerminal(sortedTerminals[k]);
			sortedTerminals[k] = bindActionEffects2(sortedTerminals[k], bestBindings);
		}

		return sortedTerminals;


	};

	var getBestBindingFromTerminal = function(terminal){
		//There might be multiple best bindings!
		var potentialBestBindings = [];
		for(var i = 0; i < terminal.goodBindings.length; i += 1){
			//See if this goodBinding is in the running for being a bestBinding!
			if(terminal.goodBindings[i].weight$$ === terminal.weight){
				potentialBestBindings.push(terminal.goodBindings[i]);
			}
		}

		//Ok, pick one of the potentialBestBindings at random!
		var goodBindingIndex = _.random(0, potentialBestBindings.length-1);
		var bindingsToUse = potentialBestBindings[goodBindingIndex];
		return bindingsToUse;
	};


	var actionLibraryInterface = {
		parseActions : parseActions,
		getAllActions : getAllActions,
		getActionsFromVolition : getActionsFromVolition,
		getActionFromName : getActionFromName,
		doAction : doAction,
		bindActionEffects : bindActionEffects,
		bindActionEffects2 : bindActionEffects2,
		categorizeActionGrammar : categorizeActionGrammar,
		getStartSymbols : getStartSymbols,
		getNonTerminals : getNonTerminals,
		getTerminalActions : getTerminalActions,
		getTerminalActionsFromNonTerminal : getTerminalActionsFromNonTerminal,
		clearActionLibrary : clearActionLibrary,
		getTerminalActionsFromVolition : getTerminalActionsFromVolition,
		getSortedActionsFromVolition : getSortedActionsFromVolition,
		getBestTerminalFromActionList : getBestTerminalFromActionList,

		getAction : getAction,
		getActions : getActions
	};



	/* test-code */
	//actionLibraryInterface.bindActionEffects = bindActionEffects;
	actionLibraryInterface.getWorkingBindingCombinations = getWorkingBindingCombinations;
	/* end-test-code */

	return actionLibraryInterface;

});