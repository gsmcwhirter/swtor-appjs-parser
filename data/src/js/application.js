addEventListener('app-ready', function (err){
  var $ = require('jquery');
  var test = node_require('./test')
    ;
    
  $("p#test").html("<pre>" + test.teststr + "\n\n" + test.getTestFile() + "</pre>");
  
});
