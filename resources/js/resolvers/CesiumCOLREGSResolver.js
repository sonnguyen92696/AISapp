/*
Updates the*  cesium viewer to show all of the ships in the AIS store


/*
 * brain storming
 *
 * reolver contains array <MMSI, VisualShip>
 * VisualShip contains
 *    static ship data
 *    most recent dynamic data
 *    update(time) update most recent dynamic data if path.getMostRecent(unixTime) returns a different position
 *        returns true if something changed
 *    addData(messages)
 *       if static update static
 *       if dynamic path.addData
 *
 *    path which contains
 *        avlTree of dynamic messages
 *        addData(messages) inert each into avl tree
 *
 *    cesium entity with model and time sampled position
 *        mode and path material is defined by colregs state - default is NA, colour green (TODO implement this first)
 *        time sampled position contains two points is based on most recent dynamic message too 15 minutes in the future based on the same messages SOG and COG
 *        availability is from most recent dynamic message time to +15 min
 *
 * on dataAdded messages are added to VisualShip.addData(messages)
 *
 * on onTimeChanged call
 *    VisualShip update(unixTime)
 *    resolver as 2 states Colregs running or not running
 *    if not running and ship selected
 *        set to running
 *        set selected ship as focus
 *        compile list of ship possitions from visual ships
 *        set default colregs state for all ships as out of range
 *        find ships in visual range and get there utm positions using lat long helper function
 *        calc colregs on ships in range
 *        update colregs state for in range ships
 */

/**
 * @typedef {object} staticMessageData
 * @property {number} length
 * @property {number} breadth
 * @property {string} name
 * @property {number} MMSI
 * @property {number} last_static_draught
 * @property {number} unixTimeStampOfData
 * @property {number} type
 */

/**
 * @class VColregsShip
 * @classDesc an object for holding and managing data relevent to colregs determinations and visualisation
 *
 * @property {null|staticMessageData} staticShipData
 *
 * @property {null|positionMessageData} mostRecentDynamicData
 * @property {ShipPath} path
 * @property {Entity} entity Cesium.entity that visualises this ship in the cesium window;
 * @property {Viewer} viewerRef link to the cesium viewer
 * @property {object.<string, string>} modelUrls colour name to model url
 * @property {string} currentModelUrl current Model Url
 * @property {string} currentColregsState current colregs state code based on last valid evaluation
 * @property {string} COREGSDesc description of current colregs evaluation
 * @property {number} currentModelMInPixle
 * @property {number} currentModelMaximumScale
 *
 * @property {int} messageListsProcessed
 * @property {int} staticMessagesProcessed
 * @property {int} dynamicMessagesProcessed
 * //property {string[]} changeTest model urls, just for testing random model changing
 * //property {number} changeTestCount number of urls in changeTest again just for testing random model changing
 */

/**
 * @constructor
 * @param {Viewer} viewer
 */
