
//requires CoordinateConversion.js

/** UTMEuclideanDistance
 * convert latlongs to UTM coordinates based on the first of the two longitudes to maintain
 * consistency with the rest of the functions in this set
 * then calculate the euclidean distance between these UTM points by
 *
 *
 * Note: no validation of latituce and longitude is performed
 * and results will be very inacurate close to the poles and over large distances
 *
 * @param {number} lat1 decimal degrees
 * @param {number} long1 decimal degrees
 * @param {number} lat2 decimal degrees
 * @param {number} long2 decimal degrees
 *
 * @return {number} distance in meters
 */

function UTMEuclideanDistance (lat1, long1, lat2, long2) {
    //console.log("(lat1, long1, lat2, long2)" + "(" + lat1 + ", " + long1 + ", " + lat2 + ", " + long2 + ")");
    var utm1 = {};
    var utm2 = {};
    var zone = UTMZone(long1);
    //console.log("zone = " + zone);
    LatLonToUTM(lat1, long1, zone, utm1);
    LatLonToUTM(lat2, long2, zone, utm2);
    //console.log("utm1 = " + utm1.easting + "," + utm1.northing);
    //console.log("utm2 = " + utm2.easting + "," + utm2.northing);

    var eucideanDistance = Math.sqrt(
        (utm1.easting - utm2.easting) * (utm1.easting - utm2.easting)
        + (utm1.northing - utm2.northing) * (utm1.northing - utm2.northing)
    );

    return eucideanDistance;
}



/** DistanceBetweenTwoLatLongs
 *
 * this function isolates the interface from changes in the preferred method of calculating distance between two lat longs.
 * at present, it will return a fairly accurate distance over short distances ( ie, < 100 km),
 * but over larger distances it is only accurate to +- 0.3% to 3%
 *
 * Note: not tested around extreme latitudes
 *
 * the logic actually uses two different methods of calculating distance as follows
 * if the longitudes place the two location in adjacent UTM zones
 *    use UTM euclidean distance based on the zone of the first of the two longs
 *         using the first longitude only is to maintain consistency wit the rest of the library
 * else
 *    use the round40kmEarthApproxDistanceBetween2LatLongs
 *    this is less accurate but works with the same accuracy over any latitude and longitud
 *    if that dist is < 1332km and the change in angle would not put you over the top or under the bottom of the utm band
 *          use UTM euclidean distance based on the zone of the first point of the two longs
 *                   using the first longitude only is to maintain consistency wit the rest of the library
 *          1332km was selected as this is approximatly the distace of 12 degrees arround the earch equator
 *          this is used because as you approach the poles the UTM calculaaion is still fearly accurate across
 *          many utm zones because the distance between longitudes srinks
 * end if
 *
 * @param {number} lat1 decimal degrees
 * @param {number} long1 decimal degrees
 * @param {number} lat2 decimal degrees
 * @param {number} long2 decimal degrees
 *
 * @return {number} distance in meters
 */

function DistanceBetweenTwoLatLongs(lat1, long1, lat2, long2)
{
    if (((long1 - long2 + 360)%360 < 12) && ((long1 - long2) > -12))
    {
        return UTMEuclideanDistance (lat1, long1, lat2, long2);
    }
    else
    {
        var distanceAprox = round40kmEarthApproxDistanceBetween2LatLongs(lat1, long1, lat2, long2)
        if (distanceAprox < 1332000 && (long1 - long2 + 360)%360 < 90) // distance < 1332km, or distace of 12 degrees arround the earch equator, and the change in angle would not put you over the top or under the bottom of the utm band
        {
            //console.log("UTMEuclideanDistance = " + UTMEuclideanDistance (lat1, long1, lat2, long2));
            return UTMEuclideanDistance (lat1, long1, lat2, long2);
        }
        return distanceAprox;
    }
}


/** BearingByUTMNorthingUp
 *
 * calculates a bearing from Northing basing on the easting and northing of the two lat long coordinates
 *
 * @param {number} lat1 decimal degrees
 * @param {number} long1 decimal degrees
 * @param {number} lat2 decimal degrees
 * @param {number} long2 decimal degrees
 *
 * @return {number} decimal degrees - angle from Northing where Northing is 0, clockwise is positive
 */
