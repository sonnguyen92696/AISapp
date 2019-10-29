/**
 * @class AISStore
 * @classDesc stores all of the downloaded messages as ships
 * @private {boolean} isClosed returns true if the store is currently closed
 */

/**
 * @constructor
 * @param {AIS_Client} ais_client
 */
function AISStore(ais_client){
  this.ais_client = ais_client;
  this.listeners = [];
  this.ships = [];
  this.shipsByMMSI = {};

  this.minTime = null;
  this.maxTime = null;

  this.limit = 100;

  this.TAG = "AIS_STORE: ";
  this.isClosed = false;
}

/*
invalidates any stored computed values
*/
AISStore.prototype.invalidate = function(){
  this.minTime = null;
  this.maxTime = null;
};
/**
 * recomputes any stored computed values
 * at this stage just the minTime and maxTime based on the list of all current ships
 * @param {boolean} [shouldForce] marked as optional only because it is not used at present
*/
AISStore.prototype.refresh = function(shouldForce){
  this.ships.forEach(function(ship){ ship.refresh(); });
  var ships = this.ships.filter(function(ship){ return ship.minTime !== null && ship.maxTime !== null; });
  this.minTime = minTime(ships, "minTime");
  this.maxTime = maxTime(ships, "maxTime");
};

AISStore.prototype.getMinTime = function(){
  if( this.minTime === null ){ this.refresh() }
  return this.minTime;
};

AISStore.prototype.getMaxTime = function(){
  if( this.maxTime === null ){ this.refresh() }
  return this.maxTime;
};
/**
 * registers the listener to the ais store and notifies the listener of any data that was loaded before it was registered
 * @param listener
 */
AISStore.prototype.register = function ( listener ){
  if  (typeof(listener.storePreRegisterEvent) === "function") listener.storePreRegisterEvent(this);
  this.listeners.push( listener );
  this.listeners.sort( function( a, b) { return (b.priority || 0) - (a.priority || 0);});

    var affectedMMSI = Object.getOwnPropertyNames(this.shipsByMMSI);
    if( affectedMMSI.length > 0 ){
      if( "dataAdded" in listener ) listener.dataAdded(affectedMMSI, this);
    }

    if(this.hasFinishedLoading() && ("dataFinished" in listener) ) listener.dataFinished();
};

/**
 * unregisters the listener for messages and also calls the onClose callback
 * @param listener
 */

AISStore.prototype.unregister = function ( listener ){
    var index = this.listeners.indexOf(listener);
    if( index >= 0 ){
        if( "onClose" in listener ) listener.onClose();
        this.listeners.splice(index, 1 );
    }
};

/**
 * notifies listeners that data was added to ais store
 * @param affectedMMSI the MMSI of the ships that had data added to them
 */
AISStore.prototype.notifyListenersDataWasAdded = function( affectedMMSI ){
    console.log(this.TAG + "data added to ships " + JSON.stringify(affectedMMSI));
    var that = this;
    this.listeners.forEach( function (l){
        if( "dataAdded" in l ) l.dataAdded(affectedMMSI, that);
    });
};

/**
 * notifies all listeners that the ais store has finished downloading data
 */
AISStore.prototype.notifyListenersDataLoadingHasFinished = function( ){
    console.log(this.TAG + "finished loading ships from \""+this.ais_client.baseURL+"\"");
  var that = this
  this.listeners.forEach( function (l){
      if( "dataFinished" in l) l.dataFinished( that );
  });
}

AISStore.prototype.addShip = function( ship ){
  this.shipsByMMSI[ship.MMSI] = ship;
  this.ships.push(ship);
};

AISStore.prototype.getShipByMMSI = function( MMSI ){
  return this.shipsByMMSI[MMSI];
};

/**
 * Call this to close the ais store and cancel any current downloads.
 * This will notify all listeners through "onCloseStore"
 */
AISStore.prototype.close = function(){

    if(this.isClosed){
        console.error("AIS_STORE is closed cannot setFilter");
        return;
    }

    //stop loading any data from the AIS client
    this.isClosed = true;

    console.log(this.TAG + "closing store");
    var that = this;

    this.listeners.forEach( function (l){
        if( "onCloseStore" in l ) l.onCloseStore(that);
    });
};

