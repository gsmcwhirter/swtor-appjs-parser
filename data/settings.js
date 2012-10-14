var fs = require('fs')
  ;
  
function Settings(filename, defaults){
  this._filename = filename;
  this._defaults = defaults || {};
  this._exists = false;
  this._data = {};
  
  var self = this;
  
  for (var key in this._defaults){
    this.__defineGetter__(key, function (){
      return self._data[key];
    });
    
    this.__defineSetter__(key, function (val){
      return self._data[key] = val;
    });
  }
}

Settings.prototype.save = function (cb){
  for (var key in this._defaults){
    if (typeof this._data[key] === "undefined"){
      this._data[key] = null;
    }
  }
  
  fs.writeFile(this._filename, JSON.stringify(this._data, null, 2), cb);
};

Settings.prototype.load = function (cb){
  if (typeof cb !== "function"){
    cb = function (){};
  }
  
  this._data = this._defaults;
  
  fs.exists(this._filename, function (exists){
    if (exists){
      var data = require(this._filename);
      for (var key in data){
        this._data[key] = data[key];
      }
    }
    
    cb();
  });
};

module.exports = Settings;

