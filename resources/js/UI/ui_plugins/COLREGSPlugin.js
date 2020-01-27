/**
 * @class COLREGSPlugin
 * @classDesc this plugin loads the colregs resolvers and ui
 * @property {string} name
 * @property {string} displayName
 * @property {null|COLREGSResolver} ColResolver
 * @type {Plugin}
 * @constructor
 */
function COLREGSPlugin(){
    this.name = "COLREGSPlugin";
    this.displayName = "COLREGS";
    this.ColResolver = null;
}

COLREGSPlugin.prototype.getDetailsHTML = function() {
    return '<label for="COLREGSPlugin_input_distance">Minimum distance </label> <input type="text" style="margin-left: 5px; margin-right:5px;" id="COLREGSPlugin_input_distance" class="fill10" value="500">';
};

COLREGSPlugin.prototype.getParameters = function() {
    return {distance: parseFloat($("#COLREGSPlugin_input_distance").val())};
};

COLREGSPlugin.prototype.getParameters = function()
{
    if(this.ColResolver !== null)
    {
        this.ColResolver.closeResolver();
    }
};

COLREGSPlugin.prototype.applyUIDetails = function(application, parameters) {
    //TODO: update the COLREGS resolver
    console.log("TODO: COLREGSPlugin.prototype.applyUIDetails");
    this.ColResolver.updateSafeDist(Number(parameters.distance));
};

COLREGSPlugin.prototype.applyPlugin = function(application, parameters){
    console.log("COLREGSPlugin.applyCOLREGS: ");
    application.clearResolvers();

    if(!application.store) return;//need the store to do the rest of the loading

    //add the colregs view resolver
    var colregsResolver = new COLREGSResolver( {}, application.viewer );
    this.ColResolver = colregsResolver
    application.store.register(colregsResolver);
    application.resolvers.push(colregsResolver);

    //add a view resolver that will reposition the camera
    var viewResolver = new ViewerResolver(application.viewer);
    application.store.register(viewResolver);
    application.resolvers.push(viewResolver);
};
