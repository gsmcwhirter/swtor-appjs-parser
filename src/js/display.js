var logger = new (require('./logger'))("display.js")
  , $ = require('jquery')
  , detail_headers = {
    "Damage Done": ["Abilities", "Targets"]
  , "Damage Done per Second": ["Abilities", "Targets"]
  , "Damage Taken": ["Abilities", "Sources"]
  , "Damage Taken per Second": ["Abilities", "Sources"]
  , "Healing Done": ["Abilities", "Targets"]
  , "Healing Done per Second": ["Abilities", "Targets"]
  , "Healing Received": ["Abilities", "Sources"]
  , "Healing Received per Second": ["Abilities", "Sources"]
  , "Threat": ["Skills", "Targets"]
  , "Threat per Second": ["Skills", "Targets"]
  }
  ;

logger.setLogLevel('info');

module.exports = {
  getEncounterName: getEncounterName
, dataToArray: dataToArray
, BarDataDisplay: BarDataDisplay
, DetailDataDisplay: DetailDataDisplay
, logger: logger
}

function dataToArray(obj){
  var arr = [];
  for (var key in obj){
    arr.push([key, obj[key]]);
  }

  return arr;
}

function getEncounterName(encounter){
  var protag = "Unknown"
    , protag_dmg = 0
    ;

  for(var key in encounter.damage_targets){
    if (encounter.damage_targets[key] > protag_dmg){
      protag = key;
    }
  }

  return protag;
}

function BarDataDisplay(target, overlay_name, parser, encounter_index, li_onclick_func){
  this.target = target;
  this.overlay_name = overlay_name;
  this.parser = parser;
  this.encounter_index = encounter_index || -1;
  this.curr_encounter = null;
  this.setOnclickFunc(li_onclick_func);

  this.force_next_redraw = false;
}

BarDataDisplay.prototype.redraw = function (force){
  if (this.force_next_redraw || force){
    this.force_next_redraw = false;
    this.target.empty();
  }

  var curr_encounter = this.getCurrentEncounter();

  if (curr_encounter){
    logger.log('debug', 'current encounter ok');
    logger.log('debug', curr_encounter);

    try{
      this.target.empty();
      var end_time = parseInt(curr_encounter.end_time || (new Date()).getTime())
        , start_time = parseInt(curr_encounter.end_time) ? curr_encounter.start_time : curr_encounter.temp_start_time
        ;

      logger.log('debug', end_time);
      logger.log('debug', (new Date()).toString());
      logger.log('debug', curr_encounter.start_time);
      logger.log('debug', (new Date(curr_encounter.start_time)).toString());
      logger.log('debug', end_time - curr_encounter.start_time);

      switch(this.overlay_name){
        case "Damage Done":
          this.target.html(this.displayBarData(dataToArray(curr_encounter.damage_done)));

          break;
        case "Damage Done per Second":
          this.target.html(this.displayBarData(dataToArray(curr_encounter.damage_done).map(function (row){
            return [row[0], Math.round(1000 * row[1] / (end_time - start_time))];
          })));

          break;
        case "Damage Taken":
          this.target.html(this.displayBarData(dataToArray(curr_encounter.damage_taken)));

          break;
        case "Damage Taken per Second":
          this.target.html(this.displayBarData(dataToArray(curr_encounter.damage_taken).map(function (row){
            return [row[0], Math.round(1000 * row[1] / (end_time - start_time))];
          })));

          break;
        case "Healing Done":
          this.target.html(this.displayBarData(dataToArray(curr_encounter.healing_done)));

          break;
        case "Healing Done per Second":
          this.target.html(this.displayBarData(dataToArray(curr_encounter.healing_done).map(function (row){
            return [row[0], Math.round(1000 * row[1] / (end_time - start_time))];
          })));

          break;
        case "Healing Received":
          this.target.html(this.displayBarData(dataToArray(curr_encounter.healing_taken)));

          break;
        case "Healing Received per Second":
          this.target.html(this.displayBarData(dataToArray(curr_encounter.healing_taken).map(function (row){
            return [row[0], Math.round(1000 * row[1] / (end_time - start_time))];
          })));

          break;
        case "Threat":
          this.target.html(this.displayBarData(dataToArray(curr_encounter.threat)));

          break;
        case "Threat per Second":
          this.target.html(this.displayBarData(dataToArray(curr_encounter.threat).map(function (row){
            return [row[0], Math.round(1000 * row[1] / (end_time - start_time))];
          })));

          break;
        default:
          this.target.append("<li>Not implemented =(</li>");
      }

      var self = this;
      this.target.find("li").on('click', function (){
        self.onclick_func(this);
      });

      return [start_time, end_time];
    } catch (err) {
      logger.log('error', err);
    }
  }
  else {
    logger.log('debug', 'no current encounter');
  }
};

