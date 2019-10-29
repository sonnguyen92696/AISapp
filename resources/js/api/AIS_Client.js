/**
 * @class AIS_Client
 * @classDescription handles all web service calls
 * @property {string} passwd
 * @property {string} baseURL
 *
 * @constructor
 * @param {string} passwd     - User identifier.
 * @param {string} baseUrl    - Base URL for web service calls (e.g. 'http://homepage.cs.latrobe.edu.au/16maritime01/api/v5/').
 *
 */
function AIS_Client (passwd, baseUrl) {
    this.passwd = passwd.toString();
    this.baseURL = baseUrl.toString();
    if( this.baseURL.substr(-1) !== "/" ) {
        this.baseURL += "/";
    }
}

//////////////////////
// Helper Functions //
//////////////////////

/** Generates the URL for a web service call.
 *
 * If filter contains 'url' it will ignore any other filters, resource or id and just use the url-value.
 *
 * @param {string} resource     - The web service name (e.g. 'sources').
 * @param {string} id           - The ID to identify a specific record; usually an int but can be string.
 * @param {object} filter       - Associative array with filter-name : filter-value pairs.
 */
AIS_Client.prototype.generateGetURL = function(resource, id, filter){
    if("url" in filter){
        return filter["url"];
    }
    else{
        return this.baseURL + resource.toString() + ".php/" + this.addID(id) + this.generateFilter(filter);
    }
};

/** Generates the filter part of the URL from key:value pairs.
 *
 * @param {object} filter - Associative array with filter-name : filter-value pairs.
 */
AIS_Client.prototype.generateFilter = function(filter){
    var result = "?passwd=" + this.passwd;
    for(var key in filter){
        result += "&" + key + "=" + filter[key];
    }
    return result;
};

/** Adds the ID + a '/' to a URL or adds nothing if ID is undefined.
 *
 *  @param {string} id - The ID to identify a specific record; usually an int but can be string.
 */
AIS_Client.prototype.addID = function(id){
    if(id === undefined){
        return "";
    }
    else{
        return id.toString() + "/";
    }
};


///////////////////////////////////
// ONE function to rule them all //
///////////////////////////////////
/**
 * Makes a GET request to ANY of our web services.
 * @param {object}   parameters
 * @param {string}   parameters.resource  - The web service name (e.g. 'sources').
 * @param {string}   parameters.id        - The ID to identify a specific record; usually an int but can be string.
 * @param {Array}    parameters.filter    - Associative array with filter-name : filter-value pairs.
 * @param {function} parameters.onSuccess - Function to call when AJAX call is done.
 * @param {function} parameters.onFail    - Function to call when AJAX call fails.
  */
AIS_Client.prototype.getResources = function(parameters) {
	
    var url = this.generateGetURL(parameters.resource, parameters.id, parameters.filter);
    
	var future = $.get(url);
	
	if( parameters.hasOwnProperty("onSuccess") ){
		future.done(parameters.onSuccess);
	}
	
	if( parameters.hasOwnProperty("onFail") ){
		future.fail(parameters.onFail);
	}
	
	return parameters
};

