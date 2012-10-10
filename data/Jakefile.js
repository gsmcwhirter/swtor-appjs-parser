var path = require('path')
  , fs = require('fs')
  , jade = require('jade')
  , stylus = require('stylus')
  ;


desc('build all assets');
task('build', [ 'build:component'
              , 'build:' + path.join('dist', 'js', 'build.js')
              , 'build:' + path.join('dist', 'css', 'build.css')    
              , 'build:' + path.join('dist', 'index.html')
              , 'build:' + path.join('dist', 'css', 'style.css')
              ], function (){
  
});

function copy(src, dest){
  console.log("Copying %s to %s", path.resolve(src), path.resolve(dest));
  //var srcdata = fs.readFileSync(path.resolve(src), 'utf8');
  //fs.writeFileSync(path.resolve(dest), srcdata, 'utf8');
  //console.log(srcdata);
  fs.createReadStream(path.resolve(src)).pipe(fs.createWriteStream(path.resolve(dest)));
  //console.log("Wrote %s bytes", writeStream.bytesWritten);
}

namespace('build', function (){

  desc('creates dist directory');
  directory('dist');
  
  desc('creates dist/css directory');
  directory(path.join('dist', 'css'), ['dist']);
  
  desc('creates dist/js directory');
  directory(path.join('dist', 'js'), ['dist']);
  
  desc('creates src/js/build directory');
  directory(path.join('src', 'js', 'build'));
  
  desc('creates src/js/components directory');
  directory(path.join('src', 'js', 'components'));
  
  /*desc('moves the application js file');
  task('dist/js/application.js', ['dist/js', 'src/js/application.js'], function (){
    
  });*/
  
  desc('build component pieces');
  task('component', [path.join('dist', 'js'), path.join('src', 'js', 'build'), path.join('src', 'js', 'components')], function (){
  
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
        });

        pkg.on('file', function(file){
          console.log('fetch', pkg.name + ':' + file);
        });

        pkg.on('end', function(){
          console.log('complete', pkg.name);
        });
      }
      
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
      
  }, {async: true});
  
  desc('copies built component js files to dist');
  file(path.join('dist', 'js', 'build.js'), ['component', path.join('dist', 'js'), path.join('src', 'js', 'build', 'build.js')], function (){
    copy(path.join('src', 'js', 'build', 'build.js'), path.join('dist', 'js', 'build.js'));
  });
  
  desc('copies build component css files to dist');
  file(path.join('dist', 'css', 'build.css'), [path.join('dist', 'css'), path.join('src', 'js', 'build', 'build.css')], function (){
    copy(path.join('src', 'js', 'build', 'build.css'), path.join('dist', 'css', 'build.css'));
  });
  
  desc('builds stylus files')
  file(path.join('dist', 'css', 'style.css'), [path.join('dist', 'css'), path.join('src', 'stylus', 'style.styl')], function (){
    console.log("Generating layout.css from stylus.");

    var src = fs.readFileSync(path.join('src', 'stylus', 'style.styl'), "utf8");

    stylus.render(src, {filename: path.join('src', 'stylus', 'style.styl')}, function (err, css){
        if (err) throw err;
        fs.writeFileSync(path.join('dist', 'css', 'style.css'), css);
        complete();
    });
  }, {async: true});
  
  desc('builds jade index file');
  file(path.join('dist', 'index.html'), ['dist', path.join('src', 'jade', 'index.jade')], function (){
    console.log("Generating index.html from jade.");
    var src = fs.readFileSync(path.join('src', 'jade', 'index.jade'))
      , fn = jade.compile(src, {filename: path.join('src', 'jade', 'index.jade')})
      , locals = {}
      ;

    fs.writeFileSync(path.join('dist', 'index.html'), fn(locals));
  });
  
  
});
