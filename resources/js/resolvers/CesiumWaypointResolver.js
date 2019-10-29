/**
  * @param parameters parameters for the CesiumWaypointResolver.
  * @param userInfo.distance the maximum distance an position update can be from another position update to be considered a close encounter
  * @param userInfo.ais_client the ais client that is used to retrieve close encounters
  * @param userInfo.store the ais store
  * @param userInfo.viewer the cesium viewer to resolve
  */
function CesiumWaypointResolver( parameters, viewer ){
  this.parameters = Object.assign( {}, defaultCesiumWaypointResolverParameters, parameters )
  this.entities = []
}

/**
default parameters used to construct cesium ship entities
*/
var defaultCesiumWaypointResolverParameters = {
	distance: 1000,//meters
	point : {
		pixelSize : 10,
		color : Cesium.Color.GREEN
	}
}

/**
callback for when data is added to the ais store
*/
CesiumWaypointResolver.prototype.dataAdded = function( changedMMSI, store ){
	//do nothing wait until all of the data is loaded
	  for( var i = 0; i < changedMMSI.length; ++i ){
		var MMSI = changedMMSI[i]
		var ship = store.getShipByMMSI( MMSI )
		
		if( ship.getMinTime() == null || ship.getMaxTime() == null ){ continue; }
		
		for( var j = 0; j < ship.ais_voyages_dynamic.length; ++j ){
			
			var waypoint = ship.ais_voyages_dynamic[j]
			var id = "waypoint-" + j + "-" + MMSI
			var entity = this.parameters.viewer.entities.getById( id )

			if( entity != undefined ){ continue; }
			
			var entityParameters = {
			  id: id,
			  position: Cesium.Cartesian3.fromDegrees(waypoint.longitude, waypoint.latitude),
			}
			var entity = this.parameters.viewer.entities.add(Object.assign(entityParameters, defaultCesiumWaypointResolverParameters));
			entity.description = constructWaypointDescription(waypoint)
		}
	}
}

function constructWaypointDescription( ii ){
  var items = ""
   
  items += "<p><strong>" + "MMSI" + "</strong>: " + ii.MMSI + "</p>"
  items += "<p><strong>" + "time_stamp_system" + "</strong>: " + ii.time_stamp_system + "</p>"
  items += "<p><strong>" + "latitude" + "</strong>: " + ii.latitude + "</p>"
  items += "<p><strong>" + "longitude" + "</strong>: " + ii.longitude + "</p>"
  items += "<p><strong>" + "navigation_status" + "</strong>: " + ii.navigation_status + "</p>"

  var list = "<p>" + items + "</p>"

  return list
}