BarDataDisplay.prototype.displayBarData = function (data){
  data.sort(function (a, b){
    if (b[1] > a[1]){
      return 1;
    }
    else if (a[1] == b[1]){
      return 0;
    }
    else {
      return -1;
    }
  });

  var max = 0;
  if (data[0]){
    max = data[0][1];
  }

  var ac_ids = this.parser.getParserData().player_classes || {};
  var ret = "";

  data.forEach(function (row, index){
    ret += "<li>.";
    ret += "<span class='value'>" + row[1] + "</span>";
    ret += "<span class='color-bar color-" + ((index % 8) + 1) + (ac_ids[row[0]] ? " color-" + ac_ids[row[0]] : "") + "' style='width: " + (max === 0 ? 0 : Math.round(row[1] / max * 100)) + "%;'>.</span>";
    ret += "<span class='name'>" + row[0] + "</span>";
    ret += "</li>";
  });

  return ret;
};

BarDataDisplay.prototype.setEncounter = function (encounter_index){
  if (this.encounter_index !== encounter_index){
    this.force_next_redraw = true;
  }

  this.encounter_index = encounter_index;
};
BarDataDisplay.prototype.setOverlayName = function (overlay_name){
  if (this.overlay_name !== overlay_name){
    this.force_next_redraw = true;
  }

  this.overlay_name = overlay_name;
};

BarDataDisplay.prototype.setOnclickFunc = function (li_onclick_func){
  if (typeof li_onclick_func === "function"){
    this.onclick_func = li_onclick_func;
  }
  else {
    this.onclick_func = function (){};
  }
};

BarDataDisplay.prototype.getCurrentEncounter = function (force){
  if (force || !this.curr_encounter){
    logger.log('debug', "getEncounter %s", this.encounter_index);
    var data = this.parser.getParserData();
    logger.log('debug', data);

    if (data && data.encounters){
      if (typeof this.encounter_index !== "undefined" && this.encounter_index !== -1){
        this.curr_encounter = data.encounters[this.encounter_index];
      }
      else {
        this.curr_encounter = data.encounters[data.encounters.length - 1];
      }
    }
    else {
      this.curr_encounter = null;
    }
  }

  return this.curr_encounter;
};


function DetailDataDisplay(target, overlay_name, display_num, parser, encounter_index){
  this.target = target;
  this.overlay_name = overlay_name;
  this.display_num = display_num;
  this.parser = parser;
  this.encounter_index = encounter_index;
  this.focus_target = null;

  this.force_next_redraw = false;
  this.last_name_sort = [];
}

DetailDataDisplay.prototype.setEncounter = function (encounter_index){
  if (this.encounter_index !== encounter_index){
    this.force_next_redraw = true;
  }

  this.encounter_index = encounter_index;
};
DetailDataDisplay.prototype.setOverlayName = function (overlay_name){
  if (this.overlay_name !== overlay_name){
    this.force_next_redraw = true;
  }

  this.overlay_name = overlay_name;
};

DetailDataDisplay.prototype.setFocusTarget = function (player_name){
  if (this.focus_target !== player_name){
    this.force_next_redraw = true;
  }

  this.focus_target = player_name;
};

DetailDataDisplay.prototype.getCurrentEncounter = function (force){
  if (force || !this.curr_encounter){
    logger.log('debug', "getEncounter %s", this.encounter_index);
    var data = this.parser.getParserData();
    logger.log('debug', data);

    if (data && data.encounters){
      if (typeof this.encounter_index !== "undefined" && this.encounter_index !== -1){
        this.curr_encounter = data.encounters[this.encounter_index];
      }
      else {
        this.curr_encounter = data.encounters[data.encounters.length - 1];
      }
    }
    else {
      this.curr_encounter = null;
    }
  }

  return this.curr_encounter;
};


