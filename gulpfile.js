var gulp = require('gulp'),
    path = require('path'),
    gulpif = require('gulp-if'),
    clean = require('gulp-clean'), 
    useref = require('gulp-useref'),
    minifyCss = require('gulp-minify-css'), 
    uglify = require('gulp-uglify'), 
    imagemin = require('gulp-imagemin'), 
    pngquant = require('imagemin-pngquant'), // png图片压缩插件
    rev = require('gulp-rev'), //md5后缀添加相关
    revReplace = require('gulp-rev-replace'), //md5后缀添加相关
    runSequence = require('run-sequence');

var buildDir = 'build';

gulp.task('clean', function() {

    return gulp.src(buildDir, {
            read: false
        })
        .pipe(clean());
});

gulp.task('useref-html', function() {
    return gulp.src(path.join('src', '**/*.html'))
        .pipe(useref())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest(buildDir));
});

gulp.task('imagemin', function() {
    return gulp.src(path.join('src', '**/*.{jpg,jpeg,gif,png}'))
        .pipe(imagemin({
            // jpg
            progressive: true,
            // for png
            use: [pngquant({
                quality: 30
            })]
        }))
        .pipe(gulp.dest(buildDir));
});

gulp.task('build', function(cb){
    gulp.on('error', function() {
        console.log('error error error error')
    })

    runSequence(
        'clean',
        'useref-html',
        'imagemin',
        cb
    );

});

