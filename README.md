# Ensemble

A framework for creating socially aware characters. An evolution of the Comme il Faut AI system, which powered the game Prom Week.

# Ensemble.js

[Ensemble.js](https://github.com/ensemble-engine/ensemble/blob/master/ensemblejs/js/ensemble/ensemble.js) is a standalone JavaScript library that you can include in a web project with an HTML script tag: 

`<script src="ensemble.js"></script>`

Then, in your Javascript code, add the event listener, `document.addEventListener('ensembleLoaded', function (e){}`, to get access to an `ensemble` singleton object, which you can then use to call Ensemble methods. _[TODO: link to a Wiki page reference to all public Ensemble functions]_

See the Getting Started page for more details. _[TODO: make Getting Started Wiki page.]_

# The Ensemble Authoring Tool

It can be difficult and tedious to author Ensemble domains (schema, trigger rules, volition rules, characters, history, and actions) in pure JSON without helper functions. The Ensemble Authoring Tool is a standalone desktop app for macOS and Windows designed to help authors develop and test their domains. 

_[TODO: screenshot of authoring tool]_

The latest build can be found under [releases](https://github.com/ensemble-engine/ensemble/releases).

## Building the Authoring Tool from Source 

### Building a macOS version

Building the Ensemble Authoring Tool requires Node.js, NPM, and Grunt. You also need the Java Development Kit (JDK) to generate documentation via jsdoc, but that isn't strictly necessary.

#### 1. Install Node.js

Note, NPM is installed when you install Node.js. Test if you already have them with: `node -v` and `npm -v` on a command line.
	
If not, download and use the installer programs (or package manager alternatives) on the [Node.js website](https://nodejs.org/en/download/).

You may also want to ensure your NPM is up-to-date with `npm update -g npm` (some systems may require `sudo`).

#### 2. Install Grunt

_See also: the [Grunt Getting Started page](https://gruntjs.com/getting-started)_

If you're using Grunt for the first time on this machine, open a command shell and install the Grunt command line interface (CLI) by running: 

	npm install -g grunt-cli

You might have to preface this with `sudo` (on OSX, \*nix, BSD, etc) or run your command shell as Administrator (for Windows).

This will install the Grunt CLI globally, putting the grunt command in your system path, allowing it to be run from any directory, as long as you also have a local grunt install in that directory. 

Now, if you aren't already there, move to this directory of the Ensemble project (where the js, jslib etc. folders live), and install Grunt locally by running:

	npm install grunt

This should create a `node_modules` folder in this directory. You'll need to do this for every new directory that uses Grunt (e.g., if you re-clone Ensemble).

Then, install the project dependencies listed in `package.json` with:

	npm install

See a list of your newly installed packages with `npm list --depth=0`.  

#### 3. Build

And finally, run the following to build a macOS version of the authoring tool! 

	grunt build

This will generate a directory called `build` with executable 32 and 64-bit macOS app files. 

Note, you can run *all* the tasks defined in the Gruntfile (including build, documentation generation, and quite a few miscellaneous tasks) with `grunt`. 

### Building a Windows version

The Grunt script doesn't seem to build a Windows version successfully. Instead, build Windows versions of the tool using the Python 3 script, `build-console-for-windows.py`. This can be done on either macOS or Windows. 

You'll need Python 3 installed. (Check with `python -V` on a command shell.) 

In this directory, run:

	python build-console-for-windows.py

This should generate the `authoringTool-Windows` directory and a compressed version, `authoringTool-Windows.zip`. They contain a Windows executable of the authoring tool. 

You may get "no such directory" errors, but they can be safely ignored as long as the above directories are generated. 
