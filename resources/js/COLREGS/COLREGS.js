/**
 * @requires <CoordinateConversion.js>
 * @requires <LatLongHelperFunctions.js>
 */

/**
 * @typedef {object} xyVector
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {object} ColregsShipPosition
 * @property {xyVector} XYstart easting northing position in meters
 * @property {xyVector} XYVelocity change in easting northing position per second
 * @property {number} UTMzone UTM zone used to calculate x adn y values
 * @property {string} COLREGSState
 * @property {string} statusDescription
 */

/**
 * @typedef {string} MMSI vessel's unique ID in string form
 */

/**
 * @typedef {object} colregsEvaluation
 * @property {string} COLREGSState
 * @property {string} statusDescription
 */


/**
 * as closestApproachCalcCOLREGS is a stateless tools object the constructor only initialises some
 * variables that can be used during debugging.
 * otherwise it has no attributes of its own
 *
 * @constructor
 */

closestApproachCalcCOLREGS = function()
{
	//this.debugText = "nil";
	//this.closestAproachInfo = "//";
	//this.UTC_Tool = {};
	//this.UTC_Tool_initialized = false;
	//this.UTC_Tool_loading = false;
};

/**
 * @param {object} utmPos cartesian position coordinates based on utm calculations
 * @param {number} utmPos.x meters easting
 * @param {number} utmPos.y meters northing
 * @param {number} utmPos.dx meters per second change in easting
 * @param {number} utmPos.dy meters per second change in northing
 * @param {number} utmPos.zone = UTM zone used to calculate x and y
 *
 * @return {ColregsShipPosition}
 */
closestApproachCalcCOLREGS.prototype.utmPosToColregsPos = function(utmPos)
{
    return {
        XYstart:{
            x:utmPos.x,
            y:utmPos.y
        },
        XYVelocity:{
            x:utmPos.dx,
            y:utmPos.dy
        },
        UTMzone:utmPos.zone,
        COLREGSState:'NONE',
        statusDescription:"State not set"
    }
};

/**
 * @param {number} ownShipMMSI
 * @param {object} group object.<MMSI, utmPositionReport>
 * @param {number} safeDist
 *
 * @returns {object.<MMSI,colregsEvaluation>}
 */
closestApproachCalcCOLREGS.prototype.evaluateEncounterOnGroup = function(ownShipMMSI, group, safeDist)
{
    var ownShipColregs = this.utmPosToColregsPos(group[ownShipMMSI]);
    var otherShipColregs = {};
	var returnArray = {};
    returnArray[ownShipMMSI] = {
        COLREGSState:"SELF",
        statusDescription:"Current 'Own Ship' for the purposes of colregs evaluations"
	};
	for (var currentMMSI in group)
	{
		if (currentMMSI != ownShipMMSI)
		{
		    //console.log(currentMMSI + " " + ownShipMMSI);
            otherShipColregs = this.utmPosToColregsPos(group[currentMMSI]);
            returnArray[currentMMSI] = this.evaluateEncounter(ownShipColregs, otherShipColregs, safeDist);
		}
	}
	return returnArray;
};

/**
 *
 * this function takes 2 different ships, a defined safe distance
 *
 * 	if the other ship is stationary
 * 			statusDescription = 'ship is stationary'
 * 			and COLREGSState = 'STIL' are returned
 *
 * 	then the relative velocity of otherShip is calculated with respect to ownShip
 * 	if the otherShip is found to have a relative velocity of near 0 then
 * 			statusDescription = 'relative velocity is near 0'
 * 			and COLREGSState = 'NONE' are returned
 *
 * 	now the time of nearest approach is calculated
 * 	if this time is more than 5 hours in the future
 * 			statusDescription = 'time of nearest approach is more than 5 hours away'
 * 			and COLREGSState = 'NONE' are returned
 * 	if this time is less than 0 (ie the otherShip is traveling away from the ownShip) then
 * 			statusDescription = 'relative velocity is away from own ship'
 * 			and COLREGSState = 'NONE' are returned
 *
 * 	having got this far
 * 	if the point of nearest approach sees the two ships closer than safeDist then
 * 			a subset of COLREGS rules are applied to determine who should give way
 * 	else (ie they never get within a safe distance of one another)
 * 			statusDescription = 'ship will never come within less than safe distance'
 * 			and COLREGSState = 'NONE' are returned
 *
 * @param {ColregsShipPosition} ownShipColregs cartesian position coordinates based on utm calculations
 * @param {ColregsShipPosition} otherShipColregs cartesian position coordinates based on utm calculations
 * @param {number} safeDist distance in meters, if the ships will pass closer than this COLREGS is implemented to see who should give way
 *
 * @returns {colregsEvaluation}
 */