/**
 *
 * @param id
 * @param {object} filter
 */
AISStore.prototype.setFilter = function(id, filter){

    if(this.isClosed){
        console.error("AIS_STORE is closed cannot setFilter");
        return;
    }

  this.id = id
  this.filter = Object.assign({}, filter)

  this.pagesDownloaded = {
    ais_voyages_dynamic: 0,
    ais_voyages_static: 0,
	
	// the number of resources to download
	expectedResources: 0,
	//incremented when we get all of the messages for ais_voyages_static or ais_voyages_static
	currentResources: 0
  };

    var dynamicFilter = Object.assign(
        {},
        this.filter,
        {"limit": this.limit, "page": 1});
    this.pagesDownloaded.expectedResources += 1;
    this.ais_client.getDynamicVoyages(
        this.id,
        dynamicFilter,
        this.onReceiveMessages.bind( this, "ais_voyages_dynamic", dynamicFilter ),
        this.onError.bind( this, "ais_voyages_dynamic"  ));

    //TODO: we can't load the static messages with the same filter as the dynamic one because that endpoint can't handle lat/long parameters
    var staticFilter = Object.assign(
        {},
        clone(filter, ["session", "mmsi", "till", "since", "page", "limit"]),
        {"limit": this.limit, "page": 1});
    this.pagesDownloaded.expectedResources += 1;
    this.ais_client.getStaticVoyages(
        this.id,
        staticFilter,
        this.onReceiveMessages.bind( this, "ais_voyages_static", staticFilter ),
        this.onError.bind( this, "ais_voyages_static" ));

};
/* from documentation on 15-05-2017 example returned json

 * AIS_voyages_static returned data string
 *
"[
 {
 "idmessage":101,
 "idsession":314,
 "time_stamp_system":"2016-11-14 14:03:26",
 "NMEA_string":"!AIVDM,2,2,1,A,53cwQC@000ch48c<000HU<PE800000000000000p10@335A3f2P00000000000000000000*2",
 "processed":1,
 "MMSI":247456077,"AIS_version":0,
 "IMO_number":700,
 "call_sign":"ABJ3   ",
 "name":"FISHER              ",
 "type_of_ship_and_cargo":56,
 "bow_to_position_unit":8,
 "stern_to_position_unit":16,
 "port_to_position_unit":3,
 "starboard_to_position_unit":3,
 "type_of_position_fixing_device":1,
 "ETA":null,"destination":"B                   ",
 "last_static_draught":0,
 "DTE":0
 },
 ...
 ]"

 AIS_voyages_dynamic
 "[
 {
 "idmessage":131481,
 "idsession":314,
 "time_stamp_system":"2016-11-14 14:03:26",
 "NMEA_string":"!AIVDO,1,1,,A,104GB2h01B:uJNMhHdkjSB=`0000*0",
 "processed":1,
 "MMSI":4575755,
 "navigation_status":2,
 "ROT":0,
 "SOG":8.2,
 "position_accuracy":0,
 "longitude":153.226157,
 "latitude":-27.287548,
 "COG":65,
 "true_heading":70,
 "maneuver_indicator":0,
 "RAIM_flag":0,
 "diagnostic_information":0,
 "time_stamp_seconds_only":52
 },
 ...
 ]"

 */
/**
 * a static message returned by php web services v5 as at 15-05-17
 * (this will change if there are changes in the database and/or web services)
 * @typedef {object} staticMessage
 * @property {number} idmessage eg. 101,
 * @property {number} idsession eg. 314,
 * @property {string} time_stamp_system eg. "2016-11-14 14:03:26",
 * @property {string} NMEA_string eg. "!AIVDM,2,2,1,A,53cwQC@000ch48c<000HU<PE800000000000000p10@335A3f2P00000000000000000000*2",
 * @property {number} processed eg. 1,
 * @property {number} MMSI eg. 247456077,
 * @property {number} AIS_version eg. 0,
 * @property {number} IMO_number eg. 700,
 * @property {string} call_sign eg. "ABJ3   ",
 * @property {string} name eg. "FISHER              ",
 * @property {number} type_of_ship_and_cargo eg. 56,
 * @property {number} bow_to_position_unit eg. 8,
 * @property {number} stern_to_position_unit eg. 16,
 * @property {number} port_to_position_unit eg. 3,
 * @property {number} starboard_to_position_unit eg. 3,
 * @property {number} type_of_position_fixing_device eg. 1,
 * @property {string|null} ETA eg. null,
 * @property {string} destination eg. "B                   ",
 * @property {number} last_static_draught eg. 0,
 * @property {number} DTE eg. 0
 */

