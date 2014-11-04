module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'js/cif/*.js',
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
          {src: 'js/CiF/CiF.js', dest: 'dist/CiF.js'},
          {src: 'js/CiF/SFDB.js', dest: 'dist/SFDB.js'},
          {src: 'js/CiF/RuleLibrary.js', dest: 'dist/RuleLibrary.js'},
          {src: 'js/CiF/Volition.js', dest: 'dist/Volition.js'}
        ],
      }
    },
    jsdoc : {
        dist : {
            src: 'js/CiF/*.js',
            options: {
                destination: 'doc',
                configure: "conf.json",
                private: false
            }
        }
    },
    nodewebkit: {
      options: {
          platforms: ['win','osx'],
          buildDir: './build', // Where the build version of my node-webkit app is saved
      },
      src: ['./nwk-package.json', './ciftool/**/*', './js/**/*', './jslib/**/*', './css/**/*', './data/**/*'] // Your node-webkit app
    },
    copy: {
      dist : {
        files: [{
          cwd: '.',  // set working folder / root to copy
          src: 'tutorialPages/crazyNewName.css',           // copy all files and subfolders
          dest: 'doc/styles/',    // destination folder
          flatten: true,
          expand: true,           // required when using cwd
          rename: function(dest, src) {
            return dest + src.replace('crazyNewName','jsdoc-default');
          }
        }]
      }
    },
    requirejs: {
        options: {
            baseUrl: '.',
            config: ['cif-config.js'],
            name: 'js/CiF/CiF',
            require: 'jslib/require',
            almond: 'jslib/almond',
            out: 'bin/cif.js',
            wrap: true
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

  // Load the plugin to wrap CiF Console as a standalone app.
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
    "jsdoc"
    ]);

  grunt.registerTask("document2", [
    "jsdoc",
    "copy"
    ]);

  grunt.registerTask("build", ["nodewebkit"]);

  grunt.registerTask("copyCssFile", ["copy"]);

};