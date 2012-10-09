addEventListener('app-ready', function (err){
  var test = node_require('./test')
    ;
    
  body.innerHTML = "<pre>" + test.teststr + "\n\n" + test.getTestFile() + "</pre>";
  
});
