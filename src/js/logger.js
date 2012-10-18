var fs = null
  , util = null
  ;

function Logger(source_file, output_file){
  this._log_level = Logger.LOG_INFO;
  this._outfile = output_file !== false ? output_file || "debug.log" : false;
  this._sourcefile = source_file || "unknown";
  this._log_to_file = false;
}

Logger.LOG_DEBUG = 1;
Logger.LOG_INFO = 2;
Logger.LOG_WARN = 3;
Logger.LOG_ERROR = 4;

Logger.prototype.levels = {
  'debug': Logger.LOG_DEBUG
, 'info': Logger.LOG_INFO
, 'warn': Logger.LOG_WARN
, 'error': Logger.LOG_ERROR
};

Logger.prototype.setLogLevel = function (level){
  console.log('setting log level to ' + level);
  if (typeof level !== "number"){
    level = this.levels[level] || Logger.LOG_INFO;
  }
  this._log_level = level;
}

Logger.prototype.enableFileLog = function (){
  this._log_to_file = true;
  if (fs === null){
    fs = node_require('fs');
  }

  if (util === null){
    util = node_require('util');
  }
}

Logger.prototype.disableFileLog = function (){
  this._log_to_file = false;
}

Logger.prototype.log = function (level, msg){
  var args = [];

  for (var arg in arguments){
    if (arg != 0){
      args.push(arguments[arg]);
    }
  }

  if (typeof level !== "number"){
    level = this.levels[level] || 0;
  }

  if (level >= this._log_level){
    if (typeof args[0] !== "object"){
      args[0] = "log " + level + ": " + args[0];
    }
    console.log.apply(console, args);

    if (this._outfile !== false && this._log_to_file){
      try{
        fs.appendFileSync(this._outfile, this._sourcefile + util.format("@%s: ", (new Date()).toISOString()) + util.format.apply(util.format, args) + "\n", 'utf8');
      } catch (err) {
        this._outfile = false;
      }
    }
  }
}

module.exports = Logger;
