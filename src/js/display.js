var logger = new (require('./logger'))("display.js")
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

logger.setLogLevel('debug');

module.exports = {
  getEncounterName: getEncounterName
, dataToArray: dataToArray
, displayBarData: displayBarData
, displayDetailData: displayDetailData
, updateParserData: updateParserData
, updateDetailedData1: updateDetailedData1
, updateDetailedData2: updateDetailedData2
, logger: logger
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

function dataToArray(obj){
  var arr = [];
  for (var key in obj){
    arr.push([key, obj[key]]);
  }

  return arr;
}

function displayBarData(data){
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

  var ret = "";

  data.forEach(function (row, index){
    ret += "<li>.";
    ret += "<span class='value'>" + row[1] + "</span>";
    ret += "<span class='color-bar color-" + ((index % 8) + 1) + "' style='width: " + (max === 0 ? 0 : Math.round(row[1] / max * 100)) + "%;'>.</span>";
    ret += "<span class='name'>" + row[0] + "</span>";
    ret += "</li>";
  });

  return ret;
}

function displayDetailData(data){
  var max = 0;
  var ret = '';
  
  if (typeof a[1].damage_done !== "undefined"){
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
      ret += "<li>.";
      ret += "<span class='value'>" + row[1].damage_done + "</span>";
      ret += "<span class='color-bar color-" + ((index % 8) + 1) + "' style='width: " + (max === 0 ? 0 : Math.round(row[1] / max * 100)) + "%;'>.</span>";
      ret += "<span class='name'>" + row[0] + "</span>";
      ret += "</li>";
    });
  }
  else if (typeof a[1].healing_done !== "undefined"){
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
      ret += "<li>.";
      ret += "<span class='value'>" + row[1].healing_done + "</span>";
      ret += "<span class='color-bar color-" + ((index % 8) + 1) + "' style='width: " + (max === 0 ? 0 : Math.round(row[1] / max * 100)) + "%;'>.</span>";
      ret += "<span class='name'>" + row[0] + "</span>";
      ret += "</li>";
    });
  }
  else {
    logger.log('error', 'do not recognize data type');
  }
  
  return ret;
}

function updateParserData(target, overlay_name, encounter_index, li_onclick_func){
  logger.log('debug', "updateParserData tick from " + overlay_name);

  li_onclick_func = typeof li_onclick_func === "function" ? li_onclick_func : function (){};

  logger.log('debug', li_onclick_func);

  var curr_encounter = getEncounter(encounter_index);

  if (curr_encounter){
    logger.log('debug', 'current encounter ok');
    logger.log('debug', curr_encounter);

    try{
      target.empty();
      var end_time = parseInt(curr_encounter.end_time || (new Date()).getTime())
        , start_time = parseInt(curr_encounter.end_time) ? curr_encounter.start_time : curr_encounter.temp_start_time
        ;

      logger.log('debug', end_time);
      logger.log('debug', (new Date()).toString());
      logger.log('debug', curr_encounter.start_time);
      logger.log('debug', (new Date(curr_encounter.start_time)).toString());
      logger.log('debug', end_time - curr_encounter.start_time);


      switch(overlay_name){
        case "Damage Done":
          target.html(displayBarData(dataToArray(curr_encounter.damage_done)));

          break;
        case "Damage Done per Second":
          target.html(displayBarData(dataToArray(curr_encounter.damage_done).map(function (row){
            return [row[0], Math.round(1000 * row[1] / (end_time - start_time))];
          })));

          break;
        case "Damage Taken":
          target.html(displayBarData(dataToArray(curr_encounter.damage_taken)));

          break;
        case "Damage Taken per Second":
          target.html(displayBarData(dataToArray(curr_encounter.damage_taken).map(function (row){
            return [row[0], Math.round(1000 * row[1] / (end_time - start_time))];
          })));

          break;
        case "Healing Done":
          target.html(displayBarData(dataToArray(curr_encounter.healing_done)));

          break;
        case "Healing Done per Second":
          target.html(displayBarData(dataToArray(curr_encounter.healing_done).map(function (row){
            return [row[0], Math.round(1000 * row[1] / (end_time - start_time))];
          })));

          break;
        case "Healing Received":
          target.html(displayBarData(dataToArray(curr_encounter.healing_taken)));

          break;
        case "Healing Received per Second":
          target.html(displayBarData(dataToArray(curr_encounter.healing_taken).map(function (row){
            return [row[0], Math.round(1000 * row[1] / (end_time - start_time))];
          })));

          break;
        case "Threat":
          target.html(displayBarData(dataToArray(curr_encounter.threat)));

          break;
        case "Threat per Second":
          target.html(displayBarData(dataToArray(curr_encounter.threat).map(function (row){
            return [row[0], Math.round(1000 * row[1] / (end_time - start_time))];
          })));

          break;
        default:
          target.append("<li>Not implemented =(</li>");
      }

      target.find("li").on('click', function (){
        li_onclick_func(this);
      });

      return [start_time, end_time];
    } catch (err) {
      logger.log('error', err);
      logger.log('debug', data);
    }
  }
  else {
    logger.log('debug', 'no current encounter');
  }

}

