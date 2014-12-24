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