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
    strip_code: {
      options: {
        start_comment: "test-code",
        end_comment: "end-test-code",
      },
      target: {
      files: [
          // a list of files you want to strip code from
          {src: 'js/ensemble/ensemble.js', dest: 'dist/ensemble.js'},
          {src: 'js/ensemble/socialRecord.js', dest: 'dist/socialRecord.js'},
          {src: 'js/ensemble/RuleLibrary.js', dest: 'dist/RuleLibrary.js'},
          {src: 'js/ensemble/Volition.js', dest: 'dist/Volition.js'}
        ],
      }
    },
    shell: {
        options: {
            stderr: false
        },
        target: {
            command: 'python build-console-for-windows.py'
        },
        chdir: {
            command: "cd manualWebkitTest"
        },
        dirList: {
          command: "ls"
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
    blah: {
      options: {
          platforms: ['win','osx'],
          buildDir: './TechnicalAlphaRelease/build', // Where the build version of my node-webkit app is saved
      },
      src: ['./nwk-package.json', './ensembletool/**/*', './js/**/*', './jslib/**/*', './css/**/*', './data/**/*'] // Your node-webkit app
    },
    nodewebkit: {
      dist: {
        options: {
          downloadUrl: "http://dl.nwjs.io/",
          version: "v0.12.2",
           platforms: ['osx'],
            buildDir: './build', // Where the build version of my node-webkit app is saved
       },
       src: ['./nwk-package.json', './ensembletool/**/*', './js/**/*', './jslib/**/*', './css/**/*', './data/**/*'] // Your node-webkit app
      },
      techRelease : {
        options: {
           platforms: ['win','osx'],
           version: "v0.12.2",
            buildDir: './TechnicalAlphaRelease/authoringToolBuilds', // Where the build version of my node-webkit app is saved
         },
         src: ['./nwk-package.json', './ensembletool/**/*', './js/**/*', './jslib/**/*', './css/**/*', './data/**/*'] // Your node-webkit app
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
    },
    requirejs: {
        options: {
            baseUrl: '.',
            config: ['ensemble-config.js'],
            name: 'js/ensemble/ensemble',
            require: 'jslib/require',
            almond: 'jslib/almond',
            out: 'bin/ensemble.js',
            wrap: true,
            optimize: "none" // 'uglify' (or just removing this line) is the default but I hope this will ease testing.
        },
        dev: {
            options: {
                build: false
            }
        },
        prod: {
            options: {
                build: true
            }
        }
      }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Load the plugin that provides the 'code strip' task
  grunt.loadNpmTasks('grunt-strip-code');

  //Load the plugin that provides the 'jsdoc' task
  grunt.loadNpmTasks('grunt-jsdoc');

  //Load the plugin that provides the 'shell' task
  grunt.loadNpmTasks('grunt-shell');

  // Load the plugin to wrap ensemble Console as a standalone app.
  grunt.loadNpmTasks('grunt-node-webkit-builder');

  // Load the plugin to copy files
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Load plugin to combine files using require.js into a single production file.
  grunt.loadNpmTasks('grunt-require');

  // Default task(s).
  grunt.registerTask('default', ['document']);

  grunt.registerTask("test", [

  ]);

  grunt.registerTask("deploy", [
    "strip_code", "requirejs:prod"
  ]);

  grunt.registerTask("document", [
    "jsdoc",
    "copy:dist"
    ]);

  grunt.registerTask("build", ["nodewebkit"]);

  grunt.registerTask("copyCssFile", ["copy:dist"]);

  // Make a folder for 'release'
  grunt.registerTask("techRelease", ["document", "deploy", "build", "python", "nodewebkit:techRelease", "copy:techRelease"]);

  //There is some problem going on where the console seems to not WORK when copied :( -- maybe build a new version from the webkit version?)
  //grunt.registerTask("techRelease", ["copy:techRelease"]);

  grunt.registerTask('python', ['shell:target']);
};