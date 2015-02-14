Building CiF currently requires NodeJS and Grunt.

To install Node: (instructions here)

To install Grunt (on Mac): 
	Open Terminal and change to the root directory of the Cif project (where the js, jslib etc. folders are.)

	Then type:
		npm install grunt
		npm install -g grunt-cli

	You might have to preface one or both of these with "sudo".

	This should create a "node_modules" folder.

	Then, you need to install all the grunt packages the compiler needs. Do this by typing each of the following:
		npm install grunt-contrib-uglify --save-dev
		npm install grunt-strip-code --save-dev
		npm install grunt-jsdoc --save-dev


	I bet I can't commit this right? RIGHT!?!?!
	How about this second change. Now that I've changed the name of my key, who knows right allb ets are all off right!?1

