"use strict";

const gulp = require("gulp");
const webpack = require("webpack-stream");
const browsersync = require("browser-sync");
const autoprefixer = require("autoprefixer");
const sourcemaps = require("gulp-sourcemaps");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');
const extReplace = require('gulp-ext-replace');
const rigger = require('gulp-rigger');
const uglify = require('gulp-uglify');
const watch = require('gulp-watch');
const rimraf = require('rimraf');
const del = require('del');
const newer = require('gulp-newer');
const rsync = require('gulp-rsync');
/*css*/
const less = require("gulp-less");
const cssnano = require("gulp-cssnano");
const cleanCSS = require("gulp-clean-css");
const postcss = require("gulp-postcss");
const gcmq = require("gulp-group-css-media-queries");
const cssbeautify = require("gulp-cssbeautify");
const removeComments = require("gulp-strip-css-comments");
/*img*/
const favicons = require('gulp-favicons');
const webp = require('imagemin-webp');
const imagemin = require('gulp-imagemin');
const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const pngquant = require('imagemin-pngquant');
const spritesmith = require("gulp.spritesmith");

const path = {
    // Откуда брать исходники
    src: {
        html: "./src/index.html",
        css: './src/css/style.less',
        js: "./src/js/main.js",
        allimg: './src/i/**/*.{png,jpg,jpeg,svg,raw,gif,ico}',
        favicons: "./src/i/favicon/*.{jpg,jpeg,png,gif}",
        webp: './src/i/*.{png,jpg,jpeg}',
        svg: './src/i/**/*.svg',
        fonts: './src/fonts/**/*.*'
    },
    // Куда складывать готовые файлы после сборки
    assets: {
        html: './dist/',
        css: './dist/assets/css/',
        js: './dist/js/',
        allimg: './dist/assets/i/',
        favicons: './dist/assets/i/favicons/',
        webp: './dist/assets/i/webp/',
        svg: './dist/assets/i/',
        fonts: './dist/assets/css/fonts/'
    },
    // За изменениями каких файлов мы хотим наблюдать
    watch: {
        html: './src/*.html',
        css: './src/css/*.less',
        js: './src/js/**/*.js',
        allimg: './src/i/**/*.{png,jpg,jpeg,svg,raw,gif,ico}',
        webp: './src/i/*.{png,jpg,jpeg}',
        svg: './src/i/**/*.svg',
        fonts: './src/fonts/**/*.*'
    },
    //clean: './dist'
    // const dist = "/Applications/MAMP/htdocs/test"; // Ссылка на вашу папку на локальном сервере
};

const dist = "./dist";

gulp.task("copy-html", () => {
    return gulp.src(path.src.html)
        .pipe(gulp.dest(path.assets.html))
        .pipe(browsersync.stream());
});

gulp.task("build-less", () => {
    return gulp.src(path.src.css)
        .pipe(plumber())
        // Скомпилируем
        .pipe(less())
        .pipe(gulp.dest(path.assets.css))
        .pipe(browsersync.stream());
});

gulp.task("build-js", () => {
    return gulp.src(path.src.js)
        .pipe(webpack({
            mode: 'development',
            output: {
                filename: 'script.js'
            },
            watch: false,
            devtool: "source-map",
            module: {
                rules: [
                  {
                    test: /\.m?js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                      loader: 'babel-loader',
                      options: {
                        presets: [['@babel/preset-env', {
                            debug: true,
                            corejs: 3,
                            useBuiltIns: "usage"
                        }]]
                      }
                    }
                  }
                ]
              }
        }))
        .pipe(gulp.dest(path.assets.js))
        .on("end", browsersync.reload);
});

// Responsive Images
const quality = 95; // Responsive images quality

// Produce @2x images
gulp.task('allimg:assets', function () {
    return gulp.src(path.src.allimg)
        .pipe(newer(path.assets.allimg))
        // Сожмем их
        .pipe(imagemin([
            imagemin.jpegtran({progressive: true}),
            imageminJpegRecompress({
                loops: 5,
                min: 65,
                max: 70,
                quality: 'medium'
            }),
            imagemin.optipng({optimizationLevel: 3}),
            pngquant({quality: '65-70', speed: 5})
        ]))
        // Переместим в assets
        .pipe(rename(function (path) {
            path.extname = path.extname.replace('jpeg', 'jpg')
        }))
        .pipe(gulp.dest(path.assets.allimg))
});

// Produce webp
gulp.task('webp:assets', function () {
    return gulp.src(path.src.webp)
        .pipe(newer(path.assets.webp))

        // Сожмем их
        .pipe(imagemin([
            webp({quality: 50})
        ]))
        .pipe(extReplace('.webp'))
        .pipe(gulp.dest(path.assets.webp))
});

