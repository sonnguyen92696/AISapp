/**
 * @class IInterval_Client_Local
 * @constructor
 * @description
 * This is a local implementation of an interesting interval finder. It compares every ship's position updates with every
 * other ship's position updates. It outputs a time interval along with a collection of MMSI that were
 * directly (or directly) within maxDistance of each other.
 * @property store a reference to the ais store
 * @property {Object} parameters
 * @param store the ais store to search within
 * @param parameters.maxSeconds max number of seconds two messages can be separate of each other and still be interesting
 */
function IInterval_Client_Local (store, parameters) {
  this.store = store;
  this.parameters = Object.assign({}, parameters);
}

/**
 * see AIS_client.getResources
 */
IInterval_Client_Local.prototype.getResources = function(parameters) {

  var data = this.findInterestingIntervals(parameters);

  data.forEach( function(el){
    el.duration = getSecondsDifference(el.startTime, el.endTime);
  });

  data = data.filter(function(a){ return a.duration > 0; });
  data.sort(function(a,b){ return -(a.duration - b.duration); });

  parameters.onSuccess(data);
};

/**
 *
 * @param parameters.filter.distance  max distance (meters) two messages can be from each other and still be interesting
 * @returns {Array} an array of interesting intervals
 */
IInterval_Client_Local.prototype.findInterestingIntervals = function(parameters){
	var interesting_intervals = [];

	var noShips = this.store.ships.length;
    var maxSeconds = parameters.filter.maxSeconds || this.parameters.maxSeconds;

	for( var i = 0; i < noShips; ++i ){
		var shipA = this.store.ships[i];
		for( var j = i + 1; j < noShips; ++j ){
			var shipB = this.store.ships[j];
			this.findInterestingIntervalsForTwoShips(
				shipA.ais_voyages_dynamic,
				shipB.ais_voyages_dynamic,
				maxSeconds,
				parameters.filter.distance,
				interesting_intervals );
		}
	}

    //sort the interesting_intervals by start time ascending
    interesting_intervals.sort(function(a,b){return -getSecondsDifference(a.startTime, b.startTime) });
    InterestingInterval.combineIntervals( interesting_intervals, maxSeconds );

	return interesting_intervals;
};

/**
 * Finds intervals of time that pairs of MMSI were within maxDistance of each other
 * @param messagesA array of position updates
 * @param messagesB array of position updates
 * @param maxSeconds max number of seconds two messages can be separate of each other and still be interesting
 * @param maxDistance max distance (meters) two messages can be from each other and still be interesting
 * @param interesting_intervals the output array of interesting intervals
 */
IInterval_Client_Local.prototype.findInterestingIntervalsForTwoShips = function( messagesA, messagesB, maxSeconds, maxDistance, interesting_intervals ){

    var maxLatitudeDifference = maxDistance / 100000;//approximately 100,000 meters per degree of latitude

    for( var i = 0; i < messagesA.length; ++i ){
        var mA = messagesA[i];
        for( var j = 0; j < messagesB.length; ++j ){
            var mB = messagesB[j];
            var seconds = Math.abs(Cesium.JulianDate.secondsDifference(mA.time, mB.time))

            if( seconds >= maxSeconds
                || Math.abs(mB.latitude - mA.latitude) > maxLatitudeDifference ) continue;

            if( round40kmEarthApproxDistanceBetween2LatLongs(mA.latitude, mA.longitude, mB.latitude, mB.longitude) < maxDistance ){
                interesting_intervals.push(new InterestingInterval(mA, mB));
            }
        }
    }
};
/**
 * @class InterestingInterval
 * Defines an interesting interval between multiple ships for a time range
 * @param messageA
 * @param messageB
 * @constructor
 * @field {String[]} MMSI
 * @field {Cesium.JulianDate} startTime
 * @field {Cesium.JulianDate} endTime
 * @field {number} latMin
 * @field {number} latMax
 * @field {number} longMin
 * @field {number} longMax
 */
function InterestingInterval( messageA, messageB ){

	this.MMSI = {};
    this.MMSI[messageA.MMSI] = 1;
    this.MMSI[messageB.MMSI] = 1;

	this.startTime = earlierTime(messageA.time, messageB.time);
	this.endTime = (this.startTime == messageA.time)
		? messageA.time
		: messageB.time;

    this.latMin = Math.min(messageA.latitude, messageB.latitude);
    this.latMax = Math.max(messageA.latitude, messageB.latitude);
    this.longMin = Math.min(messageA.longitude, messageB.longitude);
    this.longMax = Math.max(messageA.longitude, messageB.longitude);
}

InterestingInterval.prototype.tryCombineInterval = function( interestingInterval, epsilon ){

	//check if the intervals share at least one ship in common
	var containsSameMMSI = false;

	for( var key in this.MMSI ){
		if( interestingInterval.MMSI.hasOwnProperty(key) ){
			containsSameMMSI = true;
			break;
		}
	}

	if(!containsSameMMSI) { return false; }

	//check if time intervals overlap
	if( !intervalsOverlap(
			this.startTime,
			this.endTime,
			interestingInterval.startTime,
			interestingInterval.endTime,
			epsilon ) ) {
		return false;
	}

	//copy across all of the MMSI
	Object.assign(this.MMSI, interestingInterval.MMSI);

	this.startTime = earlierTime( this.startTime, interestingInterval.startTime);
	this.endTime = laterTime( this.endTime, interestingInterval.endTime);

  this.latMin = Math.min(this.latMin, interestingInterval.latMin);
  this.latMax = Math.max(this.latMax, interestingInterval.latMax);
  this.longMin = Math.min(this.longMin, interestingInterval.longMin);
  this.longMax = Math.max(this.longMax, interestingInterval.longMax);

	return true;
};

InterestingInterval.prototype.tryCombineMessage = function( message, epsilon ){

	if(!this.MMSI.hasOwnProperty(message.MMSI)){ return false; }

	//check if time intervals overlap
	if( !intervalContains(
			this.startTime,
			this.endTime,
			message.time,
			epsilon ) ) {
		return false;
	}

	//copy across all of the MMSI
	Object.assign(this.MMSI, interestingInterval.MMSI);

	this.startTime = earlierTime( this.startTime, message.time);
	this.endTime = laterTime( this.endTime, message.time);

	return true;
};

/**
 * @param [InterestingInterval] interestingIntervals array of intervals sorted by start time in ascending order
 */
InterestingInterval.combineIntervals = function( interestingIntervals, epsilon ){

    for( var i = 0; i < interestingIntervals.length - 1; ++i ){
        var ii = interestingIntervals[i];
        var j = i + 1;

        // while time range of the current interesting interval overlaps
        // the next interesting intervals time range we want to
        // we want to try and combine interesting intervals
        // ii.endTime + epsilon < interestingIntervals[j].startTime
        while( j < interestingIntervals.length
            && getSecondsDifference( ii.endTime, interestingIntervals[j].startTime )  < epsilon ){
            if( ii.tryCombineInterval(interestingIntervals[j], epsilon) ){
				interestingIntervals.splice(j, 1);
			} else {
                ++j;
            }
        }
    }
};