closestApproachCalcCOLREGS.prototype.evaluateEncounter = function(ownShipColregs, otherShipColregs, safeDist)
{

	//get the number of `<script>` elements that have the correct `src` attribute

	
	if (safeDist === undefined) safeDist = 500;

	//console.log("ownShip post=" + JSON.stringify(ownShip));
	//console.log("otherShip post=" + JSON.stringify(otherShip));
	
	// mathematical theory behind this code is as follows
	//  How to read the formulas
	//  CAPS are vectors
	//	S = position at time 0, V = ship velocity
	//  '.' , '..'  and '...' used to differentiate between different position and velocity vectors
	//
	//
	//	ship 1 position = S. + V.t
	//	ship 2 position = S.. + V..t
	//	ship 2 position relative to ship 1 = S... + V...t = ship 1 position - ship 2 position
	//		so S...x = S.x - S..x , etc
	//	distance between 1 and 2 = f(t) = ||S... + V...t||
	//	time (t) of closest aproach is when f'(t) = 0 (i.e., gradient will be 0 at the minimum of f(t) )
	//	so let V... = (a,b) and S... = (c,d)
	//	so now f(t)  = sqrt( (at+c)^2 + (bt+d)^2 )
	//	.'. f'(t) = (0.5/sqrt( (at+c)^2 + (bt+d)^2 ))(2(at+c)(a) + 2(bt+d)(b))
	//	if f'(t) = 0
	//	(0.5/sqrt( (at+c)^2 + (bt+d)^2 )) (2(at+c)(a) + 2(bt+d)(b)) = 0
	//	=> (2(at+c)(a) + 2(bt+d)(b)) = 0
	//	=> 2((at+c)(a) + (bt+d)(b)) = 0
	//	=> (at+c)(a) + (bt+d)(b) = 0
	//	=> ta^2 + ca + tb^2 + db = 0
	//	=> ta^2 + tb^2 = -(ca + db)
	//	=> t = -(ca + db)/(a^2 + b^2)
	//	
	//	t is undefined if a^2 + b^2 = 0,  this is becasue the relative velocetie of ship one and two is 0 
	//		and thus they are staying a constant distance from oneanother

    var speedMpsSquared = ownShipColregs.XYVelocity.x * ownShipColregs.XYVelocity.x + ownShipColregs.XYVelocity.y * ownShipColregs.XYVelocity.y
	if (speedMpsSquared < (0.5/3.6)*(0.5/3.6))
		//mps to kmph is *3600seconds/1000meters and then needs to be squared to be compared to MpsSquared without having to do a costly square root
	{
        return{
            COLREGSState:"STIL",
            statusDescription:"vessel is moving at less than 0.5 km/h and is thus considered to be stationary"
        };
    }


    //var ownDEastingNothing = LatLongBearingKmphToUTMNothirthingEastingPerSecond(ownShip.currentPosition.latitude, ownShip.currentPosition.longitude, ownShip.currentPosition.course, ownShip.currentPosition.speedKmph);
    //var otherDEastingNothing = LatLongBearingKmphToUTMNothirthingEastingPerSecond(otherShip.currentPosition.latitude, otherShip.currentPosition.longitude, otherShip.currentPosition.course, otherShip.currentPosition.speedKmph);
    //returns   {eastingPerSecond (m/s)
    //          northingPerSecond (m/s)}

    //ownShipColregs.XYVelocity.x = ownDEastingNothing.eastingPerSecond;
    //ownShipColregs.XYVelocity.y = ownDEastingNothing.northingPerSecond;
    //otherShipColregs.XYVelocity.x = otherDEastingNothing.eastingPerSecond;
    //otherShipColregs.XYVelocity.y = otherDEastingNothing.northingPerSecond;
	
	var relativePositionFunction = {};
	relativePositionFunction.XYstart = {
		'x':ownShipColregs.XYstart.x-otherShipColregs.XYstart.x,
		'y':ownShipColregs.XYstart.y-otherShipColregs.XYstart.y
	};
	relativePositionFunction.XYVelocity = {
		'x':ownShipColregs.XYVelocity.x-otherShipColregs.XYVelocity.x,
		'y':ownShipColregs.XYVelocity.y-otherShipColregs.XYVelocity.y
	};
	
	//console.log("relativePositionFunction.XYVelocity.x = " + relativePositionFunction.XYVelocity.x);
	
	var a = relativePositionFunction.XYVelocity.x;
	var b = relativePositionFunction.XYVelocity.y;
	var c = relativePositionFunction.XYstart.x;
	var d = relativePositionFunction.XYstart.y;
	
	var e = a*a+b*b;
	if (e < 0.0001)
	{
		return{
            COLREGSState:"NONE",
            statusDescription:"vessel is traveling in the same direction at the same speed"
        };
	}
	
	timeOfNerestPosition = -(a*c+b*d)/e;
	//console.log("timeOfNerestPosition = " + timeOfNerestPosition);
	if (timeOfNerestPosition > 5*3600)
	{
		return{
            COLREGSState:"NONE",
            statusDescription:"time of nearest approach is more than 5 hours away"
        };
	}
	
	if (timeOfNerestPosition < 0)
	{
		return{
            COLREGSState:"NONE",
            statusDescription:"vessel is getting further away"
        };
	}

    ownShipColregs.XYnerest = {
		'x':(timeOfNerestPosition*ownShipColregs.XYVelocity.x)+ownShipColregs.XYstart.x,
		'y':(timeOfNerestPosition*ownShipColregs.XYVelocity.y)+ownShipColregs.XYstart.y
	};

    otherShipColregs.XYnerest = {
		'x':(timeOfNerestPosition*otherShipColregs.XYVelocity.x)+otherShipColregs.XYstart.x,
		'y':(timeOfNerestPosition*otherShipColregs.XYVelocity.y)+otherShipColregs.XYstart.y
	};
	//console.log("ownShip.XYstart = (" + ownShip.XYstart.x + "," + ownShip.XYstart.y + ")");
	//console.log("otherShip.XYstart = (" + otherShip.XYstart.x + "," + otherShip.XYstart.y + ")");
	
	//console.log("ownShip.XYnerest = (" + ownShip.XYnerest.x + "," + ownShip.XYnerest.y + ")");
	//console.log("otherShip.XYnerest = (" + otherShip.XYnerest.x + "," + otherShip.XYnerest.y + ")");
	var dx = ownShipColregs.XYnerest.x-otherShipColregs.XYnerest.x;
	var dy = ownShipColregs.XYnerest.y-otherShipColregs.XYnerest.y;
	//console.log("dx = " + dx + ", dy = " + dy);
	
	var minDistSquared = dx*dx + dy*dy;
	//console.log("minDistSquared = " + minDistSquared);
	if (minDistSquared < safeDist*safeDist)
	{
		//invoke COLREGS
        return this.clasifyEncounter(ownShipColregs, otherShipColregs);
	}
	else
	{
	//		there is no signifigant encounter based on the two ships current state
	//		 so otherShip.COLREGSState = 'NONE'
		return {
            COLREGSState:"NONE",
            statusDescription:"vessel will never approach within less than safe distance"
        };
	}
};


