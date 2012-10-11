var $ = require("jquery");

addEventListener('app-ready', function (err){
  var test = node_require('./test')
    ;
    
  $("p#test").html("<pre>" + test.teststr + "\n\n" + test.getTestFile() + "</pre>");
  
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
  
overlays.add("Damage Done");
overlays.add("Damage Done per Second");
overlays.add("Damage Taken");
overlays.add("Damage Taken per Second")
overlays.add("Healing Done");
overlays.add("Healing Done per Second");
overlays.add("Healing Done per Resource");
overlays.add("Healing Received");
overlays.add("Healing Received per Second");
overlays.add("Threat");
overlays.add("Threat per Second");

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
