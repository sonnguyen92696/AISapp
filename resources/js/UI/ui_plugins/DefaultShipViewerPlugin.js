/**
 * @class DefaultShipViewerPlugin
 * @classDesc this plugin loads the default ship viewer resolvers and ui
 * @type {Plugin}
 * @constructor
 */
function DefaultShipViewerPlugin(){
    this.name = "DefaultShipViewerPlugin";
    this.displayName = "Default View";
}

DefaultShipViewerPlugin.prototype.getDetailsHTML = function() {
    return 'This is the default viewer.';
};

DefaultShipViewerPlugin.prototype.getParameters = function() {
    return {};
};

DefaultShipViewerPlugin.prototype.applyUIDetails = function(application, parameters) {
};

DefaultShipViewerPlugin.prototype.applyPlugin = function(application, parameters){
    console.log("DefaultShipViewerPlugin.applyAISViewer: ");
    application.clearResolvers();

    if(!application.store) return;//need the store to do the rest of the loading

    //add the path ship viewer resolver
    var shipViewTypeResolver = new ShipResolver({}, application.viewer);
    application.store.register(shipViewTypeResolver );
    application.resolvers.push(shipViewTypeResolver);

    //add a view resolver that will reposition the camera
    var viewResolver = new ViewerResolver(application.viewer);
    application.store.register(viewResolver);
    application.resolvers.push(viewResolver);
};
