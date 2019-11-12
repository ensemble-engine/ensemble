The tool can be built as a standalone app for Mac/Windows/Linux (via Node) with:

	grunt build

It can also be run in a web browser for testing, but to do this you'll need a web server running on your computer for file i/o. On Mac OS, if you navigate to the main ensemble folder (one folder above "ensembletool", you can type this at a command prompt to start a server based in that directory:

	python -m SimpleHTTPServer

You then need to open a web browser pointing at the right spot:

	http://localhost:8000/ensembletool/ensembleconsole.html