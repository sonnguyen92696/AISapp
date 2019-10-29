
function AIS_Client_Local (ais_messages) {
  this.ais_messages = ais_messages
}

// ONE function to rule them all
AIS_Client_Local.prototype.getResources = function(parameters) {
    if( parameters.resource == "ais_voyages_dynamic" ){
      this.getDynamicVoyages(parameters.id, parameters.filter, parameters.onSuccess, parameters.onFail);
    } else {
      onFail("'" + resource + "' not implemented.");
    }
};

AIS_Client_Local.prototype.getDynamicVoyages = function(id, filter, onSuccess, onFail) {
  var that = this;
  window.setTimeout(function(){
    that.getDynamicVoyages_sync(id, filter, onSuccess, onFail)
  }, 500);//returns results in half a second
};

AIS_Client_Local.prototype.getDynamicVoyages_sync = function(id, filter, onSuccess, onFail) {
  var limit = filter.limit || 100;
  var start = limit * ( filter.page || 0 );
  var end = Math.min( start + limit, this.ais_messages.length );

  if( start >= this.ais_messages.length ){
    onSuccess([]);
    return;
  }

  onSuccess(this.ais_messages.slice(start, end));
};


AIS_Client_Local.prototype.getStaticVoyages = function(id, filter, onSuccess, onFail) {
    onSuccess([]);
};
