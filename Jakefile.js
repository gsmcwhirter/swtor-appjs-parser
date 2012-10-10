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
              , 'build:' + path.join('data', 'content', 'css', 'style.css')
              ], function (){
  
});

function copy(src, dest){
  console.log("Copying %s to %s", path.resolve(src), path.resolve(dest));
  fs.createReadStream(path.resolve(src)).pipe(fs.createWriteStream(path.resolve(dest)));
}

namespace('build', function (){

  desc('creates data/content directory');
  directory(path.join('data', 'content'));
  
  desc('creates data/content/css directory');
  directory(path.join('data', 'content', 'css'), [path.join('data', 'content')]);
  
  desc('creates data/content/js directory');
  directory(path.join('data', 'content', 'js'), [path.join('data', 'content')]);
  
  desc('creates src/js/build directory');
  directory(path.join('src', 'js', 'build'));
  
  desc('creates src/js/components directory');
  directory(path.join('src', 'js', 'components'));
  
  desc('build component pieces');
  task('component', [path.join('data', 'content', 'js'), path.join('src', 'js', 'build'), path.join('src', 'js', 'components')], function (){
  
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
        pkg.on('end', whenDone);
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
        });

        pkg.on('file', function(file){
          console.log('fetch', pkg.name + ':' + file);
        });

        pkg.on('end', function(){
          console.log('complete', pkg.name);
        });
      }
      
      function doBuild(){
        //do component build
        var js = fs.createWriteStream(path.join(outdir, 'build', 'build.js'));
        var css = fs.createWriteStream(path.join(outdir, 'build', 'build.css'));

        // build

        var builder = new Builder(outdir);
        console.log(builder);
        console.log(builder.path("component.json"));
        var start = new Date;

        console.log();
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
  file(path.join('data', 'content', 'js', 'build.js'), ['component', path.join('data', 'content', 'js'), path.join('src', 'js', 'build', 'build.js')], function (){
    copy(path.join('src', 'js', 'build', 'build.js'), path.join('data', 'content', 'js', 'build.js'));
  });
  
  desc('copies build component css files to dist');
  file(path.join('data', 'content', 'css', 'build.css'), [path.join('data', 'content', 'css'), path.join('src', 'js', 'build', 'build.css')], function (){
    copy(path.join('src', 'js', 'build', 'build.css'), path.join('data', 'content', 'css', 'build.css'));
  });
  
  desc('builds stylus files')
  file(path.join('data', 'content', 'css', 'style.css'), [path.join('data', 'content', 'css'), path.join('src', 'stylus', 'style.styl')], function (){
    console.log("Generating layout.css from stylus.");

    var src = fs.readFileSync(path.join('src', 'stylus', 'style.styl'), "utf8");

    stylus.render(src, {filename: path.join('src', 'stylus', 'style.styl')}, function (err, css){
        if (err) throw err;
        fs.writeFileSync(path.join('data', 'content', 'css', 'style.css'), css);
        complete();
    });
  }, {async: true});
  
  desc('builds jade index file');
  file(path.join('data', 'content', 'index.html'), [path.join('data', 'content'), path.join('src', 'jade', 'index.jade')], function (){
    console.log("Generating index.html from jade.");
    var src = fs.readFileSync(path.join('src', 'jade', 'index.jade'))
      , fn = jade.compile(src, {filename: path.join('src', 'jade', 'index.jade')})
      , locals = {}
      ;

    fs.writeFileSync(path.join('data', 'content', 'index.html'), fn(locals));
  });
  
  
});
