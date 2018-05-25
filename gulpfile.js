var gulp = require('gulp')
var browserify = require('browserify')
var babelify = require('babelify')
var tap = require('gulp-tap')
var zip = require('gulp-zip')

const VERSION = require('./package.json').version
const paths = {
  zip: [
    '**'
    , '!src/**'
    , '!node_modules/**'
    , '!img/**'
    , '!ISSUE_TEMPLATE.md'
    , '!gulpfile.js'
  ]
  , views: './views/*.html'
  , entries: 'src/entries/*.js'
  , js: 'src/*'
}

gulp.task('default', ['html', 'js', '3rd-party'])

gulp.task('js', function () {
  return gulp.src(paths.entries, {read: false}) // no need of reading file because browserify does.
    // transform file objects using gulp-tap plugin
    .pipe(tap(function (file) {
      // replace file contents with browserify's bundle stream
      file.contents = browserify(file.path, {
        debug: true,
      })
        .transform(babelify, {
          presets: ['es2015']
          , plugins: [
            'transform-object-rest-spread'
            , 'syntax-jsx'
            , 'transform-react-jsx'
            , 'transform-async-to-generator'
          ]
        })
        .bundle()
    }))
    .pipe(gulp.dest('./dist/js/'))
})

gulp.task('html', function () {
  return gulp.src(paths.views).pipe(gulp.dest('./dist/html/'))
})

gulp.task('3rd-party', ['polyfill', 'mocha'])

gulp.task('polyfill', function () {
  return gulp.src('./node_modules/babel-polyfill/dist/polyfill.js').pipe(gulp.dest('./dist/js/'))
})

gulp.task('mocha', ['mochajs', 'mochacss'])

gulp.task('mochajs', function () {
  return gulp.src('./node_modules/mocha/mocha.js').pipe(gulp.dest('./dist/js/'))
})
gulp.task('mochacss', function () {
  return gulp.src('./node_modules/mocha/mocha.css').pipe(gulp.dest('./dist/css/'))
})

gulp.task('release', ['zip', 'xpi'])

gulp.task('zip', ['default'], function () {
  gulp.src(paths.zip)
    .pipe(zip(`confluence-bookmarks-build-v${VERSION}.zip`))
    .pipe(gulp.dest('../'))
})

gulp.task('xpi', ['default'], function () {
  gulp.src(paths.zip)
    .pipe(zip(`confluence-bookmarks-build-v${VERSION}.xpi`))
    .pipe(gulp.dest('../'))
})

gulp.task('watch', function () {
  gulp.watch(paths.js, ['js'])
  gulp.watch(paths.views, ['html'])
})

gulp.task('web-ext', function () {
  var webext = require('web-ext').default
  gulp.src(paths.zip)
    .pipe(gulp.dest('.tmp-dist'))

  webext.cmd.sign({
    // These are command options derived from their CLI conterpart.
    // In this example, --source-dir is specified as sourceDir.
    sourceDir: '.tmp-dist',

  }, {
    // These are non CLI related options for each function.
    // You need to specify this one so that your NodeJS application
    // can continue running after web-ext is finished.
    shouldExitProgram: false,
  }).then((extensionRunner) => {
    // The command has finished. Each command resolves its
    // promise with a different value.
    console.log(extensionRunner);
    // You can do a few things like:
    // extensionRunner.reloadAllExtensions();
    // extensionRunner.exit();
  });
});
