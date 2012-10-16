var $ = require("jquery")
  , ButtonSet = require("buttonset")
  , logger = new (require("./logger"))()
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

/* Configure logging */
console.log(logger);
logger.setLogLevel('debug');
console.log(logger);
logger.log('debug', 'test debug');
logger.log('info', 'test info');
logger.log('warn', 'test warn');
logger.log('error', 'test error');

/* Helpers for opening overlays on application load */
function openOverlay(overlay_index){
  logger.log('debug', 'openOverlay');
  _overlay_queue.push(overlay_index);

  if (!_opening_overlays){
    _opening_overlays = true;
  }

  logger.log('debug', _overlay_queue);
}

function _openOverlays(){
  logger.log('debug', '_openOverlays');
  var ind = _overlay_queue.shift();
  logger.log('debug', ind);
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
  logger.log('debug', 'app-ready triggered');
  logger.log('debug', app_overlays);

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
    logger.log('debug', 'SET menu button "%s". index: %s', button.text(), index);

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
    logger.log('debug', 'UNSET menu button "%s". index: %s', button.text(), index);
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
    logger.log('debug', "restoring window position");
    window.frame.move(parseInt(app_settings.winpos.left || 0), parseInt(app_settings.winpos.top || 0));
  }
  else {
    logger.log('debug', "no position to restore. centering.");
    logger.log('debug', app_settings);
    window.frame.center();
  }

  /* Set up window controls -- close and minimize, click-drag */
  $("a#close").click(function (){
    logger.log('debug', 'close clicked');
    window.close();
  });

  $("a#minimize").click(function (){
    logger.log('debug', 'minimize clicked');
    window.frame.minimize();
  });

  $('a.winctl').on('mouseover', function(event){
                  $(this).css('z-index', 2);
               })
               .on('mouseout', function(event){
                  $(this).css('z-index', 0);
               });


  $("header h1, header img").on("mousedown", function (){
    logger.log('debug', 'header mousedown');

    window.frame.drag();

    logger.log('debug', 'saving window position');
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
    logger.log('debug', 'SET overlays button "%s". index: %s', button.text(), index);
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

      logger.log('debug', overlay_windows[button.text()].frame);

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
    logger.log('debug', 'UNSET overlays button "%s". index: %s', button.text(), index);
    if (overlay_windows[button.text()]){
      overlay_windows[button.text()].frame.hide();
    }

    (app_settings.overlays[button.text()] || {}).opened = false;
    app_settings.save();

  });

  /* Open previously opened overlays */
  app_overlays.forEach(function (overlay, index){
    logger.log('debug', "checking overlay %s", overlay);
    if (app_settings.overlays[overlay] && app_settings.overlays[overlay].opened){
      logger.log('debug', 'opening');
      openOverlay(index);
    }
    else {
      logger.log('debug', 'not opening');
    }
  });

  setTimeout(_openOverlays, 1000);


  logger.log('debug', app_settings.overlays);
  logger.log('debug', app_settings);

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
        logger.log('error', err);
        return;
      }
      else {
        logger.log('debug', files);
      }

      showing_dir_selector = false;
      files.forEach(function (file){
        file = file.toString('utf8');
        if (file.substring(file.length - 4) === ".txt"){
          file = path.dirname(file);
        }

        $("#log_dir_input").val(file);
        $("#log_dir_input").blur();
        logger.log('debug', file);
      });
    });
  });

  var last_ldi = ""
    , last_gsk = ""
    ;

  function setConfigLasts(){
    var restart = false;
    logger.log('debug', "setConfigLasts");
    logger.log('debug', last_ldi);
    logger.log('debug', app_settings.log_dir.substring(0));
    if (last_ldi !== app_settings.log_dir.substring(0)){
      restart = true;
    }

    last_ldi = app_settings.log_dir.substring(0);
    last_gsk = app_settings.group_sync_key.substring(0);

    if (restart){
      logger.log('debug', "calling restartParser");
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
    logger.log('debug', e);
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
      logger.log('debug', "stopping parser")
      parser.on('stop', function (){
        logger.log('debug', "parser stopped. restarting");
        parser = null;
        restartParser();
      })
      parser.stop();
    }
    else if (fs.existsSync(app_settings.log_dir) && fs.statSync(app_settings.log_dir).isDirectory()) {
      logger.log('debug', "starting parser");
      parser = new slp.CombatLogParser(app_settings.log_dir, true);

      parser.on('start', function (){
        logger.log('debug', 'parser started');
        logger.log('debug', parser);
      });

      parser.on('error', function (err){
        logger.log('debug', "Error: " + err);
      });

      parser.on('data', function (obj){
        if (obj){
          logger.log('debug', obj);
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

          logger.log('debug', parser_data.total_dmg);
          logger.log('debug', parser_data.total_heals);
          logger.log('debug', parser_data.unknown_events);
        }
        else {
          logger.log('debug', "data event with no data");
        }
      });

      parser.start();
    }
    else {
      parser = null;
      logger.log('debug', "combat log directory doesn't exist or isn't a directory");
    }
  }
});