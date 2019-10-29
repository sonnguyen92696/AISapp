
/**
 * @class Ship
 * @property {number} MMSI
 * @property {staticMessageShip[]} ais_voyages_static
 * @property {dynamicMessageShip[]} ais_voyages_dynamic
 * @property {null|Cesium.JulianDate} minTime
 * @property {null|Cesium.JulianDate} maxTime
 *
 * @constructor
 * @param {number} MMSI
 * @param {object} messages
 * @param {staticMessageShip[]} messages.ais_voyages_static
 * @param {dynamicMessageShip[]} messages.ais_voyages_dynamic
 */
function Ship( MMSI, messages ){

  messages = Object.assign( {"ais_voyages_static": [], "ais_voyages_dynamic": []}, messages);

  this.MMSI = MMSI;
  this.ais_voyages_static = messages.ais_voyages_static.map( ProcessMessage );
  this.ais_voyages_dynamic = messages.ais_voyages_dynamic.map( ProcessMessage );
  this.minTime = null;
  this.maxTime = null;
}

/**
 * @param {staticMessage[],dynamicMessage[]} messages a list of AIS messages
 * @param {string} message_type "ais_voyages_static" || "ais_voyages_dynamic"
 */
Ship.prototype.appendMessages = function( messages, message_type ){
  this[message_type] = this[message_type].concat( messages.map( ProcessMessage ) );
  this.invalidate();
};

/*
called to invalidate any stored derived values when messages are added
*/
Ship.prototype.invalidate = function(){
  this.minTime = null;
  this.maxTime = null;
};

/*
called to re-calculate any stored derived values
*/
Ship.prototype.refresh = function(){
  var messages = [].concat(this.ais_voyages_dynamic);
  this.minTime = minTime(messages, "time");
  this.maxTime = maxTime(messages, "time");
};

Ship.prototype.getMinTime = function(){
  if( this.minTime === null ){ this.refresh() }
  return this.minTime;
};

Ship.prototype.getMaxTime = function(){
  if( this.maxTime === null ){ this.refresh() }
  return this.maxTime;
};




/*
Helper function to do any intial processing per message.
At the moment, it just parses the date
*/

/**
 * a static message used in the ship class aquires most of its properties from {staticMessage} (see Store.js}
 * (this will change with if there are changes in the database and/or web services)
 * @typedef {object} staticMessageShip
 *
 * existing properties from staticMessage as at 15-05-2017
 * @property {number} idmessage           eg. 101,
 * @property {number} idsession           eg. 314,
 * @property {string} time_stamp_system   eg. "2016-11-14 14:03:26",
 * @property {string} NMEA_string         eg. "!AIVDM,2,2,1,A,53cwQC@000ch48c<000HU<PE800000000000000p10@335A3f2P00000000000000000000*2",
 * @property {number} processed           eg. 1,
 * @property {number} MMSI                eg. 247456077,
 * @property {number} AIS_version         eg. 0,
 * @property {number} IMO_number          eg. 700,
 * @property {string} call_sign           eg. "ABJ3   ",
 * @property {string} name                eg. "FISHER              ",
 * @property {number} type_of_ship_and_cargo          eg. 56,
 * @property {number} bow_to_position_unit            eg. 8,
 * @property {number} stern_to_position_unit          eg. 16,
 * @property {number} port_to_position_unit           eg. 3,
 * @property {number} starboard_to_position_unit      eg. 3,
 * @property {number} type_of_position_fixing_device  eg. 1,
 * @property {string|null} ETA            eg. null,
 * @property {string} destination         eg. "B                   ",
 * @property {number} last_static_draught eg. 0,
 * @property {number} DTE                 eg. 0
 *
 * new properties
 * @property {Date} jsDate time_stamp_system translated into a javascript date
 * @property {JulianDate} time Cesium JulianDate created from property jsDate
 * @property {number} unixTimeStamp unix time stamp of this report
 */

/**
 * a dynamic message used in the ship class aquires most of its properties from {dynamicMessage} (see Store.js}
 * (this will change with if there are changes in the database and/or web services)
 * @typedef {object} dynamicMessageShip
 *
 * existing properties from dynamicMessage as at 15-05-2017
 * @property {number} idmessage             eg. 131481,
 * @property {number} idsession             eg. 314,
 * @property {string} time_stamp_system     eg. "2016-11-14 14:03:26",
 * @property {string} NMEA_string           eg. "!AIVDO,1,1,,A,104GB2h01B:uJNMhHdkjSB=`0000*0",
 * @property {number} processed             eg. 1,
 * @property {number} MMSI                  eg. 4575755,
 * @property {number} navigation_status     eg. 2,
 * @property {number} ROT                   eg. 0,
 * @property {number} SOG                   eg. 8.2, knots
 * @property {number} position_accuracy     eg. 0,
 * @property {number} longitude             eg. 153.226157,
 * @property {number} latitude              eg. -27.287548,
 * @property {number} COG                   eg. 65,
 * @property {number} true_heading          eg. 70,
 * @property {number} maneuver_indicator    eg. 0,
 * @property {number} RAIM_flag             eg. 0,
 * @property {number} diagnostic_information    eg. 0,
 * @property {number} time_stamp_seconds_only   eg. 52
 *
 * new properties
 * @property {Date} jsDate time_stamp_system translated into a javascript date
 * @property {JulianDate} time Cesium JulianDate created from property jsDate
 * @property {number} unixTimeStamp unix time stamp of this report
 */

/**
 *
 * @param {staticMessage|dynamicMessage} message
 * @returns {staticMessageShip|dynamicMessageShip}
 */
function ProcessMessage( message ){
  var augmentedMessage = Object.assign(message);
    augmentedMessage.jsDate = parseDate(message.time_stamp_system);
    augmentedMessage.time = Cesium.JulianDate.fromDate(augmentedMessage.jsDate, new Cesium.JulianDate());
    augmentedMessage.unixTimeStamp = Cesium.JulianDate.toDate(augmentedMessage.time).getTime()/1000;
  return augmentedMessage;
}
