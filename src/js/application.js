var $ = require("jquery");

addEventListener('app-ready', function (err){
  var test = node_require('./test')
    ;
    
  var showing_dir_selector = false;
  $("a#log_dir_button").on('click', function (){
    if (showing_dir_selector) return;
    
    window.frame.openDialog({
      type: 'open'
    , title: 'Select Combat Log Directory'
    , multiSelect: false
    , dirSelect: true
    }, function (err, files){
      showing_dir_selector = false;
      files.forEach(function (file){
        app_settings.log_dir = file;
        $("#log_dir_input").val(file);
        console.log(file);
      });
    });
  });
  
});

var ButtonSet = require("buttonset")
  , overlays = new ButtonSet("#overlay-selector", {
      unselectable: false
    , multiple: true
    })
  , menu = new ButtonSet("nav#menu", {
      unselectable: false
    , multiple: false
    })
  ;

application_overlays.forEach(function (overlay){
  overlays.add(overlay);
});

overlays.on('set', function (button, index){
  console.log('SET overlays button "%s". index: %s', button.text(), index);
});

overlays.on('unset', function (button, index){
  console.log('UNSET overlays button "%s". index: %s', button.text(), index);
});

menu.add("Configuration");
menu.add("Statistics");

menu.on('set', function (button, index){
  console.log('SET menu button "%s". index: %s', button.text(), index);
  
  function showPane(pane){
    $("#leftpane>div").slideUp('fast', function (){
      $(pane).slideDown('slow');
    });
  }
  
  switch (button.text()){
    case "Configuration":
      showPane("#config");
      break;
    case "Statistics":
      showPane("#stats")
      break;
    default:
      menu.set(0);
  }
});

menu.on('unset', function (button, index){
  console.log('UNSET menu button "%s". index: %s', button.text(), index);
});

menu.set(0);
