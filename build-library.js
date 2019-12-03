// This script builds the bin/ensemble.js standalone Ensemble library file.
// TODO: Based on CLI arguments, switch whether or not the internal Ensemble JS modules
// are exposed to the global scope. (In testing mode they should be, in release they shouldn't.)

const fs = require("fs");

const mainBuildPath = "bin/ensemble.js";
const testBuildPath = "bin/ensemble-test.js";
const version = "1.1.1";

const modules = [
  {name: "underscore",    path: "jslib/underscore-min.js", wrapper: "none"},
  {name: "util",          path: "jslib/util.js"},
  {name: "socialRecord",  path: "js/ensemble/socialRecord.js"},
  {name: "ruleLibrary",   path: "js/ensemble/RuleLibrary.js"},
  {name: "actionLibrary", path: "js/ensemble/ActionLibrary.js"},
  {name: "volition",      path: "js/ensemble/Volition.js"},
  {name: "validate",      path: "js/ensemble/Validate.js"},
  {name: "ensemble",      path: "js/ensemble/ensemble.js"}
];

for (let buildPath of [mainBuildPath, testBuildPath]) {
  console.log(`Building ${buildPath}...`);
  fs.writeFileSync(buildPath, `// *** Ensemble ${version} ***\nensemble = (function(){\n`);
  for (let mod of modules) {
    console.log("  *", mod.name, mod.path);
    fs.appendFile(buildPath, `// MODULE ${mod.name}\n`, () => {});
    const moduleContents = fs.readFileSync(mod.path).toString();
    let moduleOutput = "";
    if (mod.wrapper === "none") {
      moduleOutput = moduleContents;
    }
    else if (mod.wrapper === "IIFE" || mod.wrapper === undefined) {
      // keep internal modules private unless building for tests
      if (buildPath !== testBuildPath) moduleOutput = "const ";
      moduleOutput += `${mod.name} = (function(){\n${moduleContents}\n})();`;
    }
    else {
      console.error(`No such wrapper type: ${mod.wrapper} for module: ${mod.name}`);
      moduleOutput = `// OMITTED MODULE ${mod.name} DUE TO ERROR`;
    }
    fs.appendFile(buildPath, moduleOutput + "\n", () => {});
  }
  fs.appendFile(buildPath, "return ensemble;\n})();", () => {});
}
