
/**
 * @class SelectRegion
 * @classDescription this class facilitates the user clicking on the cesium map to select a restricted region to receive ship positions
 *
 * @property {number} isPicking
 * @property {null|ScreenSpaceEventHandler} handler_PickingFilterHover
 * @property {null|ScreenSpaceEventHandler} handler2_PickingFilterClick
 * @property {boolean} firstPicking
 * @property {null|Entity} entityLabel
 * @property {Viewer} viewer
 * @property {Entity} entityFilterRectangle
 * @property {boolean} entityFilterRectangleSet
 * @property {boolean} showFilterRegionOnMap
 * @property {object} UIObjectIDS
 * @property {string} UIObjectIDS.longMinInputFieldID
 * @property {string} UIObjectIDS.longMaxInputFieldID
 * @property {string} UIObjectIDS.latMinInputFieldID
 * @property {string} UIObjectIDS.latMaxInputFieldID
 * @property {null|function} removePickTimeEventListener
 *
 * @constructor
 * @param {Viewer} viewer cesium viewer
 */

function SelectRegion(viewer) {
    this.isPicking = 0;
    this.handler_PickingFilterHover = null;
    this.handler2_PickingFilterClick = null;
    this.firstPicking = true;
    this.entityLabel = null;
    this.viewer = viewer;
    this.entityFilterRectangle = null;
    this.entityFilterRectangleSet = false;
    this.showFilterRegionOnMap = false;

    this.removePickTimeEventListener = null;

    this.regionParams = {
          longMin:0
        , longMax:0
        , latMax:0
        , latMin:0
    }
}
/**
 * event handling function that is bound to the cesium mouse click function
 * this function updates the current picking state which lets handleMovement know when the user has selected a lat long position
 * also wipes the event handles once the user has clicked twice and calls updateShowOnMap() to update the current filter state
 * while the user is performing a select filter region on map operation
 */
SelectRegion.prototype.handleClick = function(filterUICallback)
{
    if (this.isPicking > 0)
    {
        this.isPicking = this.isPicking - 1;
        if (this.isPicking <= 0)
        {
            this.handler_PickingFilterHover = null;
            this.handler2_PickingFilterClick = null;
            this.updateShowOnMap(true);
            this.viewer.entities.remove(this.entityLabel);
            this.entityLabel = null;
        }
    }
};
/**
 * event handling function that is bound to the cesium mouse move function
 * updates the min lat long or max lat long in the UI depending on which one the user is currently picking
 * while the user is performing a select filter region on map operation
 * @param {object} movement
 * @param {updateFilters} filterUICallback
 */
SelectRegion.prototype.handleMovement = function(movement, filterUICallback)
{
    if (this.isPicking > 0)
    {
        var cartesian = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (cartesian) {
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4);
            var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4);

            this.entityLabel.position = cartesian;
            this.entityLabel.label.show = true;
            this.entityLabel.label.text =
                'Lon: ' + ('   ' + longitudeString).slice(-8) + '\u00B0' +
                '\nLat: ' + ('   ' + latitudeString).slice(-8) + '\u00B0';
        } else {
            this.entityLabel.label.show = false;
        }
        if (this.isPicking == 2)
        {
            this.regionParams.longMin = Number(longitudeString);
            this.regionParams.latMax = Number(latitudeString);

            this.regionParams.long1 = Number(longitudeString);
            this.regionParams.lat1 = Number(latitudeString);

            filterUICallback(this.regionParams);
            //$(this.UIObjectIDS.longMinInputFieldID).val(longitudeString);
            //$(this.UIObjectIDS.latMaxInputFieldID).val(latitudeString);
        }
        else if (this.isPicking == 1)
        {

            this.regionParams.long2 = Number(longitudeString);
            this.regionParams.lat2 = Number(latitudeString);

            this.regionParams.longMin = Math.min(this.regionParams.long1, this.regionParams.long2);
            this.regionParams.longMax = Math.max(this.regionParams.long1, this.regionParams.long2);
            this.regionParams.latMin = Math.min(this.regionParams.lat1, this.regionParams.lat2);
            this.regionParams.latMax = Math.max(this.regionParams.lat1, this.regionParams.lat2);

            filterUICallback(this.regionParams);
            this.updateShowOnMap(true);
            //$(this.UIObjectIDS.longMaxInputFieldID).val(longitudeString);
            //$(this.UIObjectIDS.latMinInputFieldID).val(latitudeString);
        }
    }
};

/**
 * the function that is bound to the select on map function in the UI
 * this function resets the min and max, lat and long, and binds handleClick and handleMovement to there respective cesium mouse events
 * @param {updateFilters} filterUICallback
 */
