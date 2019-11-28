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
        buildConsoleForWindows: {
          command: 'python build-console-for-windows.py'
        },
        clean: {
          // Remove generated directories that are problematic for future grunt building
          // --force to prevent erroring out of the build task if they don't exist
          command: "rm -rf cache build"
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
    nwjs: {
      dist: {
        options: {
          //downloadUrl: "http://dl.nwjs.io/",
          version: "0.42.5",
          platforms: ['osx64'], // Can't seem to build a non-empty Windows version with Grunt
          buildDir: './build', // Where the build version of my node-webkit app is saved
       },
       src: ['./nwk-package.json', './bin/ensemble.js', './ensembletool/**/*', './jslib/**/*', './css/**/*'] // Your node-webkit app
      },
      // techRelease : {
      //   options: {
      //     platforms: ['win','osx'],
      //     version: "0.12.2",
      //     buildDir: './TechnicalAlphaRelease/authoringToolBuilds', // Where the build version of my node-webkit app is saved
      //    },
      //    src: ['./nwk-package.json', './ensembletool/**/*', './js/**/*', './jslib/**/*', './css/**/*', './data/**/*'] // Your node-webkit app
      // }
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

  // Load the plugin to wrap ensemble Console as a standalone app.
  grunt.loadNpmTasks('grunt-nw-builder');

  // Load the plugin to copy files
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['document']);

  grunt.registerTask("deploy", ["shell:buildLibrary"]);

  grunt.registerTask("document", ["jsdoc", "copy:dist"]);

  // Clean any generated directories before rebuilding
  grunt.registerTask("build", ["deploy", "shell:clean", "nwjs"]);

  grunt.registerTask("copyCssFile", ["copy:dist"]);

  // Make a folder for 'release'
  grunt.registerTask("techRelease", [
    "document", "deploy", "build", "shell:buildConsoleForWindows", "nwjs:techRelease", "copy:techRelease"
  ]);

  //There is some problem going on where the console seems to not WORK when copied :( -- maybe build a new version from the webkit version?)
  //grunt.registerTask("techRelease", ["copy:techRelease"]);
};