function VColregsShip(viewer)
{
    this.messageListsProcessed = 0;
    this.staticMessagesProcessed = 0;
    this.dynamicMessagesProcessed = 0;
    this.staticShipData = null;
    this.mostRecentDynamicData = null;
    this.path = new ShipPath();
    this.entity = null;
    this.viewerRef = viewer;
    this.currentColregsState = 'default';
    this.COREGSDesc = "";
    this.modelUrls = {
        green:'resources/assets/ShipGreen.gltf',
        blue:'resources/assets/ShipBlue.gltf',
        grey:'resources/assets/ShipGrey.gltf',
        greyOpaque:'resources/assets/ShipGreyHalfAlpha.gltf',
        red:'resources/assets/ShipRed.gltf',
        white:'resources/assets/ShipWhite.gltf',
        whiteOpaque:'resources/assets/ShipWhiteHalfAlpha.gltf',
        COREGSDisc:'resources/assets/ColRegsDisc.gltf'
    };
    this.currentModelUrl = this.modelUrls.green.url;
    this.currentModelMInPixle = 20;
    this.currentModelMaximumScale = 1000;
    this.colregsModelProperties = {
        SELF: {
            url:this.modelUrls.COREGSDisc,
            minPixleSize:1000,
            maximumScale:10000
        },
        STIL:{
            url:this.modelUrls.white,
            minPixleSize:20,
            maximumScale:1000
        },
        NONE:{
            url:this.modelUrls.greyOpaque,
            minPixleSize:20,
            maximumScale:1000
        },
        GWOT:{
            url:this.modelUrls.green,
            minPixleSize:20,
            maximumScale:1000
        },
        GWHO:{
            url:this.modelUrls.green,
            minPixleSize:20,
            maximumScale:1000
        },
        GWSC:{
            url:this.modelUrls.green,
            minPixleSize:20,
            maximumScale:1000
        },
        SOOT:{
            url:this.modelUrls.red,
            minPixleSize:20,
            maximumScale:1000
        },
        SOPC:{
            url:this.modelUrls.red,
            minPixleSize:20,
            maximumScale:1000
        },
        SOOT:{
            url:this.modelUrls.red,
            minPixleSize:20,
            maximumScale:1000
        },
        default:{
            url:this.modelUrls.greyOpaque,
            minPixleSize:20,
            maximumScale:1000
        }
    }
    /*
    this.changeTest = [
        'resources/assets/ShipGreen.gltf',
        'resources/assets/ShipBlue.gltf',
        'resources/assets/ShipGrey.gltf',
        'resources/assets/ShipGreyHalfAlpha.gltf',
        'resources/assets/ShipRed.gltf',
        'resources/assets/ShipWhite.gltf',
        'resources/assets/ShipWhiteHalfAlpha.gltf'
    ];
    this.changeTestCount = 7;
    */
}

VColregsShip.prototype.updateColregsState = function()
{
    if (this.currentColregsState in this.colregsModelProperties)
    {
        this.currentModelUrl = this.colregsModelProperties[this.currentColregsState].url;
        this.currentModelMInPixle = this.colregsModelProperties[this.currentColregsState].minPixleSize;
        this.currentModelMaximumScale = this.colregsModelProperties[this.currentColregsState].maximumScale;
    }
    else
    {
        this.currentModelUrl = this.colregsModelProperties['default'].url;
        this.currentModelMInPixle = this.colregsModelProperties['default'].minPixleSize;
        this.currentModelMaximumScale = this.colregsModelProperties['default'].maximumScale;
    }

    if (this.entity)
    {
        this.entity.model.uri = this.currentModelUrl;
        this.entity.model.minimumPixelSize = this.currentModelMInPixle;
        this.entity.model.maximumScale = this.currentModelMaximumScale;
    }
};

VColregsShip.prototype.setColregsState = function(stateCode, description)
{
    if (this.currentState === 'GWOT' || this.currentState === 'SOOT')
    {
        //then this prior state can not be overiden
        //according to colregs, if the over taking rules apply then they remain regardless of the change in situation until the incedent is finished
        return; // without change
    }
    this.currentColregsState = stateCode;
    this.COREGSDesc = description;
    this.updateColregsState();
};
/**
 *
 * @param {staticMessageShip} message
 */
VColregsShip.prototype.updateStaticData = function(message)
{
    if (this.staticShipData === null) this.staticShipData = {};
    this.staticShipData.breadth = 0;
    this.staticShipData.length = 0;
    if (message.port_to_position_unit != undefined && message.port_to_position_unit > 0)
    {
        this.staticShipData.breadth = message.port_to_position_unit;
    }
    if (message.starboard_to_position_unit != undefined && message.starboard_to_position_unit > 0)
    {
        this.staticShipData.breadth += message.starboard_to_position_unit;
    }

    if (message.bow_to_position_unit != undefined && message.bow_to_position_unit > 0)
    {
        this.staticShipData.length = message.bow_to_position_unit;
    }
    if (message.stern_to_position_unit != undefined && message.stern_to_position_unit > 0)
    {
        this.staticShipData.length += message.stern_to_position_unit;
    }
    this.staticShipData.name = message.name;
    this.staticShipData.MMSI = message.MMSI;
    this.staticShipData.type = message.type_of_ship_and_cargo;
    this.staticShipData.last_static_draught = message.last_static_draught;
    this.staticShipData.unixTimeStampOfData = message.unixTimeStamp;
};