function BearingByUTMNorthingUp(lat1, long1, lat2, long2, zone)
{
    //console.log("(lat1, long1, lat2, long2, zone)" + "(" + lat1 + ", " + long1 + ", " + lat2 + ", " + long2 + ", " + zone + ")");
    if (zone == null || zone < 1 || zone > 60)
    {
        zone = UTMZone(long1)
    }
    //console.log("zone = " + zone);
    var utm1 = {};
    var utm2 = {};
    LatLonToUTM(lat1, long1, zone, utm1);
    LatLonToUTM(lat2, long2, zone, utm2);
    //console.log("utm1 = " + utm1.easting + "," + utm1.northing);
    //console.log("utm2 = " + utm2.easting + "," + utm2.northing);

    var dx = utm2.easting - utm1.easting;
    var dy = utm2.northing - utm1.northing;
    //console.log("dx = " + dx);
    //console.log("dy = " + dy);
    return  (450 - (RadToDeg(Math.atan2(dy, dx))))%360;
}

/** BearingFromLatLongToLatLong
 * this is just a rapper function to insulate the interface from changes in the prefered
 * method of claculating bearings
 *
 * currnet using BearingFromLatLongToLatLongByUTM
 *
 * @param {number} lat1 (decimal degrees)
 * @param {number} long1 (decimal degrees)
 * @param {number} lat2 (decimal degrees)
 * @param {number} long2 (decimal degrees)
 *
 * @return {number} decimal degrees - Initial bearing - North is 0, clockwise is positive
 */

function BearingFromLatLongToLatLong(lat1, long1, lat2, long2, zone)
{
    return BearingFromLatLongToLatLongByUTM(lat1, long1, lat2, long2, zone);
}

/** BearingFromLatLongToLatLongByUTM
 *
 * calculates the bearing by converting to UTM an calculating the angle based on the easting and northing vector
 * then compensates for the difference between direction of noth and northing
 *
 * Note: this bearing is only accurate over short distances (ie < 100km)
 *
 * compensating for difference between north and the northing axis at the specific lat long is necessary because
 * they will not be the same accept when the lat long lies on the equator or the central longitude of the zone
 *
 * |<-----6 degree UTM band----->|
 * | ----------N-Pole------------|
 * |       ,-' ,' | '. '-.       |
 * |    ,-'   /   |   \   '-.    |     anywhere but the equator positive northing is != north
 * |   /     /    |    \     \   |                  /\                |\
 * |  /     /     |     \ x...\..|.... Northing is  ||  but North is   \\
 * | /     |      |      |     \ |
 * ||      |      |      |      ||     UTM heading north ~ 315 deg
 * |0     1.5     3     4.5     6|
 * ||      |      |      |      ||
 * | \     |      |      |     / |
 * |  \     \     |     /     /  |
 * |   \     \    |    /     /   |
 * |    '-.   \   |   /   ,-'    |
 * |       '-. '. | ,' ,-'       |
 * |------------S-Pole-----------|
 *
 * @param {number} lat1 decimal degrees
 * @param {number} long1 decimal degrees
 * @param {number} lat2 decimal degrees
 * @param {number} long2 decimal degrees
 * @param {number} [zone] UTM zone
 *
 * @return {number} decimal degrees - Initial bearing - North is 0, clockwise is positive
 */
function BearingFromLatLongToLatLongByUTM(lat1, long1, lat2, long2, zone) {
    //console.log("(lat1, long1, lat2, long2)" + "(" + lat1 + ", " + long1 + ", " + lat2 + ", " + long2 + ")");

    if (zone == null || zone < 1 || zone > 60)
    {
        zone = UTMZone(long1)
    }
    // first calc angle based on easting northing cartesial plain
    var bearingNorthingUp = BearingByUTMNorthingUp(lat1, long1, lat2, long2, zone);
    //console.log("bearingNorthingUp = " + bearingNorthingUp);
    // then calculate the difference betaeen Northing up
    //       and North up
    // lat + 0.0001 is aproximatly 11 meters to the north
    var deltaNorthingToNorth = BearingByUTMNorthingUp(lat1, long1, lat1 + 0.0001, long1, zone);
    //console.log("deltaNorthingToNorth = " + deltaNorthingToNorth);

    //console.log("bearingRad = " + bearingRad);
    //console.log("bearing = " + ((450 - RadToDeg(bearingRad))%360));
    return (360 + bearingNorthingUp - deltaNorthingToNorth)%360;
}

