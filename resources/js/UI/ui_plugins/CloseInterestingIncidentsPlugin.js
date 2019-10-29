/**
 * @class CloseInterestingIncidentsPlugin
 * @classDesc this plugin loads the close encounters resolvers and ui
 * @type {Plugin}
 * @constructor
 */
function CloseInterestingIncidentsPlugin(){
    this.name = "CloseInterestingIncidentsPlugin";
    this.displayName = "Close Encounters";
}

CloseInterestingIncidentsPlugin.prototype.showLoadingScreen = function() {

    this.$body.empty();
    this.$distance = $('<input type="text" class="fill10" value="'+this.getParameters().distance+'">')
    this.$body
      .append("no data loaded...")
      .append(
          $("<p>Ships within </p>")
              .append(this.$distance)
              .append(" meters"));
}

CloseInterestingIncidentsPlugin.prototype.showEmptyScreen = function() {

    this.$body.empty();
    this.$distance = $('<input type="text" class="fill10" value="'+this.getParameters().distance+'">')
    this.$body
      .append("no incidents found...")
      .append(
          $("<p>Ships within </p>")
              .append(this.$distance)
              .append(" meters"));
}

CloseInterestingIncidentsPlugin.prototype.showEditScreen = function() {

      var that = this;

      this.$body.empty();

      this.$noShips = $("<span>##</span>");
      this.$duration = $("<span>##</span>");
      this.$incidentId = $("<span>##</span>");
      this.$incidentCount = $("<span>##</span>");

      this.$previousButton = $('<button class="icon-button" ><i class="material-icons">skip_previous</i></button>');
      this.$previousButton.click(function(){
        if ("idx" in that && that.idx - 1 >= 0 ) {
          that.idx -= 1;
          that.loadInterestingIncident(that.idx);
        }
      });

      this.$nextButton = $('<button class="icon-button" ><i class="material-icons">skip_next</i></button>');
      this.$nextButton.click(function(){
        if ("idx" in that && that.idx + 1 < that.closeIntervalsResolver.incidents.length) {
          that.idx += 1;
          that.loadInterestingIncident(that.idx);
        }
      });

      this.$loadfilter = $('<button class="icon-button text-button" >Make Filter</button>');
      this.$loadfilter.click(function(){
          that.loadFilter();
      });

      this.$distance = $('<input type="text" style="margin-left: 5px; margin-right:5px;" class="fill10" value="'+this.getParameters().distance+'">')
      this.$maxSeconds = $('<input type="text" style="margin-left: 5px; margin-right:5px;" class="fill10" value="'+this.getParameters().maxSeconds+'">')

      this.$body
      .append(
          $("<p></p>")
              .append(this.$previousButton)
              .append(" Incident ")
              .append(this.$incidentId)
              .append(" out of ")
              .append(this.$incidentCount)
              .append(" ")
              .append(this.$nextButton)
              .append(this.$loadfilter))
          .append($("<p><span class='value-label'>Number of ships:</span> </p>").append(this.$noShips))
          .append(
            $("<p><span class='value-label'>Duration: </span></p>")
              .append(this.$duration))
          .append(
              $("<p <span class='value-label'>Ships within </span></p>")
                  .append(this.$distance)
                  .append(" meters"))
          .append(
              $("<p <span class='value-label'>Messages within </span></p>")
                  .append(this.$maxSeconds)
                  .append(" seconds"));
}

CloseInterestingIncidentsPlugin.prototype.loadFilter = function(){

      var incident = this.getCurrentIncident();

      var filter = {
        latMin  : incident.latMin,
        latMax  : incident.latMax,
        longMin : incident.longMin,
        longMax : incident.longMax,
        timeStart: incident.startTime,
        timeEnd: incident.endTime,
      };

      console.log("CloseInterestingIncidentsPlugin: load filter " + JSON.stringify(filter));

      updateFilters(filter);
      this.application.latLongFilterUpdate(filter);
}

CloseInterestingIncidentsPlugin.prototype.getDetailsHTML = function() {

    this.$body = $("<div></div>");
    this.showLoadingScreen();

     return this.$body;
};

CloseInterestingIncidentsPlugin.formatSeconds = function( seconds ){
  if( seconds < 60 ) return seconds + " sec";
  if( seconds < 60 * 60 ) return Math.floor(seconds/60) + " min";
  return (seconds/(60*60)).tofixed(2) + " hr";
}

CloseInterestingIncidentsPlugin.prototype.getCurrentIncident = function() {
  return this.closeIntervalsResolver.incidents[this.idx];
}

CloseInterestingIncidentsPlugin.prototype.loadInterestingIncident = function( idx ) {
    if( idx < 0 || idx >= this.closeIntervalsResolver.incidents.length ){
        console.error("CloseInterestingIncidentsPlugin: invalid idx: " + idx);
        return;
    }

    var incident = this.closeIntervalsResolver.incidents[idx];

    this.$noShips.html(Object.keys(incident.MMSI).length);//incident.MMSI.length);
    this.$duration.html(CloseInterestingIncidentsPlugin.formatSeconds(getSecondsDifference(incident.startTime, incident.endTime)));
    this.$incidentId.html(idx+1);
    this.$incidentCount.html(this.closeIntervalsResolver.incidents.length);

    this.application.viewer.clock.currentTime = incident.startTime;

    this.loadFilter();
    this.closeIntervalsResolver.emphasizeIncident(idx);
};

CloseInterestingIncidentsPlugin.prototype.onLoadedIncidents = function(){
  if( this.closeIntervalsResolver.incidents.length == 0 ){
    this.showEmptyScreen();
  } else {
    this.showEditScreen();
    this.idx = 0;
    this.loadInterestingIncident(this.idx);
  }
}


CloseInterestingIncidentsPlugin.prototype.getParameters = function() {

    var parameters = { distance: 1000, maxSeconds: 45 };

    if (!!this.$distance) {
        parameters.distance = parseFloat(this.$distance.val());
    }

    if (!!this.$maxSeconds) {
        parameters.maxSeconds = parseFloat(this.$maxSeconds.val());
    }

    return parameters;
};

CloseInterestingIncidentsPlugin.prototype.applyUIDetails = function(application, parameters) {
    delete this.idx;
    this.closeIntervalsResolver.applyParameters(parameters);
};

CloseInterestingIncidentsPlugin.prototype.applyPlugin = function(application, parameters){
  this.application = application;
    application.clearResolvers();

    if(!application.store) return;//need the store to do the rest of the loading

    //add a view resolver that will reposition the camera
    //this resolver must go first otherwise it will override the
    //the update of the interesting incident plugin
    this.viewResolver = new ViewerResolver(application.viewer);
    application.store.register(this.viewResolver );
    application.resolvers.push(this.viewResolver);

    //add the path ship viewer resolver
    this.shipViewTypeResolver = new ShipResolver( {path: null}, application.viewer);
    application.store.register(this.shipViewTypeResolver);
    application.resolvers.push(this.shipViewTypeResolver);

    //add the close intervals resolver
    this.closeIntervalsResolver = new CloseIntervalsResolver({
        distance: parameters.distance || 2000,
        viewer: application.viewer,
        store: application.store,
        ais_client: new IInterval_Client_Local(application.store, { maxSeconds: 45 })
    });
    this.closeIntervalsResolver.registerListener(this);
    application.store.register(this.closeIntervalsResolver );
    application.resolvers.push(this.closeIntervalsResolver);

};
