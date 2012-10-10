var fs = require('fs')
  , path = require('path')
  ;

module.exports.teststr = "12345";

module.exports.getTestFile = function (){
  return fs.readFileSync(path.join(__dirname, 'test.js'), 'utf8');
}; 
