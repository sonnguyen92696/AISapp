/**
  * @param parameters parameters for the CloseIntervalsResolver.
  * @param userInfo.distance the maximum distance an position update can be from another position update to be considered a close encounter
  * @param userInfo.ais_client the ais client that is used to retrieve close encounters
  * @param userInfo.store the ais store
  * @param userInfo.viewer the cesium viewer to resolve
  * @field {object[]} incidents
  * @field {object[]} listener
  */
function CloseIntervalsResolver( parameters, viewer ){
  this.parameters = Object.assign( {}, defaultCloseIntervalsResolverParameters, parameters )
  this.entities = [];
  this.incidents = [];
  this.listeners = [];
}

/**
default parameters used to construct cesium ship entities
*/
var defaultCloseIntervalsResolverParameters = {
    distance: 1000,//meters
    maxSeconds: 30,
    sampleTime: 7,
    colors:[
        Cesium.Color.CRIMSON,
        Cesium.Color.DARKGOLDENROD,
        Cesium.Color.LAWNGREEN,
        Cesium.Color.DARKMAGENTA,
        Cesium.Color.DARKORANG,
        Cesium.Color.HOTPINK,
        Cesium.Color.WHEAT,
        Cesium.Color.DARKGREEN,
    ],

}

/**
callback for when data is added to the ais store
*/
CloseIntervalsResolver.prototype.dataAdded = function( changedMMSI, store ){
	//do nothing wait until all of the data is loaded
}

/**
callback for when all of the AIS store has stopped downloading data
*/
CloseIntervalsResolver.prototype.dataFinished = function( store ){
	this.invalidate()
}

CloseIntervalsResolver.prototype.applyParameters = function(parameters){
	this.parameters.distance = parameters.distance || this.parameters.distance;
	this.parameters.maxSeconds = parameters.maxSeconds || this.parameters.maxSeconds;
	this.invalidate()
}

/**
callback for when the close encounters are returned from the server
 @param {object[]} data a collection of interesting incidents
*/
CloseIntervalsResolver.prototype.onReceiveInterestingIncidents = function(data){


	//create a marker for each interesting incident

	data.forEach(function(ii, idx){
		for( var el in ii.MMSI){

            var shipEntitiy = this.parameters.viewer.entities.getById( el );

            //sample the path during the interesting interval
            var time = Cesium.JulianDate.clone( ii.startTime, new Cesium.JulianDate() );
            var locations = [];

            var duration = getSecondsDifference(ii.startTime, ii.endTime);


            sampleTime = (duration / this.parameters.sampleTime > 20)
                ? duration / 20
                : this.parameters.sampleTime;


            while( Cesium.JulianDate.lessThan( time, ii.endTime )){
                var position = shipEntitiy.position.getValue(time);
                Cesium.JulianDate.addSeconds(time, sampleTime, time);
                if( !position ) { console.log("CloseIntervalsResolver: found undefined position for MMSI: " + el + " at " + time.toString() ); continue; }
                locations.push(position);
            }

            var position = shipEntitiy.position.getValue(ii.endTime);
            if( !!position ) {
                locations.push(position);
            }

            if(locations.length == 0){ continue; }

            var arrow = this.parameters.viewer.entities.add({
                polyline : {
                    positions : locations,
                    width : 25,
                    followSurface : true,
                    material : new Cesium.PolylineArrowMaterialProperty(
                        this.parameters.colors[idx % this.parameters.colors.length])
                }
            });
            arrow.addProperty("incidentId");
            arrow.incidentId = idx;
            arrow.description = constructCloseIntervalDescription(ii, this.parameters.distance)
            this.entities.push(arrow);

		}
	}.bind(this));

	this.incidents = data.slice();

  this.notifyListeners("onLoadedIncidents", this);
}

/**
* this function will color the polylines with the incidentId == emphasisIdx red and the rest GRAY
*
*/
CloseIntervalsResolver.prototype.emphasizeIncident = function(emphasisIdx){

  for( var i = 0; i < this.entities.length; ++i ){
    var el = this.entities[i];

    var colour = ((el.incidentId == emphasisIdx)
      ? Cesium.Color.CRIMSON
      : Cesium.Color.fromAlpha( Cesium.Color.GRAY, 0.3));

    var arrow = this.parameters.viewer.entities.add({
        polyline : {
            positions : el.polyline.positions,
            width : el.polyline.width,
            followSurface : el.polyline.followSurface,
            material : new Cesium.PolylineArrowMaterialProperty(colour)
        }});

    arrow.addProperty("incidentId");
    arrow.incidentId = el.incidentId;

    this.parameters.viewer.entities.remove(el);
    this.entities[i] = arrow;
  }
};


CloseIntervalsResolver.prototype.notifyListeners = function(eventName, parameters){
  var count = 0;
  this.listeners.forEach(function(el){
    if(eventName in el){
      el[eventName](parameters);
      count += 1;
    }
  });

  console.log("CloseIntervalsResolver: notify "+count+ " listeners of '" + eventName + "'");
}

CloseIntervalsResolver.prototype.registerListener = function(listener){
  if (this.listeners.indexOf(listener) < 0) {
    this.listeners.push(listener);
  }
}

function constructCloseIntervalDescription( ii, distance ){
  var items = ""

    items += "<p><strong>" + "MMSI" + "</strong>: </p><ul>";
   for( var mmsi in ii.MMSI ){
       items += "<li>" + mmsi + "</li>";
   }
    items += "</ul>";
    items += "<p><strong>" + "distance" + "</strong>: " + distance + "meters</p>"
    items += "<p><strong>" + "start time" + "</strong>: " + ii.startTime.toString() + "</p>"
    items += "<p><strong>" + "end time" + "</strong>: " + ii.endTime.toString() + "</p>"

  var list = "<p>" + items + "</p>"

  return list
}


CloseIntervalsResolver.prototype.invalidate = function( ){

  //remove all of the old interesting incidents
	this.entities.forEach(function(entity){
		this.parameters.viewer.entities.remove(entity)
	}.bind(this));

	this.entities = [];

	//search for interesting incidents
	this.parameters.ais_client.getResources({
		resource: "ii_close_encounters",
		filter: Object.assign({}, this.parameters.store.filter, {distance: this.parameters.distance, maxSeconds: this.parameters.maxSeconds} ),
		onSuccess: this.onReceiveInterestingIncidents.bind(this),
		onFail: function( error ){ console.log(error); }
	});
}
