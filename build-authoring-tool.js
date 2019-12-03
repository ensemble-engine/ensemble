// replace version string in ensembletool/package.json with updated version string
// (passed as first CLI argument)
if (process.argv[2]) {
  const version = process.argv[2];
  const packageFilePath = "ensembletool/package.json";
  const fs = require("fs");
  const oldContents = fs.readFileSync(packageFilePath, "utf8");
  const newContents = oldContents.replace(/"version": "[^"]+"/, `"version": "${version}"`);
  fs.writeFileSync(packageFilePath, newContents);
}

const packager = require("electron-packager");

async function bundleElectronApp(options) {
  const appPaths = await packager(options);
  console.log(`Electron app bundles created:\n${appPaths.join("\n")}`);
};

bundleElectronApp({
  // options as specified in https://github.com/electron/electron-packager/blob/master/docs/api.md
  arch: "ia32,x64",
  dir: "ensembletool",
  platform: "darwin,win32,linux",
  out: "build",
  overwrite: true
});