SelectRegion.prototype.Select_on_Map = function (filterUICallback)
{
    //design decision changed, we no longer want this calss to have to know about the IDs of UI objects
    //$("#long-min").val(0);
    //$("#long-max").val(0);
    //$("#lat-min").val(0);
    //$("#lat-max").val(0);

    this.regionParams = {
          longMin:0
        , longMax:0
        , latMax:0
        , latMin:0
    };
    filterUICallback(this.regionParams);
    this.isPicking = 2;
    this.entityLabel = this.viewer.entities.add({
        label : {
              show : false
            , showBackground : true
            , font : '18px monospace'
            , horizontalOrigin : Cesium.HorizontalOrigin.LEFT
            , verticalOrigin : Cesium.VerticalOrigin.TOP
            , pixelOffset : new Cesium.Cartesian2(15, 0)
        }
    });
    this.removeEntityFilterRectangle();
    // Mouse over the globe to see the cartographic position
    var thisPointer = this; // needed for event handlers
    if (this.firstPicking)
    {
        this.handler_PickingFilterHover = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler_PickingFilterHover.setInputAction(
            function (movement) {thisPointer.handleMovement(movement, filterUICallback);}
            , Cesium.ScreenSpaceEventType.MOUSE_MOVE
        );
        this.handler2_PickingFilterClick = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler2_PickingFilterClick.setInputAction(
            function(){thisPointer.handleClick(filterUICallback);}
            , Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
        this.firstPicking = false;
    }
};
/**
 * remove the visualisation of the filter region rectangle
 */

SelectRegion.prototype.removeEntityFilterRectangle = function ()
{
    if (this.entityFilterRectangleSet)
    {
        this.viewer.entities.remove(this.entityFilterRectangle);
        this.entityFilterRectangleSet = false;
    }
};
/**
 * remove the old and place a new rectangle who's edges mach the current filter region
 * the colour will be red if the boundaries are bad
 *  west decimal degrees longitude of the western edge of the filter region
 *  south decimal degrees latitude of the southern edge of the filter region
 *  east decimal degrees longitude of the eastern edge of the filter region
 *  north decimal degrees latitude of the northern edge of the filter region
 */
SelectRegion.prototype.entityFilterRectangleUpdate = function ()
{
    //Cesium.Color.RED.withAlpha(0.8)
    //Cesium.Color.YELLOWGREEN.withAlpha(0.8)
    var material = Cesium.Color.YELLOWGREEN.withAlpha(0.8)
    var west = 0;  // longMin
    var south = 0; // latMin
    var east = 0;  // longMax
    var north = 0; // latMax

    if (this.regionParams.latMin < this.regionParams.latMax)
    {
        south = this.regionParams.latMin;
        north = this.regionParams.latMax;
    }
    else
    {
        material = Cesium.Color.RED.withAlpha(0.8); // max should not be equal or less than min
        north = this.regionParams.latMin;
        south = this.regionParams.latMax;
    }

    if (this.regionParams.longMin < this.regionParams.longMax)
    {
        west = this.regionParams.longMin;
        east = this.regionParams.longMax;
    }
    else
    {
        material = Cesium.Color.RED.withAlpha(0.8); // max should not be equal or less than min
        east = this.regionParams.longMin;
        west = this.regionParams.longMax;
    }
    this.removeEntityFilterRectangle();
    this.entityFilterRectangle = this.viewer.entities.add({
        id : "entityFilterRectangle",
        name : 'Filter Rectangle',
        polyline : {
            width : 2.0,
            positions : Cesium.Cartesian3.fromDegreesArrayHeights([
                west, north, 1000.0,
                east, north, 1000.0,
                east, south, 1000.0,
                west, south, 1000.0,
                west, north, 1000.0
            ]),
            material : material
        }
    });
    this.entityFilterRectangleSet = true;
};
/**
 *
 * @param {boolean} show
 */
SelectRegion.prototype.updateShowOnMap = function(show)
{
    if (show)
    {
        this.entityFilterRectangleUpdate();
    }
    else
    {
        this.removeEntityFilterRectangle();
    }
};
/**
 *
 * @param {updateTextField} callback
 */
SelectRegion.prototype.pickTime = function(callback)
{
    console.log("SelectRegion pickTime");
    if (this.removePickTimeEventListener !== null ) this.removePickTimeEventListener();
    var currentDateTimeString1 = Cesium.JulianDate.toIso8601(this.viewer.clock.currentTime,0);
    callback(currentDateTimeString1);
    console.log("SelectRegion pickTime current time -- " + currentDateTimeString1);

    this.removePickTimeEventListener = this.viewer.clock.onTick.addEventListener(function (){
        var currentDateTimeString2 = Cesium.JulianDate.toIso8601(this.viewer.clock.currentTime,0);
        callback(currentDateTimeString2);
    }, this)
};
/**
 *
 * @param {updateTextField} callback
 */
SelectRegion.prototype.stopPickTime = function(callback)
{
    console.log("SelectRegion stopPickTime");
    if (this.removePickTimeEventListener !== null ) this.removePickTimeEventListener()
    this.removePickTimeEventListener = null;
};
/**
 *
 * @param {object} filter
 * @param {string} [filter.latMin]
 * @param {string} [filter.latMax]
 * @param {string} [filter.longMin]
 * @param {string} [filter.longMax]
 */
SelectRegion.prototype.latLongFilterUpdate = function(filter)
{
    this.regionParams.latMin = filter.latMin;
    this.regionParams.latMax = filter.latMax;
    this.regionParams.longMin = filter.longMin;
    this.regionParams.longMax = filter.longMax;
    this.updateShowOnMap(true);
};
