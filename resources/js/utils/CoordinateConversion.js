//<!--
// sources
// adapted from from http://home.hiwaay.net/~taylorc/toolbox/geography/geoutm.html

var pi = 3.14159265358979;

/* Ellipsoid model constants (actual values here are for WGS84) */
var sm_a = 6378137.0; // Ellipsoid model major axis
var sm_b = 6356752.314; //Ellipsoid model minor axis.
var sm_EccSquared = 6.69437999013e-03;

var UTMScaleFactor = 0.9996;


/**
 * DegToRad
 *
 * Converts degrees to radians.
 * @param {number} deg degrees
 * @returns {number} radiens
 */
function DegToRad (deg)
{
    return (deg / 180.0 * pi)
}




/**
 * RadToDeg
 *
 * Converts radians to degrees.
 * @param {number} rad radiens
 * @returns {number} degrees
 */
function RadToDeg (rad)
{
    return (rad / pi * 180.0)
}

/**
 * angleFromCoordinate
 *
 * calculates the angle between two lat lon locations relative to the center of the earth
 * ie angle between the lines formed from the center of the earch out to the respective lat long locations
 *
 * @param {number} lat1  decimal degrees
 * @param {number} long1 decimal degrees
 * @param {number} lat2 decimal degrees
 * @param {number} long2 decimal degrees
 *
 * @returns {number} decimal degrees
 */

