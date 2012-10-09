addEventListener('app-ready', function (err){
  var test = require('./test')
    ;
    
  body.innerHTML = "<pre>" + test.teststr + "\n\n" + test.getTestFile() + "</pre>";
  
});