/** BearingBetween
 *
 * sorced from http://cdn.rawgit.com/chrisveness/geodesy/v1.1.1/latlon-spherical.js
 * Note: when folowing the shortest path from one lat long to another the nearing will change
 * this becomes substantial the bigger the differnce beteen bothe lat and long
 *  (ie if one stays reletivly the same then the error change is less signifigant)
 *  or when traversing the poles
 *
 * @param {number} lat1 decimal degrees
 * @param {number} long1 decimal degrees
 * @param {number} lat2 decimal degrees
 * @param {number} long2 decimal degrees
 *
 * @return {number} decimal degrees - Initial bearing - North is 0, clockwise is positive
 */
function BearingFromLatLongToLatLongByAngle(lat1, long1, lat2, long2)
{
    var p1 = DegToRad(lat1)
    var p2 = DegToRad(lat2);
    var df = DegToRad(long2-long1);

    // see http://mathforum.org/library/drmath/view/55417.html
    var y = Math.sin(df) * Math.cos(p2);
    var x = Math.cos(p1)*Math.sin(p2) -
        Math.sin(p1)*Math.cos(p2)*Math.cos(df);
    var bearingRad = Math.atan2(y, x);

    return (RadToDeg(bearingRad)+360) % 360;
}

/**
 * calcUTMheadingNorthingUp calculates the bearing between northing and north at the given lat long
 * lat + 0.0001 is approximatly 11 meters to the north
 * then returns the (heading + difference between northing and north) to be used when performing calculations in UTM coodinates
 *
 * @param {number} lat decimal degrees
 * @param {number} long decimal degrees
 * @param {number} heading decimal degrees, clockwise angle
 *
 * Returns:
 *   decimal degrees - bearing from northing to north
 */
function calcUTMheadingNorthingUp(lat, long, heading)
{
    var deltaNorthingToNorth = BearingByUTMNorthingUp(lat, long, lat + 0.0001, long);
    return (heading + deltaNorthingToNorth)%360;
}

/** DeltaPositionFromLastKnownLatLongBearingSpeedKMpH
 *
 * this function calculates the estimate of a ships position at the current time based on a
 * known lat, long, speed, and heading at some other time
 *
 * this is intended for forward time projections but there is no reason that it can't be used for backward projections
 *
 * Note: this function is very inacurate over larg distances
 *       and breaks down compleatly if you cross over the top of the utm band at either of the poles
 *       as a result of its dependance on DeltaPositionFromLastKnownLatLongUTMBearingSpeedKMpH
 *
 * the function converts the heading from world space (ie, North = 0 degrees) to the
 * local Easting Northing space (ie, Northing = 0 degrees) then calls
 * DeltaPositionFromLastKnownLatLongUTMBearingSpeedKMpH to calculate the new lat long using simple
 * current pos = known pos + velocity vector * delta time
 *
 * compensating for difference between north and the northing axis at the specific lat long is necessary because
 * they will not be the same accept when the lat long lies on the equator or the central longitude of the zone
 *
 * |<-----6 degree UTM band----->|
 * | ----------N-Pole------------|
 * |       ,-' ,' | '. '-.       |
 * |    ,-'   /   |   \   '-.    |     anywhere but the equator positive northing is != north
 * |   /     /    |    \     \   |                  /\                |\
 * |  /     /     |     \ x...\..|.... Northing is  ||  but North is   \\
 * | /     |      |      |     \ |
 * ||      |      |      |      ||     UTM heading north ~ 315 deg
 * |0     1.5     3     4.5     6|
 * ||      |      |      |      ||
 * | \     |      |      |     / |
 * |  \     \     |     /     /  |
 * |   \     \    |    /     /   |
 * |    '-.   \   |   /   ,-'    |
 * |       '-. '. | ,' ,-'       |
 * |------------S-Pole-----------|
 *
 * @param {number} lat (decimal degrees)
 * @param {number} long (decimal degrees)
 * @param {number} heading - North is 0, clockwise is positive  assumed to be between 0 and 360 (decimal degrees)
 * @param {number} speed (Km per hour)
 * @param {number} timeReport - the time when the previous information was current (in seconds)
 * @param {number} timeCurrent - the current time at which to estimate the ships current position (in seconds)
 *
 * @param {object} newLatLong used as an output variable
 * @param {number} newLatLong.latitude - the ships prejected latitude at timeCurrent (decimal degrees)
 * @param {number} newLatLong.longitude - the ships prejected lingitude at timeCurrent (decimal degrees)
 */