/**
 *
 * @param {dynamicMessageShip} message
 */
VColregsShip.prototype.updateDynamicData = function(message)
{
    if (this.staticShipData === null) this.staticShipData = {};
    {
        this.staticShipData.MMSI = message.MMSI;
    }
    this.path.insertPosition({
        latitude:message.latitude,
        longitude:message.longitude,
        course:message.COG,
        speedKmph:message.SOG*1.852, // knots to kmph
        transmission_time:message.unixTimeStamp,
        time:message.time
    });
};

VColregsShip.prototype.updateData = function(messages, wipeOldData)
{
    this.messageListsProcessed++;
    if (wipeOldData)
    {
        this.path = new ShipPath();
    }

    if ("ais_voyages_dynamic" in messages && messages.ais_voyages_dynamic.length > 0)
    {
        for (var dynamicIndex = 0; dynamicIndex < messages.ais_voyages_dynamic.length; dynamicIndex++)
        {
            this.updateDynamicData(messages.ais_voyages_dynamic[dynamicIndex]);
            this.dynamicMessagesProcessed++;
        }
    }
    if ("ais_voyages_static" in messages && messages.ais_voyages_static.length > 0)
    {
        //for (var staticIndex = 0; staticIndex < messages.ais_voyages_static.length; staticIndex++)
        //{
        //    TODO update static data to be an object like path
        //}
        this.updateStaticData(messages.ais_voyages_static[messages.ais_voyages_static.length-1]);
        this.staticMessagesProcessed++;
    }
    var mmsi = "";
    if (this.staticShipData === null) mmsi = "null";
    else mmsi = this.staticShipData.MMSI;
    //console.log(mmsi + " has processed (" + this.messageListsProcessed + "," + this.staticMessagesProcessed + "," + this.dynamicMessagesProcessed +") (lists, statics, dynamics)")
    //console.log (this.path.timeStampToPossitionsArrayIndexAvlTree.getTreeStructure());
};

VColregsShip.prototype.createEntityParams = function()
{
    var polylineOptions = {};
    var position = this.computeShipSampledPositionProperty(polylineOptions);
    var stopTime = Cesium.JulianDate.clone(this.mostRecentDynamicData.time);
    var startTime = Cesium.JulianDate.clone(this.mostRecentDynamicData.time);
    Cesium.JulianDate.addMinutes(stopTime, 15, stopTime);
    Cesium.JulianDate.addMinutes(startTime, -15, startTime);
    //console.log(this.mostRecentDynamicData)
    var orPosition = Cesium.Cartesian3.fromDegrees(this.mostRecentDynamicData.longitude, this.mostRecentDynamicData.latitude, 10.0);
    var heading = Cesium.Math.toRadians(this.mostRecentDynamicData.course);
    var pitch = 0;
    var roll = 0;
    var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    //console.log("hpr = " + hpr);
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(orPosition, hpr);
    //console.log("update orientation");
    //console.log(orientation);
    //console.log("orientation done")
    return  { // entity Params as follows
        name: "MMSI: " + this.staticShipData.MMSI,
        id: this.staticShipData.MMSI,

        //Set the entity availability to the same interval as the simulation time.
        availability : new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
            start : startTime,
            stop : stopTime
        })]),

        //Use our computed positions
        position : position,

        polyline:new Cesium.PolylineGraphics(polylineOptions),

        model : {
            uri : this.colregsModelProperties.default.url,
            minimumPixelSize : this.colregsModelProperties.default.minPixleSize,
            maximumScale: this.colregsModelProperties['default'].maximumScale
        },

        //Show the path as a pink line sampled in 1 second increments.
        //path : {
        //    resolution: 1,
        //    material: new Cesium.PolylineGlowMaterialProperty({
        //        glowPower: 0.1,
        //        color: Cesium.Color.BLUE
        //    }),
        //   width: 10
        //},

        //Automatically compute orientation based on position movement.
        orientation : orientation,

        description:this.createDescription()
    };
};