/**
 * XYvectorDot
 * basic vector functions that seem to be not in the js Math library (or at least not consistently included)
 *
 * @param {xyVector} V1
 * @param {xyVector} V2
 * @returns {number} dotProduct
 */
closestApproachCalcCOLREGS.prototype.XYvectorDot = function(V1, V2)
{
	return (V1.x*V2.x + V1.y*V2.y);
};
/**
 *
 * @param {xyVector} V1
 * @returns {xyVector} of unit length
 */
closestApproachCalcCOLREGS.prototype.XYvectorCalcNormal = function (V1)
{
    var length = this.XYvectorLenegth(V1);
    return {
        x:V1.x/length,
        y:V1.y/length
    }
};

/**
 * XYangleBetween2VectorsClockwise
 * @param {xyVector} V1
 * @param {xyVector} V2
 * @returns {number} angle in degrees, range = [0, 360) from V1 around to V2
 */
closestApproachCalcCOLREGS.prototype.XYangleBetween2VectorsClockwise = function(V1, V2)
{
	var angleRad1 = Math.atan2(V1.x, V1.y);
    var angleRad2 = Math.atan2(V2.x, V2.y);

    var bearingDeg1 = ((90-(angleRad1/Math.PI*180))+360)%360;
    var bearingDeg2 = ((90-(angleRad2/Math.PI*180))+360)%360;

    return ((bearingDeg2 - bearingDeg1)+360)%360;
	//retuns in radiens
	/*
    var V1Unit = this.XYvectorCalcNormal(V1);
    var V2Unit = this.XYvectorCalcNormal(V2);



	var dot = this.XYvectorDot(V1Unit, V2Unit);
	var det = V1Unit.x*V2Unit.y - V1Unit.y*V2Unit.x;
	
	var tempRads =  Math.atan2( det,dot );
	if (tempRads >= 0) 
	{
		return tempRads;
	}
	else 
	{
		return (2*Math.PI) + tempRads;
	}
	*/
};

