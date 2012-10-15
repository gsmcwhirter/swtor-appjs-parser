var $ = require("jquery")
  , ButtonSet = require("buttonset")
  , _overlay_queue = []
  , _opening_overlays = false
  , _pause_overlays = false
  , _dragging = false
  , overlays = {}
  , overlays_set = false
  , menu = {}
  , enablebutton = {}
  , parser = null
  , parser_data = {
    total_dmg: {}
  , total_heals: {}
  , unknown_events: {}
  }
  ;

/* Helpers for opening overlays on application load */
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

function getParser(){
  return parser;
}

function getParserData(){
  return parser_data;
}

window.getParser = getParser;
window.getParserData = getParserData;

/* Set up application listeners etc. */
addEventListener('app-ready', function (err){
  console.log('app-ready triggered');
  console.log(app_overlays);

  /* require the combat log parser */
  var slp = node_require('swtor-log-parser')
    , fs = node_require('fs')
    , path = node_require('path')
    ;

  overlays = new ButtonSet("#overlay-selector", {
      unselectable: false
    , multiple: true
    })
  , menu = new ButtonSet("nav#menu", {
      unselectable: false
    , multiple: false
    })
  , enablebutton = new ButtonSet("#config .enablebutton", {
      unselectable: true
    , multiple: false
  })
  ;

  /* Set up menu */
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

  /* Set up enable button */
  enablebutton.add("Enable Sync");

  enablebutton.on('set', function (button, index){
    if (index === 0){
      app_settings.group_sync_enabled = true;
    }
  });

  enablebutton.on('unset', function (button, index){
    if (index === 0){
      app_settings.group_sync_enabled = false;
    }
  });

  if (app_settings.group_sync_enabled){
    enablebutton.set(0);
  }

  /* Move window to last position */
  if (app_settings.winpos && app_settings.winpos.left !== false){
    console.log("restoring window position");
    window.frame.move(parseInt(app_settings.winpos.left || 0), parseInt(app_settings.winpos.top || 0));
  }
  else {
    console.log("no position to restore. centering.");
    console.log(app_settings);
    window.frame.center();
  }

  /* Set up window controls -- close and minimize, click-drag */
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
    app_settings.winpos.left = parseInt(window.frame.left);
    app_settings.winpos.top = parseInt(window.frame.top);

    app_settings.save();

  });

  /* Configure overlays menu */
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
        overlay_windows[button.text()].getParser = getParser;
        overlay_windows[button.text()].getParserData = getParserData;
        overlay_windows[button.text()].overlay_name = button.text();
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

    (app_settings.overlays[button.text()] || {}).opened = true;
    app_settings.save();


  });

  overlays.on('unset', function (button, index){
    console.log('UNSET overlays button "%s". index: %s', button.text(), index);
    if (overlay_windows[button.text()]){
      overlay_windows[button.text()].frame.hide();
    }

    (app_settings.overlays[button.text()] || {}).opened = false;
    app_settings.save();

  });

  /* Open previously opened overlays */
  app_overlays.forEach(function (overlay, index){
    console.log("checking overlay %s", overlay);
    if (app_settings.overlays[overlay] && app_settings.overlays[overlay].opened){
      console.log('opening');
      openOverlay(index);
    }
    else {
      console.log('not opening');
    }
  });

  setTimeout(_openOverlays, 1000);


  console.log(app_settings.overlays);
  console.log(app_settings);

  /* Set up directory chooser */
  var showing_dir_selector = false;
  $("a#log_dir_button").on('click', function (){
    if (showing_dir_selector) return;

    window.frame.openDialog({
      type: 'open'
    , title: 'Select Combat Log Directory'
    , multiSelect: false
    , dirSelect: false /* BUG: this should be true, but the directory selector doesn't work. so the following is a hack */
    }, function (err, files){
      if (err) {
        console.log(err);
        return;
      }
      else {
        console.log(files);
      }

      showing_dir_selector = false;
      files.forEach(function (file){
        file = file.toString('utf8');
        if (file.substring(file.length - 4) === ".txt"){
          file = path.dirname(file);
        }

        $("#log_dir_input").val(file);
        $("#log_dir_input").blur();
        console.log(file);
      });
    });
  });

  var last_ldi = ""
    , last_gsk = ""
    ;

  function setConfigLasts(){
    var restart = false;
    console.log("setConfigLasts");
    console.log(last_ldi);
    console.log(app_settings.log_dir.substring(0));
    if (last_ldi !== app_settings.log_dir.substring(0)){
      restart = true;
    }

    last_ldi = app_settings.log_dir.substring(0);
    last_gsk = app_settings.group_sync_key.substring(0);

    if (restart){
      console.log("calling restartParser");
      restartParser();
    }
  }

  setTimeout(setConfigLasts, 100);

  $("#log_dir_input, #group_sync_key").on('blur keydown keypress change', function (){
    if ($(this).attr('id') === "log_dir_input" && $(this).val() !== last_ldi){
      $(this).css('border-color', 'red');
    }
    else if ($(this).attr('id') === "group_sync_key" && $(this).val() !== last_gsk){
      $(this).css('border-color', 'red');
    }
    else {
      $(this).css('border-color', 'black');
    }
  });

  $("#config input").on('keydown', function (e){
    console.log(e);
    if (e.keyCode === 27){
      $("#config input").blur();
    }
  });

  $("#config .savebutton").click(function (){
    app_settings.log_dir = $("#log_dir_input").val();
    app_settings.group_sync_key = $("#group_sync_key").val();
    app_settings.save();

    $("#log_dir_input, #group_sync_key").blur();
  });

  /* Set up the saved log_dir, if any */
  if (app_settings.log_dir){
    $("#log_dir_input").val(app_settings.log_dir);
  }

  /* Set up the saved group sync key, if any */
  $("#group_sync_key").val(app_settings.group_sync_key || "");

  /* Start the parser */
  function restartParser(){
    if (parser && typeof parser.stop === "function"){
      console.log("stopping parser")
      parser.on('stop', function (){
        console.log("parser stopped. restarting");
        //parser = null;
        //restartParser();
      })
      parser.stop();
    }
    else if (fs.existsSync(app_settings.log_dir) && fs.statSync(app_settings.log_dir).isDirectory()) {
      console.log("starting parser");
      parser = new slp.CombatLogParser(app_settings.log_dir, true);

      parser.on('start', function (){
        console.log('parser started');
        console.log(parser);
      });

      parser.on('error', function (err){
        console.log("Error: " + err);
      });

      parser.on('data', function (obj){
        if (obj){
          console.log(obj);
          var identifier;
          if (obj.effect.name === "Damage"){
            if (obj.event_source.is_player || !obj.event_source.unique_id){
              identifier = obj.event_source.name;
            }
            else {
              identifier = obj.event_source.name + ":" + obj.event_source.unique_id;
            }

            if (!parser_data.total_dmg[identifier]) parser_data.total_dmg[identifier] = 0;

            parser_data.total_dmg[identifier] += obj.effect_value.amt;
          }
          else if (obj.effect.name === "Heal"){
            if (obj.event_source.is_player || !obj.event_source.unique_id){
              identifier = obj.event_source.name;
            }
            else {
              identifier = obj.event_source.name + ":" + obj.event_source.unique_id;
            }

            if (!parser_data.total_heals[identifier]) parser_data.total_heals[identifier] = 0;

            parser_data.total_heals[identifier] += obj.effect_value.amt;
          }
          else {
            parser_data.unknown_events[obj.effect.name] = (parser_data.unknown_events[obj.effect.name] || 0) + 1;
          }

          console.log(parser_data.total_dmg);
          console.log(parser_data.total_heals);
          console.log(parser_data.unknown_events);
          console.log();
        }
        else {
          console.log("data event with no data");
        }
      });

      parser.start();
    }
    else {
      //parser = null;
      console.log("combat log directory doesn't exist or isn't a directory");
    }
  }
});