// if (vShip.mostRecentDynamicData === null) return null;
// var pos = vShip.mostRecentDynamicData;
// var property = new Cesium.SampledPositionProperty();
// addSample(JulianDate times, Cartesian3 position[, derivative])
// property.addSample(pos.time, Cesium.Cartesian3.fromDegrees( pos.longitude, pos.latitude));
// Cesium.JulianDate.addSeconds(julianDate, seconds, result) --> JulianDate
// forward15min = Cesium.JulianDate.addSeconds(pos.time, 15*60);
//DeltaPositionFromLastKnownLatLongBearingSpeedKMpH(
//      lat,
//      long,
//      heading,
//      speedKmph,
//      timeReport,
//      timeCurrent,
//      newLatLong
// )
// var pos2 = {};
// DeltaPositionFromLastKnownLatLongBearingSpeedKMpH(
//      pos.latitude,
//      pos.longitude,
//      pos.COG,
//      pos.SOG*1.852, // knots to kmph
//      pos.unixTimeStamp,
//      pos.unixTimeStamp+15*60,
//      pos2
// );
// property.addSample(forward15min, Cesium.Cartesian3.fromDegrees( pos2.longitude, pos2.latitude));
// return property;

/**
 *
 * @param {JulianDate} [currentJulianTime]
 */
VColregsShip.prototype.createDescription = function(currentJulianTime)
{
    if (this.staticShipData === null) return "no static data";
    if (this.mostRecentDynamicData === null) return "no position data at this time";
    //we have both static Data and Dynamic Data
    var posToUse = {};
    var latLongPrecision = 10000;
    if(currentJulianTime !== undefined && this.entity !== null && this.entity.position.getValue(currentJulianTime) !== undefined)
    {
        //console.log("using this.entity.position.getValue");
        var cartesian3Pos = this.entity.position.getValue(currentJulianTime);
        var cartegraphicPosInRads = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian3Pos);
        posToUse.latitude = Math.floor(Cesium.Math.toDegrees(cartegraphicPosInRads.latitude)*latLongPrecision)/latLongPrecision;
        posToUse.longitude = Math.floor(Cesium.Math.toDegrees(cartegraphicPosInRads.longitude)*latLongPrecision)/latLongPrecision;

    }
    else
    {
        //console.log("using mostRecentDynamicData");
        posToUse.latitude = Math.floor(this.mostRecentDynamicData.latitude*latLongPrecision)/latLongPrecision;
        posToUse.longitude = Math.floor(this.mostRecentDynamicData.longitude*latLongPrecision)/latLongPrecision;
    }
    var desc = "";
    desc += "MMSI: " + this.staticShipData.MMSI;
    desc += "<br>Name: " + this.staticShipData.name;
    desc += "<br>Latitude: " + posToUse.latitude;
    desc += "<br>Longitude: " + posToUse.longitude;
    desc += "<br>Course: " + this.mostRecentDynamicData.course;
    desc += "<br>Time of last transmission: " + this.mostRecentDynamicData.transmission_time;
    if (this.COREGSDesc !== "")
        desc += "<br>COLREGS verdict: " + this.COREGSDesc;
    //if (this.viewerRef.selectedEntity)
    //{
        //console.log("selectedEntity.id = " + this.viewerRef.selectedEntity.id  + ", this.staticShipData.MMSI = " + this.staticShipData.MMSI)
        //if (this.viewerRef.selectedEntity.id === this.staticShipData.MMSI)
            //console.log(desc);
    //}

    return desc;
};

