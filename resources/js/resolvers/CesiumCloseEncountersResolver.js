/**
  * @param parameters parameters for the CloseEncountersResolver.
  * @param userInfo.distance the maximum distance an position update can be from another position update to be considered a close encounter
  * @param userInfo.ais_client the ais client that is used to retrieve close encounters
  * @param userInfo.store the ais store
  * @param userInfo.viewer the cesium viewer to resolve
  */
function CloseEncountersResolver( parameters, viewer ){
  this.parameters = Object.assign( {}, defaultCloseEncountersResolverParameters, parameters )
  this.entities = []
}

/**
default parameters used to construct cesium ship entities
*/
var defaultCloseEncountersResolverParameters = {
  distance: 1000//meters
}

/**
callback for when data is added to the ais store
*/
CloseEncountersResolver.prototype.dataAdded = function( changedMMSI, store ){
	//do nothing wait until all of the data is loaded
}

/**
callback for when all of the AIS store has stopped downloading data
*/
CloseEncountersResolver.prototype.dataFinished = function( store ){
	console.log("CloseEncountersResolver.prototype.dataFinished")
	this.invalidate()
}

CloseEncountersResolver.prototype.setDistance = function(newDistance ){
	this.parameters.distance = newDistance
	this.invalidate()
}

/**
callback for when the close encounters are returned from the server
*/
CloseEncountersResolver.prototype.onReceiveInterestingIncidents = function(data){
	//remove all of the old interesting incidents	
	this.entities.forEach(function(entity){
		this.parameters.viewer.entities.remove(entity)
	}.bind(this));
	
	this.entities = []
	
	console.log("onReceiveInterestingIncidents")
	console.log(data)
	//create a marker for each interesting incident	
	data.forEach(function(ii, idx){
		
		var entity = this.parameters.viewer.entities.add({
		  position: Cesium.Cartesian3.fromDegrees(ii.longitude, ii.latitude),
		  ellipse : {
			semiMinorAxis : this.parameters.distance,
			semiMajorAxis : this.parameters.distance,
			material : Cesium.Color.BLUE.withAlpha(0.2)
		  }
		});
		entity.description = constructCloseEncounterDescription(ii, this.parameters.distance);
		this.entities.push(entity)		
		
		var entity = this.parameters.viewer.entities.add({
			id: "interesting incident - " + idx,
			position: Cesium.Cartesian3.fromDegrees(ii.longitude, ii.latitude),
			point : {
				pixelSize : 10,
				color : Cesium.Color.YELLOW
			}
		});
		
		entity.description = constructCloseEncounterDescription(ii, this.parameters.distance);
		
		this.entities.push(entity)	
		
	}.bind(this));
}

function constructCloseEncounterDescription( ii, distance ){
  var items = ""
   
  items += "<p><strong>" + "MMSI" + "</strong>: " + ii.MMSI + "</p>"
  items += "<p><strong>" + "distance" + "</strong>: " + distance + "meters </p>"
  items += "<p><strong>" + "time_stamp_system" + "</strong>: " + ii.time_stamp_system + "</p>"
  items += "<p><strong>" + "latitude" + "</strong>: " + ii.latitude + "</p>"
  items += "<p><strong>" + "longitude" + "</strong>: " + ii.longitude + "</p>"
  items += "<p><strong>" + "navigation_status" + "</strong>: " + ii.navigation_status + "</p>"

  var list = "<p>" + items + "</p>"

  return list
}


CloseEncountersResolver.prototype.invalidate = function( ){
	//search for interesting incidents
	this.parameters.ais_client.getResources({
		resource: "ii_close_encounters",
		filter: Object.assign({}, this.parameters.store.filter, {distance: this.parameters.distance} ),
		onSuccess: this.onReceiveInterestingIncidents.bind(this),
		onFail: function( error ){ console.log(error); }		
	});
}