/**
 * a dynamic message returned by php web services v5 as at 15-05-17
 * (this will change if there are changes in the database and/or web services)
 * @typedef {object} dynamicMessage
 * @property {number} idmessage eg. 131481,
 * @property {number} idsession eg. 314,
 * @property {string} time_stamp_system eg. "2016-11-14 14:03:26",
 * @property {string} NMEA_string eg. "!AIVDO,1,1,,A,104GB2h01B:uJNMhHdkjSB=`0000*0",
 * @property {number} processed eg. 1,
 * @property {number} MMSI eg. 4575755,
 * @property {number} navigation_status eg. 2,
 * @property {number} ROT eg. 0,
 * @property {number} SOG eg. 8.2,
 * @property {number} position_accuracy eg. 0,
 * @property {number} longitude eg. 153.226157,
 * @property {number} latitude eg. -27.287548,
 * @property {number} COG eg. 65,
 * @property {number} true_heading eg. 70,
 * @property {number} maneuver_indicator eg. 0,
 * @property {number} RAIM_flag eg. 0,
 * @property {number} diagnostic_information eg. 0,
 * @property {number} time_stamp_seconds_only eg. 52
 */

/**
 *
 * @param {string} message_type "ais_voyages_static" or "ais_voyages_dynamic"
 * @param {staticMessage[]|dynamicMessage[]} data
 * @param status
 * @param xhr
 */
AISStore.prototype.onReceiveMessages = function(message_type, filter, data, status, xhr){

    if( this.isClosed ) return;

    this.invalidate();

    console.log(this.TAG + "received \""
        + message_type + "\" pg. " + this.pagesDownloaded[message_type]
        + " with filter " + JSON.stringify(filter));


  if( !data || data.length == 0 ){
	//no data was returned by the server, so we have finished downloading one resource
      console.log("ending");
      console.log(data);
	this.pagesDownloaded.currentResources += 1
      //check if we have finished downloading all of the resources
	if( this.hasFinishedLoading() ) this.notifyListenersDataLoadingHasFinished();

	return;
  }
  /*
   * messagesByMMSI will be an associative array of the form
   * {object.{string MMSI,staticMessage[]|dynamicMessage[]}
   *
   * note because this data is placed into the data base in decending date time order the entries will remain in this order
   * but you should not relie on this always being the case or it may break later
   */
  var messagesByMMSI = groupBy( data, "MMSI" );

  for( var key in messagesByMMSI ){
    if( !this.shipsByMMSI.hasOwnProperty(key) ){
      var parameters = {}
      parameters[message_type] = messagesByMMSI[key]
      this.addShip(new Ship(key, parameters))
    } else {
      this.shipsByMMSI[key].appendMessages( messagesByMMSI[key], message_type )
    }
  }
  //let the listeners know what changed
  this.notifyListenersDataWasAdded(Object.keys(messagesByMMSI))

    //check to see if we have to download more pages
    var newFilter = Object.assign(
        {},
        filter,
        {"limit": this.limit, "page": 1 + ++this.pagesDownloaded[message_type]});

  this.ais_client.getResources({
		resource: message_type,
		id: this.id,
		filter: newFilter,
		onSuccess: this.onReceiveMessages.bind( this, message_type, newFilter ),
		onFail: this.onError.bind( this, message_type )});
};

/**
 * @return {boolean} true if the store has finished loading
 */
AISStore.prototype.hasFinishedLoading = function(){
    return this.pagesDownloaded.currentResources >= this.pagesDownloaded.expectedResources;
}

AISStore.prototype.onError = function(message_type, error){
    console.log(this.TAG + "an error occured on the server for " + message_type);
    console.log(error);
};

/**
 * @param {object} event
 * @param {string} event.name
 */
AISStore.prototype.postEvent = function(event){
    this.listeners.forEach(function(l){
        if("handleEvent" in l ) l.handleEvent(event);
    });
};