VColregsShip.prototype.computeShipSampledPositionProperty = function(outPolylineOptions)
{
    if (this.mostRecentDynamicData === null || this.mostRecentDynamicData === undefined) return null;
    var pos = this.mostRecentDynamicData;
    var property = new Cesium.SampledPositionProperty();
    // Cesium.SampledPositionProperty.addSample(JulianDate times, Cartesian3 position[, derivative])
    property.addSample(pos.time, Cesium.Cartesian3.fromDegrees( pos.longitude, pos.latitude,10));
    // Cesium.JulianDate.addSeconds(julianDate, seconds, result) --> JulianDate
    //console.log("pos.time" + pos.time);
    //JulianDate addMinute and addSecond functions do not seem to work so this is a work around using moment
    //convert JulianDate pos.time --> Date
    //convert Date --> moment
    //moment.add(15,'minutes') // cos I know this actually works
    //convert moment --> Date
    //convert Date --> JulianDate

    //var forward15min = Cesium.JulianDate.fromDate(
    //    (new moment(
    //        Cesium.JulianDate.toDate(pos.time))
    //    ).add(15,'minutes').toDate()
    //);
    //Cesium.JulianDate.addMinutes(forward15min,15,forward15min); //dose not work
    var forward15min = Cesium.JulianDate.clone(pos.time);
    Cesium.JulianDate.addMinutes(pos.time, 15, forward15min);
    // from latLongHelperFunctions
    // DeltaPositionFromLastKnownLatLongBearingSpeedKMpH(
    //      lat,
    //      long,
    //      heading,
    //      speedKmph,
    //      timeReport,
    //      timeCurrent,
    //      newLatLong
    // )
    var pos2 = {};
    DeltaPositionFromLastKnownLatLongBearingSpeedKMpH(
         pos.latitude,
         pos.longitude,
         pos.course,
         pos.speedKmph,
         pos.transmission_time,
         pos.transmission_time+(15*60),
         pos2
    );
    property.addSample(forward15min, Cesium.Cartesian3.fromDegrees( pos2.longitude, pos2.latitude));
    if ( typeof(outPolylineOptions) === 'object')
    {
        outPolylineOptions.positions = [
            Cesium.Cartesian3.fromDegrees( pos.longitude, pos.latitude),
            Cesium.Cartesian3.fromDegrees( pos2.longitude, pos2.latitude)
        ];
        outPolylineOptions.width = 2;
    }
    return property;
};
/**
 *
 * @param {JulianDate} currentJulianTime
 */
VColregsShip.prototype.updateEntity = function(currentJulianTime)
{
    if (this.mostRecentDynamicData !== null && this.staticShipData !== null) {
        if (this.entity === null) {
            var newEntityParams = this.createEntityParams();
            this.entity = this.viewerRef.entities.add(newEntityParams);
        }
        else {
            var stopTime = Cesium.JulianDate.clone(this.mostRecentDynamicData.time);
            var startTime = Cesium.JulianDate.clone(this.mostRecentDynamicData.time);
            Cesium.JulianDate.addMinutes(stopTime, 15, stopTime);
            Cesium.JulianDate.addMinutes(startTime, -15, startTime);
            Cesium.JulianDate.addMinutes(this.mostRecentDynamicData.time, 15, stopTime);
            this.entity.availability = (new Cesium.TimeIntervalCollection()).addInterval(
                new Cesium.TimeInterval({
                    start:startTime,
                    stop:stopTime
                })
            );
            this.entity.description = this.createDescription(currentJulianTime);
            var polylineOptions = {};
            this.entity.position = this.computeShipSampledPositionProperty(polylineOptions);
            this.entity.polyline = new Cesium.PolylineGraphics(polylineOptions);
            //this.entity.availability.start = this.mostRecentDynamicData.time;

            //console.log("-----------------");
            //console.log("julian " + this.mostRecentDynamicData.time + "unix " + this.mostRecentDynamicData.transmission_time);
            //console.log("julian " + this.viewerRef.clock.currentTime + "unix " + (Cesium.JulianDate.toDate(this.viewerRef.clock.currentTime).getTime()/1000));
            //console.log("julian " + stopTime + "unix " + (Cesium.JulianDate.toDate(stopTime).getTime()/1000));

            //this.entity.availability.stop = stopTime;

            var position = Cesium.Cartesian3.fromDegrees(this.mostRecentDynamicData.longitude, this.mostRecentDynamicData.latitude, 0.0);
            var heading = Cesium.Math.toRadians(this.mostRecentDynamicData.course);
            var pitch = 0;
            var roll = 0;
            var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
            //console.log("update orientation");
            this.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
            //console.log(this.entity.orientation);
            //console.log("orientation done");
            //var RandModelIndex = Math.floor(this.mostRecentDynamicData.transmission_time/10)%this.changeTestCount;
            //this.entity.model.uri = this.changeTest[RandModelIndex];
        }
    }
};

