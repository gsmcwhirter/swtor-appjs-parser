var app = module.exports = require('appjs');

app.serveFilesFrom(__dirname + '/content');

var window = app.createWindow({
  width  : 640,
  height : 460,
  icons  : __dirname + '/icons'
});

window.on('create', function(){
  console.log("Window Created");
});

window.on('ready', function(){
  console.log("Window Ready");
  window.frame.show();
  window.node_require = require;
  window.node_process = process;
  window.node_module = module;

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
});

window.on('close', function(){
  console.log("Window Closed");
});