/**
 * XYvectorLenegth
 * @param {xyVector} V1
 * @returns {number} length
 */
closestApproachCalcCOLREGS.prototype.XYvectorLenegth = function(V1)
{
	return Math.sqrt(this.XYvectorDot(V1,V1));
};

/**
 * calcEncounterDetails calculates the relevant info needed to make a call using Colregs rules
 *
 * @param {ColregsShipPosition} ownShip
 * @param {number} ownShip.angleToOther decimal angle, clockwise from ownShip.XYVelocity, output via js object reference
 * @param {number} ownShip.velocity meters per second, output via js object reference
 * @param {number} ownShip.angleOfVelocities decimal angle, clockwise from ownShip.XYVelocity, output via js object reference
 * @param {ColregsShipPosition} otherShip
 *
 */


closestApproachCalcCOLREGS.prototype.calcEncounterDetails = function(otherShip, ownShip)
{
	//ownShip = this.ownShipTemplate;
	
	var relativePositionVector = {
		'x':otherShip.XYstart.x-ownShip.XYstart.x,
		'y':otherShip.XYstart.y-ownShip.XYstart.y
	};

    ownShip.angleToOther = this.XYangleBetween2VectorsClockwise(ownShip.XYVelocity, relativePositionVector);
    ownShip.velocity = this.XYvectorLenegth(ownShip.XYVelocity);
    ownShip.angleOfVelocities = this.XYangleBetween2VectorsClockwise(ownShip.XYVelocity, otherShip.XYVelocity);
    //console.log(relativePositionVector);
    //console.log(ownShip.XYVelocity);
    //console.log(otherShip.XYVelocity);
    //console.log(this.XYvectorCalcNormal(relativePositionVector));
    //console.log(this.XYvectorCalcNormal(ownShip.XYVelocity));
    //console.log(this.XYvectorCalcNormal(otherShip.XYVelocity));
    //console.log(ownShip.angleToOther);
    //console.log(ownShip.velocity);
    //console.log(ownShip.angleOfVelocities);
};