/**
 *
 * @param {number} currentUnixTime in seconds
 * @param {JulianDate} currentJulianTime
 * @returns {boolean} wheather the entity was actually updated this time
 */

VColregsShip.prototype.update = function(currentUnixTime, currentJulianTime)
{
    var pathPosIndex = this.path.getLastKnownPositionIndex(currentUnixTime);
    var tempPos = null;
    if (pathPosIndex > 0)
        tempPos = this.path.positions[pathPosIndex];
    if (tempPos !== null && (this.mostRecentDynamicData === null || tempPos.transmission_time !== this.mostRecentDynamicData.transmission_time))
    {
        //console.log(this.MMSI + " pathPosIndex = " + pathPosIndex + " currentUnixTime = " + currentUnixTime + " tempPos.transTime = " + tempPos.transmission_time);
        this.mostRecentDynamicData = tempPos;
        this.updateEntity(currentJulianTime);
        return true;
    }
    else {
        if (this.entity)
            this.entity.description = this.createDescription(currentJulianTime);
    }
    return false;
};

VColregsShip.prototype.onCloseStore = function()
{
    if (this.entity)
    {
        this.viewerRef.entities.remove(this.entity);
        this.entity = null;
    }
};

/**
 *
 * @param parameters
 * @param viewer
 *
 * @class COLREGSResolver
 * @class description used to calculate and visualise the COLREGS relations between ships
 * @property {object} defaultParameters not used at the moment, TODO remove
 * @property {Viewer} viewer reference to the Cesium viewer object that is used to add and remove visual objects from the cesium world
 * @property {object.<MMSI, VColregsShip>} visualShips associative data structure of MMSI's to objects that manage the visualisation of a single ship
 * @property {boolean} shipSelected used to toggle between calculating COLREGS and not
 * @property {number} colregsFocusMMSI used to
 * @property {number} safeDist in meters
 * @property {number[]} MMSIList list of MMSIs in visual ships with a numeric index used to limit the number of ships to be updated per fraim
 * @property {number} noOfShipsToUpdate
 * @property {null|function} onTickRemoveEventListener the call back retunred by viewer.clock.onTick.addEventListener that removes this event listener
 * @property {number} currentMMSIIndex
 * @property {number} mutexLock
 * @property {boolean} closing
 */

/**
 * @constructor
 * @param {object} parameters not used at the moment, but kept for consistency with the other resovers
 * @param {Viewer} viewer
 */

function COLREGSResolver( parameters, viewer ){

    this.defaultParameters = {}; //Object.assign( {}, defaultCOLREGSResolverParameters, parameters )
    this.viewer = viewer;
    this.safeDist = 500;
    this.visualShips = {};
    this.shipSelected = false;
    this.colregsFocusMMSI = -1;
    this.MMSIList = [];
    this.noOfShipsToUpdate = 100;
    this.currentMMSIIndex = 0;
    this.ColregsEvaluator = new closestApproachCalcCOLREGS();
    this.closing = false;
    this.onTickRemoveEventListener = this.viewer.clock.onTick.addEventListener(function(){this.onClockTick(this.viewer.clock.currentTime)}, this);
}


