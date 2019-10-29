/**
 * @class ViewerResolver
 * @classDescription updates the cesium viewer in response to data changes in the AIS data store
 * @property {Viewer} viewer
 * @property {boolean} shouldTriggerUpdate
 * @property {number} priority
 * @property {SelectRegion} SelectRegionHandler
 * @property {null|AISStore} ref_ais_store
 */
/**
 * @constructor
 * @param {Viewer} viewer
 *
 */
function ViewerResolver(viewer) {
  this.viewer = viewer;
  this.shouldTriggerUpdate = true;
  this.priority = -1000;
  this.SelectRegionHandler = new SelectRegion(viewer);
  this.ref_ais_store = null;
}

/*
 callback for when data is added to the ais store
 */
ViewerResolver.prototype.dataAdded = function( changedMMSI, ais_store ){
    console.log("ViewerResolver: dataAdded " + JSON.stringify(changedMMSI));
    //update the time range on the viewer
    var minTime = ais_store.getMinTime();
    var maxTime = ais_store.getMaxTime();

    this.viewer.timeline.zoomTo(minTime, maxTime);
    console.log("ViewerResolver: changing timeline to " + minTime.toString() + ", " + maxTime.toString() );

    if(!this.shouldTriggerUpdate) { return }

    if( minTime === null || maxTime === null ){ return }

    this.viewer.clock.currentTime = minTime;

    console.log("ViewerResolver: about to zoom to entities " + this.viewer.entities.values.length);

    if (this.viewer.entities.values.length > 0){
      this.viewer.zoomTo(this.viewer.entities.values)
          .then( function(){this.viewer.camera.moveBackward(20000);}.bind(this) );
      this.shouldTriggerUpdate = false//should only be called once to initialise
    }

};
/**
 *
 * @param {object} event
 * @param {string} event.name
 * @param {function} [event.updateFilters]
 * @param {function} [event.updateTextField]
 * @param {object} [event.filter]
 */
ViewerResolver.prototype.handleEvent = function(event)
{
    console.log ("ViewerResolver handleEvent " + event.name);
    if(event.name === 'beginSelectOnMap')
    {
        // event.updateFilters is of type 'updateFilters' as defined in Tools_UI.js
        this.SelectRegionHandler.Select_on_Map(event.updateFilters);
    }
    else if(event.name === 'beginPickOnTimeLine')
    {
        this.SelectRegionHandler.pickTime(event.updateTextField);
    }
    else if(event.name === 'endPickOnTimeLine')
    {
        this.SelectRegionHandler.stopPickTime(event.updateTextField);
    }
    else if (event.name === 'latLongFilterUpdate')
    {
        this.SelectRegionHandler.latLongFilterUpdate(event.filter);
    }
};

ViewerResolver.prototype.storePreRegisterEvent = function(ais_store)
{
    this.ref_ais_store = ais_store
};