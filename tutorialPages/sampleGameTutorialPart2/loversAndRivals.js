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
	"turnNumber" : 0
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