/*
default parameters used to construct cesium ship entities
just testing re branching
*
// !!!!!!!!!!not used at the moment!!!!!!!!!!!!!
var defaultCOLREGSResolverParameters = {

    model : {
        uri : 'assets/ShipGreen.gltf',
            minimumPixelSize : 20
    },

    //Show the path as a pink line sampled in 1 second increments.
    path : {
        resolution : 1,
            material : new Cesium.PolylineGlowMaterialProperty({
            glowPower : 0.1,
            color : Cesium.Color.BLUE
        }),
            width : 10
    }
};
//*/
/*
callback for when data is added to the ais store
*/
COLREGSResolver.prototype.dataAdded = function( changedMMSI, ais_store ){
    if (this.closing) return;
    for( var i = 0; i < changedMMSI.length; ++i ){
        var MMSI = changedMMSI[i];
        var ship = ais_store.getShipByMMSI( MMSI );

        if (!(MMSI in this.visualShips))
        {
            this.visualShips[MMSI] = new VColregsShip(this.viewer);
            this.MMSIList.push(MMSI);
        }
        this.visualShips[MMSI].updateData(ship,true);
    }
};


/*
 converts a ship into parameters to create an entity
 *
COLREGSResolver.prototype.createEntityFromShip = function( ship, parameters ){
    var position = this.computeShipSampledPositionProperty(ship);

    var entityParameters = {
        name: "MMSI: " + ship.MMSI,
        id: ship.MMSI,

        //Set the entity availability to the same interval as the simulation time.
        availability : new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
            start : ship.getMinTime(),
            stop : ship.getMaxTime()
        })]),

        //Use our computed positions
        position : position,

        //Automatically compute orientation based on position movement.
        orientation : new Cesium.VelocityOrientationProperty(position)
    };

    return Object.assign(entityParameters, parameters);
};
//*/
/*
 computes the path of the ship for the cesium ship entity
 *
COLREGSResolver.prototype.computeShipSampledPositionProperty = function( ship ){
    var property = new Cesium.SampledPositionProperty();
    for( var i = 0; i < ship.ais_voyages_dynamic.length; ++ i ){

        var message = ship.ais_voyages_dynamic[i];

        var position = Cesium.Cartesian3.fromDegrees(
            message.longitude,
            message.latitude);

        property.addSample(message.time, position);
    }
    return property;
};
//*/
/*
 computes the description of the ship to display when it is clicked in cesium
 *
COLREGSResolver.prototype.constructShipDescription = function( ship ){
    var items = "";
    var tShip = ship.ais_voyages_dynamic[0];
    for( var key in ship ){
        items += "<p><strong>" + key + "</strong>: " + tShip[key] + "</p>";
    }

    return "<p>" + items + "</p>";

};

//*/

COLREGSResolver.prototype.evaluate = function(selectedMMSI)
{
    if(selectedMMSI in this.visualShips) {
        var mostRecentShipPositionReports = {};
        for (var MMSI in this.visualShips) {
            if(this.visualShips[MMSI].mostRecentDynamicData != null) {
                mostRecentShipPositionReports[MMSI] = {
                    longitude : this.visualShips[MMSI].mostRecentDynamicData.longitude,
                    latitude : this.visualShips[MMSI].mostRecentDynamicData.latitude,
                    COG : this.visualShips[MMSI].mostRecentDynamicData.course,
                    SOG : this.visualShips[MMSI].mostRecentDynamicData.speedKmph*1.852,
                    unixTimeStamp : this.visualShips[MMSI].mostRecentDynamicData.transmission_time
                };
                this.visualShips[MMSI].setColregsState('default');
            }
        }
        var UTMPositionReportsForShipsWithin20km = calculateUTMPositionReportAtAPointInTimeForVeselsWthinRange(mostRecentShipPositionReports, selectedMMSI, 20000);
        var numberOfShipsInRange = Object.keys(UTMPositionReportsForShipsWithin20km).length;
        console.log("numberOfShipsInRange = " + numberOfShipsInRange)
        if (numberOfShipsInRange > 1) {
            var colregsEvaluation = this.ColregsEvaluator.evaluateEncounterOnGroup(selectedMMSI, UTMPositionReportsForShipsWithin20km, this.safeDist);
            for (MMSI in colregsEvaluation) {
                this.visualShips[MMSI].setColregsState(colregsEvaluation[MMSI].COLREGSState, colregsEvaluation[MMSI].statusDescription);

                //this.visualShips[MMSI].COREGSDesc = colregsEvaluation[MMSI].statusDescription; now done in setColregsState
            }
        }
    }
};