function DeltaPositionFromLastKnownLatLongBearingSpeedKMpH(lat, long, heading, speed, timeReport, timeCurrent, newLatLong) {
    /*
     */
    var UTMheadingNorthingUp = calcUTMheadingNorthingUp(lat, long, heading);
    DeltaPositionFromLastKnownLatLongUTMBearingSpeedKMpH(lat, long, UTMheadingNorthingUp, speed, timeReport, timeCurrent, newLatLong);
}

/** DeltaPositionFromLastKnownLatLongUTMBearingSpeedKMpH
 *
 * converts the lat long to utm coordinates
 * calculates a (easting,northing) velocity vector based on UTMheadingNorthingUp and speed
 * claculates the new pos  using known UTM pos + UTM velocity vector * delta time
 * calls UTMToLatLon using the new UTM possition to calculate the new Lat Long and assign it to newLatLong
 *
 * Note: this function is very inacurate over larg distances
 *       and breaks down compleatly if you cross over the top of the utm band at either of the poles
 *
 * @param {number} lat (decimal degrees)
 * @param {number} long (decimal degrees)
 * @param {number} UTMheadingNorthingUp - Northing is 0 (this is not an actual bearing), clockwise is positive  assumed to be between 0 and 360 (decimal degrees)
 * @param {number} speed (Km per hour)
 * @param {number} timeReport - the time when the previous information was current (in seconds)
 * @param {number} timeCurrent - the current time at which to estimate the ships current position (in seconds)
 *
 * @param {object} newLatLong used as an output variable
 * @param {number} newLatLong.latitude - the ships prejected latitude at timeCurrent (decimal degrees)
 * @param {number} newLatLong.longitude - the ships prejected lingitude at timeCurrent (decimal degrees)
 */

function DeltaPositionFromLastKnownLatLongUTMBearingSpeedKMpH(lat, long, UTMheadingNorthingUp, speed, timeReport, timeCurrent, newLatLong)
{
    //convert to UTM
    var utm = {};
    var zone = LatLonToUTM (lat, long, -1, utm);

    //claculate change in position over the given time interval
    var counterClockwiseDegFromEastToWestAxis = (450-UTMheadingNorthingUp)%360;
    var UTMheadingRads = DegToRad(counterClockwiseDegFromEastToWestAxis);
    var speedMpS = speed/3.6;
    var dTime = timeCurrent - timeReport;
    var dEasting = speedMpS*Math.cos(UTMheadingRads) * dTime//horizontal axis
    var dNorthing = speedMpS*Math.sin(UTMheadingRads) * dTime//vertical axis

    // calculate new Lat Long using existing UTM possition + change in position over delta time
    UTMToLatLon (utm.easting + dEasting, utm.northing + dNorthing, zone, newLatLong);
}

/**
 * @typedef {Object} UTMvector
 * @property {number} eastingPerSecond meters per second in the eastsing direction
 * @property {number} northingPerSecond meters per second in the easting direction
 */

/**
 * LatLongBearingKmphToUTMNothirthingEastingPerSecond, the name is faily self explanitory
 * Note: this is only accurate at the ships current position ans should not be applied over long distances
 *
 * @param {number} lat (decimal degrees)
 * @param {number} long (decimal degrees)
 * @param {number} bearing - North is 0, clockwise is positive  assumed to be between 0 and 360 (decimal degrees)
 * @param {number} kmph (Km per hour)
 *
 * @returns {UTMvector}
 */