function updateDetailedData1(target, overlay_name, encounter_index, focus_target){
  var curr_encounter = getEncounter(encounter_index);

  if (curr_encounter){
    target.find('ol').empty();

    if (typeof focus_target === "undefined" || focus_target === null){
      target.find('h2').text((detail_headers[overlay_name] || [])[0] || "");
      target.find('ol').append("<li>Please select a focus target from the left column.</li>");
    }
    else {
      target.find('h2').text(((detail_headers[overlay_name] || [])[0] || "") + ": " + focus_target);
      
      switch (overlay_name){
        case "Damage Done":
        case "Damage Done per Second":
          target.html(displayDetailData(dataToArray(curr_encounter.damage_done_details[focus_target].abilities)));
          break;
        case "Damage Taken":
        case "Damage Taken per Second":
          target.html(displayDetailData(dataToArray(curr_encounter.damage_taken_details[focus_target].abilities)));
          break;
        case "Healing Done":
        case "Healing Done per Second":
          target.html(displayDetailData(dataToArray(curr_encounter.healing_done_details[focus_target].abilities)));
          break;
        case "Healing Received":
        case "Healing Received per Second":
          target.html(displayDetailData(dataToArray(curr_encounter.healing_taken_details[focus_target].abilities)));
          break;
        case "Threat":
        case "Threat per Second":
        default:
          target.append("<li>Not implemented =(</li>");
      }
    }

  }
}

function updateDetailedData2(target, overlay_name, encounter_index, focus_target){
  var curr_encounter = getEncounter(encounter_index);

  if (curr_encounter){
    target.find('ol').empty();

    if (typeof focus_target === "undefined" || focus_target === null){
      target.find('h2').text((detail_headers[overlay_name] || [])[1] || "");
      target.find('ol').append("<li>Please select a focus target from the left column.</li>");
    }
    else {
      target.find('h2').text(((detail_headers[overlay_name] || [])[1] || "") + ": " + focus_target);
      
      switch (overlay_name){
        case "Damage Done":
        case "Damage Done per Second":
          target.html(displayDetailData(dataToArray(curr_encounter.damage_done_details[focus_target].targets)));
          break;
        case "Damage Taken":
        case "Damage Taken per Second":
          target.html(displayDetailData(dataToArray(curr_encounter.damage_taken_details[focus_target].sources)));
          break;
        case "Healing Done":
        case "Healing Done per Second":
          target.html(displayDetailData(dataToArray(curr_encounter.healing_done_details[focus_target].targets)));
          break;
        case "Healing Received":
        case "Healing Received per Second":
          target.html(displayDetailData(dataToArray(curr_encounter.healing_taken_details[focus_target].sources)));
          break;
        case "Threat":
        case "Threat per Second":
        default:
          target.append("<li>Not implemented =(</li>");
      }
    }
  }
}

function getEncounter(encounter_index){
  logger.log('debug', "getEncounter %s", encounter_index);
  var data = getParserData();
  logger.log('debug', data);

  if (data && data.encounters){
    var curr_encounter;
    if (typeof encounter_index !== "undefined"){
      curr_encounter = data.encounters[encounter_index];
    }
    else {
      curr_encounter = data.encounters[data.encounters.length - 1];
    }

    return curr_encounter || false;
  }

  logger.log('debug', 'no data');
  logger.log('debug', data);

  return false;
}
