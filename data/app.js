var app = module.exports = require('appjs')
  , ConsoleStream = require('console_stream')
  , Settings = require('./settings')
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
      "log_dir": ""
    , "winpos": {}
    , "overlays": {}
    }
  , overlay_windows = {}
  , stderr = process.stderr
  , stdout = process.stdout
  ;

overlays_available.forEach(function (overlay){
  default_settings.overlays[overlay] = false;
});

var settings = new Settings(path.resolve(path.join(__dirname, "..", "config.json")), default_settings);

app.serveFilesFrom(__dirname + '/content');

var window = app.createWindow({
  width  : 800
, height : 500
, icons  : __dirname + '/icons'
, resizable: false
, opacity: 1
, showChrome: false
, alpha: true
, disableSecurity: true
});

function createOverlay(){
  return app.createWindow('appjs/overlay.html', {
    width: 200
  , height: 300
  , icons: __dirname + "/icons"
  , showChrome: false
  , topmost: true
  , opacity: 1
  , alpha: true
  , resizable: false
  , left: 0
  , top: 0
  });
}

function F12(e){ return e.keyIdentifier === 'F12' }
function Command_Option_J(e){ return e.keyCode === 74 && e.metaKey && e.altKey }

function configureWindow(win){
  win.main_window = window;

  win.addEventListener('keydown', function(e){
    if (F12(e) || Command_Option_J(e)) {
      win.frame.openDevTools();
    }
  });

  win.addEventListener('app-done', function(e){
    console.log(e);
  });

  //win.dispatchEvent(new win.Event('app-ready'));
}

console.log(window);

window.on('create', function(){
  console.log("Window Created");
  settings.load();
});

window.on('ready', function(){
  console.log("Window Ready");
  window.frame.show();
  window.node_require = require;
  window.node_process = process;
  window.node_module = module;
  window.app_settings = settings;
  window.app_overlays = overlays_available;
  window.createOverlay = createOverlay;
  window.configureOverlay = configureWindow;
  window.overlay_windows = overlay_windows;

  var consoleStream = new ConsoleStream(window.console)
    , desc = { configurable: true,
             enumerable: true,
             get: function(){ return consoleStream } };

  Object.defineProperties(process, {
    stderr: desc,
    stdout: desc
  });

  configureWindow(window);

  console.log("Application bindings set up.");
});

window.on('close', function(){
  for (var key in overlay_windows){
    if (overlay_windows[key] && typeof overlay_windows[key].close === "function"){
      overlay_windows[key].close();
    }
  }
  console.log("Window Closed");
});
