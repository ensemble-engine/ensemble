Building ensemble currently requires NodeJS and Grunt.

To install Node: (instructions here)

To install Grunt (on Mac): 
	Open Terminal and change to the root directory of the ensemble project (where the js, jslib etc. folders are.)

	Then type:
		npm install grunt
		npm install -g grunt-cli

	You might have to preface one or both of these with "sudo".

	This should create a "node_modules" folder.

	Then, you need to install all the grunt packages the compiler needs. Do this by typing each of the following:
		npm install --save-dev