COLREGSResolver.prototype.processSelected = function ()
{
    if (this.shipSelected)
    {
        if (this.viewer.selectedEntity !== undefined) {

            if (!(this.viewer.selectedEntity.id in this.visualShips)) {
                this.colregsFocusMMSI = -1;
                this.shipSelected = false;
                for (var MMSI in this.visualShips) {
                    this.visualShips[MMSI].setColregsState("default");
                    this.visualShips[MMSI].COREGSDesc = "";
                }
                console.log("colregs focus reset");
            }
            if (this.currentMMSIIndex === 0)
            {
                this.evaluate(this.colregsFocusMMSI);
                console.log("colregs recalculating");
            }
        }
        else {
            this.colregsFocusMMSI = -1;
            this.shipSelected = false;
            for (var MMSI in this.visualShips) {
                this.visualShips[MMSI].setColregsState("default")
                this.visualShips[MMSI].COREGSDesc = "";
            }
            console.log("colregs focus reset");
        }
    }
    else
    {
        //if (this.viewer.selectedEntity === undefined)
        //{
        //    console.log("this.viewer.selectedEntity === undefined");
        //}
        //else {
        //    console.log("this.viewer.selectedEntity.id = " + this.viewer.selectedEntity.id);
        //}
        if (this.viewer.selectedEntity !== undefined && this.viewer.selectedEntity.id in this.visualShips)
        {
            //this.visualShips[this.viewer.selectedEntity.id].setColregsState("SELF");
            this.colregsFocusMMSI = this.viewer.selectedEntity.id;
            this.shipSelected = true;
            this.evaluate(this.colregsFocusMMSI);
            console.log("colregs focus selected = " + this.colregsFocusMMSI);
        }
    }
};

COLREGSResolver.prototype.doUpdate = function (newTime)
{

    if (this.closing) return;

    //reclassify everything
    //change colours of ships in viewer
    var currentJuliaDate = this.viewer.clock.currentTime;
    var unixTimeStamp = Cesium.JulianDate.toDate(currentJuliaDate).getTime()/1000;
    //console.log("tick time" + unixTimeStamp)
    //var unixTimeStamp = Cesium.JulianDate.toDate(newTime).getTime()/1000;
    //for (var MMSI in this.visualShips)
    //{
    //    this.visualShips[MMSI].update(unixTimeStamp);
    //}
    var count = 0;
    while (this.currentMMSIIndex < this.MMSIList.length && count < this.noOfShipsToUpdate)
    {
        this.visualShips[this.MMSIList[this.currentMMSIIndex]].update(unixTimeStamp, currentJuliaDate);
        this.currentMMSIIndex++;
        count++;
    }
    if (this.currentMMSIIndex == this.MMSIList.length) this.currentMMSIIndex = 0;
    this.processSelected();
};

/*
callback for when the timer is updated
*/
COLREGSResolver.prototype.onClockTick = function( newTime ){
    if (this.mutexLock > 0) return;
    this.mutexLock++;
    if (this.closing) return;
    this.doUpdate(newTime);
};

COLREGSResolver.prototype.onStoreTick = function(){
    if (this.closing) return;
    if (this.viewer)
        this.doUpdate(this.viewer.clock.currentTime);
};

COLREGSResolver.prototype.changeMinimumDistance = function( distance ){
	//reclassify everything
	//change colours of ships in viewer
};

COLREGSResolver.prototype.closeResolver = function()
{
    for (var MMSI in this.visualShips) {
        this.visualShips[MMSI].onCloseStore();
    }
    if(this.onTickRemoveEventListener !== null) this.onTickRemoveEventListener();
    this.visualShips = {};
    this.MMSIList = [];
    this.shipSelected = false;
    this.colregsFocusMMSI = -1;
    this.closing = true;
}

COLREGSResolver.prototype.onCloseStore = function() {
    this.closeResolver();
};

/**
 *
 * @param {number} newSafeDist
 */

COLREGSResolver.prototype.updateSafeDist = function(newSafeDist) {
    this.safeDist = newSafeDist;
};
