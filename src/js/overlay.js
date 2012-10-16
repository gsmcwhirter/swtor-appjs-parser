var $ = require('jquery')
  , logger = new (require("./logger"))()
  ;

/* Set up window listeners etc. */
addEventListener('app-ready', function (err){
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
  $("header h1").text(overlay_name);

  /* Move overlay to saved position */
  if (main_window.app_settings.overlays[overlay_name] && main_window.app_settings.overlays[overlay_name].left !== false){
    logger.log('debug', "restoring overlay position");
    window.frame.move(parseInt(main_window.app_settings.overlays[overlay_name].left || 0), parseInt(main_window.app_settings.overlays[overlay_name].top || 0));
  }
  else {
    logger.log('debug', "no position to restore. leaving at top left corner.");
  }

  /* Set overlay opacity */
  window.frame.opacity = 0.75;

  /* refresh data on an interval */
  function updateParserData(){
    logger.log('debug', "updateParserData tick from " + overlay_name);
    var data = getParserData();

    if (data){

      try{
        switch(overlay_name){
          case "Damage Done":
            $(".content ol").empty();
            for (var entity in data.total_dmg){
              $(".content ol").append("<li>" + entity + ": " + data.total_dmg[entity] + "</li>");
            }
            break;
          case "Healing Done":
            $(".content ol").empty();
            for (var entity in data.total_heals){
              $(".content ol").append("<li>" + entity + ": " + data.total_heals[entity] + "</li>");
            }
            break;
          default:
            $(".content ol").empty();
            for (var entity in data.unknown_events){
              $(".content ol").append("<li>" + entity + ": " + data.unknown_events[entity] + "</li>");
            }
        }
      } catch (err) {
        logger.log('error', err);
        logger.log('debug', data);
      }

    }
  }

  setInterval(updateParserData, 2000);
});


