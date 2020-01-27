/**
 * copies all of properties(propertiesArray) in srcObject to a new object and returns it
 * @param srcObject
 * @param propertiesArray
 * @return {{}}
 */
function clone(srcObject, propertiesArray) {
    var objcopy = {};
    for(var property in propertiesArray) {
        if(!srcObject[propertiesArray[property]]) continue;
        objcopy [propertiesArray[property]] = srcObject[propertiesArray[property]];
    }
    return objcopy;
}

/**
 * if there is a function named functionName in object it is bound to that object
 * @param {string} functionName
 * @param {object} object
 */
function bindIfPresent( functionName, object ){
    if( functionName in object && (typeof(functionName) == "function")){
        object.functionName = functionName.bind(object);
    }
}

/**
 * groups an array of objects by attribute
 * type of K = type of T[{number}][attribute]
 * @param {T[]} arr
 * @param {string} attribute
 * @returns {object.<K,T>}
 * @template T, K
 */
function groupBy( arr, attribute ){
  var result = {}

  for( var i = 0; i < arr.length; ++i){
    var el = arr[i]
    var groupKey = el[attribute]

    if( !(groupKey in result) ){ result[groupKey] = [] }

    result[groupKey].push(el)
  }
  return result
}


/**
 *
 * @param {object} arr
 * @param {string} key arr[key] must be of type JulianDate
 * @returns {null|JulianDate}
 */
function maxTime( arr, key ){
  if( arr.length == 0 ){ return null }
  return arr.reduce( function( acc, value ){
    return Cesium.JulianDate.greaterThan(acc[key], value[key])
      ? acc
      : value
  })[key]
}
/**
 *
 * @param {object} arr
 * @param {string} key arr[key] must be of type JulianDate
 * @returns {null|JulianDate}
 */
function minTime( arr, key ){
  if( arr.length == 0 ){ return null }
  return arr.reduce( function( acc, value ){
    return Cesium.JulianDate.lessThan(acc[key], value[key])
      ? acc
      : value
  })[key]
}

function earlierTime( timeA, timeB ){
	return Cesium.JulianDate.lessThan(timeA, timeB)
		? timeA
		: timeB;	
}

function laterTime( timeA, timeB ){
	return Cesium.JulianDate.greaterThan(timeA, timeB)
		? timeA
		: timeB;	
}

function getSecondsDifference(julianDate1, julianDate2) {
    var dayDifference = (julianDate2.dayNumber - julianDate1.dayNumber) * 24 * 60 * 60;
    return (dayDifference + (julianDate2.secondsOfDay - julianDate1.secondsOfDay));
};

/**
* returns true if the interval defined by (timeA0, timeA1) overlaps the
* interval defined by (timeB0, timeB1) with a margin of error of epsilon seconds
* all times are Cesium.JulianDate
*/
function intervalsOverlap( timeA0, timeA1, timeB0, timeB1, epsilon ){
	
	if( getSecondsDifference( timeB0, timeA1 )  < -epsilon
		|| getSecondsDifference( timeB1, timeA0 )  > epsilon ) {
		return false;
	}
	
	return true;
}

/**
* returns true if the interval defined by (timeA0, timeA1) contains
* timeB with a margin of error of epsilon seconds
* all times are Cesium.JulianDate
*/
function intervalContains( timeA0, timeA1, timeB, epsilon ){	
	return intervalsOverlap(timeA0, timeA1, timeB, timeB, epsilon);
}

/*
takes the link http response header e.g, "Link: <http://homepage.cs.latrobe.edu.au/16maritime01/api/v5/ais_voyages_static.php/?passwd=FA74Ir7V0H&page=1>; REL=first, <http://homepage.cs.latrobe.edu.au/16maritime01/api/v5/ais_voyages_static.php/?passwd=FA74Ir7V0H&page=NA>; REL=prev, <http://homepage.cs.latrobe.edu.au/16maritime01/api/v5/ais_voyages_static.php/?passwd=FA74Ir7V0H&page=2>; REL=next, <http://homepage.cs.latrobe.edu.au/16maritime01/api/v5/ais_voyages_static.php/?passwd=FA74Ir7V0H&page=171>; REL=last"
and returns an object {"next": "http...", "first": "http...",...}
*/
function parseLink ( link ){
  var result = {}
  //return 
  // 6/11/19 fixed code unreached
  link.split(',').forEach( function( c ){
    var elements = c.match(/<(.*)>.*(rel|REL)=([a-zA-Z]*)/)
    var url = elements[1]
    var rel = elements[3]
    result[rel] = url
  });
  return result
}

/*
returns true if a web service call has more pages to download
*/
function hasMorePages( links ){
  return "next" in links && (links["next"].indexOf("page=NA") < 0)
}
/**
 * @param {string} dateString a date string of the form YYYY-mm-dd HH:MM:ss
 * @return {date}
*/
function parseDate( dateString ) {
  var parts = []
  parts.push(dateString.substring(0,4))
  parts.push(dateString.substring(5,7))
  parts.push(dateString.substring(8,10))
  parts.push(dateString.substring(11,13))
  parts.push(dateString.substring(14,16))
  parts.push(dateString.substring(17,19))

  parts.map( function( p ){ return parseInt( p )})

  return new Date( parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5] )
}

/*
parses the query parameters of a url i.e. "www.website.com?apple=3&dog=3" ==> {apple:3, dog:3}
*/
function getQueryParameters(url) {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};

    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);

    return urlParams
}
