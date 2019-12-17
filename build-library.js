// This script builds the build/ensemble.js standalone Ensemble library file.

const fs = require("fs");

const buildDir = "build";
const mainBuildPath = buildDir + "/ensemble.js";
const testBuildPath = buildDir + "/ensemble-test.js";
const version = process.argv[2];

const modules = [
  {name: "underscore",    path: "ensemble/jslib/underscore-min.js", wrapper: "none"},
  {name: "util",          path: "ensemble/jslib/util.js"},
  {name: "socialRecord",  path: "ensemble/socialRecord.js"},
  {name: "ruleLibrary",   path: "ensemble/RuleLibrary.js"},
  {name: "actionLibrary", path: "ensemble/ActionLibrary.js"},
  {name: "volition",      path: "ensemble/Volition.js"},
  {name: "validate",      path: "ensemble/Validate.js"},
  {name: "ensemble",      path: "ensemble/ensemble.js"}
];

if (!fs.existsSync(buildDir)) {
  console.log(`Creating directory ${buildDir}/`);
  fs.mkdirSync(buildDir);
}

for (let buildPath of [mainBuildPath, testBuildPath]) {
  console.log(`Building ${buildPath}...`);
  fs.writeFileSync(buildPath, `// *** Ensemble v${version} ***\nensemble = (function(){\n`);
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
