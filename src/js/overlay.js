var $ = require('jquery');

/* Set up window listeners etc. */
addEventListener('app-ready', function (err){
  console.log('app-ready triggered');

  /* Set up window controls */
  /* Can't get close to work right now, so close from the main interface instead
  $("a#close").click(function (){
    console.log('close clicked');
    window.trigger('overlay-closed');
  });

  $('a.winctl')
    .on('mouseover', function(event){
      $(this).css('z-index', 2);
    })
    .on('mouseout', function(event){
      $(this).css('z-index', 0);
    });
  */


  $("header h1, header img").on("mousedown", function (){
    console.log('header mousedown');
    window.frame.drag();

    console.log('saving overlay position');
    (main_window.app_settings.overlays[overlay_name] || {}).left = parseInt(window.frame.left);
    (main_window.app_settings.overlays[overlay_name] || {}).top = parseInt(window.frame.top);

    main_window.app_settings.save();
  });

  /* Set title of the overlay */
  $("header h1").text(overlay_name);

  /* Move overlay to saved position */
  if (main_window.app_settings.overlays[overlay_name] && main_window.app_settings.overlays[overlay_name].left !== false){
    console.log("restoring overlay position");
    window.frame.move(parseInt(main_window.app_settings.overlays[overlay_name].left || 0), parseInt(main_window.app_settings.overlays[overlay_name].top || 0));
  }
  else {
    console.log("no position to restore. leaving at top left corner.");
  }

  /* Set overlay opacity */
  window.frame.opacity = 0.75;

  /* refresh data on an interval */
  function updateParserData(){
    console.log("updateParserData tick from " + overlay_name);
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
        console.log(err);
        console.log(data);
      }

    }
  }

  setInterval(updateParserData, 2000);
});


