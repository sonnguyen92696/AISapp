/**
 * Created by j2thompson on 06/06/2017.
 */

/**
 * @enum { String }
 */
var APPLICATION_STATES = {
    EMPTY: "empty",
    LOADING: "loading",
    LOADED: "loaded"
};

/**
 * @class Application
 * @classDescription ...
 * @property {AIS_Client} ais_client
 * @property {null|AISStore} store
 * @property {object[]} resolvers
 * @property {APPLICATION_STATES} state
 * @property {Cesium.Viewer} viewer
 *
 * @constructor
 * @param {object} parameters
 */
function Application(parameters) {

    this.ais_client = parameters.api;
    this.state = APPLICATION_STATES.EMPTY;

    Cesium.BingMapsApi.defaultKey = "AgPiiYJxenn6wUtrNpRc2Om2HBSzI1PeUdPNkyvhvOSAhCXvLCMjC3swWtpaVs6j"
    this.viewer = new Cesium.Viewer('cesium',{infoBox : false});

    //this is the event listener to display the entity information in the information pane
    this.viewer.selectedEntityChanged.addEventListener(function(el){

        $("#vessel_information > .contents").html(this.viewer.selectedEntity.description.getValue() || "no information available" );
        $("#vessel_information_modal").dialog();

    }, this);


    this.store = null;
    this.resolvers = [];
    this.plugins = {};
    this.currentPlugin = null;

    //load all of the plugins

    this.loadPlugin(new DefaultShipViewerPlugin());//the first plugin is loaded as the default
    this.loadPlugin(new CloseInterestingIncidentsPlugin());
    this.loadPlugin(new COLREGSPlugin());
}



//region Plugins
/**
 * A plugin contains all of the functionality to be a view overlay that is accessible from the misc panel drop down.
 * Only one plugin can be active at a time.
 *
 * @typedef {object} Plugin
 * @property {string} name unique name of the plugin
 * @property {string} displayName the name of the plugin to be displayed in the UI
 * @property {function()} getDetailsHTML returns the plugins ui as HTML in a string
 * @property {function()} getParameters returns an object which contains all of the parameters extracted from the HTML UI
 * @property {function(Application, object)} applyUIDetails signals that the plugin should apply the 2nd parameter to its state
 * @property {function(Application)} applyPlugin signals that the plugin should load itself into the application
 * @property {function(Application)} onDeactivate called when the plugin is about to be unloaded
 */

/**
 *
 * @param {Plugin} plugin
 */
Application.prototype.loadPlugin = function(plugin){
    //save the plugin to the menu
    appendOptionToSelect(plugin.name, plugin.displayName || plugin.name || "No name set", "selectmenuView");
    this.plugins[plugin.name] = plugin;

    //automatically bind all of the functions to the plugin
    bindIfPresent("getDetailsHTML", plugin);
    bindIfPresent("getParameters", plugin);
    bindIfPresent("applyUIDetails", plugin);
    bindIfPresent("applyPlugin", plugin);
    bindIfPresent("onDeactivate", plugin);

    this.currentPlugin = this.currentPlugin || plugin;
};

Application.prototype.changeToView = function(pluginName){
    if(!(pluginName in this.plugins)){
        console.error("no such plugin '" + pluginName + "'");
        return;
    }

    if( !!this.currentPlugin && ("onDeactivate" in this.currentPlugin)){
        this.currentPlugin.onDeactivate(this);
    }

    this.currentPlugin = this.plugins[pluginName];

    $("#viewControlPanel").html(this.currentPlugin.getDetailsHTML());
    this.currentPlugin.applyPlugin(this, this.currentPlugin.getParameters());

    console.log("Application: applied plugin " + pluginName);
};

Application.prototype.applyUIDetails = function(pluginName){

    if( !this.currentPlugin ){
        console.warn("Application: there is no current plugin to applyUIDetails");
        return;
    }

    if("applyUIDetails" in this.currentPlugin){
        var parameters = this.currentPlugin.getParameters();
        this.currentPlugin.applyUIDetails(this, parameters);

        console.log("Application: applyUIDetails to " + this.currentPlugin.name + " with parameters " + JSON.stringify(parameters));
    }
};

Application.prototype.reloadCurrentPlugin = function(){
    if (!this.currentPlugin) return;

    this.currentPlugin.applyPlugin(this, this.currentPlugin.getParameters());
};
//endregion


