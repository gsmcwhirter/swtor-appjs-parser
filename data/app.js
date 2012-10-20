var app = module.exports = require('appjs')
  , ConsoleStream = require('console_stream')
  , Settings = require('./settings')
  , path = require('path')
  , packjson = require(path.resolve(path.join(__dirname, "..", "package.json")))
  , overlays_available = [
      "Damage Done"
    , "Damage Done per Second"
    , "Damage Taken"
    , "Damage Taken per Second"
    , "Healing Done"
    , "Healing Done per Second"
    //, "Healing Done per Resource"
    , "Healing Received"
    , "Healing Received per Second"
    , "Threat"
    , "Threat per Second"
    ]
  , default_settings = {
      "log_dir": ""
    , "group_sync_key": ""
    , "group_sync_enabled": false
    , "overlay_opacity": 0.75
    , "logging_enabled": false
    , "winpos": {left: false, top: false}
    , "overlays": {}
    }
  , overlay_windows = {}
  , stderr = process.stderr
  , stdout = process.stdout
  ;

overlays_available.forEach(function (overlay){
  default_settings.overlays[overlay] = {
    opened: false
  , left: false
  , top: false
  };
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

function createOverlay(title){
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
  , title: title || ""
  });
}

function F12(e){ return e.keyIdentifier === 'F12' }
function Command_Option_J(e){ return e.keyCode === 74 && e.metaKey && e.altKey }

function configureWindow(win){
  win.main_window = window;
  win.node_require = require;
  win.node_process = process;
  win.node_module = module;
  win.app_settings = settings;
  win.app_overlays = overlays_available;
  win.createOverlay = createOverlay;
  win.configureOverlay = configureWindow;
  win.overlay_windows = overlay_windows;
  win.app_version = packjson.build_version + "-" + packjson.build_number;

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
