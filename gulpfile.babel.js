import gulp from 'gulp';
import del from 'del';
import purifyCSS from 'gulp-purifycss';
import cleanCSS from 'gulp-clean-css';
import babel from 'gulp-babel';
import uglifyJS from 'gulp-uglify';
import minifyHTML from 'gulp-htmlmin';

const paths = {
    resource: [
        "src/**/*.png",
        "src/**/icomoon.*",
        "src/manifest.json"
    ],
    styles: "src/**/*.css",
    scripts: "src/**/*.js",
    html: "src/**/*.html",
    dest: "dist/"
}

export const clean = () => del(['dist/'])

export const copy = () => gulp
    .src(paths.resource)
    .pipe(gulp.dest(paths.dest))

export const styles = () => gulp
    .src(paths.styles)
    // .pipe(purifyCSS([paths.html, paths.scripts]))
    .pipe(cleanCSS({
        rebase: false
    }))
    .pipe(gulp.dest(paths.dest))

export const scripts = () => gulp
    .src(paths.scripts, { sourcemaps: true })
    .pipe(uglifyJS())
    .pipe(gulp.dest(paths.dest))

export const html = () => gulp
    .src(paths.html)
    .pipe(minifyHTML({
        collapseWhitespace: true,
        removeComments: true,
    }))
    .pipe(gulp.dest(paths.dest))

const build = gulp.series(clean, gulp.parallel(copy, styles, scripts, html));
gulp.task('build', build);
export default build;