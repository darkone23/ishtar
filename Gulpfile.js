var gulp = require('gulp');
var mocha = require('gulp-mocha');
var webpack = require('gulp-webpack');
var uglify = require('webpack').optimize.UglifyJsPlugin

var package = require('./package.json');

gulp.task('dist', function() {
  return gulp.src('core.js')
    .pipe(webpack({
      output: {
        library: "Ishtar",
        filename: "ishtar-" + package.version + ".min.js"
      },
      plugins: [ new uglify() ]
     }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('test', function (){
    return gulp.src('./test/*_test.js', {read: false})
        .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('default', ['test', 'dist']);