/**
 * clasify uses the following rules as defined by Colregs to determine whether the other vessel is the give-way or stand-on vessel
 *
 *
 *                       own ship velocity
 *                             ^
 *                             |
 * 			               Head on
 *			             355   |    5
 *                         \   |   /
 *                          |  |  |
 *                           \ | /
 *        Stand on            |||     Give way (alter to Starboard)
 *                            /|\
 *                          /  |  \             ___...//''' 67.5
 *                         |   |   |   _...//'''
 *                   ______|___|___|______     Give way (alter to port if speed is much slower)   refer to research paper
 *                  ___...-|-''^''-|-...___    ????? currently not included in clasification as I am not sure if this case is possible in reality ??????
 *        _...//'''        |_______|        '''//..._
 *   247.5                                            112.5
 *                        Overtaking
 *                       ( Stand on )
 *
 *
 * @param {ColregsShipPosition} ownShip
 * @param {number} ownShip.angleToOther
 * @param {number} ownShip.angleOfVelocities
 * @param {ColregsShipPosition} otherShip
 * @param {number} otherShip.angleToOther
 * @param {number} otherShip.angleOfVelocities
 * @returns {colregsEvaluation}
 *
 */

closestApproachCalcCOLREGS.prototype.clasify = function(otherShip, ownShip)
{	
	if (ownShip.angleToOther >= 112.5 && ownShip.angleToOther <= 247.5)
	{// if the other ship is behind us
        return {
            COLREGSState:"GWOT",
            statusDescription:"This vessel is overtaking and must give way"
        };
	}
	else if ((ownShip.angleToOther <= 5 ||  ownShip.angleToOther >= 355) && (ownShip.angleOfVelocities > 90 || ownShip.angleOfVelocities < 270) )
	{//if the other ships is directly in front of us and heading toward us
        return {
            COLREGSState:"GWHO",
            statusDescription:"This vessel is approaching head on, both vessels must give way"
        };
	}
	else if ((otherShip.angleToOther >= 112.5 && otherShip.angleToOther <= 247.5) && (otherShip.angleOfVelocities < 90 || otherShip.angleOfVelocities > 270))
	{// we are behind the other ship and about to overtake
        return {
            COLREGSState:"SOOT",
            statusDescription:"This vessel being overtaking and is expected to stand on"
        };
	}
	else if (ownShip.angleToOther > 247.5)
	{
        return {
            COLREGSState:"SOPC",
            statusDescription:"This vessel is approaching from Starboard and is expected to stand on"
        };
	}
	else
	{
        return {
            COLREGSState:"GWSC",
            statusDescription:"This vessel is approaching from port and should give way"
        };
	}
};

/**
 * clasifyEncounter
 *
 * calculates the last remaining details that are needed to make a judgment based on basic Colregs rules
 * then classifies the encounter accordingly
 * the final judgment will be output by reference with otherShip
 *
 *
 * @param {ColregsShipPosition} ownShip
 * @param {ColregsShipPosition} otherShip
 * @returns {colregsEvaluation}
 *
 */
closestApproachCalcCOLREGS.prototype.clasifyEncounter = function(ownShip, otherShip)
{
    this.calcEncounterDetails(otherShip, ownShip);
    this.calcEncounterDetails(ownShip, otherShip);
    //console.log("ownShip.XY");
    //console.log(ownShip.XYstart);
    //console.log("ownShip.XYVell");
    //console.log(ownShip.XYVelocity);
    //console.log("otherShip.XY");
    //console.log(otherShip.XYstart);
    //console.log("otherShip.XYVell");
    //console.log(otherShip.XYVelocity);
    //console.log("otherShip.XYVell");
    //console.log({
    //    'x':otherShip.XYstart.x-ownShip.XYstart.x,
    //    'y':otherShip.XYstart.y-ownShip.XYstart.y
    //})
    //console.log("this.clasify(otherShip, ownShip)");
    //console.log(this.clasify(otherShip, ownShip));

	return this.clasify(otherShip, ownShip);
};



