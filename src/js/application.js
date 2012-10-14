var $ = require("jquery")
  ;

var ButtonSet = require("buttonset")
  , overlays = new ButtonSet("#overlay-selector", {
      unselectable: false
    , multiple: true
    })
  , overlays_set = false
  , menu = new ButtonSet("nav#menu", {
      unselectable: false
    , multiple: false
    })
  ;

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

addEventListener('app-ready', function (err){
  console.log('app-ready triggered');
  console.log(app_overlays);

  $("a#close").click(function (){
    window.close();
  });

  $("a#minimize").click(function (){
    window.frame.minimize();
  });

  $("header");

  if (!overlays_set){
    app_overlays.forEach(function (overlay){
      overlays.add(overlay);
    });

    overlays_set = true;
  }

  overlays.on('set', function (button, index){
    console.log('SET overlays button "%s". index: %s', button.text(), index);
    if (!overlay_windows[button.text()]){
      overlay_windows[button.text()] = createOverlay();
      configureOverlay(overlay_windows[button.text()]);
      overlay_windows[button.text()].on('ready', function (){
      });
    }

    app_settings.overlays[button.text()] = true;
    overlay_windows[button.text()].frame.show();

  });

  overlays.on('unset', function (button, index){
    console.log('UNSET overlays button "%s". index: %s', button.text(), index);
    if (overlay_windows[button.text()]){
      overlay_windows[button.text()].frame.hide();
    }

    app_settings.overlays[button.text()] = false;

  });

  app_overlays.forEach(function (overlay, index){
    if (app_settings.overlays[overlay]){
      setTimeout(function (){overlays.set(index);}, 500);
    }
  });

  console.log(app_settings);

  var showing_dir_selector = false;
  $("a#log_dir_button").on('click', function (){
    if (showing_dir_selector) return;

    window.frame.openDialog({
      type: 'open'
    , title: 'Select Combat Log Directory'
    , multiSelect: false
    , dirSelect: true
    }, function (err, files){
      if (err) {
        console.log(err);
        return;
      }

      showing_dir_selector = false;
      files.forEach(function (file){
        file = file.toString('utf8');
        app_settings.log_dir = file;
        $("#log_dir_input").val(file);
        console.log(file);
      });
    });
  });

});
