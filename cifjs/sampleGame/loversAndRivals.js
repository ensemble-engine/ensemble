var helloWorld = function(){
	console.log("Hello, World!");
};

var move = function(){
	console.log("Hello, button click!");
	
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

var positionCharacter = function(id, pos){
	console.log("I got here, id is " + id + " and pos is " + pos);
	var elem = document.getElementById(id);
	elem.style.left = pos + "px";
};

var setUpLoversAndRivalsInitialState = function(){

	//Give every character a name.
	var heroTrait = {
		"class" : "trait",
		"type" : "hero",
		"first" : "hero",
		"value" : true
	};
	var loveTrait = {
		"class" : "trait",
		"type" : "love",
		"first" : "love",
		"value" : true
	};
	var rivalTrait = {
		"class" : "trait",
		"type" : "rival",
		"first" : "rival",
		"value" : true
	};

	//don't need to establish initial closeness values, because they default to 0 in the schema!
	// But keep it around for testing purposes.
	var tempCloseness = {
		"class" : "feeling",
		"type" : "closeness",
		"first" : "love",
		"second" : "hero",
		"value" : 30
	};


	
	//Actually insert this state into CiF's social facts database.
	cif.set(heroTrait);
	cif.set(loveTrait);
	cif.set(rivalTrait);
	cif.set(tempCloseness);
};

var drawCharacters = function(){
	var hero = document.getElementById("hero");
	var love = document.getElementById("love");
	var rival = document.getElementById("rival");

	var loveToHeroClosenessPred = {
		"class" : "feeling",
		"type" : "closeness",
		"first" : "love",
		"second" : "hero"
	};
	var loveToRivalClosenessPred = {
		"class" : "feeling",
		"type" : "closeness",
		"first" : "love",
		"second" : "rival"
	};
	var heroToLoveClosenessPred = {
		"class" : "feeling",
		"type" : "closeness",
		"first" : "hero",
		"second" : "love"
	};

	//Get love to hero closeness.
	var results = cif.get(loveToHeroClosenessPred);
	var loveToHeroCloseness = results[0].value;

	//Get love to rival closeness
	results = cif.get(loveToRivalClosenessPred);
	var loveToRivalCloseness = results[0].value;

	//Get hero to Love closeness
	results = cif.get(heroToLoveClosenessPred);
	var heroToLoveCloseness = results[0].value;

	console.log("Hero to love: " + heroToLoveCloseness + " love to hero: " + loveToHeroCloseness + " love to rival: " + loveToRivalCloseness);

	//console.log("Uhh, I'm not actually super sure what results are going to be! " , results);
};