var logger = new (require('./logger'))("parser.js")
  , fs = node_require('fs')
  , slp = node_require('swtor-log-parser')
  , parser = null
  , parser_data = {
    encounters: []
  }
  ;

logger.setLogLevel('info');

module.exports = {
  getParser: getParser
, getParserData: getParserData
, restartParser: restartParser
, logger: logger
}

function getParser(){
  return parser;
}

function getParserData(){
  return parser_data;
}

function restartParser(app_settings){
  if (parser && typeof parser.stop === "function"){
    logger.log('debug', "stopping parser")
    parser.on('stop', function (){
      logger.log('debug', "parser stopped. restarting");
      parser.removeAllListeners('data');
      parser.removeAllListeners('start');
      parser.removeAllListeners('stop');
      parser.removeAllListeners('error');
      parser = null;
      restartParser(app_settings);
    })
    parser.stop();
  }
  else if (fs.existsSync(app_settings.log_dir) && fs.statSync(app_settings.log_dir).isDirectory()) {
    logger.log('debug', "starting parser");
    parser = new slp.CombatLogParser(app_settings.log_dir, false);

    parser.on('start', function (){
      logger.log('debug', 'parser started');
      logger.log('debug', parser);
    });

    parser.on('error', function (err){
      logger.log('debug', "Error: " + err);
    });

    parser.on('data', function (obj){
      if (obj){
        logger.log('debug', obj);
        logger.log('debug', parser_data);
        var source_identifier, target_identifier;

        if (obj.event_source.is_player || !obj.event_source.unique_id){
          source_identifier = obj.event_source.name;
        }
        else {
          source_identifier = obj.event_source.name + ":" + obj.event_source.unique_id;
        }

        if (obj.event_target.is_player || !obj.event_target.unique_id){
          target_identifier = obj.event_target.name;
        }
        else {
          target_identifier = obj.event_target.name + ":" + obj.event_target.unique_id;
        }

        /* Check for new encounter */
        if (obj.effect.name === "EnterCombat"){
          logger.log('info', 'enter combat event')
          if (!parser_data.encounters[parser_data.encounters.length - 1] || parser_data.encounters[parser_data.encounters.length - 1].end_time){
            logger.log('info', 'starting new encounter')
            //new encounter
            parser_data.encounters.push({
              damage_done: {}
            , damage_done_details: {}
            , damage_taken: {}
            , damage_taken_details: {}
            , healing_done: {}
            , healing_done_details: {}
            , healing_taken: {}
            , healing_taken_details: {}
            , damage_targets: {}

            , threat: {}
            , threat_details: {}
            , raw_events: []
            , temp_start_time: (new Date()).getTime()
            , start_time: obj.timestamp
            , end_time: null
            });
          }
          else {
            logger.log('debug', 'starting new encounter');
            logger.log('debug', parser_data.encounters);
            logger.log('debug', parser_data.encounters[parser_data.encounters.length - 1].end_time);
            logger.log('debug', !parser_data.encounters[parser_data.encounters.length - 1].end_time);
          }
        }

        /* Check for Ending Encounter */
        else if (obj.effect.name === "ExitCombat"){
          logger.log('info', 'ending current encounter');

          if (parser_data.encounters[parser_data.encounters.length - 1]){
            parser_data.encounters[parser_data.encounters.length - 1].end_time = obj.timestamp;
          }

          logger.log('debug', parser_data.encounters);
        }

        /* Read event data */
        else {

          var curr_encounter = (parser_data.encounters) ? parser_data.encounters[parser_data.encounters.length - 1] : null;

          if (!curr_encounter){
            return;
          }

          if ((curr_encounter.end_time && obj.timestamp > curr_encounter.end_time) || !curr_encounter.start_time || obj.timestamp < curr_encounter.start_time){
            logger.log('error', 'damage packet etc unexpected');
            return;
          }

          curr_encounter.raw_events.push(obj);

          if (obj.effect.name === "Damage"){
            if (obj.event_source.is_player){
              curr_encounter.damage_done[source_identifier] = (curr_encounter.damage_done[source_identifier] || 0) + obj.effect_value.amt;
              curr_encounter.threat[source_identifier] = (curr_encounter.threat[source_identifier] || 0) + (obj.threat || 0);

              curr_encounter.damage_targets[target_identifier] = (curr_encounter.damage_targets[target_identifier] || 0) + obj.effect_value.amt;
            }

            if (obj.event_target.is_player){
              curr_encounter.damage_taken[target_identifier] = (curr_encounter.damage_taken[target_identifier] || 0) + obj.effect_value.amt;
            }

          }
          else if (obj.effect.name === "Heal"){
            if (obj.event_source.is_player){
              curr_encounter.healing_done[source_identifier] = (curr_encounter.healing_done[source_identifier] || 0) + obj.effect_value.amt;
              curr_encounter.threat[source_identifier] = (curr_encounter.threat[source_identifier] || 0) + (obj.threat || 0);
            }

            if (obj.event_target.is_player){
              curr_encounter.healing_taken[target_identifier] = (curr_encounter.healing_taken[target_identifier] || 0) + obj.effect_value.amt;
            }
          }
          else if (obj.threat && obj.event_source.is_player) {
            curr_encounter.threat[source_identifier] = (curr_encounter.threat[source_identifier] || 0) + (obj.threat || 0);
          }

          logger.log('debug', curr_encounter);
          logger.log('debug', parser_data.encounters);
        }
      }
      else {
        logger.log('debug', "data event with no data");
      }
    });

    parser.start();
  }
  else {
    parser = null;
    logger.log('debug', "combat log directory doesn't exist or isn't a directory");
  }
}