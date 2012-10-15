var $ = require('jquery');

addEventListener('app-ready', function (err){
  console.log('app-ready triggered');

  $("a#close").click(function (){
    console.log('close clicked');
    window.trigger('overlay-closed');
  });

  $('a.winctl').on('mouseover', function(event){
                  $(this).css('z-index', 2);
               })
               .on('mouseout', function(event){
                  $(this).css('z-index', 0);
               });

  ;

  $("header h1, header img").on("mousedown", function (){
    console.log('header mousedown');
    window.frame.drag();
  });
});


