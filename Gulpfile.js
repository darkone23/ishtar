var gulp = require('gulp');
var mocha = require('gulp-mocha');
var webpack = require('gulp-webpack');
var jshint = require('gulp-jshint');

var package = require('./package.json');

gulp.task('dist', function() {
  return gulp.src('./ishtar/index.js')
    .pipe(webpack({
      output: {
        library: "Ishtar",
        filename: "ishtar-" + package.version + ".js"
      }
     }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('lint', function() {
  return gulp.src([
      'Gulpfile.js',
      'ishtar/**/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('test', function (){
    return gulp.src('./test/*_test.js', {read: false})
        .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('default', ['lint', 'test', 'dist']);
