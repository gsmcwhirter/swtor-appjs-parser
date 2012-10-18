var path = require('path')
  , fs = require('fs')
  , jade = require('jade')
  , stylus = require('stylus')
  ;


desc('build all assets');
task('build', [ 'build:component'
              , 'build:' + path.join('data', 'content', 'js', 'build.js')
              , 'build:' + path.join('data', 'content', 'css', 'build.css')
              , 'build:' + path.join('data', 'content', 'index.html')
              , 'build:' + path.join('data', 'content', 'overlay.html')
              , 'build:' + path.join('data', 'content', 'css', 'style.css')
              , 'build:' + path.join('move_icons')
              ], function (){
                console.log();
                console.log("Done building all tasks.");
});

desc('create distributable folder');
task('dist', ['build', 'wip', path.join('wip', 'data')], function (){
  copy('app.exe', path.join('wip', 'app.exe'));
  copy_dir('data', path.join('wip', 'data'));
});

desc('creates the wip folder');
directory('wip');

desc('creates the wip/data folder');
directory(path.join('wip', 'data'), ['wip']);

function copy(src, dest){
  console.log("Copying %s to %s", path.resolve(src), path.resolve(dest));
  fs.createReadStream(path.resolve(src)).pipe(fs.createWriteStream(path.resolve(dest)));
}

function copy_dir(src, dest){
  if (!fs.existsSync(dest)){
    fs.mkdirSync(dest);
  }

  fs.readdirSync(src).forEach(function (file){
    var stat = fs.statSync(path.join(src, file));
    if (stat.isFile()){
      copy(path.join(src, file), path.join(dest, file));
    }
    else if (stat.isDirectory()){
      copy_dir(path.join(src, file), path.join(dest, file));
    }
  });
}

