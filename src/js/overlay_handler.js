module.exports = OverlayHandler;

function OverlayHandler(logger, parser, app_settings, createOverlay, configureOverlay){
  this._working = false;
  this.tasks = [];
  this.overlay_windows = {};
  this.logger = logger;
  this.parser = parser;
  this.app_settings = app_settings;
  this.createOverlay = createOverlay;
  this.configureOverlay = configureOverlay;
}

OverlayHandler.prototype.processTasks = function (){
  this.logger.log('debug', 'processTasks; working? %s, num_tasks: %s', this._working, this.tasks.length);
  this.logger.log('debug', this.tasks);

  if (this._working){
    return;
  }

  var self = this;

  var task = this.tasks.shift();
  if (task){
    this._working = true;
    //process task

    this.logger.log('debug', 'processing task:');
    this.logger.log('debug', task);

    switch (task.type){
      case "open":
        if (!this.overlay_windows[task.oname]){
          this.overlay_windows[task.oname] = this.createOverlay(task.oname);


          this.overlay_windows[task.oname].on('ready', function (){
            self.logger.log('info', 'opening overlay %s', task.oname);
            self.overlay_windows[task.oname].parser = self.parser;
            self.overlay_windows[task.oname].overlay_name = task.oname;
            self.configureOverlay(self.overlay_windows[task.oname]);
            self.overlay_windows[task.oname].frame.show();
            self.setOverlayOpacity(task.oname);

            self.logger.log('debug', 'window ready: %s', task.oname);

            setTimeout(function (){
              self._working = false;
              self.processTasks();
            }, 200);

          });

          this.logger.log('debug', this.overlay_windows[task.oname].frame);

          this.overlay_windows[task.oname].on('close', function (){
            self.logger.log('info', 'closing overlay %s', task.oname);
          });

          (this.app_settings.overlays[task.oname] || {}).opened = true;
          this.app_settings.save();
        }
        else {
          this.overlay_windows[task.oname].frame.show();
          (this.app_settings.overlays[task.oname] || {}).opened = true;
          this.app_settings.save();

          setTimeout(function (){
            self._working = false;
            self.processTasks();
          }, 200);
        }
        break;

      case "close":
        if (this.overlay_windows[task.oname]){
          this.overlay_windows[task.oname].frame.hide();
        }

        (this.app_settings.overlays[task.oname] || {}).opened = false;
        this.app_settings.save();
        this._working = false;
        this.processTasks();
        break;
      case "set-opacity":
        if (typeof task.oname === "undefined"){
          task.oname = false;
        }
        else if (typeof task.oname === "number"){
          task.opacity = task.oname;
          task.oname = false;
        }

        if (typeof task.opacity === "undefined"){
          task.opacity = parseFloat(typeof this.app_settings.overlay_opacity === "undefined" ? 0.75 : this.app_settings.overlay_opacity);
        }
        else {
          task.opacity = parseFloat(task.opacity);
        }

        this.logger.log('debug', 'overlay opacity being set to %s for %s', task.opacity, task.oname);

        if (task.oname === false){
          this.logger.log('debug', 'overlay name was false. scanning all overlays');
          for (var key in this.overlay_windows){
            this.logger.log('debug', key);
            if (key !== false && typeof key !== "undefined"){
              this.tasks.push({
                type: 'set-opacity'
              , oname: key
              , opacity: task.opacity
              });
            }
          }

          this._working = false;
          this.processTasks();
        }
        else {
          this.logger.log('debug', 'actuallySetOpacity %s %s', task.oname, task.opacity);
          if (this.overlay_windows[task.oname]){
            if (false && typeof this.overlay_windows[task.oname].frame.fade === "function"){ //Fade is busted
              if (this.overlay_windows[task.oname].frame.opacity !== task.opacity){
                this.logger.log('debug', 'trying to fade to opacity %s from %s', task.opacity, this.overlay_windows[task.oname].frame.opacity);
                this.overlay_windows[task.oname].frame.fade(task.opacity, 100, function (){
                  self._working = false;
                  self.processTasks();
                });
              }
              else {
                this.logger.log('debug', 'opacities already match.');
                this._working = false;
                this.processTasks();
              }
            }
            else {
              this.logger.log('debug', 'fade is not a function (or is disabled)');
              this.overlay_windows[task.oname].frame.opacity = task.opacity;

              setTimeout(function (){
                self._working = false;
                self.processTasks();
              }, 200);
            }
          }
          else {
            this._working = false;
            this.processTasks();
          }
        }
        break;
      case "trigger-event":
        this.logger.log('debug', 'triggerOverlaysEvent %s', task.event);
        if (task.oname === false){
          for (var key in this.overlay_windows){
            if (key !== false){
              this.tasks.push({
                type: "trigger-event"
              , oname: key
              , event: task.event
              , data: task.data
              });
            }
          }
        }
        else {
          var win = this.overlay_windows[task.oname];
          if (win){
            win.dispatchEvent(new win.Event(task.event, task.data));
          }
        }

        this._working = false;
        this.processTasks();
      default:
        this.logger.log('error', 'unknown task type %s', task.type);
        this._working = false;
        this.processTasks();
    }
  }
  else {
    this.logger.log('debug', 'processTasks: no more tasks.');
  }
};

OverlayHandler.prototype.openOverlay = function (overlay_name){
  this.tasks.push({
    type: 'open'
  , oname: overlay_name
  });

  this.processTasks();
};

OverlayHandler.prototype.closeOverlay = function (overlay_name){
  this.tasks.push({
    type: 'close'
  , oname: overlay_name
  });

  this.processTasks();
};

OverlayHandler.prototype.closeAllOverlays = function (){
  for (var key in this.overlay_windows){
    this.overlay_windows[key].close();
  }
};

OverlayHandler.prototype.setOverlayOpacity = function (overlay_name, opacity){
  this.logger.log('debug', 'setOverlayOpacity %s %s', overlay_name, opacity);
  this.tasks.push({
    type: 'set-opacity'
  , oname: overlay_name
  , opacity: opacity
  });

  this.processTasks();
};

OverlayHandler.prototype.triggerEvent = function (overlay_name, event, data){
  this.tasks.push({
    type: 'trigger-event'
  , oname: overlay_name
  , event: event
  , data: data
  });

  this.processTasks();
};

