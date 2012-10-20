var $ = require('jquery')
  , display = require('./display')
  , logger = null
  ;

var window_titles = {
  "Damage Done": "Damage"
, "Damage Done per Second": "DPS"
, "Damage Taken": "Damage Taken"
, "Damage Taken per Second": "DTPS"
, "Healing Done": "Healing"
, "Healing Done per Second": "HPS"
, "Healing Received": "Heals Taken"
, "Healing Received per Second": "HTPS"
, "Threat": "Threat"
, "Threat per Second": "TPS"
};

/* Set up window listeners etc. */
addEventListener('app-ready', function (event){
  logger = new (require("./logger"))("overlay.js#" + overlay_name)
    ;

  logger.setLogLevel('info');

  logger.log('debug', 'app-ready triggered');

  $("header h1, header img").on("mousedown", function (){
    logger.log('debug', 'header mousedown');
    window.frame.drag();

    logger.log('debug', 'saving overlay position');
    (main_window.app_settings.overlays[overlay_name] || {}).left = parseInt(window.frame.left);
    (main_window.app_settings.overlays[overlay_name] || {}).top = parseInt(window.frame.top);

    main_window.app_settings.save();
  });

  /* Set title of the overlay */
  $("header h1").text(window_titles[overlay_name] || overlay_name);

  /* Move overlay to saved position */
  if (main_window.app_settings.overlays[overlay_name] && main_window.app_settings.overlays[overlay_name].left !== false){
    logger.log('debug', "restoring overlay position");
    window.frame.move(parseInt(main_window.app_settings.overlays[overlay_name].left || 0), parseInt(main_window.app_settings.overlays[overlay_name].top || 0));
  }
  else {
    logger.log('debug', "no position to restore. leaving at top left corner.");
  }

  /* refresh data on an interval */

  var data_display = new display.BarDataDisplay($(".content ol"), overlay_name, parser, -1);

  var _intid = setInterval(function (){
    logger.log('debug', 'updateParserData wrapper tick');
    data_display.setEncounter(-1);
    var timers = data_display.redraw();

    if (timers){
      var start_time = timers[0]
        , end_time = timers[1]
        ;

      var mins = Math.floor((end_time - start_time) / 60 / 1000) + ''
        , secs = (Math.round((end_time - start_time) / 1000) % 60) + ''
        ;
      $("header .timer").text(mins + ":" + (secs.length === 1 ? "0" : "") + secs);
    }
  }, 2000);

  window.stopUpdates = function (){
    clearInterval(_intid);
  }

});
