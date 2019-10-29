/**
 * @typedef {object} positionMessageData object containing position and velocity information
 * @property {number} latitude decimal degrees
 * @property {number} longitude decimal degrees
 * @property {number} course decimal degrees, clockwise, north = 0
 * @property {number} speedKmph speed km/h
 * @property {number} transmission_time unix timestamp in seconds
 * @property {JulianDate} time Cesium date formatted time of transmission
 */

/**
 * Created by KRogers on 02/03/2017.
 *
 * a buffer of known ship positions speeds and bearings from AIS data
 *
 * @param {object} [initialPosition]
 * @param {number} initialPosition.latitude decimal degrees
 * @param {number} initialPosition.longitude decimal degrees
 * @param {number} initialPosition.course decimal degrees, clockwise, north = 0
 * @param {number} initialPosition.speedKmph speed km/h
 * @param {number} initialPosition.transmission_time unix timestamp in seconds
 * @param {number} initialPosition.time cesium julian date for use in cesium related functions, included because it is a pain to convert unix time stamps to julian dates
 *
 * @class ShipPath
 * @classDesc this object is used to manage an non sequential set of position reports and be able to quickly retrieve the most recent position at any given point in time
 * TODO add the ability to cull positions outside a given time range to make data buffering possible
 * possitions are actually appended to an array with the intention that if the path becomes too long then data can be deleted in a
 * FIFO manner, with each entree in the array also being deleted from the avl tree
 * @property {positionMessageData[]} positions
 * @property {boolean} hasPosition
 * @property {number} nextFreeIndex
 * @property {AvlTree} timeStampToPossitionsArrayIndexAvlTree
 * @constructor
 */

function ShipPath(initialPosition)
{
    this.positions = [];
    this.hasPosition = false;
    this.nextFreeIndex = 0;
    this.timeStampToPossitionsArrayIndexAvlTree = new AvlTree();

    /**
     * clones the position and velocity data provided into a new object that is then inserted into the positions array
     * and adds and entry to the timeStampToPossitionsArrayIndexAvlTree so that this position can be retrieved based on
     * its time stamp
     * @param {positionMessageData} positionMessageData object containing position and velocity information
     */
    this.insertPosition = function(positionMessageData)
    {
        //console.log("inserting possition at time " + positionMessageData.transmission_time);
        this.positions[this.nextFreeIndex] = {
            latitude:positionMessageData.latitude,
            longitude:positionMessageData.longitude,
            course:positionMessageData.course,
            speedKmph:positionMessageData.speedKmph,
            transmission_time:positionMessageData.transmission_time,
            time:positionMessageData.time
        };
        this.timeStampToPossitionsArrayIndexAvlTree.insert(positionMessageData.transmission_time, this.nextFreeIndex);
        //console.log(this.timeStampToPossitionsArrayIndexAvlTree.getTreeStructure());
        this.nextFreeIndex = this.nextFreeIndex + 1;
        this.hasPosition = true;
    };

    /**
     * get index based on param unixTime by using member variable timeStampToPossitionsArrayIndexAvlTree
     * @param {number} unixTime in seconds
     * @returns {number} index in the positions array
     */
    this.getLastKnownPositionIndex = function(unixTime)
    {
        //console.log("this.hasPosition = " + (this.hasPosition));
        //console.log("unixTime = " + (unixTime));
        //console.log("structure = ");
        //console.log(this.timeStampToPossitionsArrayIndexAvlTree.getTreeStructure());
        //console.log("this.timeStampToPossitionsArrayIndexAvlTree.getNearestPrevious(Math.floor(unixTime) = " + (this.timeStampToPossitionsArrayIndexAvlTree.getNearestPrevious(Math.floor(unixTime)))||"null");
        if (this.hasPosition)
        {
            var index = this.timeStampToPossitionsArrayIndexAvlTree.getNearestLessThan(unixTime);
            if (index === null)
                return -1;
            return index;
        }
        return -1;
    };


    if(initialPosition !== null && initialPosition !== undefined && initialPosition.transmission_time !== null)
    {
        this.insertPosition(initialPosition);
    }
}
