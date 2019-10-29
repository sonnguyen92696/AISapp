/*
Updates the cesium viewer to show all of the ships in the AIS store
*/
function ShipResolver( parameters, viewer ){
  this.defaultParameters = Object.assign( {}, defaultShipResolverParameters, parameters )
  this.viewer = viewer
}
/*
default parameters used to construct cesium ship entities
*/
var defaultShipResolverParameters = {
  model : {
      uri : 'resources/assets/pirate-ship-fat.glb',
      minimumPixelSize : 50
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
/*
callback for when data is added to the ais store
*/
ShipResolver.prototype.dataAdded = function( changedMMSI, ais_store ){
  for( var i = 0; i < changedMMSI.length; ++i ){
    var MMSI = changedMMSI[i];
    var ship = ais_store.getShipByMMSI( MMSI );

    if( ship.getMinTime() === null || ship.getMaxTime() === null ){ continue; }

    var entity = this.viewer.entities.getById( MMSI );

    if( entity === undefined ){
      //create it
      entity = this.createEntityFromShip(ship, this.defaultParameters);
      //TODO: the description should be generated dynamically based on the current time of the time line
        //entity.addProperty("descriptionAtTime")//this should be a function that returns a description of the ship for a given time
      entity.description = this.constructShipDescription(ship);
      this.viewer.entities.add( entity )
    } else {
      //update it
      entity.position = this.computeShipSampledPositionProperty(ship);
      entity.availability = new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
          start : ship.getMinTime(),
          stop : ship.getMaxTime()
      })]);
        //TODO: remove this when we assign a function to dynamically generate descriptions
        entity.description.setValue(this.constructShipDescription(ship));
    }
  }
};
/*
converts a ship into parameters to create an entity
*/
ShipResolver.prototype.createEntityFromShip = function( ship, parameters ){
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
/*
computes the path of the ship for the cesium ship entity
*/
ShipResolver.prototype.computeShipSampledPositionProperty = function( ship ){
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

/*
computes the description of the ship to display when it is clicked in cesium
*/
ShipResolver.prototype.constructShipDescription = function( ship ){
  var items = "";
  var tShip = ship.ais_voyages_static.length > 0 ? ship.ais_voyages_static[0] : {MMSI:ship.MMSI};
  for( var key in tShip ){
    if( key == "NMEA_string") continue;
    items += "<p><strong>" + key + "</strong>: " + tShip[key] + "</p>";
  }

    return "<p>" + items + "</p>";

};
