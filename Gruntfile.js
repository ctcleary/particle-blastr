module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          port: 8000
        }
      }
    },
    watch: {
      gruntfile: {
        files: ['Gruntfile.js'],
        options: {
          livereload: true
        },
      },
      all: {
        files: [
          '*.html',
          '/*.html',
          'css/**/*.css',


          'src/**/*.js',
          'src/*.js',
          '**/*.html',

          'img/**/*.jpg',
          'img/**/*.png',
        ],
        options: {
          livereload: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');

  
  grunt.registerTask('default', [
    'connect',
    'watch'
  ]);

};