function LatLongBearingKmphToUTMNothirthingEastingPerSecond(lat, long, bearing, kmph)
{
    var UTMheadingNorthingUp = calcUTMheadingNorthingUp(lat, long, bearing);
    var counterClockwiseDegFromEastToWestAxisRad = DegToRad ((450-UTMheadingNorthingUp)%360);
    var mps = kmph/3.6;
    return {
        eastingPerSecond:Math.cos(counterClockwiseDegFromEastToWestAxisRad)*mps,
        northingPerSecond:Math.sin(counterClockwiseDegFromEastToWestAxisRad)*mps
    }
}
/**
 * @typedef {object} UTMPositionReport
 * @property {number} x meters easting
 * @property {number} y meters northing
 * @property {number} zone UTM zone used to calculate x and y
 * @property {number} dx meters per second change in easting
 * @property {number} dy meters per second change in northing
 * @property {number} UTMHeading clockwise angle of velocity relative to positive northing axis
 * @property {number} unixTimeStamp unix time stamp in seconds when the position was current
 */

/**
 * LatLongBearingKmphToUTMPositionReport converts a ship position from attributes contained in AIS messages to
 * a UTM
 * @param {number} lat (decimal degrees)
 * @param {number} long (decimal degrees)
 * @param {number} bearing - North is 0, clockwise is positive  assumed to be between 0 and 360 (decimal degrees)
 * @param {number} unixTimeStamp unix time in seconds when this info was current
 * @param {number} kmph (Km per hour)
 * @param {number} [UTMZone] optional utm zone, if not provided
 * @returns {UTMPositionReport}
 */
function LatLongBearingKmphToUTMPositionReport(lat, long, bearing, kmph, unixTimeStamp, UTMZone)
{
    var utmPos = {};
    if (UTMZone === null || typeof(UTMZone) === 'undefined' || UTMZone < 1 || UTMZone > 60) {
        LatLonToUTM(lat, long, -1, utmPos);
    }
    else
    {
        LatLonToUTM(lat, long, UTMZone, utmPos);
    }

    var UTMPosRep = {};
    UTMPosRep.x = utmPos.easting;
    UTMPosRep.y = utmPos.northing;
    UTMPosRep.zone = utmPos.zone;
    UTMPosRep.UTMHeading = calcUTMheadingNorthingUp(lat, long, bearing);
    UTMPosRep.unixTimeStamp = unixTimeStamp;

    var angRadAnticlockwiseFromXAxis = ((450-UTMPosRep.UTMHeading)%360)/180*Math.PI;
    var mps = kmph/3.6; //km per hour to meters per second

    UTMPosRep.dx = Math.cos(angRadAnticlockwiseFromXAxis)*mps;
    UTMPosRep.dy = Math.sin(angRadAnticlockwiseFromXAxis)*mps;
    //console.log("lat, long, bearing, kmph, unixTimeStamp, UTMZone");
    //console.log(lat + ", " + long + ", " + bearing + ", " + kmph + ", " + unixTimeStamp + ", " + UTMZone);
    //console.log("UTMPosRep");
    //console.log(UTMPosRep);
    return UTMPosRep;
}

/**
 * @typedef {object} latLongShipPositionReport
 * @property {number} longitude             eg. 153.226157,
 * @property {number} latitude              eg. -27.287548,
 * @property {number} COG                   eg. 65,
 * @property {number} SOG                   eg. 8.2, speed over ground in knots (approx 1.852 km per hour)
 * @property {number} unixTimeStamp unix time stamp of this report
 */

/**
 * @param {object.<MMSI, latLongShipPositionReport>} mostRecentShipPositionReports
 * @param {string} focusMMSI
 * @param {number} range in meters
 * @returns {object.<MMSI, UTMPositionReport>}
 */