DetailDataDisplay.prototype.displayDetailData = function (data, total_amt){
  var max = 0;

  var ol = this.target.find('ol');

  if (data[0] && typeof data[0][1].damage_done !== "undefined"){
    data.sort(function (a, b){
        if (b[1].damage_done > a[1].damage_done){
          return 1;
        }
        else if (b[1].damage_done == a[1].damage_done){
          return 0;
        }
        else {
          return -1;
        }
    });

    if (data[0]){
      max = data[0][1].damage_done;
    }

    data.forEach(function (row, index){
      var ret = '';
      var theli = ol.find('li span.name[data-name=\'' + row[0] + '\']');
      var pct = Math.round(row[1].damage_done / total_amt * 1000) / 10;
      console.log('debug', row[0]);
      console.log('debug', theli);
      if (theli.length){
        theli = theli.parent();
        theli.find('span.color-bar').css('width', (max === 0 ? 0 : Math.round(row[1].damage_done / max * 100)) + "%");
        theli.find('span.tooltip').html([
          "Damage Done: " + row[1].damage_done + "(" + pct + "%)"
        , "Ticks: " + row[1].hits
        , "Crits: " + row[1].crits
        , "Misses: " + row[1].misses
        , "Dodges: " + row[1].dodges
        , "Absorbs: " + row[1].absorbs
        , "Dmg. Absorbed: " + row[1].absorb_amt
        ].join("<br>"));
      }
      else {
        ret += "<li>.";
        ret += "<span class='expand-control downarrow'></span>";
        ret += "<span class='color-bar color-" + ((index % 8) + 1) + "' style='width: " + (max === 0 ? 0 : Math.round(row[1].damage_done / max * 100)) + "%;'>.</span>";
        ret += "<span class='name' data-name='" + row[0] + "' data-val='" + row[1].damage_done + "'>" + row[0] + "</span>";
        ret += "<span class='tooltip'>";
        ret += [
          "Damage Done: " + row[1].damage_done + "(" + pct + "%)"
        , "Ticks: " + row[1].hits
        , "Crits: " + row[1].crits
        , "Misses: " + row[1].misses
        , "Dodges: " + row[1].dodges
        , "Absorbs: " + row[1].absorbs
        , "Dmg. Absorbed: " + row[1].absorb_amt
        ].join("<br>");
        ret += "</span>";
        ret += "</li>";

        ol.append(ret);
      }
    });
  }
  else if (data[0] && typeof data[0][1].healing_done !== "undefined"){
    data.sort(function (a, b){
      if (b[1].healing_done > a[1].healing_done){
        return 1;
      }
      else if (b[1].healing_done == a[1].healing_done){
        return 0;
      }
      else {
        return -1;
      }
    });

    if (data[0]){
      max = data[0][1].healing_done;
    }

    data.forEach(function (row, index){
      var ret = '';
      var theli = ol.find('li span.name[data-name=\'' + row[0] + '\']');
      var pct = Math.round(row[1].healing_done / total_amt * 1000) / 10;
      console.log('debug', row[0]);
      console.log('debug', theli);
      if (theli.length){
        theli = theli.parent();
        theli.find('span.color-bar').css('width', (max === 0 ? 0 : Math.round(row[1].healing_done / max * 100)) + "%");
        theli.find('span.tooltip').html([
          "Healing Done: " + row[1].healing_done + "(" + pct + "%)"
        , "Ticks: " + row[1].heals
        , "Crits: " + row[1].crits
        ].join("<br>"));
      }
      else {
        ret += "<li>.";
        ret += "<span class='expand-control downarrow'></span>";
        ret += "<span class='color-bar color-" + ((index % 8) + 1) + "' style='width: " + (max === 0 ? 0 : Math.round(row[1].healing_done / max * 100)) + "%;'>.</span>";
        ret += "<span class='name' data-name='" + row[0] + "' data-val='" + row[1].healing_done + "'>" + row[0] + "</span>";
        ret += "<span class='tooltip'>";
        ret += [
          "Healing Done: " + row[1].healing_done + "(" + pct + "%)"
        , "Ticks: " + row[1].heals
        , "Crits: " + row[1].crits
        ].join("<br>");
        ret += "</span>";
        ret += "</li>";

        ol.append(ret);
      }
    });
  }
  else {
    logger.log('error', 'do not recognize data type');
  }

  this.sortList();
}

