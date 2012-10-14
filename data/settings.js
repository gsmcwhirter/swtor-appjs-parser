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
    this.__defineGetter__(key, function (){
      return self._data[key];
    });

    this.__defineSetter__(key, function (val){
      return self._data[key] = val;
    });
  }
}

Settings.prototype.save = function (){
  for (var key in this._defaults){
    if (typeof this._data[key] === "undefined"){
      this._data[key] = null;
    }
  }

  return fs.writeFileSync(this._filename, JSON.stringify(this._data, null, 2));
};

Settings.prototype.load = function (cb){
  var self = this;
  if (typeof cb !== "function"){
    cb = function (){};
  }

  this._data = this._defaults;

  fs.exists(this._filename, function (exists){
    if (exists){
      console.log(self._filename);
      var data = require(path.resolve(self._filename));
      for (var key in data){
        self._data[key] = data[key];
      }
    }

    cb();
  });
};

module.exports = Settings;

