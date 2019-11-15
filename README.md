# Ensemble

A framework for creating socially aware characters. An evolution of the Comme il Faut AI system, which powered the game Prom Week.

## ensemble.js

`ensemble.js`, available as part of the [latest release](https://github.com/ensemble-engine/ensemble/releases/latest), is a standalone JavaScript library that you can include in a web project with an HTML script tag:

`<script src="ensemble.js"></script>`

Then, in your Javascript code, add the event listener, `document.addEventListener('ensembleLoaded', function (e){}`, to get access to an `ensemble` singleton object, which you can then use to call [Ensemble methods](https://github.com/ensemble-engine/ensemble/wiki/Ensemble-API).

See the [wiki homepage](https://github.com/ensemble-engine/ensemble/wiki/) for tutorial links and other resources for getting started.

---

## Ensemble Authoring Tool

It can be difficult and tedious to author Ensemble domains (schema, trigger rules, volition rules, characters, history, and actions) in pure JSON without helper functions. The Ensemble Authoring Tool is a standalone desktop app for macOS and Windows designed to help authors develop and test their domains.

[TODO: screenshot of authoring tool]

The latest builds can be found on the [releases](https://github.com/ensemble-engine/ensemble/releases/latest) page.

---

## Developing Ensemble

See the [Contributing](https://github.com/ensemble-engine/ensemble/wiki/Contributing) wiki page for information about how to contribute to the project, how to build the library and the tool from source, etc. 
