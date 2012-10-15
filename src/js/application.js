var $ = require("jquery")
  , _overlay_queue = []
  , _opening_overlays = false
  , _pause_overlays = false
  , _dragging = false
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
    /*$("#leftpane>div").slideUp('fast', function (){
      $(pane).slideDown('slow');
    });*/

    $(".leftpane>div").hide();
    $(pane).show();
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

  if (app_settings.winpos){
    console.log("restoring window position");
    window.frame.move(parseInt(app_settings.winpos.left || 0), parseInt(app_settings.winpos.top || 0));
  }
  else {
    console.log("no position to restore. centering.");
    console.log(app_settings);
    window.frame.center();
  }

  $("a#close").click(function (){
    console.log('close clicked');
    window.close();
  });

  $("a#minimize").click(function (){
    console.log('minimize clicked');
    window.frame.minimize();
  });

  $('a.winctl').on('mouseover', function(event){
                  $(this).css('z-index', 2);
               })
               .on('mouseout', function(event){
                  $(this).css('z-index', 0);
               });


  $("header h1, header img").on("mousedown", function (){
    console.log('header mousedown');

    window.frame.drag();

    console.log('saving window position');
    app_settings.winpos = {
      left: window.frame.left
    ,  top: window.frame.top
    };

    app_settings.save();

  });

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

      overlay_windows[button.text()].on('ready', function (){
        configureOverlay(overlay_windows[button.text()]);
        overlay_windows[button.text()].frame.show();

        if (_opening_overlays) {
          _pause_overlays = false;
        }
      });

      console.log(overlay_windows[button.text()].frame);

      /* doesn't work
      overlay_windows[button.text()].frame.on('show', function (){
        console.log('test 2');
      });


      overlay_windows[button.text()].on('overlay-closed', function (){
        console.log('overlay closed');
        overlay_windows[button.text()].frame.hide();
        overlays.unset(index);
      });
      */

      overlay_windows[button.text()].on('close', function (){
        overlays.unset(index);
      });
    }
    else {
      overlay_windows[button.text()].frame.show();

      if (_opening_overlays){
        _pause_overlays = false;
      }
    }

    app_settings.overlays[button.text()] = true;
    app_settings.save();


  });

  overlays.on('unset', function (button, index){
    console.log('UNSET overlays button "%s". index: %s', button.text(), index);
    if (overlay_windows[button.text()]){
      overlay_windows[button.text()].frame.hide();
    }

    app_settings.overlays[button.text()] = false;
    app_settings.save();

  });

  /* Freezes the program */
  app_overlays.forEach(function (overlay, index){
    console.log("checking overlay %s", overlay);
    if (app_settings.overlays[overlay]){
      console.log('opening');
      openOverlay(index);
      //overlays.set(index);
    }
    else {
      console.log('not opening');
    }
  });

  _openOverlays();


  console.log(app_settings.overlays);
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

function openOverlay(overlay_index){
  console.log('openOverlay');
  _overlay_queue.push(overlay_index);

  if (!_opening_overlays){
    _opening_overlays = true;
  }

  console.log(_overlay_queue);
}

function _openOverlays(){
  console.log('_openOverlays');
  var ind = _overlay_queue.shift();
  console.log(ind);
  if (!ind && ind !== 0) {
    _opening_overlays = false;
    return;
  }

  if (!_pause_overlays){
    _pause_overlays = true;
    overlays.set(ind);
  }

  setTimeout(_openOverlays, 100);
}