Application.prototype.clearResolvers = function(){

    var store = this.store;
    this.resolvers.forEach(function(r){
        store.unregister(r);
    });

    this.resolvers = [];
    this.viewer.entities.removeAll();

};

Application.prototype.clearCesiumAndData = function() {

    if (this.state === APPLICATION_STATES.EMPTY) return;

    if (this.state === APPLICATION_STATES.LOADING
        || this.state === APPLICATION_STATES.LOADED){
        this.store.close();
        this.viewer.entities.removeAll();
        this.state = APPLICATION_STATES.EMPTY;
        this.clearResolvers();
        return;
    }
};

/**
 * @param {object} scenario
 * @param {number} scenario.idsession
 * @param {string} scenario.time_start
 * @param {string} scenario.time_end
 * @param {number} scenario.lat1
 * @param {number} scenario.lat2
 * @param {number} scenario.long1
 * @param {number} scenario.long2
 *
 */
Application.convertScenarioIntoFilter = function( scenario ){
    console.log(scenario)
    var filter = { session: scenario.idsession };
    //TODO: the webservice is not handling since and till correctly, so until it is fixed, we will disable those parameters
/*
    if( "time_start" in scenario && "time_end" in scenario ){
        filter.since = Math.round(parseDate(scenario.time_start).getTime()/1000);
        filter.till = Math.round(parseDate(scenario.time_end).getTime()/1000);
    }

    if( "lat1" in scenario
        && "lat2" in scenario
        && "long1" in scenario
        && "long2" in scenario ){

        filter.lat1 = scenario.lat1;
        filter.lat2 = scenario.lat2;
        filter.long1 = scenario.long1;
        filter.long2 = scenario.long2;
    }
*/
    return filter;
};

/**
 *
 * @param {object} filter
 * @param {number} filter.scenarioID
 */
Application.prototype.loadScenarioIntoCesium = function (filter){
    this.clearCesiumAndData();
    this.state = APPLICATION_STATES.LOADING;

    this.ais_client.getScenarios(
        filter.scenarioID,
        function(data){
            this.store = new AISStore( this.ais_client );
            this.store.setFilter(AISStore.noId, Application.convertScenarioIntoFilter(data[0]));
            this.store.register(this);
        }.bind(this),
        function (error) {
            this.state = APPLICATION_STATES.EMPTY;
        });
};

Application.prototype.dataFinished = function(){
    this.state = APPLICATION_STATES.LOADED;
    this.reloadCurrentPlugin();
};

/**
 *
 * @param {object} filter
 * @param {number} filter.latMin
 * @param {number} filter.latMax
 * @param {number} filter.longMin
 * @param {number} filter.longMax
 * @param {date} filter.timeStart
 * @param {date} filter.timeEnd
 */
Application.prototype.applySpaceTimeFilter = function(filter){
    console.log("Application.applySpaceTimeFilter: ");
};


/**
 * @param {updateFilters} callback
 */
Application.prototype.beginSelectOnMap = function (callback){
    console.log("Application.beginSelectOnMap: ");
    if(this.store !== null)
    {
        this.store.postEvent({
            name:'beginSelectOnMap',
            updateFilters:callback
        })
    }
};

/**
 * @param {updateTextField} callback
 * @param {boolean} begin
 */
Application.prototype.pickTimeOnTimeLine = function (callback,begin){
    console.log("Application.pickTimeOnTimeLine: ");
    if(this.store !== null)
    {
        if(begin) {
            this.store.postEvent({
                name: 'beginPickOnTimeLine',
                updateTextField: callback
            });
        }
        else {
            this.store.postEvent({
                name: 'endPickOnTimeLine',
                updateTextField: callback
            });
        }
    }
};
/**
 *
 * @param {object} filter
 * @param {string} [filter.latMin]
 * @param {string} [filter.latMax]
 * @param {string} [filter.longMin]
 * @param {string} [filter.longMax]
 */
Application.prototype.latLongFilterUpdate = function(filter)
{
    this.store.postEvent({
        name: 'latLongFilterUpdate',
        filter:filter
    });
};

/**
 *
 * @param {object} filter
 * @param {string} [filter.latMin]
 * @param {string} [filter.latMax]
 * @param {string} [filter.longMin]
 * @param {string} [filter.longMax]
 * @param {string} [filter.timeStart]
 * @param {string} [filter.timeEnd]
 */
Application.prototype.applyFilters = function(filter)
{
    console.log('event applyFilters fired, filter = ');
    console.log(filter);
    this.store.postEvent({
        name: 'applyFilters',
        filter:filter
    });
};
