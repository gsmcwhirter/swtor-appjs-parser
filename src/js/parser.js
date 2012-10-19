var logger = new (require('./logger'))("parser.js")
  , fs = node_require('fs')
  , slp = node_require('swtor-log-parser')
  , parser = null
  , parser_data = {
    encounters: []
  , player_classes: {}
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
            var tmplate = generateEncounterTemplate();
            tmplate.temp_start_time = (new Date()).getTime();
            tmplate.start_time = obj.timestamp;
            tmplate.end_time = null;
            parser_data.encounters.push(tmplate);
            
            /* Used to account for battle rez's and combat stealth for regen purposes */
            parser_data.temp_encounter = generateEncounterTemplate();
            
            parser_data.use_temp = false;
          }
          else {
            logger.log('debug', 'starting new encounter');
            logger.log('debug', parser_data.encounters);
            logger.log('debug', parser_data.encounters[parser_data.encounters.length - 1].end_time);
            logger.log('debug', !parser_data.encounters[parser_data.encounters.length - 1].end_time);
          }
        }

        /* Check for Ending Encounter */
        else if (obj.effect.name === "ExitCombat" || (obj.effect.name === "Death" && obj.event_target.is_player)){
          logger.log('info', 'ending current encounter');
          
          if (parser_data.encounters[parser_data.encounters.length - 1]){
            parser_data.encounters[parser_data.encounters.length - 1].end_time = obj.timestamp;
            parser_data.use_temp = true;
          }

          logger.log('debug', parser_data.encounters);
        }
        
        else if (false){
          //TODO: Check for battle rez / combat stealth and then merge the temp_encounter with the real one
          
        }

        /* Read event data */
        else {
          var curr_encounter = (parser_data.encounters) ? parser_data.encounters[parser_data.encounters.length - 1] : null;

          if (!curr_encounter){
            return;
          }

          if ((curr_encounter.end_time && obj.timestamp > curr_encounter.end_time) || !curr_encounter.start_time || obj.timestamp < curr_encounter.start_time){
            logger.log('error', 'packet unexpected: %s', obj.effect.name);
            
            if (parser_data.use_temp){
              curr_encounter = parser_data.temp_encounter;
            }
            else {
              return;
            }
          }

          if (obj.effect.name === "Damage"){
            if (obj.event_source.is_player){
              curr_encounter.damage_done[source_identifier] = (curr_encounter.damage_done[source_identifier] || 0) + obj.effect_value.amt;

              if (!curr_encounter.damage_done_details[source_identifier]){
                curr_encounter.damage_done_details[source_identifier] = {
                  abilities: {}
                , targets: {}
                };
              }

              if (!curr_encounter.damage_done_details[source_identifier].abilities[obj.ability.name]){
                curr_encounter.damage_done_details[source_identifier].abilities[obj.ability.name] = {
                  damage_done: 0
                , hits: 0
                , misses: 0
                , dodges: 0
                , absorbs: 0
                , absorb_amt: 0
                , crits: 0
                }
              }

              if (!curr_encounter.damage_done_details[source_identifier].targets[target_identifier]){
                curr_encounter.damage_done_details[source_identifier].targets[target_identifier] = {
                  damage_done: 0
                , hits: 0
                , misses: 0
                , dodges: 0
                , absorbs: 0
                , absorb_amt: 0
                , crits: 0
                }
              }

              curr_encounter.damage_done_details[source_identifier].abilities[obj.ability.name].damage_done += obj.effect_value.amt;
              curr_encounter.damage_done_details[source_identifier].abilities[obj.ability.name].hits += 1;
              curr_encounter.damage_done_details[source_identifier].abilities[obj.ability.name].crits += obj.effect_value.is_crit ? 1 : 0;
              curr_encounter.damage_done_details[source_identifier].abilities[obj.ability.name].absorbs += obj.effect_value.absorb_amt === 0 ? 0 : 1;
              curr_encounter.damage_done_details[source_identifier].abilities[obj.ability.name].absorb_amt += obj.effect_value.absorb_amt;
              curr_encounter.damage_done_details[source_identifier].abilities[obj.ability.name].misses += obj.effect_value.type === "-miss" ? 1 : 0;
              curr_encounter.damage_done_details[source_identifier].abilities[obj.ability.name].dodges += obj.effect_value.type === "-dodge" ? 1 : 0;

              curr_encounter.damage_done_details[source_identifier].targets[target_identifier].damage_done += obj.effect_value.amt;
              curr_encounter.damage_done_details[source_identifier].targets[target_identifier].hits += 1;
              curr_encounter.damage_done_details[source_identifier].targets[target_identifier].crits += obj.effect_value.is_crit ? 1 : 0;
              curr_encounter.damage_done_details[source_identifier].targets[target_identifier].absorbs += obj.effect_value.absorb_amt === 0 ? 0 : 1;
              curr_encounter.damage_done_details[source_identifier].targets[target_identifier].absorb_amt += obj.effect_value.absorb_amt;
              curr_encounter.damage_done_details[source_identifier].targets[target_identifier].misses += obj.effect_value.type === "-miss" ? 1 : 0;
              curr_encounter.damage_done_details[source_identifier].targets[target_identifier].dodges += obj.effect_value.type === "-dodge" ? 1 : 0;
            }

            if (obj.event_target.is_player){
              curr_encounter.damage_taken[target_identifier] = (curr_encounter.damage_taken[target_identifier] || 0) + obj.effect_value.amt;

              if (!curr_encounter.damage_taken_details[target_identifier]){
                curr_encounter.damage_taken_details[target_identifier] = {
                  abilities: {}
                , sources: {}
                };
              }

              if (!curr_encounter.damage_taken_details[target_identifier].abilities[obj.ability.name]){
                curr_encounter.damage_taken_details[target_identifier].abilities[obj.ability.name] = {
                  damage_done: 0
                , hits: 0
                , misses: 0
                , dodges: 0
                , absorbs: 0
                , absorb_amt: 0
                , crits: 0
                }
              }

              if (!curr_encounter.damage_taken_details[target_identifier].sources[source_identifier]){
                curr_encounter.damage_taken_details[target_identifier].sources[source_identifier] = {
                  damage_done: 0
                , hits: 0
                , misses: 0
                , dodges: 0
                , absorbs: 0
                , absorb_amt: 0
                , crits: 0
                }
              }

              curr_encounter.damage_taken_details[target_identifier].abilities[obj.ability.name].damage_done += obj.effect_value.amt;
              curr_encounter.damage_taken_details[target_identifier].abilities[obj.ability.name].hits += 1;
              curr_encounter.damage_taken_details[target_identifier].abilities[obj.ability.name].crits += obj.effect_value.is_crit ? 1 : 0;
              curr_encounter.damage_taken_details[target_identifier].abilities[obj.ability.name].absorbs += obj.effect_value.absorb_amt === 0 ? 0 : 1;
              curr_encounter.damage_taken_details[target_identifier].abilities[obj.ability.name].absorb_amt += obj.effect_value.absorb_amt;
              curr_encounter.damage_taken_details[target_identifier].abilities[obj.ability.name].misses += obj.effect_value.type === "-miss" ? 1 : 0;
              curr_encounter.damage_taken_details[target_identifier].abilities[obj.ability.name].dodges += obj.effect_value.type === "-dodge" ? 1 : 0;

              curr	_encounter.damage_taken_details[target_identifier].sources[source_identifier].damage_done += obj.effect_value.amt;
              curr_encounter.damage_taken_details[target_identifier].sources[source_identifier].hits += 1;
              curr_encounter.damage_taken_details[target_identifier].sources[source_identifier].crits += obj.effect_value.is_crit ? 1 : 0;
              curr_encounter.damage_taken_details[target_identifier].sources[source_identifier].absorbs += obj.effect_value.absorb_amt === 0 ? 0 : 1;
              curr_encounter.damage_taken_details[target_identifier].sources[source_identifier].absorb_amt += obj.effect_value.absorb_amt;
              curr_encounter.damage_taken_details[target_identifier].sources[source_identifier].misses += obj.effect_value.type === "-miss" ? 1 : 0;
              curr_encounter.damage_taken_details[target_identifier].sources[source_identifier].dodges += obj.effect_value.type === "-dodge" ? 1 : 0;
            }

            if (!obj.event_target.is_player){
              curr_encounter.damage_targets[target_identifier] = (curr_encounter.damage_targets[target_identifier] || 0) + obj.effect_value.amt;
            }

          }
          else if (obj.effect.name === "Heal"){
            if (obj.event_source.is_player){
              curr_encounter.healing_done[source_identifier] = (curr_encounter.healing_done[source_identifier] || 0) + obj.effect_value.amt;

              if (!curr_encounter.healing_done_details[source_identifier]){
                curr_encounter.healing_done_details[source_identifier] = {
                  abilities: {}
                , targets: {}
                };
              }

              if (!curr_encounter.healing_done_details[source_identifier].abilities[obj.ability.name]){
                curr_encounter.healing_done_details[source_identifier].abilities[obj.ability.name] = {
                  healing_done: 0
                , heals: 0
                , crits: 0
                }
              }

              if (!curr_encounter.healing_done_details[source_identifier].targets[target_identifier]){
                curr_encounter.healing_done_details[source_identifier].targets[target_identifier] = {
                  healing_done: 0
                , heals: 0
                , crits: 0
                }
              }

              curr_encounter.healing_done_details[source_identifier].abilities[obj.ability.name].healing_done += obj.effect_value.amt;
              curr_encounter.healing_done_details[source_identifier].abilities[obj.ability.name].heals += 1;
              curr_encounter.healing_done_details[source_identifier].abilities[obj.ability.name].crits += obj.effect_value.is_crit ? 1 : 0;

              curr_encounter.healing_done_details[source_identifier].targets[target_identifier].healing_done += obj.effect_value.amt;
              curr_encounter.healing_done_details[source_identifier].targets[target_identifier].heals += 1;
              curr_encounter.healing_done_details[source_identifier].targets[target_identifier].crits += obj.effect_value.is_crit ? 1 : 0;
            }

            if (obj.event_target.is_player){
              curr_encounter.healing_taken[target_identifier] = (curr_encounter.healing_taken[target_identifier] || 0) + obj.effect_value.amt;

              if (!curr_encounter.healing_taken_details[target_identifier]){
                curr_encounter.healing_taken_details[target_identifier] = {
                  abilities: {}
                , sources: {}
                };
              }

              if (!curr_encounter.healing_taken_details[target_identifier].abilities[obj.ability.name]){
                curr_encounter.healing_taken_details[target_identifier].abilities[obj.ability.name] = {
                  healing_done: 0
                , heals: 0
                , crits: 0
                }
              }

              if (!curr_encounter.healing_taken_details[target_identifier].sources[source_identifier]){
                curr_encounter.healing_taken_details[target_identifier].sources[source_identifier] = {
                  healing_done: 0
                , heals: 0
                , crits: 0
                }
              }

              curr_encounter.healing_taken_details[target_identifier].abilities[obj.ability.name].healing_done += obj.effect_value.amt;
              curr_encounter.healing_taken_details[target_identifier].abilities[obj.ability.name].heals += 1;
              curr_encounter.healing_taken_details[target_identifier].abilities[obj.ability.name].crits += obj.effect_value.is_crit ? 1 : 0;

              curr_encounter.healing_taken_details[target_identifier].sources[source_identifier].healing_done += obj.effect_value.amt;
              curr_encounter.healing_taken_details[target_identifier].sources[source_identifier].heals += 1;
              curr_encounter.healing_taken_details[target_identifier].sources[source_identifier].crits += obj.effect_value.is_crit ? 1 : 0;
            }
          }

          if (obj.threat && obj.event_source.is_player) {
            //TODO: more interesting threat details
            curr_encounter.threat[source_identifier] = (curr_encounter.threat[source_identifier] || 0) + (obj.threat || 0);

            if (!curr_encounter.threat_details.sources[source_identifier]){
              curr_encounter.threat_details.sources[source_identifier] = {};
            }

            if (!curr_encounter.threat_details.targets[target_identifier]){
              curr_encounter.threat_details.targets[target_identifier] = {};
            }

            curr_encounter.threat_details.sources[source_identifier][target_identifier] = (curr_encounter.threat_details.sources[source_identifier][target_identifier] || 0) + (obj.threat || 0);
            curr_encounter.threat_details.targets[target_identifier][source_identifier] = (curr_encounter.threat_details.targets[target_identifier][source_identifier] || 0) + (obj.threat || 0);
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

function generateEncounterTemplate(){
  return {
    damage_done: {}
  , damage_done_details: {}
  , damage_taken: {}
  , damage_taken_details: {}
  , healing_done: {}
  , healing_done_details: {}
  , healing_taken: {}
  , healing_taken_details: {}
  , threat: {}
  , threat_details: {
    targets: {}
  , sources: {}
  }
  , damage_targets: {} //used to find the protagonist of the encounter
  };
}

function detectAdvancedClass(packet, player_name){
  
}
