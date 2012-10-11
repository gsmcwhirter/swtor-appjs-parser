var app = module.exports = require('appjs')
  , ConsoleStream = require('console_stream')
  ;

app.serveFilesFrom(__dirname + '/content');

var window = app.createWindow({
  width  : 800,
  height : 500,
  icons  : __dirname + '/icons'
});

console.log(window);

window.on('create', function(){
  console.log("Window Created");
});

window.on('ready', function(){
  console.log("Window Ready");
  window.frame.show();
  window.node_require = require;
  window.node_process = process;
  window.node_module = module;

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
  console.log("Window Closed");
});