function calculateUTMPositionReportAtAPointInTimeForVeselsWthinRange(mostRecentShipPositionReports, focusMMSI, range)
{
    var currentTime = mostRecentShipPositionReports[focusMMSI].unixTimeStamp;
    var centralLat = mostRecentShipPositionReports[focusMMSI].latitude;
    var centralLong = mostRecentShipPositionReports[focusMMSI].longitude;
    var centralSOGmps = mostRecentShipPositionReports[focusMMSI].SOG*1.852*3.6;
    //console.log("range = " + range);
    // Create return array
    var returnArray = {};

    // Calc focus ships UTMPositionReport
    // and add to the return array
    // also save the zone
    returnArray[focusMMSI] = LatLongBearingKmphToUTMPositionReport(
        mostRecentShipPositionReports[focusMMSI].latitude,
        mostRecentShipPositionReports[focusMMSI].longitude,
        mostRecentShipPositionReports[focusMMSI].COG,
        mostRecentShipPositionReports[focusMMSI].unixTimeStamp,
        centralSOGmps/3.6
    );

    var zone = returnArray[focusMMSI].zone;
    var currentX = returnArray[focusMMSI].x;
    var currentY = returnArray[focusMMSI].y;

    var maxDist = 0;
    var currentUTMPosRep = {}
    var dt = 0;
    var dx = 0;
    var dy = 0;


    for (var currentMMSI in mostRecentShipPositionReports)
    {
        if (mostRecentShipPositionReports.hasOwnProperty(currentMMSI) && currentMMSI !== focusMMSI)
        {
            dt = mostRecentShipPositionReports[currentMMSI].unixTimeStamp - currentTime;
            if (dt > 0)
            {
                maxDist = range + (centralSOGmps * dt) + (mostRecentShipPositionReports[currentMMSI].SOG*1.852*3.6 * dt);
            }
            else
            {
                maxDist = range + (centralSOGmps * (-dt)) + (mostRecentShipPositionReports[currentMMSI].SOG*1.852*3.6 * (-dt));
            }
            //console.log("maxDist = " + maxDist);
            //  multiplying by 1.02 to over compensate for margin of error in round40kmEarthApproxDistanceBetween2LatLongs
            var round40kmEarthApproxDist = round40kmEarthApproxDistanceBetween2LatLongs(
                    centralLat,
                    centralLong,
                    mostRecentShipPositionReports[currentMMSI].latitude,
                    mostRecentShipPositionReports[currentMMSI].longitude
                ) * 1.02;
            //console.log("round40kmEarthApproxDist = " + round40kmEarthApproxDist);
            if (round40kmEarthApproxDist < maxDist)
            {
                // by now we have confirmed that the ship is not the focus ship and that there is a good chance that
                // it is in range at the time of the focus vessels message so it is worth going to all the trouble of
                // converting to UTM and getting a more accurate distance

                // calc UTMPositionReport of the current ship
                currentUTMPosRep = LatLongBearingKmphToUTMPositionReport(
                    mostRecentShipPositionReports[currentMMSI].latitude,
                    mostRecentShipPositionReports[currentMMSI].longitude,
                    mostRecentShipPositionReports[currentMMSI].COG,
                    mostRecentShipPositionReports[currentMMSI].SOG*1.852,
                    zone
                );
                // apply change in position based on delta time between this message and the focus ships message
                dt = mostRecentShipPositionReports[currentMMSI].unixTimeStamp - currentTime;
                currentUTMPosRep.x = currentUTMPosRep.x + (dt * currentUTMPosRep.dx);
                currentUTMPosRep.y = currentUTMPosRep.y + (dt * currentUTMPosRep.dy);
                currentUTMPosRep.unixTimeStamp = currentTime;

                //check if the ship is actually in range
                dx = currentUTMPosRep.x - currentX;
                dy = currentUTMPosRep.y - currentY;

                //console.log("(dx * dx + dy * dy) = " + (dx * dx + dy * dy));
                //console.log("(range * range) = " + (range * range));
                if ( (dx * dx + dy * dy) < (range * range))
                {
                    returnArray[currentMMSI] = Object.assign(currentUTMPosRep);
                }
            }
        }
    }
    return returnArray
}