/**
 * Makes a POST request to ANY of our web services.
 *
 * @param {string} resource     - The web service name (e.g. 'sources').
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.addResources = function(resource, values, onSuccess, onFail) {
    var url = this.baseURL + resource.toString() + ".php/" + this.generateFilter({});
    $.post(url, "[" + JSON.stringify(values) + "]")
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a PUT request to ANY of our web services.
 *
 * @param {string} resource     - The web service name (e.g. 'sources').
 * @param {int} id              - The ID to identify a specific record.
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.updateResource = function(resource, id, values, onSuccess, onFail) {
    $.ajax({
        url: this.baseURL + resource.toString() + ".php/" + this.addID(id) + this.generateFilter({}),
        type: "PUT",
        data: JSON.stringify(values)})
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a DELETE request to ANY of our web services.
 *
 * @param {string} resource     - The web service name (e.g. 'sources').
 * @param {int} id              - The ID to identify a specific record.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.deleteResource = function(resource, id, onSuccess, onFail) {
    $.ajax({
        url: this.baseURL + resource.toString() + ".php/" + this.addID(id) + this.generateFilter({}),
        type: "DELETE"})
        .done(onSuccess)
        .fail(onFail);
};


//////////////////
// GET requests //
//////////////////

/**
 * Makes a GET request to the SOURCES web services.
 *
 * @param {string} id           - The ID to identify a specific source.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.getSources = function(id, onSuccess, onFail) {
    var url = this.baseURL + "sources.php/" + this.addID(id) + this.generateFilter({});
    $.get(url)
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a GET request to the SESSIONS web services.
 *
 * @param {int} id              - The ID to identify a specific session.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.getSessions = function(id, onSuccess, onFail) {
    var url = this.baseURL + "sessions.php/" + this.addID(id) + this.generateFilter({});
    $.get(url)
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a GET request to the STATIONS web services.
 *
 * @param {int} id              - The ID to identify a specific station.
 * @param {Array} filter        - Associative array with filter-name : filter-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.getStations = function(id, filter, onSuccess, onFail) {
    var url = this.generateGetURL("ais_stations", id, filter);
    $.get(url)
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a GET request to the AIS_DYNAMIC_VOYAGES web services.
 *
 * @param {int} id              - The ID to identify a specific dynamic_voyage.
 * @param {Array} filter        - Associative array with filter-name : filter-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.getDynamicVoyages = function(id, filter, onSuccess, onFail) {
    var url = this.generateGetURL("ais_voyages_dynamic", id, filter);
    $.get(url)
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a GET request to the AIS_STATIC_VOYAGES web services.
 *
 * @param {int} id              - The ID to identify a specific static_voyage.
 * @param {Array} filter        - Associative array with filter-name : filter-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.getStaticVoyages = function(id, filter, onSuccess, onFail) {
    var url = this.generateGetURL("ais_voyages_static", id, filter);
    $.get(url)
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a GET request to the SCENARIOS web services.
 *
 * @param {int} id              - The ID to identify a specific scenario.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.getScenarios = function(id, onSuccess, onFail) {
    var url = this.baseURL + "scenarios.php/" + this.addID(id) + this.generateFilter({});
    $.get(url)
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a GET request to the PLAYLISTS web services.
 *
 * @param {int} id              - The ID to identify a specific playlist.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.getPlaylists = function(id, onSuccess, onFail) {
    var url = this.baseURL + "playlists.php/" + this.addID(id) + this.generateFilter({});
    console.log(url)
    $.get(url)
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a GET request to the PLAYLIST_ITEMS web services.
 *
 * @param {int} id              - The ID to identify a specific playlist_item.
 * @param {Array} filter        - Associative array with filter-name : filter-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.getPlaylistItems = function(id, filter, onSuccess, onFail) {
    var url = this.generateGetURL("playlist_items", id, filter);
    $.get(url)
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a GET request to the PLAYLISTS_DATA web services.
 *
 * @param {int} playlistID      - The ID to identify a specific playlist.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.getPlaylistsWithScenarios = function(playlistID, onSuccess, onFail) {
    var url = this.baseURL + "playlists_data.php/" + this.addID(playlistID) + this.generateFilter({});
    $.get(url)
        .done(onSuccess)
        .fail(onFail);
};



///////////////////
// POST requests //
///////////////////

/**
 * Makes a POST request to SOURCES web services.
 *
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.addSources = function(values, onSuccess, onFail) {
    var url = this.baseURL + "sources.php/" + this.generateFilter({});
    $.post(url, JSON.stringify(values))
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a POST request to SESSIONS web services.
 *
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.addSessions = function(values, onSuccess, onFail) {
    var url = this.baseURL + "sessions.php/" + this.generateFilter({});
    $.post(url, JSON.stringify(values))
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a POST request to AIS_STATIONS web services.
 *
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.addStations = function(values, onSuccess, onFail) {
    var url = this.baseURL + "ais_stations.php/" + this.generateFilter({});
    $.post(url, JSON.stringify(values))
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a POST request to AIS_VOYAGES_DYNAMIC web services.
 *
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.addDynamicVoyages = function(values, onSuccess, onFail) {
    var url = this.baseURL + "ais_voyages_dynamic.php/" + this.generateFilter({});
    $.post(url, JSON.stringify(values))
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a POST request to AIS_VOYAGES_STATIC web services.
 *
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.addStaticVoyages = function(values, onSuccess, onFail) {
    var url = this.baseURL + "ais_voyages_static.php/" + this.generateFilter({});
    $.post(url, JSON.stringify(values))
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a POST request to SCENARIOS web services.
 *
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.addScenarios = function(values, onSuccess, onFail) {
    var url = this.baseURL + "scenarios.php/" + this.generateFilter({});
    $.post(url, JSON.stringify(values))
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a POST request to PLAYLISTS web services.
 *
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.addPlaylists = function(values, onSuccess, onFail) {
    var url = this.baseURL + "playlists.php/" +this.generateFilter({});
    $.post(url, JSON.stringify(values))
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a POST request to PLAYLIST_ITEMS web services.
 *
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.addPlaylistItems = function(values, onSuccess, onFail) {
    var url = this.baseURL + "playlist_items.php/" + this.generateFilter({});
    $.post(url, JSON.stringify(values))
        .done(onSuccess)
        .fail(onFail);
};



//////////////////
// PUT requests //
//////////////////

/**
 * Makes a PUT request to SCENARIO web services.
 *
 * @param {int} id              - The ID to identify a specific scenario.
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.updateScenario = function(id, values, onSuccess, onFail) {
    $.ajax({
        url: this.baseURL + "scenarios.php/" + this.addID(id) + this.generateFilter({}),
        type: "PUT",
        data: JSON.stringify(values)})
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a PUT request to PLAYLISTS web services.
 *
 * @param {int} id              - The ID to identify a specific playlist.
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.updatePlaylist = function(id, values, onSuccess, onFail) {
    $.ajax({
        url: this.baseURL + "playlists.php/" + this.addID(id) + this.generateFilter({}),
        type: "PUT",
        data: JSON.stringify(values)})
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a PUT request to PLAYLIST_ITEMS web services.
 *
 * @param {int} id              - The ID to identify a specific playlist_item.
 * @param {Array} values        - Associative array with column-name : column-value pairs.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.updatePlaylistItem = function(id, values, onSuccess, onFail) {
    $.ajax({
        url: this.baseURL + "playlist_items.php/" + this.addID(id) + this.generateFilter({}),
        type: "PUT",
        data: JSON.stringify(values)})
        .done(onSuccess)
        .fail(onFail);
};



//////////////////
// PUT requests //
//////////////////

/**
 * Makes a DELETE request to SCENARIO web services.
 *
 * @param {int} id              - The ID to identify a specific scenario.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.deleteScenario = function(id, onSuccess, onFail) {
    $.ajax({
        url: this.baseURL + "scenarios.php/" + this.addID(id) + this.generateFilter({}),
        type: "DELETE"})
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a DELETE request to PLAYLISTS web services.
 *
 * @param {int} id                      - The ID to identify a specific playlist.
 * @param {boolean} deleteItsScenarios  - Delete scenarios associated with this playlist or not.
 * @param {function} onSuccess          - Function to call when AJAX call is done.
 * @param {function} onFail             - Function to call when AJAX call fails.
 */
AIS_Client.prototype.deletePlaylist = function(id, deleteItsScenarios, onSuccess, onFail) {
    $.ajax({
        url: this.baseURL + "playlists.php/" + this.addID(id) + this.generateFilter({"deleteItsScenarios" : deleteItsScenarios}),
        type: "DELETE"})
        .done(onSuccess)
        .fail(onFail);
};

/**
 * Makes a DELETE request to PLAYLIST_ITEMS web services.
 *
 * @param {int} id              - The ID to identify a specific playlist_item.
 * @param {function} onSuccess  - Function to call when AJAX call is done.
 * @param {function} onFail     - Function to call when AJAX call fails.
 */
AIS_Client.prototype.deletePlaylistItem = function(id, onSuccess, onFail) {
    $.ajax({
        url: this.baseURL + "playlist_items.php/" + this.addID(id) + this.generateFilter({}),
        type: "DELETE"})
        .done(onSuccess)
        .fail(onFail);
};