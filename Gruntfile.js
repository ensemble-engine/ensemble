module.exports = function(grunt) {

  // Project configuration.
  const config = {
    pkg: grunt.file.readJSON("package.json"),
    shell: {
      options: {stderr: false},
      buildLibrary: {command: "node build-library.js <%=pkg.version%>"},
      buildAuthoringTool: {command: "node build-authoring-tool.js <%=pkg.version%>"}
    },
    jsdoc: {
      dist: {
        src: "ensemble/*.js",
        options: {
          destination: "doc",
          configure: "jsdoc-conf.json",
          private: false
        }
      }
    },
    copy: {
      buildLibrary: {
        files: [
          {src: "build/ensemble.js", dest: "ensembletool/jslib/ensemble.js"},
          {src: "build/ensemble.js", dest: "sampleGame/ensemble.js"}
        ]
      },
      release: {
        files: [
          {src: "build/ensemble.js", dest: "release/ensemble.js"}
        ]
      }
    }
  };

  // Set up a compress:PLATFORM subtask for each authoring tool target platform
  const authoringToolTargetPlatforms = [
    {releaseName: "linux32", internalName: "linux-ia32"},
    {releaseName: "linux64", internalName: "linux-x64"},
    {releaseName: "macOS",   internalName: "darwin-x64"},
    {releaseName: "win32",   internalName: "win32-ia32"},
    {releaseName: "win64",   internalName: "win32-x64"}
  ];
  config.compress = {};
  for (let platform of authoringToolTargetPlatforms) {
    config.compress[platform.releaseName] = {
      options: {archive: `release/EnsembleTool-v<%=pkg.version%>-${platform.releaseName}.zip`, mode: "zip"},
      files:   [{expand: true, cwd: `build/Ensemble Tool-${platform.internalName}`, src: "**", dest: "."}]
    };
  }

  // Load config
  grunt.initConfig(config);

  // Load plugins
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-jsdoc");
  grunt.loadNpmTasks("grunt-shell");
  //grunt.loadNpmTasks("grunt-contrib-uglify");

  // Default task: just build the library
  grunt.registerTask("default", ["deploy"]);

  // Build ensemble.js and copy newly built file into place for consumers
  grunt.registerTask("deploy", ["shell:buildLibrary", "copy:buildLibrary"]);

  // Generate library documentation
  grunt.registerTask("document", ["jsdoc"]);

  // Rebuild the library, then build the authoring tool for all target platforms
  grunt.registerTask("build", ["deploy", "shell:buildAuthoringTool"]);

  // Rebuild the library and authoring tool, then zip the authoring tool builds
  // and copy all release-ready files to the release directory
  grunt.registerTask("release", ["build", "compress", "copy:release"]);
};
