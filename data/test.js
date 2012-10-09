var fs = require('fs')
  ;

module.exports.teststr = "12345";

module.exports.getTestFile = function (){
  return fs.readFileSync('test.js', 'utf8');
}; 
