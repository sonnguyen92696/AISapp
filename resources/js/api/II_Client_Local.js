/**
 * This is a local implementation of an interesting incident API. It compares every ship's position updates with every
 * other ship's position updates. It includes a pair of messages as interesting incidents if they are within maxSeconds
 * and maxDistance of each other.
 * @param store the ais store to search within
 * @param parameters.maxSeconds max number of seconds two messages can be separate of each other and still be interesting
 * @constructor
 */
function II_Client_Local (store, parameters) {
  this.store = store;
  this.parameters = Object.assign({}, parameters);
}

/**
 * see AIS_client.getResources
 */
II_Client_Local.prototype.getResources = function(parameters) {
    parameters.onSuccess(this.findInterestingIncidentMessages(parameters));
};

/**
 *
 * @param parameters.filter.distance  max distance (meters) two messages can be from each other and still be interesting
 * @returns {Array} an array of interesting incidents
 */
II_Client_Local.prototype.findInterestingIncidentMessages = function(parameters){
	var interesting_incidents = [];
	
	var noShips = this.store.ships.length;
	
	for( var i = 0; i < noShips; ++i ){
		var shipA = this.store.ships[i];
		for( var j = i + 1; j < noShips; ++j ){
			var shipB = this.store.ships[j];
			this.findCloseMessages( 
				shipA.ais_voyages_dynamic,
				shipB.ais_voyages_dynamic,
				this.parameters.maxSeconds,
				parameters.filter.distance,
				interesting_incidents );				
		}	
	}
	
	return interesting_incidents;
};

/**
 *
 * @param messagesA array of position updates
 * @param messagesB array of position updates
 * @param maxSeconds max number of seconds two messages can be separate of each other and still be interesting
 * @param maxDistance max distance (meters) two messages can be from each other and still be interesting
 * @param interesting_incidents the output array of interesting incidents
 * @returns {Array} messages that are within maxDistance and maxDistance of another message
 */
II_Client_Local.prototype.findCloseMessages = function( messagesA, messagesB, maxSeconds, maxDistance, interesting_incidents ){	

	for( var i = 0; i < messagesA.length; ++i ){
		var mA = messagesA[i];
		for( var j = 0; j < messagesB.length; ++j ){
			var mB = messagesB[j];
			var seconds = Math.abs(Cesium.JulianDate.secondsDifference(mA.time, mB.time));
			 
			if( seconds < maxSeconds 
				&& DistanceBetweenTwoLatLongs(mA.latitude, mA.longitude, mB.latitude, mB.longitude) < maxDistance ){
				interesting_incidents.push( mA );
				interesting_incidents.push( mB );			
			}
		}	
	}
};


