var $ = require("jquery")
  , ButtonSet = require("buttonset")
  , OverlayHandler = require('./overlay_handler')

  , overlay_handler = {}
  , _dragging = false
  , overlays = {}
  , menu = {}
  , enablesync = {}
  , enablelogging = {}
  ;

/* Set up application listeners etc. */
addEventListener('app-ready', function (err){
  var logger = new (require("./logger"))("application.js")
    , display = require('./display')
    , parser = require('./parser')
    ;

  /* Configure logging */
  logger.setLogLevel('debug');

  overlay_handler = new OverlayHandler(logger, parser, app_settings, createOverlay, configureOverlay);

  logger.log('debug', 'app-ready triggered');
  logger.log('debug', app_overlays);

  /* require the combat log parser */
  var path = node_require('path')
    ;

  overlays = new ButtonSet("#overlay-selector", {
      unselectable: false
    , multiple: true
    })
  , menu = new ButtonSet("nav#menu", {
      unselectable: false
    , multiple: false
    })
  , enablesync = new ButtonSet("#config .enablebutton", {
      unselectable: true
    , multiple: false
    })
  , enablelogging = new ButtonSet("#enablelogging", {
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

  /* Default to Configuration */
  menu.set(0);

  /* Set up enable sync button */
  enablesync.add("Enable Sync");

  enablesync.on('set', function (button, index){
    if (index === 0){
      app_settings.group_sync_enabled = true;
    }
  });

  enablesync.on('unset', function (button, index){
    if (index === 0){
      app_settings.group_sync_enabled = false;
    }
  });

  if (app_settings.group_sync_enabled){
    enablesync.set(0);
  }

  /* Set up enable logging */
  enablelogging.add("Enable Logging");

  enablelogging.on('set', function (button, index){
    if (index === 0){
      app_settings.logging_enabled = true;
      logger.enableFileLog();
      parser.logger.enableFileLog();
      display.logger.enableFileLog();
      //triggerOverlaysEvent('enable-file-logging');
    }
  });

  enablelogging.on('unset', function (button, index){
    if (index === 0){
      app_settings.logging_enabled = false;
      logger.disableFileLog();
      parser.logger.disableFileLog();
      display.logger.disableFileLog();
      //triggerOverlaysEvent('disable-file-logging');
    }
  });

  if (app_settings.logging_enabled){
    enablelogging.set(0);
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
    logger.disableFileLog();
    parser.logger.disableFileLog();
    display.logger.disableFileLog();
    overlay_handler.closeAllOverlays();
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

  $("footer .version").text(app_version);

  /* Configure overlays menu */
  overlays.on('set', function (button, index){
    logger.log('debug', 'SET overlays button "%s". index: %s', button.text(), index);
    overlay_handler.openOverlay(button.text());
  });

  overlays.on('unset', function (button, index){
    logger.log('debug', 'UNSET overlays button "%s". index: %s', button.text(), index);
    overlay_handler.closeOverlay(button.text());

  });

  app_overlays.forEach(function (overlay, index){
    overlays.add(overlay);

    logger.log('debug', "checking overlay %s", overlay);
    if (app_settings.overlays[overlay] && app_settings.overlays[overlay].opened){
      logger.log('debug', 'opening');
      overlays.set(index);
    }
    else {
      logger.log('debug', 'not opening');
    }
  });

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
    , last_opacity = 0.75
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
    last_opacity = parseFloat(app_settings.overlay_opacity) * 1;

    if (restart){
      logger.log('debug', "calling restartParser");
      parser.restartParser(app_settings);
    }
  }

  setConfigLasts();
  //setTimeout(setConfigLasts, 100);

  $("#log_dir_input, #group_sync_key, #overlay_opacity").on('blur keydown keypress change', function (){
    if ($(this).attr('id') === "log_dir_input" && $(this).val() !== last_ldi){
      $(this).css('border-color', 'red');
    }
    else if ($(this).attr('id') === "group_sync_key" && $(this).val() !== last_gsk){
      $(this).css('border-color', 'red');
    }
    else if ($(this).attr('id') === "overlay_opacity" && $(this).val() != last_opacity){
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
    console.log('debug', 'setting all settings...');
    app_settings.log_dir = $("#log_dir_input").val();
    app_settings.group_sync_key = $("#group_sync_key").val();
    app_settings.overlay_opacity = parseFloat($("#overlay_opacity").val());
    console.log('debug', 'saving settings...');
    app_settings.save();
    console.log('debug', 'setting default setting values...');
    setConfigLasts();
    console.log('debug', 'setting opacities...');
    overlay_handler.setOverlayOpacity();

    $("#log_dir_input, #group_sync_key, #overlay_opacity").blur();
    parser.restartParser(app_settings);
  });

  /* Set up the saved log_dir, if any */
  if (app_settings.log_dir){
    $("#log_dir_input").val(app_settings.log_dir);
  }

  /* Set up the saved group sync key, if any */
  $("#group_sync_key").val(app_settings.group_sync_key || "");

  /* Set up the saved opacity, if any */
  $("#overlay_opacity").val(typeof app_settings.overlay_opacity === "undefined" ? 0.75 : app_settings.overlay_opacity);

  /* Set up stats selectors */
  ["#stats select#left_selector", "#stats select#mid_selector", "#stats select#right_selector"].forEach(function (selector){
    $(selector).empty();
    app_overlays.forEach(function (overlay){
      $(selector).append("<option value='" + overlay + "'>" + overlay + "</option>");
    });
  });

  var left_stats_display = null
    , mid_stats_display = null
    , right_stats_display = null
    ;

  function updateEncounterStatistics(){
    logger.log('debug', 'updateEncounterStatistics tick');
    var parser_data = parser.getParserData() || {};
    (parser_data.encounters || []).forEach(function (encounter, index){
      logger.log('debug', encounter);
      var opt = $("select#encounter_selector option[value=" + index + "]");
      logger.log('debug', opt);
      if (opt.length){
        opt.text(display.getEncounterName(encounter));
      }
      else {
        $("select#encounter_selector").append("<option value='" + index + "'></option>");
      }
    });

    var encounter_index = $("select#encounter_selector").val() || false;
    if (encounter_index === false){
      encounter_index = (parser_data.encounters || []).length - 1;
    }

    if (encounter_index !== -1){
      if (!left_stats_display){
        left_stats_display = new display.BarDataDisplay($("#stats .left_stats .content ol"), $("select#left_selector").val(), parser, encounter_index, function (focus_li){
          if (mid_stats_display){
            mid_stats_display.setFocusTarget($(focus_li).find("span.name").text());
          }

          if (right_stats_display){
            right_stats_display.setFocusTarget($(focus_li).find("span.name").text());
          }
        });
      }

      left_stats_display.setEncounter(encounter_index);
      left_stats_display.setOverlayName($("select#left_selector").val());
      left_stats_display.redraw();

      if (!mid_stats_display){
        mid_stats_display = new display.DetailDataDisplay($("#stats .mid_stats .content"), $("select#left_selector").val(), 0, parser, encounter_index);
      }

      mid_stats_display.setEncounter(encounter_index);
      mid_stats_display.setOverlayName($("select#left_selector").val());
      mid_stats_display.redraw();

      if (!right_stats_display){
        right_stats_display = new display.DetailDataDisplay($("#stats .right_stats .content"), $("select#left_selector").val(), 1, parser, encounter_index);
      }

      right_stats_display.setEncounter(encounter_index);
      right_stats_display.setOverlayName($("select#left_selector").val());
      right_stats_display.redraw();
    }
  }

  var _intid = setInterval(updateEncounterStatistics, 2000);

  window.stopUpdates = function (){
    clearInterval(_intid);
  }


});


