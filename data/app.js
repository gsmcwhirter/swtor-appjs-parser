var app = module.exports = require('appjs')
  , ConsoleStream = require('console_stream')
  , Settings = require('./settings');
  , path = require('path')
  , overlays_available = [
      "Damage Done"
    , "Damage Done per Second"
    , "Damage Taken"
    , "Damage Taken per Second"
    , "Healing Done"
    , "Healing Done per Second"
    , "Healing Done per Resource"
    , "Healing Received"
    , "Healing Received per Second"
    , "Threat"
    , "Threat per Second"
    ]
  , default_settings = {
      "log_dir": null
    , "overlays": {}
    }
  ;
  
overlays_available.forEach(function (overlay){
  default_settings.overlays[overlay] = false;
});
  
var settings = new Settings(path.resolve(path.join(__dirname, "..", "config.json")), default_settings);

app.serveFilesFrom(__dirname + '/content');

var window = app.createWindow({
  width  : 800,
  height : 500,
  icons  : __dirname + '/icons'
});

console.log(window);

window.on('create', function(){
  console.log("Window Created");
  settings.load();
});

window.on('ready', function(){
  console.log("Window Ready");
  console.log(app);
  window.frame.show();
  window.node_require = require;
  window.node_process = process;
  window.node_module = module;
  window.app_settings = settings;
  window.app_overlays = overlays_available;

  var consoleStream = new ConsoleStream(window.console)
    , desc = { configurable: true,
             enumerable: true,
             get: function(){ return consoleStream } };

  Object.defineProperties(process, {
    stderr: desc,
    stdout: desc
  });

  function F12(e){ return e.keyIdentifier === 'F12' }
  function Command_Option_J(e){ return e.keyCode === 74 && e.metaKey && e.altKey }

  window.addEventListener('keydown', function(e){
    if (F12(e) || Command_Option_J(e)) {
      window.frame.openDevTools();
    }
  });

  window.addEventListener('app-done', function(e){
    console.log(e);
  });

  window.dispatchEvent(new window.Event('app-ready'));

  console.log("Application bindings set up.");
});

window.on('close', function(){
  settings.save();
  console.log("Window Closed");
});