namespace('build', function (){

  desc('creates data/content directory');
  directory(path.join('data', 'content'), function (){
    console.log("Creating directory %s", path.join('data', 'content'));
  });

  desc('creates data/content/css directory');
  directory(path.join('data', 'content', 'css'), [path.join('data', 'content')]);

  desc('creates data/content/js directory');
  directory(path.join('data', 'content', 'js'), [path.join('data', 'content')]);

  desc('creates src/js/build directory');
  directory(path.join('src', 'js', 'build'));

  desc('creates src/js/components directory');
  directory(path.join('src', 'js', 'components'));

  desc('creates data/content/icons directory');
  directory(path.join('data', 'content', 'icons'));

  desc('build component pieces');
  task('component', [path.join('data', 'content', 'js'), path.join('src', 'js', 'build'), path.join('src', 'js', 'components')], function (){
    console.log();
    console.log("Downloading and building components...");
    //The following is essentially copied from component/component/bin/component-install and component/component/bin/component-build
    var component = require('component')
      , outdir = path.join('src', 'js')
      , config = require(path.resolve(path.join(outdir, 'component.json')))
      , pkgs = []
      , Builder = require('component-builder')
      ;

      if (config.dependencies){
        pkgs = pkgs.concat(normalize(config.dependencies));
      }

      var pkgcount = pkgs.length;
      var pkgsdone = 0;

      function whenDone(err){
        if (err) {
          throw err;
        }
        else {
          pkgsdone += 1;
          //console.log("done %s/%s", pkgsdone, pkgcount);
        }

        if (pkgsdone === pkgcount){
          doBuild();
        }
      }

      pkgs.forEach(function (pkg){
        var parts = pkg.split('@');
        pkg = parts.shift();
        var version = parts.shift() || 'master';
        pkg = component.install(pkg, version, {
          dest: path.resolve(path.join(outdir, 'components'))
        , force: false
        , dev: false
        });
        report(pkg);
        pkg.install();
      });

      function normalize(deps) {
        return Object.keys(deps).map(function(name){
          return name + '@' + deps[name];
        });
      }

      function report(pkg) {
        console.log('install', pkg.name + '@' + pkg.version);

        pkg.on('error', function(err){
          console.log('error', err.message);
          process.exit(1);
        });

        pkg.on('dep', function(dep){
          console.log('dep', dep.name + '@' + dep.version);
          report(dep);
        });

        pkg.on('exists', function(dep){
          console.log('exists', dep.name + '@' + dep.version);
          whenDone();
        });

        pkg.on('file', function(file){
          console.log('fetch', pkg.name + ':' + file);
        });

        pkg.on('end', function(){
          console.log('complete', pkg.name);
          whenDone();
        });
      }

      function doBuild(){
        //do component build
        var js = fs.createWriteStream(path.join(outdir, 'build', 'build.js'));
        var css = fs.createWriteStream(path.join(outdir, 'build', 'build.css'));

        // build

        var builder = new Builder(outdir);
        //console.log(builder);
        //console.log(builder.path("component.json"));
        var start = new Date;

        //console.log();
        builder.build(function(err, obj){
          if (err) {
            throw err;
          }

          var name = config.name;

          css.write(obj.css);
          js.write(obj.require);
          js.write(obj.js);

          var duration = new Date - start;
          console.log('write', js.path);
          console.log('write', css.path);
          console.log('js', (obj.js.length / 1024 | 0) + 'kb');
          console.log('css', (obj.css.length / 1024 | 0) + 'kb');
          console.log('duration', duration + 'ms');
          console.log();
          complete();
        });
      }

  }, {async: true});

  desc('copies built component js files to dist');
  file(path.join('data', 'content', 'js', 'build.js'), ['component', path.join('data', 'content'), path.join('data', 'content', 'js'), path.join('src', 'js', 'build', 'build.js')], function (){
    console.log();
    copy(path.join('src', 'js', 'build', 'build.js'), path.join('data', 'content', 'js', 'build.js'));
  });

  desc('copies build component css files to dist');
  file(path.join('data', 'content', 'css', 'build.css'), [path.join('data', 'content'), path.join('data', 'content', 'css'), path.join('src', 'js', 'build', 'build.css')], function (){
    console.log();
    copy(path.join('src', 'js', 'build', 'build.css'), path.join('data', 'content', 'css', 'build.css'));
  });

  desc('builds stylus files')
  file(path.join('data', 'content', 'css', 'style.css'), [path.join('data', 'content'), path.join('data', 'content', 'css'), path.join('src', 'stylus', 'style.styl')], function (){
    console.log();
    console.log("Generating style.css from stylus.");

    var src = fs.readFileSync(path.join('src', 'stylus', 'style.styl'), "utf8");

    stylus.render(src, {filename: path.join('src', 'stylus', 'style.styl')}, function (err, css){
        if (err) throw err;
        fs.writeFileSync(path.join('data', 'content', 'css', 'style.css'), css);
        complete();
    });
  }, {async: true});

  desc('builds jade index file');
  file(path.join('data', 'content', 'index.html'), [path.join('data', 'content'), path.join('src', 'jade', 'index.jade')], function (){
    console.log();
    console.log("Generating index.html from jade.");
    var src = fs.readFileSync(path.join('src', 'jade', 'index.jade'))
      , fn = jade.compile(src, {filename: path.join('src', 'jade', 'index.jade')})
      , locals = {}
      ;

    fs.writeFileSync(path.join('data', 'content', 'index.html'), fn(locals));
  });

  desc('builds jade overlay file');
  file(path.join('data', 'content', 'overlay.html'), [path.join('data', 'content'), path.join('src', 'jade', 'overlay.jade')], function (){
    console.log();
    console.log("Generating overlay.html from jade");
    var src = fs.readFileSync(path.join('src', 'jade', 'overlay.jade'))
      , fn = jade.compile(src, {filename: path.join('src', 'jade', 'index.jade')})
      , locals = {}
      ;

    fs.writeFileSync(path.join('data', 'content', 'overlay.html'), fn(locals));
  });

  desc('copy the icons to the content folder');
  task('move_icons', [path.join('data', 'content', 'icons')], function (){
    console.log("Copying icon files");
    fs.readdir(path.join('data', 'icons'), function (err, items){
      items.forEach(function (item){
        copy(path.join('data', 'icons', item), path.join('data', 'content', 'icons', item));
      });

      complete();
    });
  }, {async: true});


});