DetailDataDisplay.prototype.redraw = function (force){
  if (this.force_next_redraw || force){
    this.target.find('ol').empty();
    this.last_name_sort = [];
    this.force_next_redraw = false;
  }

  var curr_encounter = this.getCurrentEncounter();

  if (curr_encounter){

    if (typeof this.focus_target === "undefined" || this.focus_target === null){
      this.target.find('h2').text((detail_headers[this.overlay_name] || [])[this.display_num] || "");
      this.target.find('ol').html("<li>Please select a focus target from the left column.</li>");
    }
    else {
      this.target.find('h2').text(((detail_headers[this.overlay_name] || [])[this.display_num] || "") + ": " + this.focus_target);

      switch (this.overlay_name){
        case "Damage Done":
        case "Damage Done per Second":
          if (this.display_num === 0){
            this.displayDetailData(dataToArray((curr_encounter.damage_done_details[this.focus_target] || {}).abilities), curr_encounter.damage_done[this.focus_target]);
          }
          else if (this.display_num === 1) {
            this.displayDetailData(dataToArray((curr_encounter.damage_done_details[this.focus_target] || {}).targets), curr_encounter.damage_done[this.focus_target]);
          }
          break;
        case "Damage Taken":
        case "Damage Taken per Second":
          if (this.display_num === 0){
            this.displayDetailData(dataToArray((curr_encounter.damage_taken_details[this.focus_target] || {}).abilities), curr_encounter.damage_taken[this.focus_target]);
          }
          else if (this.display_num === 1){
            this.displayDetailData(dataToArray((curr_encounter.damage_taken_details[this.focus_target] || {}).sources), curr_encounter.damage_taken[this.focus_target]);
          }
          break;
        case "Healing Done":
        case "Healing Done per Second":
          if (this.display_num === 0){
            this.displayDetailData(dataToArray((curr_encounter.healing_done_details[this.focus_target] || {}).abilities), curr_encounter.healing_done[this.focus_target]);
          } else if (this.display_num === 1){
            this.displayDetailData(dataToArray((curr_encounter.healing_done_details[this.focus_target] || {}).targets), curr_encounter.healing_done[this.focus_target]);
          }
          break;
        case "Healing Received":
        case "Healing Received per Second":
          if (this.display_num === 0){
            this.displayDetailData(dataToArray((curr_encounter.healing_taken_details[this.focus_target] | {}).abilities), curr_encounter.healing_taken[this.focus_target]);
          } else if (this.display_num === 0){
            this.displayDetailData(dataToArray((curr_encounter.healing_taken_details[this.focus_target] || {}).sources), curr_encounter.healing_taken[this.focus_target]);
          }
          break;
        case "Threat":
        case "Threat per Second":
        default:
          this.target.find('ol').html("<li>Not implemented =(</li>");
      }

      this.target.find('ol li span.expand-control').on('click', function (){
        var tooltip = $(this).parent().find('span.tooltip');
        tooltip.toggleClass('showing');
        if (tooltip.hasClass('showing')){
          $(this).removeClass('downarrow').addClass('uparrow');
        }
        else {
          $(this).removeClass('uparrow').addClass('downarrow');
        }
      });
    }

  }
}

DetailDataDisplay.prototype.sortList = function (){
  var ol = this.target.find('ol');
  var sorted = ol.children('li').get().sort(function (a, b){
    var bval = parseInt($(b).attr('data-val') || 0)
      , aval = parseInt($(a).attr('data-val') || 0)
      ;

    return bval > aval;
  });

  var name_sort = sorted.map(function (li){
      return $(li).attr('data-name');
  });

  if (name_sort != this.last_name_sort){
    $.each(sorted, function (idx, itm){
      itm = $(itm).removeClass('color-1, color-2, color-3, color-4, color-5, color-6, color-7, color-8').addClass('color-' + ((idx % 8) + 1));
      ol.append(itm);
    });

    this.last_name_sort = name_sort;
  }
}
