const packager = require("electron-packager");

async function bundleElectronApp(options) {
  const appPaths = await packager(options);
  console.log(`Electron app bundles created:\n${appPaths.join("\n")}`);
};

bundleElectronApp({
  // options as specified in https://github.com/electron/electron-packager/blob/master/docs/api.md
  arch: "all",
  dir: "ensembletool",
  platform: "darwin,win32,linux",
  out: "build",
  overwrite: true
});
