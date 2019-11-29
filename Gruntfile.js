module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'js/ensemble/*.js',
        dest: 'gruntTestBuild/<%= pkg.name %>.min.js'
      }
    },
    shell: {
        options: {
            stderr: false
        },
        buildLibrary: {
          command: 'node build-library.js'
        },
        buildAuthoringTool: {
          command: 'node build-authoring-tool.js'
        }
    },
    jsdoc : {
        dist : {
            src: 'js/ensemble/*.js',
            options: {
                destination: 'doc',
                configure: "conf.json",
                private: false
            }
        }
    },
    copy: {
      dist : {
        files: [{
          cwd: '.',  // set working folder / root to copy
          src: 'tutorialPages/tutorialPageStyle.css',           // copy all files and subfolders
          dest: 'doc/styles/',    // destination folder
          flatten: true,
          expand: true,           // required when using cwd
          rename: function(dest, src) {
            return dest + src.replace('tutorialPageStyle','jsdoc-default');
          }
        },
        {
          cwd: 'tutorialPages/images',  // set working folder / root to copy
          src: '*',           // copy all files and subfolders
          dest: 'doc/images',    // destination folder
          flatten: true,
          expand: true,           // required when using cwd
        }]
      },
      techRelease : {
        files: [{
          cwd: '.',  // set working folder / root to copy
          src: 'bin/*',           // copy all files and subfolders
          dest: 'TechnicalAlphaRelease/sampleEmptyProject/',    // destination folder
          flatten: true,
          expand: true           // required when using cwd
        },
        {
          cwd: 'sampleGame',
          src: '**',
          dest: 'TechnicalAlphaRelease/sampleGame/',
          flatten: false,
          expand: true
        },
       // {
       //   cwd: 'cache/',  // set working folder / root to copy
       //   src: '**',           // copy all files and subfolders
       //   dest: 'TechnicalAlphaRelease/cache/',    // destination folder
       //   flatten: false,
       //   expand: true           // required when using cwd
       // },
       // {
       //   cwd: 'build/',  // set working folder / root to copy
       //   src: '**',           // copy all files and subfolders
       //   dest: 'TechnicalAlphaRelease/build/',    // destination folder
       //   flatten: false,
       //   expand: true           // required when using cwd
       // },
        {
          cwd: 'schemata/',  // set working folder / root to copy
          src: '**',           // copy all files and subfolders
          dest: 'TechnicalAlphaRelease/exampleSchemata/',    // destination folder
          flatten: false,
          expand: true           // required when using cwd
        },
        {
          cwd: 'bin/',  // set working folder / root to copy
          src: 'ensemble.js',           // copy all files and subfolders
          dest: 'TechnicalAlphaRelease/',    // destination folder
          flatten: false,
          expand: true           // required when using cwd
        },
        {
          cwd: 'doc/',  // set working folder / root to copy
          src: '**',           // copy all files and subfolders
          dest: 'TechnicalAlphaRelease/doc/',    // destination folder
          flatten: false,
          expand: true,           // required when using cwd
        }]
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  //Load the plugin that provides the 'jsdoc' task
  grunt.loadNpmTasks('grunt-jsdoc');

  //Load the plugin that provides the 'shell' task
  grunt.loadNpmTasks('grunt-shell');

  // Load the plugin to copy files
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['document']);

  // TODO after building, also copy new built ensemble.js into place for consumers
  // (i.e. ensembletool and sampleGame)
  grunt.registerTask("deploy", ["shell:buildLibrary"]);

  grunt.registerTask("document", ["jsdoc", "copy:dist"]);

  // Clean any generated directories before rebuilding
  grunt.registerTask("build", ["deploy", "shell:buildAuthoringTool"]);

  /*
  grunt.registerTask("copyCssFile", ["copy:dist"]);

  // Make a folder for 'release'
  grunt.registerTask("techRelease", ["document", "deploy", "build", "copy:techRelease"]);
  */
};