function angleFromCoordinate(lat1, long1, lat2, long2) {

    //var R = 6371e3; // metres
    var p1 = DegToRad (lat1);
    var p2 = DegToRad (lat2);
    var dp = DegToRad (lat2-lat1);
    var dr = DegToRad (long2-long1);

    var a = Math.sin(dp/2) * Math.sin(dp/2) +
        Math.cos(p1) * Math.cos(p2) *
        Math.sin(dr/2) * Math.sin(dr/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    c = RadToDeg (c);
    c = Math.min(c,360-c); // take the shortest path arround the earth
    //var d = R * c;
    return c;
}

/**
 * round40kmEarthApproxDistanceBetween2LatLongs has a limited accuracy (at best about 0.3% to 1% error)
 * but it is a much simpler calculation than converting to UTM then calculating two UTM coordinates
 * and then calculating the euclidean distance, and it has an advantage over using UTM in that it
 * has the same accuracy between any two points on earth
 *
 * The intention is that this function can be used as an initial distance calculation before calling
 * on the UTM to calculate a more precise distance
 *
 * @param {number} lat1  decimal degrees
 * @param {number} long1 decimal degrees
 * @param {number} lat2 decimal degrees
 * @param {number} long2 decimal degrees
 *
 * @returns {number} meters across earths surface
 */

function round40kmEarthApproxDistanceBetween2LatLongs(lat1, long1, lat2, long2)
{
    var AngleBetweenLatLongs = angleFromCoordinate( lat1, long1, lat2, long2);
    return AngleBetweenLatLongs/360*40000000; // under aproximation of earths circumference at 40,000,000 meters
}

/**
 * ArcLengthOfMeridian
 *
 * Computes the ellipsoidal distance from the equator to a point at a
 * given latitude.
 *
 * Reference: Hoffmann-Wellenhof, B., Lichtenegger, H., and Collins, J.,
 * GPS: Theory and Practice, 3rd ed.  New York: Springer-Verlag Wien, 1994.
 *
 * requires Globals:
 *     sm_a - Ellipsoid model major axis.
 *     sm_b - Ellipsoid model minor axis.
 *
 * @param {number} phi - Latitude of the point, in radians.
 *
 * @returns {number} The ellipsoidal distance of the point from the equator, in meters.
 */
function ArcLengthOfMeridian (phi)
{
    var alpha, beta, gamma, delta, epsilon, n;
    var result;

	/* Precalculate n */
    n = (sm_a - sm_b) / (sm_a + sm_b);

	/* Precalculate alpha */
    alpha = ((sm_a + sm_b) / 2.0)
        * (1.0 + (Math.pow (n, 2.0) / 4.0) + (Math.pow (n, 4.0) / 64.0));

	/* Precalculate beta */
    beta = (-3.0 * n / 2.0) + (9.0 * Math.pow (n, 3.0) / 16.0)
        + (-3.0 * Math.pow (n, 5.0) / 32.0);

	/* Precalculate gamma */
    gamma = (15.0 * Math.pow (n, 2.0) / 16.0)
        + (-15.0 * Math.pow (n, 4.0) / 32.0);

	/* Precalculate delta */
    delta = (-35.0 * Math.pow (n, 3.0) / 48.0)
        + (105.0 * Math.pow (n, 5.0) / 256.0);

	/* Precalculate epsilon */
    epsilon = (315.0 * Math.pow (n, 4.0) / 512.0);

	/* Now calculate the sum of the series and return */
    result = alpha
        * (phi + (beta * Math.sin (2.0 * phi))
        + (gamma * Math.sin (4.0 * phi))
        + (delta * Math.sin (6.0 * phi))
        + (epsilon * Math.sin (8.0 * phi)));

    return result;
}



/**
 * UTMCentralMeridian
 *
 * Determines the central meridian for the given UTM zone.
 *
 *   returns the central meridian for the given UTM zone, in radians, or zero
 *   if the UTM zone parameter is outside the range [1,60].
 *   Range of the central meridian is the radian equivalent of [-177,+177].
 *
 * @param {number} zone - An integer value designating the UTM zone, range [1,60].
 *
 * @returns {number} in radians, or zero if the UTM zone parameter is outside the range
 *
 *
 */
function UTMCentralMeridian (zone)
{
    var cmeridian;

    cmeridian = DegToRad (-183.0 + (zone * 6.0));

    return cmeridian;
}

/**
 * UTMZone(long) only calculates the basic regular UTM zone
 * none of the exceptions where zones bounderies have been streched are accounted for
 *
 * this function is to be used to get the zone of a given longitude for use in the UTMToLatLon function
 *
 * @param {number} longitude - decimal degrees
 *
 * @returns {number} UTM zone - int
 */
function UTMZone(long)
{
    return Math.floor ((long + 180.0) / 6) + 1;
}

/**
 * FootpointLatitude
 *
 * Computes the footpoint latitude for use in converting transverse
 * Mercator coordinates to ellipsoidal coordinates.
 *
 * Reference: Hoffmann-Wellenhof, B., Lichtenegger, H., and Collins, J.,
 *   GPS: Theory and Practice, 3rd ed.  New York: Springer-Verlag Wien, 1994.
 *
 * @param {number} y - The UTM northing coordinate, in meters.
 *
 * @returns {number} The footpoint latitude, in radians.
 */
function FootpointLatitude (y)
{
    var y_, alpha_, beta_, gamma_, delta_, epsilon_, n;
    var result;

	/* Precalculate n (Eq. 10.18) */
    n = (sm_a - sm_b) / (sm_a + sm_b);

	/* Precalculate alpha_ (Eq. 10.22) */
	/* (Same as alpha in Eq. 10.17) */
    alpha_ = ((sm_a + sm_b) / 2.0)
        * (1 + (Math.pow (n, 2.0) / 4) + (Math.pow (n, 4.0) / 64));

	/* Precalculate y_ (Eq. 10.23) */
    y_ = y / alpha_;

	/* Precalculate beta_ (Eq. 10.22) */
    beta_ = (3.0 * n / 2.0) + (-27.0 * Math.pow (n, 3.0) / 32.0)
        + (269.0 * Math.pow (n, 5.0) / 512.0);

	/* Precalculate gamma_ (Eq. 10.22) */
    gamma_ = (21.0 * Math.pow (n, 2.0) / 16.0)
        + (-55.0 * Math.pow (n, 4.0) / 32.0);

	/* Precalculate delta_ (Eq. 10.22) */
    delta_ = (151.0 * Math.pow (n, 3.0) / 96.0)
        + (-417.0 * Math.pow (n, 5.0) / 128.0);

	/* Precalculate epsilon_ (Eq. 10.22) */
    epsilon_ = (1097.0 * Math.pow (n, 4.0) / 512.0);

	/* Now calculate the sum of the series (Eq. 10.21) */
    result = y_ + (beta_ * Math.sin (2.0 * y_))
        + (gamma_ * Math.sin (4.0 * y_))
        + (delta_ * Math.sin (6.0 * y_))
        + (epsilon_ * Math.sin (8.0 * y_));

    return result;
}

/**
 * @typedef {object} xyCoord
 * @property {number} x meters in x axis
 * @property {number} y meters in y axis
 */

/**
 * MapLatLonToXY
 *
 * Converts a latitude/longitude pair to x and y coordinates in the
 * Transverse Mercator projection.  Note that Transverse Mercator is not
 * the same as UTM; a scale factor is required to convert between them.
 *
 * Reference: Hoffmann-Wellenhof, B., Lichtenegger, H., and Collins, J.,
 * GPS: Theory and Practice, 3rd ed.  New York: Springer-Verlag Wien, 1994.
 *
 * @param {number} phi - Latitude of the point, in radians.
 * @param {number} lambda - Longitude of the point, in radians.
 * @param {number} lambda0 - Longitude of the central meridian to be used, in radians.
 * @param {xyCoord} xy - output param for UTM easting northing vlaues as properties 'x' and 'y' repectivly
 */
function MapLatLonToXY (phi, lambda, lambda0, xy)
{
    var N, nu2, ep2, t, t2, l;
    var l3coef, l4coef, l5coef, l6coef, l7coef, l8coef;
    var tmp;

	/* Precalculate ep2 */
    ep2 = (Math.pow (sm_a, 2.0) - Math.pow (sm_b, 2.0)) / Math.pow (sm_b, 2.0);

	/* Precalculate nu2 */
    nu2 = ep2 * Math.pow (Math.cos (phi), 2.0);

	/* Precalculate N */
    N = Math.pow (sm_a, 2.0) / (sm_b * Math.sqrt (1 + nu2));

	/* Precalculate t */
    t = Math.tan (phi);
    t2 = t * t;
    tmp = (t2 * t2 * t2) - Math.pow (t, 6.0);

	/* Precalculate l */
    l = lambda - lambda0;

	/* Precalculate coefficients for l**n in the equations below
	 so a normal human being can read the expressions for easting
	 and northing
	 -- l**1 and l**2 have coefficients of 1.0 */
    l3coef = 1.0 - t2 + nu2;

    l4coef = 5.0 - t2 + 9 * nu2 + 4.0 * (nu2 * nu2);

    l5coef = 5.0 - 18.0 * t2 + (t2 * t2) + 14.0 * nu2
        - 58.0 * t2 * nu2;

    l6coef = 61.0 - 58.0 * t2 + (t2 * t2) + 270.0 * nu2
        - 330.0 * t2 * nu2;

    l7coef = 61.0 - 479.0 * t2 + 179.0 * (t2 * t2) - (t2 * t2 * t2);

    l8coef = 1385.0 - 3111.0 * t2 + 543.0 * (t2 * t2) - (t2 * t2 * t2);

	/* Calculate easting (x) */
    xy.x = N * Math.cos (phi) * l
        + (N / 6.0 * Math.pow (Math.cos (phi), 3.0) * l3coef * Math.pow (l, 3.0))
        + (N / 120.0 * Math.pow (Math.cos (phi), 5.0) * l5coef * Math.pow (l, 5.0))
        + (N / 5040.0 * Math.pow (Math.cos (phi), 7.0) * l7coef * Math.pow (l, 7.0));

	/* Calculate northing (y) */
    xy.y = ArcLengthOfMeridian (phi)
        + (t / 2.0 * N * Math.pow (Math.cos (phi), 2.0) * Math.pow (l, 2.0))
        + (t / 24.0 * N * Math.pow (Math.cos (phi), 4.0) * l4coef * Math.pow (l, 4.0))
        + (t / 720.0 * N * Math.pow (Math.cos (phi), 6.0) * l6coef * Math.pow (l, 6.0))
        + (t / 40320.0 * N * Math.pow (Math.cos (phi), 8.0) * l8coef * Math.pow (l, 8.0));

    return;
}

/**
 * @typedef {object} latLonCoord
 * @property {number} latitude in radiens
 * @property {number} longitude in radiens
 */

/**
 * MapXYToLatLon
 *
 * Converts x and y coordinates in the Transverse Mercator projection to
 * a latitude/longitude pair.  Note that Transverse Mercator is not
 * the same as UTM; a scale factor is required to convert between them.
 *
 * Reference: Hoffmann-Wellenhof, B., Lichtenegger, H., and Collins, J.,
 *   GPS: Theory and Practice, 3rd ed.  New York: Springer-Verlag Wien, 1994.
 *
 * @param {number} x - The easting of the point, in meters.
 * @param {number} y - The northing of the point, in meters.
 * @param {number} lambda0 - Longitude of the central meridian to be used, in radians.
 * @param {latLonCoord} philambda - output  via js object referece to .latitude and .longitude in radians.

 *
 * Remarks:
 *   The local variables Nf, nuf2, tf, and tf2 serve the same purpose as
 *   N, nu2, t, and t2 in MapLatLonToXY, but they are computed with respect
 *   to the footpoint latitude phif.
 *
 *   x1frac, x2frac, x2poly, x3poly, etc. are to enhance readability and
 *   to optimize computations.
 *
 */
function MapXYToLatLon (x, y, lambda0, philambda)
{
    var phif, Nf, Nfpow, nuf2, ep2, tf, tf2, tf4, cf;
    var x1frac, x2frac, x3frac, x4frac, x5frac, x6frac, x7frac, x8frac;
    var x2poly, x3poly, x4poly, x5poly, x6poly, x7poly, x8poly;

	/* Get the value of phif, the footpoint latitude. */
    phif = FootpointLatitude (y);

	/* Precalculate ep2 */
    ep2 = (Math.pow (sm_a, 2.0) - Math.pow (sm_b, 2.0))
        / Math.pow (sm_b, 2.0);

	/* Precalculate cos (phif) */
    cf = Math.cos (phif);

	/* Precalculate nuf2 */
    nuf2 = ep2 * Math.pow (cf, 2.0);

	/* Precalculate Nf and initialize Nfpow */
    Nf = Math.pow (sm_a, 2.0) / (sm_b * Math.sqrt (1 + nuf2));
    Nfpow = Nf;

	/* Precalculate tf */
    tf = Math.tan (phif);
    tf2 = tf * tf;
    tf4 = tf2 * tf2;

	/* Precalculate fractional coefficients for x**n in the equations
	 below to simplify the expressions for latitude and longitude. */
    x1frac = 1.0 / (Nfpow * cf);

    Nfpow *= Nf;   /* now equals Nf**2) */
    x2frac = tf / (2.0 * Nfpow);

    Nfpow *= Nf;   /* now equals Nf**3) */
    x3frac = 1.0 / (6.0 * Nfpow * cf);

    Nfpow *= Nf;   /* now equals Nf**4) */
    x4frac = tf / (24.0 * Nfpow);

    Nfpow *= Nf;   /* now equals Nf**5) */
    x5frac = 1.0 / (120.0 * Nfpow * cf);

    Nfpow *= Nf;   /* now equals Nf**6) */
    x6frac = tf / (720.0 * Nfpow);

    Nfpow *= Nf;   /* now equals Nf**7) */
    x7frac = 1.0 / (5040.0 * Nfpow * cf);

    Nfpow *= Nf;   /* now equals Nf**8) */
    x8frac = tf / (40320.0 * Nfpow);

	/* Precalculate polynomial coefficients for x**n.
	 -- x**1 does not have a polynomial coefficient. */
    x2poly = -1.0 - nuf2;

    x3poly = -1.0 - 2 * tf2 - nuf2;

    x4poly = 5.0 + 3.0 * tf2 + 6.0 * nuf2 - 6.0 * tf2 * nuf2
        - 3.0 * (nuf2 *nuf2) - 9.0 * tf2 * (nuf2 * nuf2);

    x5poly = 5.0 + 28.0 * tf2 + 24.0 * tf4 + 6.0 * nuf2 + 8.0 * tf2 * nuf2;

    x6poly = -61.0 - 90.0 * tf2 - 45.0 * tf4 - 107.0 * nuf2
        + 162.0 * tf2 * nuf2;

    x7poly = -61.0 - 662.0 * tf2 - 1320.0 * tf4 - 720.0 * (tf4 * tf2);

    x8poly = 1385.0 + 3633.0 * tf2 + 4095.0 * tf4 + 1575 * (tf4 * tf2);

	/* Calculate latitude */
    philambda.latitude = RadToDeg (
        phif + x2frac * x2poly * (x * x)
        + x4frac * x4poly * Math.pow (x, 4.0)
        + x6frac * x6poly * Math.pow (x, 6.0)
        + x8frac * x8poly * Math.pow (x, 8.0)
    );

	/* Calculate longitude */
    philambda.longitude = RadToDeg (
        lambda0 + x1frac * x
        + x3frac * x3poly * Math.pow (x, 3.0)
        + x5frac * x5poly * Math.pow (x, 5.0)
        + x7frac * x7poly * Math.pow (x, 7.0)
    );

    return;
}

/**
 * @typedef {object} UTMCoord
 * @property {number} easting meters
 * @property {number} northing meters
 * @property {number} zone integer
 */


/**
 * LatLonToUTMXY
 *
 * Converts a latitude/longitude pair to easting/northing coordinates in the
 * Universal Transverse Mercator projection.
 *
 * Note: the 4th parameter in this function must be of type java script object as they are passed by reference
 * and the calculated easting, northing and zone are passed back to the caller by being assigned to keys in this object.
 *
 * @param {number} lat - Latitude decimal degrees
 * @param {number} lon - Longitude decimal degrees
 * @param {number} [zone] - UTM zone to be used for calculating values for x and y.
 *          If zone is null, less than 1, or greater than 60, the routine
 *          will determine the appropriate zone from the value of lon.
 *          you can use UTMZone(long) to calculate this from the longitude,
 *          or you can supply a valid UTM zone.
 *          results will be less acurate if the longitude is far from the central
 *          longitude of the zone.
 * @param {UTMCoord} xy - output via js object referece
 *
 * @returns {number} The UTM zone used for calculating the values of easting and northing.
 *
 */
function LatLonToUTM (lat, lon, zone, xy)
{

    zone = Math.floor(zone);
    if (zone === null || zone < 1 || zone > 60) zone = UTMZone(lon);

    lat = DegToRad(lat);
    lon = DegToRad(lon);
    MapLatLonToXY (lat, lon, UTMCentralMeridian (zone), xy);

	/* Adjust easting and northing for UTM system. */
    xy.easting = xy.x * UTMScaleFactor + 500000.0;
    xy.northing = xy.y * UTMScaleFactor;
    //if (xy[1] < 0.0)
        xy.northing = xy.northing + 10000000.0;
    xy.zone = zone
    return zone;
}


/**
 * UTMXYToLatLon
 *
 * Converts easting/northing coordinates in the Universal Transverse Mercator
 * projection to a latitude/longitude pair.
 *
 * Note: the 4th parameter in this function must be of type java script object as they are passed by reference
 * and the calculated latitude and longitude are passed back to the caller by being assigned to keys in this object.
 *
 *
 * @param {number} x - The easting of the point, in meters.
 * @param {number} y - The northing of the point, in meters.
 * @param {number} zone - The UTM zone that was used to calculate the points x and y.
 * @param {latLonCoord} latlon - output via js object referece to .latitude and .longitude in degrees.
 *
 */
function UTMToLatLon (easting, nourthing, zone, latlon)
{
    var cmeridian;

    var x = easting - 500000.0;
    x /= UTMScaleFactor;

	/* If in southern hemisphere, adjust y accordingly. */
    //if (southhemi)
    var y = nourthing - 10000000.0;

    y /= UTMScaleFactor;

    cmeridian = UTMCentralMeridian (zone);
    MapXYToLatLon (x, y, cmeridian, latlon);
}

//    -->
