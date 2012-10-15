var fs = require('fs')
  , path = require('path')
  ;

function Settings(filename, defaults){
  this._filename = filename;
  this._defaults = defaults || {};
  this._exists = false;
  this._data = {};

  var self = this;

  for (var key in this._defaults){
    this._data[key] = this._defaults[key];
    console.log("Defining setters and getters for %s", key);
    (function (key){
      self.__defineGetter__(key, function (){
        return self._data[key];
      });

      self.__defineSetter__(key, function (val){
        /*var autosave = false;
        if (self._data[key] != val){
          autosave = true
        }*/

        console.log("Setting %s to:", key);
        console.log(val);
        self._data[key] = val;

        /*if (autosave){
          self.save();
        }*/
      });
    })(key);
  }
}

Settings.prototype.save = function (){
  console.log("saving settings");
  /*for (var key in this._defaults){
    if (typeof this._data[key] === "undefined"){
      console.log('resetting key: ' + key);
      this._data[key] = null;
    }
  }*/

  //console.log(this);
  //console.log(this._data);
  //console.log(this._filename);
  try{
  //console.log(JSON);
  //console.log(JSON.stringify(this._data));

  //console.log(this._data);
  var writeData = JSON.stringify(this._data, null, 2);
  //var writeData = JSON.stringify(this._data);
  //console.log(writeData);
  //console.log(this._filename);

  return fs.writeFileSync(this._filename, writeData);
  }
  catch (err){
    console.log(err);
    return false;
  }
};

Settings.prototype.load = function (){
  if(fs.existsSync(this._filename)){
    console.log(this._filename);
    var data = require(path.resolve(this._filename));
    for (var key in data){
      this._data[key] = data[key];
    }
  }
  else {

  }
};

module.exports = Settings;

