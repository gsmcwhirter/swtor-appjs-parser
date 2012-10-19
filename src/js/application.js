var $ = require("jquery")
  , ButtonSet = require("buttonset")

  , _overlay_queue = []
  , _opening_overlays = false
  , _pause_overlays = false
  , _dragging = false
  , overlays = {}
  , overlays_set = false
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
  logger.setLogLevel('info');

  window.getParser = parser.getParser;
  window.getParserData = parser.getParserData;

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

  /* Function to trigger an event on all overlays */
  /* Broken
  function triggerOverlaysEvent(event_name){
    logger.log('debug', 'triggerOverlaysEvent %s', event_name)
    for (var key in overlay_windows){
      var win = overlay_windows[key];
      if (win){
        win.dispatchEvent(new win.Event(event_name));
      }
    }
  }
  */


  function setOverlayOpacity(overlay_name, opacity){
    logger.log('debug', 'setOverlayOpacity %s %s', overlay_name, opacity);
    if (typeof overlay_name === "undefined"){
      overlay_name = false;
    }
    else if (typeof overlay_name === "number"){
      opacity = overlay_name;
      overlay_name = false;
    }

    if (typeof opacity === "undefined"){
      opacity = parseFloat(typeof app_settings.overlay_opacity === "undefined" ? 0.75 : app_settings.overlay_opacity);
    }

    logger.log('debug', 'overlay opacity being set to %s for %s', opacity, overlay_name);

    if (overlay_name === false){
      logger.log('debug', 'overlay name was false. scanning all overlays');
      for (var key in overlay_windows){
        try{
          //logger.log('debug', 'recursing to set opacity on %s', key);
          logger.log('debug', key);
          /* TODO: Fix this so it doesn't cause the app to hang when you update more than one at a time. Until then, just have it reapply at restart.
          if (key !== false && typeof key !== "undefined"){
            actuallySetOpacity(key, opacity);
          }
          */
        } catch (err) {
          logger.log('error', err);
        }
      }
    }
    else {
      actuallySetOpacity(overlay_name, opacity);
    }

    function actuallySetOpacity(_oname, _opacity){

      logger.log('debug', 'actuallySetOpacity %s %s', _oname, _opacity);
      if (overlay_windows[_oname]){
        setTimeout(function (){
          logger.log('debug', 'actuallySetOpacity setTimeout %s %s', _oname, _opacity);
          overlay_windows[_oname].frame.opacity = parseFloat(_opacity);
        }, 200);
      }

    }

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
        logger.log('info', 'opening overlay %s', button.text());
        overlay_windows[button.text()].updateParserData = display.updateParserData;
        overlay_windows[button.text()].overlay_name = button.text();
        configureOverlay(overlay_windows[button.text()]);
        setOverlayOpacity(button.text());
        overlay_windows[button.text()].frame.show();

        if (_opening_overlays) {
          _pause_overlays = false;
        }
      });

      logger.log('debug', overlay_windows[button.text()].frame);

      overlay_windows[button.text()].on('close', function (){
        logger.log('info', 'closing overlay %s', button.text());
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

  setTimeout(setConfigLasts, 100);

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
    setOverlayOpacity();

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

  var statistics_focus = null
    , last_enc = null
    , last_left_sel = null
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
      if (last_enc !== encounter_index){
        display.forceRedrawDetails($("#stats .mid_stats .content, #stats .right_stats .content"));
        last_enc = encounter_index;
      }

      if (last_left_sel !== $("select#left_selector").val()){
        display.forceRedrawDetails($("#stats .mid_stats .content, #stats .right_stats .content"));
        last_left_sel = $("select#left_selector").val();
      }

      display.updateParserData($("#stats .left_stats .content ol"), $("select#left_selector").val(), encounter_index, function (focus_li){
        statistics_focus = $(focus_li).find("span.name").text();
        display.forceRedrawDetails($("#stats .mid_stats .content, #stats .right_stats .content"));
      });
      display.updateDetailedData1($("#stats .mid_stats .content"), $("select#left_selector").val(), encounter_index, statistics_focus);
      display.updateDetailedData2($("#stats .right_stats .content"), $("select#left_selector").val(), encounter_index, statistics_focus);
    }
  }

  var _intid = setInterval(updateEncounterStatistics, 2000);

  window.stopUpdates = function (){
    clearInterval(_intid);
  }


});