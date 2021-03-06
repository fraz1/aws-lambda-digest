var gulp = require('gulp');
var gutil = require('gulp-util');
var del = require('del');
var rename = require('gulp-rename');
var install = require('gulp-install');
var zip = require('gulp-zip');
var AWS = require('aws-sdk');
var fs = require('fs');
var runSeq = require('run-sequence');
var args = require('yargs').argv;

/*
  Clean up before deployment
*/
gulp.task('clean', function(cb) {
  del([
    './dist',
    'dist.zip',
  ], cb);
});

/*
  No need to deploy package json
*/
gulp.task('prune', function(cb) {
  del('./dist/package.json', cb);
});

/*
  Copy main index json
*/
gulp.task('js', function() {
  return gulp.src('index.js')
    .pipe(gulp.dest('dist/'));
});

/*
  Ignore dev packages
*/
gulp.task('npm', function() {
  return gulp.src('./package.json')
    .pipe(gulp.dest('./dist/'))
    .pipe(install({
      production: true
    }));
});

/*
  Copy over environment variables, these are managed outside of source control,
  see .gitignore
*/
gulp.task('env', function() {
  return gulp.src('./env.json')
    .pipe(gulp.dest('./dist'));
});

/*
  Zip up files in prep for uploading
*/
gulp.task('zip', function() {
  return gulp.src(['dist/**/*', 'dist/.*'])
    .pipe(zip('dist.zip'))
    .pipe(gulp.dest('./'));
});

/*
  This only works for a lambda function that exists.

  Note: This presumes that AWS.config already has credentials. This will be
  the case if you have installed and configured the AWS CLI.

  See http://aws.amazon.com/sdk-for-node-js/
*/
gulp.task('upload', function() {
  AWS.config.region = 'us-east-1';
  var lambda = new AWS.Lambda();
  var functionName = 'hh-daily-digest-producer';

  lambda.getFunction({
    FunctionName: functionName
  }, function(err, data) {

    if (err) {
      var warning;
      if (err.statusCode === 404) {
        warning = 'Unable to find lambda function ' + functionName + '. ';
        warning += 'Verify the lambda function name and AWS region are correct.';
        gutil.log(warning);
      } else {
        warning = 'AWS API request failed. ';
        warning += 'Check your AWS credentials and permissions.';
        gutil.log(warning);
      }
    }

    var current = data.Configuration;
    var params = {
      FunctionName: functionName
    };

    fs.readFile('./dist.zip', function(err, data) {
      params.ZipFile = data;
      lambda.updateFunctionCode(params, function(err, data) {
        if (err) {
          var warning = 'Package upload failed. ' + err;
          gutil.log(warning);
        }
      });
    });
  });
});

/*
  Run default tasks synchrously as needed
*/
gulp.task('default', function() {
  runSeq(
    'clean', ['npm', 'js', 'env'],
    'prune',
    'zip',
    'upload'
  );
});
