const { upload } = require('bugsnag-sourcemaps');
const path = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const fs = require('fs');

function messageForError(e) {
  let message = e.message;
  if (message) {
    return `Error uploading sourcemaps to Bugsnag: ${message}`;
  }

  return 'Error uploading sourcemaps to Bugsnag';
}


module.exports = (params) => {
  const {
    log,
    config,
    iosBundle,
    iosSourceMap,
    iosManifest,
    androidBundle,
    androidSourceMap,
    androidManifest,
    projectRoot
  } = params

  // create the temp dir and write the files
  const tmpdir = path.resolve(projectRoot, '.bugsnag');
  const appVersion = iosManifest.version;

  rimraf.sync(tmpdir);
  mkdirp.sync(tmpdir);

  try {
    fs.writeFileSync(tmpdir + '/main.ios.bundle.js', iosBundle, 'utf-8');
    fs.writeFileSync(tmpdir + '/main.android.bundle.js', androidBundle, 'utf-8');
    fs.writeFileSync(tmpdir + '/main.ios.map', iosSourceMap, 'utf-8');
    fs.writeFileSync(tmpdir + '/main.android.map', androidSourceMap, 'utf-8');


    log('Uploading ios js sourcemaps')
    upload({
      ...config,
      appVersion,
      minifiedUrl: iosManifest.bundleUrl,
      sourceMap: path.resolve(tmpdir, 'main.ios.map'),
      minifiedFile: path.resolve(tmpdir, 'main.ios.bundle.js'),
      overwrite: true
    }, function(err){
      if (err) {
        log(messageForError(err))
      } else {
        log('ios sourcemap was uploaded successfully.')
      }
    })

    log('Uploading android js sourcemaps')
    upload({
      ...config,
      appVersion,
      minifiedUrl: androidManifest.bundleUrl,
      sourceMap: path.resolve(tmpdir, 'main.android.map'),
      minifiedFile: path.resolve(tmpdir, 'main.android.bundle.js'),
      overwrite: true
    }, function(err){
      if (err) {
        log(messageForError(err))
      } else {
        log('android sourcemap was uploaded successfully.')
      }
      rimraf.sync(tmpdir);
    })

  } catch (e) {
    log(messageForError(e));
    log('Verify that your Bugsnag configuration in app.json is correct');
    rimraf.sync(tmpdir);
  }
}