gulp.task("favicons:assets", function () {
    return gulp.src(path.src.favicons)
        .pipe(favicons({
            icons: {
                appleIcon: true,
                favicons: true,
                online: false,
                appleStartup: false,
                android: false,
                firefox: false,
                yandex: false,
                windows: false,
                coast: false
            }
        }))
        .pipe(gulp.dest(path.assets.favicons));
});

gulp.task('svg:assets', function () {
    gulp.src(path.src.svg)
        .pipe(svgmin({
            js2svg: {
                pretty: false
            }
        }))
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(replace('&gt;', '>'))
        // assets svg sprite
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: "sprite.svg"
                }
            }
        }))
        .pipe(gulp.dest(path.assets.svg));
});

gulp.task('sprites:assets', function () {
    const spriteData =
        gulp.src('./src/i/sprite/*.*') //path to source
            .pipe(spritesmith({
                imgName: 'sprite.png', //sprite file name
                cssName: 'sprite-position.less', //sprite less name where are stored image position
                padding: 15,
                imgPath: '../dist/assets/i/sprite/sprite.png', //path to sprite file
                cssFormat: 'less', //css format
                algorithm: 'binary-tree',
                cssTemplate: 'template.mustache', //mask file
                cssVarMap: function (sprite) {
                    sprite.name = 's-' + sprite.name //sprite name format, ex. 's-logo' for logo.png
                }
            }));
    spriteData.img
        .pipe(gulp.dest('./dist/assets/i/sprite')); //path to save sprite file on build
    spriteData.css
        .pipe(gulp.dest('./src/assets/css/')); //path to save style file on build
});

gulp.task('fonts:assets', function () {
    gulp.src(path.src.fonts)
    // Переместим шрифты в assets
        .pipe(gulp.dest(path.assets.fonts))
});

gulp.task('gcmd:assets', function () {
    gulp.src(path.src.css)
        .pipe(rigger())
        .pipe(gulp.dest(path.assets.css));
});

gulp.task("watch", () => {
    browsersync.init({
		server: "./dist/",
		port: 4000,
		notify: true
    });
    
    gulp.watch("./src/index.html", gulp.parallel("copy-html"));
    gulp.watch("./src/js/**/*.js", gulp.parallel("build-js"));
    gulp.watch("./src/css/**/*.less", gulp.parallel("build-less"));
    gulp.watch("./src/i/**/*.{png,jpg,jpeg,svg,raw,gif,ico}", gulp.parallel("allimg:assets"));
    gulp.watch("./src/i/*.{png,jpg,jpeg}", gulp.parallel("webp:assets"));
    gulp.watch("./src/i/**/*.svg", gulp.parallel("svg:assets"));
    gulp.watch("./src/fonts/**/*.*", gulp.parallel("fonts:assets"));
});

gulp.task("build",
    gulp.parallel(
        "copy-html",
        "build-js",
        "build-less",
        'favicons:assets',
        'allimg:assets',
        'webp:assets',
        'sprites:assets',
        'svg:assets',
        'fonts:assets',
        'gcmd:assets'
        ));

gulp.task("prod", () => {

    gulp.src(path.src.html)
   .pipe(gulp.dest(path.assets.html))


    gulp.src(path.src.css)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        // Скомпилируем
        .pipe(less())
        .pipe(gcmq())
        // Добавим вендорные префиксы
        .pipe(postcss([autoprefixer()]))
        .pipe(cssbeautify())
        .pipe(gulp.dest(path.assets.css))

        // Сожмем
        .pipe(cssnano({
            zindex: false,
            discardComments: {
                removeAll: true
            }
        }))
        .pipe(sourcemaps.write())
        .pipe(removeComments())
        .pipe(rename({
            suffix: ".min",
            extname: ".css"
        }))

        // Переместим в assets
        .pipe(gulp.dest(path.assets.css));

    gulp.task('cleanLess', function () {
        return del(['./dist/assets/css/**/*less'], {force: true})
    });

    return gulp.src(path.src.js)
        .pipe(webpack({
            mode: 'production',
            output: {
                filename: 'script.js'
            },
            module: {
                rules: [
                  {
                    test: /\.m?js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                      loader: 'babel-loader',
                      options: {
                        presets: [['@babel/preset-env', {
                            corejs: 3,
                            useBuiltIns: "usage"
                        }]]
                      }
                    }
                  }
                ]
              }
        }))
        .pipe(gulp.dest(path.assets.js));
});

gulp.task("default", gulp.parallel("watch", "build"));