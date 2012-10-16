function Logger(){
  this._log_level = Logger.LOG_INFO;
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
  }
}

module.exports = Logger;
