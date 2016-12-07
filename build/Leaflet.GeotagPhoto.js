(function (L) {
'use strict';

L = 'default' in L ? L['default'] : L;

var GeotagPhotoCrosshair = L.Evented.extend({
  options: {
    element: '<img src="../images/crosshair.svg" width="100px" />'
  },

  addTo: function addTo(map) {
    this._map = map;
    var container = map.getContainer();
    this._element = L.DomUtil.create('div', 'leaflet-geotag-photo-crosshair', container);
    this._element.innerHTML = this.options.element;

    this._boundOnInput = this._onInput.bind(this);
    this._boundOnChange = this._onChange.bind(this);

    this._map.on('move', this._boundOnInput);
    this._map.on('moveend', this._boundOnChange);

    return this;
  },

  removeFrom: function removeFrom(map) {
    if (this._map && this._boundOnInput && this._boundOnChange) {
      this._map.off('move', this._boundOnInput);
      this._map.off('moveend', this._boundOnChange);
    }

    return this;
  },

  _onInput: function _onInput() {
    this.fire('input');
  },

  _onChange: function _onChange() {
    this.fire('change');
  },

  getCrosshairLatLng: function getCrosshairLatLng() {
    return this._map.getCenter();
  },

  getCrosshairPoint: function getCrosshairPoint() {
    if (this._map) {
      var center = this.getCrosshairLatLng();
      return {
        type: 'Point',
        coordinates: [center.lng, center.lat]
      };
    }
  }

});

/**
 * Unwrap a coordinate from a Feature with a Point geometry, a Point
 * geometry, or a single coordinate.
 *
 * @param {*} obj any value
 * @returns {Array<number>} a coordinate
 */
function getCoord$1(obj) {
    if (Array.isArray(obj) &&
        typeof obj[0] === 'number' &&
        typeof obj[1] === 'number') {
        return obj;
    } else if (obj) {
        if (obj.type === 'Feature' &&
            obj.geometry &&
            obj.geometry.type === 'Point' &&
            Array.isArray(obj.geometry.coordinates)) {
            return obj.geometry.coordinates;
        } else if (obj.type === 'Point' &&
            Array.isArray(obj.coordinates)) {
            return obj.coordinates;
        }
    }
    throw new Error('A coordinate, feature, or point geometry is required');
}

/**
 * Enforce expectations about types of GeoJSON objects for Turf.
 *
 * @alias geojsonType
 * @param {GeoJSON} value any GeoJSON object
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} if value is not the expected type.
 */
function geojsonType(value, type, name) {
    if (!type || !name) throw new Error('type and name required');

    if (!value || value.type !== type) {
        throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + value.type);
    }
}

/**
 * Enforce expectations about types of {@link Feature} inputs for Turf.
 * Internally this uses {@link geojsonType} to judge geometry types.
 *
 * @alias featureOf
 * @param {Feature} feature a feature with an expected geometry type
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} error if value is not the expected type.
 */
function featureOf(feature, type, name) {
    if (!name) throw new Error('.featureOf() requires a name');
    if (!feature || feature.type !== 'Feature' || !feature.geometry) {
        throw new Error('Invalid input to ' + name + ', Feature with geometry required');
    }
    if (!feature.geometry || feature.geometry.type !== type) {
        throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + feature.geometry.type);
    }
}

/**
 * Enforce expectations about types of {@link FeatureCollection} inputs for Turf.
 * Internally this uses {@link geojsonType} to judge geometry types.
 *
 * @alias collectionOf
 * @param {FeatureCollection} featurecollection a featurecollection for which features will be judged
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} if value is not the expected type.
 */
function collectionOf(featurecollection, type, name) {
    if (!name) throw new Error('.collectionOf() requires a name');
    if (!featurecollection || featurecollection.type !== 'FeatureCollection') {
        throw new Error('Invalid input to ' + name + ', FeatureCollection required');
    }
    for (var i = 0; i < featurecollection.features.length; i++) {
        var feature = featurecollection.features[i];
        if (!feature || feature.type !== 'Feature' || !feature.geometry) {
            throw new Error('Invalid input to ' + name + ', Feature with geometry required');
        }
        if (!feature.geometry || feature.geometry.type !== type) {
            throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + feature.geometry.type);
        }
    }
}

var geojsonType_1 = geojsonType;
var collectionOf_1 = collectionOf;
var featureOf_1 = featureOf;
var getCoord_1 = getCoord$1;

var index$1 = {
	geojsonType: geojsonType_1,
	collectionOf: collectionOf_1,
	featureOf: featureOf_1,
	getCoord: getCoord_1
};

/**
 * Wraps a GeoJSON {@link Geometry} in a GeoJSON {@link Feature}.
 *
 * @name feature
 * @param {Geometry} geometry input geometry
 * @param {Object} properties properties
 * @returns {FeatureCollection} a FeatureCollection of input features
 * @example
 * var geometry = {
 *      "type": "Point",
 *      "coordinates": [
 *        67.5,
 *        32.84267363195431
 *      ]
 *    }
 *
 * var feature = turf.feature(geometry);
 *
 * //=feature
 */
function feature(geometry, properties) {
    return {
        type: 'Feature',
        properties: properties || {},
        geometry: geometry
    };
}

var feature_1 = feature;

/**
 * Takes coordinates and properties (optional) and returns a new {@link Point} feature.
 *
 * @name point
 * @param {Array<number>} coordinates longitude, latitude position (each in decimal degrees)
 * @param {Object=} properties an Object that is used as the {@link Feature}'s
 * properties
 * @returns {Feature<Point>} a Point feature
 * @example
 * var pt1 = turf.point([-75.343, 39.984]);
 *
 * //=pt1
 */
var point$1 = function (coordinates, properties) {
    if (!Array.isArray(coordinates)) throw new Error('Coordinates must be an array');
    if (coordinates.length < 2) throw new Error('Coordinates must be at least 2 numbers long');
    return feature({
        type: 'Point',
        coordinates: coordinates.slice()
    }, properties);
};

/**
 * Takes an array of LinearRings and optionally an {@link Object} with properties and returns a {@link Polygon} feature.
 *
 * @name polygon
 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
 * @param {Object=} properties a properties object
 * @returns {Feature<Polygon>} a Polygon feature
 * @throws {Error} throw an error if a LinearRing of the polygon has too few positions
 * or if a LinearRing of the Polygon does not have matching Positions at the
 * beginning & end.
 * @example
 * var polygon = turf.polygon([[
 *  [-2.275543, 53.464547],
 *  [-2.275543, 53.489271],
 *  [-2.215118, 53.489271],
 *  [-2.215118, 53.464547],
 *  [-2.275543, 53.464547]
 * ]], { name: 'poly1', population: 400});
 *
 * //=polygon
 */
var polygon = function (coordinates, properties) {

    if (!coordinates) throw new Error('No coordinates passed');

    for (var i = 0; i < coordinates.length; i++) {
        var ring = coordinates[i];
        if (ring.length < 4) {
            throw new Error('Each LinearRing of a Polygon must have 4 or more Positions.');
        }
        for (var j = 0; j < ring[ring.length - 1].length; j++) {
            if (ring[ring.length - 1][j] !== ring[0][j]) {
                throw new Error('First and last Position are not equivalent.');
            }
        }
    }

    return feature({
        type: 'Polygon',
        coordinates: coordinates
    }, properties);
};

/**
 * Creates a {@link LineString} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name lineString
 * @param {Array<Array<number>>} coordinates an array of Positions
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<LineString>} a LineString feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var linestring1 = turf.lineString([
 *	[-21.964416, 64.148203],
 *	[-21.956176, 64.141316],
 *	[-21.93901, 64.135924],
 *	[-21.927337, 64.136673]
 * ]);
 * var linestring2 = turf.lineString([
 *	[-21.929054, 64.127985],
 *	[-21.912918, 64.134726],
 *	[-21.916007, 64.141016],
 * 	[-21.930084, 64.14446]
 * ], {name: 'line 1', distance: 145});
 *
 * //=linestring1
 *
 * //=linestring2
 */
var lineString = function (coordinates, properties) {
    if (!coordinates) {
        throw new Error('No coordinates passed');
    }
    return feature({
        type: 'LineString',
        coordinates: coordinates
    }, properties);
};

/**
 * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
 *
 * @name featureCollection
 * @param {Feature[]} features input features
 * @returns {FeatureCollection} a FeatureCollection of input features
 * @example
 * var features = [
 *  turf.point([-75.343, 39.984], {name: 'Location A'}),
 *  turf.point([-75.833, 39.284], {name: 'Location B'}),
 *  turf.point([-75.534, 39.123], {name: 'Location C'})
 * ];
 *
 * var fc = turf.featureCollection(features);
 *
 * //=fc
 */
var featureCollection = function (features) {
    return {
        type: 'FeatureCollection',
        features: features
    };
};

/**
 * Creates a {@link Feature<MultiLineString>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiLineString
 * @param {Array<Array<Array<number>>>} coordinates an array of LineStrings
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<MultiLineString>} a MultiLineString feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiLine = turf.multiLineString([[[0,0],[10,10]]]);
 *
 * //=multiLine
 *
 */
var multiLineString = function (coordinates, properties) {
    if (!coordinates) {
        throw new Error('No coordinates passed');
    }
    return feature({
        type: 'MultiLineString',
        coordinates: coordinates
    }, properties);
};

/**
 * Creates a {@link Feature<MultiPoint>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiPoint
 * @param {Array<Array<number>>} coordinates an array of Positions
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<MultiPoint>} a MultiPoint feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiPt = turf.multiPoint([[0,0],[10,10]]);
 *
 * //=multiPt
 *
 */
var multiPoint = function (coordinates, properties) {
    if (!coordinates) {
        throw new Error('No coordinates passed');
    }
    return feature({
        type: 'MultiPoint',
        coordinates: coordinates
    }, properties);
};


/**
 * Creates a {@link Feature<MultiPolygon>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiPolygon
 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygons
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<MultiPolygon>} a multipolygon feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiPoly = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]);
 *
 * //=multiPoly
 *
 */
var multiPolygon = function (coordinates, properties) {
    if (!coordinates) {
        throw new Error('No coordinates passed');
    }
    return feature({
        type: 'MultiPolygon',
        coordinates: coordinates
    }, properties);
};

/**
 * Creates a {@link Feature<GeometryCollection>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name geometryCollection
 * @param {Array<{Geometry}>} geometries an array of GeoJSON Geometries
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<GeometryCollection>} a GeoJSON GeometryCollection Feature
 * @example
 * var pt = {
 *     "type": "Point",
 *       "coordinates": [100, 0]
 *     };
 * var line = {
 *     "type": "LineString",
 *     "coordinates": [ [101, 0], [102, 1] ]
 *   };
 * var collection = turf.geometryCollection([pt, line]);
 *
 * //=collection
 */
var geometryCollection = function (geometries, properties) {
    return feature({
        type: 'GeometryCollection',
        geometries: geometries
    }, properties);
};

var factors = {
    miles: 3960,
    nauticalmiles: 3441.145,
    degrees: 57.2957795,
    radians: 1,
    inches: 250905600,
    yards: 6969600,
    meters: 6373000,
    metres: 6373000,
    kilometers: 6373,
    kilometres: 6373,
    feet: 20908792.65
};

/*
 * Convert a distance measurement from radians to a more friendly unit.
 *
 * @name radiansToDistance
 * @param {number} distance in radians across the sphere
 * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers
 * inches, yards, metres, meters, kilometres, kilometers.
 * @returns {number} distance
 */
var radiansToDistance = function (radians, units) {
    var factor = factors[units || 'kilometers'];
    if (factor === undefined) {
        throw new Error('Invalid unit');
    }
    return radians * factor;
};

/*
 * Convert a distance measurement from a real-world unit into radians
 *
 * @name distanceToRadians
 * @param {number} distance in real units
 * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers
 * inches, yards, metres, meters, kilometres, kilometers.
 * @returns {number} radians
 */
var distanceToRadians$1 = function (distance, units) {
    var factor = factors[units || 'kilometers'];
    if (factor === undefined) {
        throw new Error('Invalid unit');
    }
    return distance / factor;
};

/*
 * Convert a distance measurement from a real-world unit into degrees
 *
 * @name distanceToRadians
 * @param {number} distance in real units
 * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers
 * inches, yards, metres, meters, kilometres, kilometers.
 * @returns {number} degrees
 */
var distanceToDegrees = function (distance, units) {
    var factor = factors[units || 'kilometers'];
    if (factor === undefined) {
        throw new Error('Invalid unit');
    }
    return (distance / factor) * 57.2958;
};

var index$3 = {
	feature: feature_1,
	point: point$1,
	polygon: polygon,
	lineString: lineString,
	featureCollection: featureCollection,
	multiLineString: multiLineString,
	multiPoint: multiPoint,
	multiPolygon: multiPolygon,
	geometryCollection: geometryCollection,
	radiansToDistance: radiansToDistance,
	distanceToRadians: distanceToRadians$1,
	distanceToDegrees: distanceToDegrees
};

//http://en.wikipedia.org/wiki/Haversine_formula
//http://www.movable-type.co.uk/scripts/latlong.html
var getCoord = index$1.getCoord;
var helpers = index$3;
var point = helpers.point;
var distanceToRadians = helpers.distanceToRadians;

/**
 * Takes a {@link Point} and calculates the location of a destination point given a distance in degrees, radians, miles, or kilometers; and bearing in degrees. This uses the [Haversine formula](http://en.wikipedia.org/wiki/Haversine_formula) to account for global curvature.
 *
 * @name destination
 * @param {Feature<Point>} from starting point
 * @param {number} distance distance from the starting point
 * @param {number} bearing ranging from -180 to 180
 * @param {string} [units=kilometers] miles, kilometers, degrees, or radians
 * @returns {Feature<Point>} destination point
 * @example
 * var point = {
 *   "type": "Feature",
 *   "properties": {
 *     "marker-color": "#0f0"
 *   },
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [-75.343, 39.984]
 *   }
 * };
 * var distance = 50;
 * var bearing = 90;
 * var units = 'miles';
 *
 * var destination = turf.destination(point, distance, bearing, units);
 * destination.properties['marker-color'] = '#f00';
 *
 * var result = {
 *   "type": "FeatureCollection",
 *   "features": [point, destination]
 * };
 *
 * //=result
 */
var index = function (from, distance, bearing, units) {
    var degrees2radians = Math.PI / 180;
    var radians2degrees = 180 / Math.PI;
    var coordinates1 = getCoord(from);
    var longitude1 = degrees2radians * coordinates1[0];
    var latitude1 = degrees2radians * coordinates1[1];
    var bearing_rad = degrees2radians * bearing;

    var radians = distanceToRadians(distance, units);

    var latitude2 = Math.asin(Math.sin(latitude1) * Math.cos(radians) +
        Math.cos(latitude1) * Math.sin(radians) * Math.cos(bearing_rad));
    var longitude2 = longitude1 + Math.atan2(Math.sin(bearing_rad) *
        Math.sin(radians) * Math.cos(latitude1),
        Math.cos(radians) - Math.sin(latitude1) * Math.sin(latitude2));

    return point([radians2degrees * longitude2, radians2degrees * latitude2]);
};

/**
 * Iterate over coordinates in any GeoJSON object, similar to
 * Array.forEach.
 *
 * @name coordEach
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (value)
 * @param {boolean=} excludeWrapCoord whether or not to include
 * the final coordinate of LinearRings that wraps the ring in its iteration.
 * @example
 * var point = { type: 'Point', coordinates: [0, 0] };
 * coordEach(point, function(coords) {
 *   // coords is equal to [0, 0]
 * });
 */
function coordEach(layer, callback, excludeWrapCoord) {
    var i, j, k, g, l, geometry, stopG, coords,
        geometryMaybeCollection,
        wrapShrink = 0,
        isGeometryCollection,
        isFeatureCollection = layer.type === 'FeatureCollection',
        isFeature = layer.type === 'Feature',
        stop = isFeatureCollection ? layer.features.length : 1;

  // This logic may look a little weird. The reason why it is that way
  // is because it's trying to be fast. GeoJSON supports multiple kinds
  // of objects at its root: FeatureCollection, Features, Geometries.
  // This function has the responsibility of handling all of them, and that
  // means that some of the `for` loops you see below actually just don't apply
  // to certain inputs. For instance, if you give this just a
  // Point geometry, then both loops are short-circuited and all we do
  // is gradually rename the input until it's called 'geometry'.
  //
  // This also aims to allocate as few resources as possible: just a
  // few numbers and booleans, rather than any temporary arrays as would
  // be required with the normalization approach.
    for (i = 0; i < stop; i++) {

        geometryMaybeCollection = (isFeatureCollection ? layer.features[i].geometry :
        (isFeature ? layer.geometry : layer));
        isGeometryCollection = geometryMaybeCollection.type === 'GeometryCollection';
        stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

        for (g = 0; g < stopG; g++) {
            geometry = isGeometryCollection ?
            geometryMaybeCollection.geometries[g] : geometryMaybeCollection;
            coords = geometry.coordinates;

            wrapShrink = (excludeWrapCoord &&
                (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) ?
                1 : 0;

            if (geometry.type === 'Point') {
                callback(coords);
            } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
                for (j = 0; j < coords.length; j++) callback(coords[j]);
            } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
                for (j = 0; j < coords.length; j++)
                    for (k = 0; k < coords[j].length - wrapShrink; k++)
                        callback(coords[j][k]);
            } else if (geometry.type === 'MultiPolygon') {
                for (j = 0; j < coords.length; j++)
                    for (k = 0; k < coords[j].length; k++)
                        for (l = 0; l < coords[j][k].length - wrapShrink; l++)
                            callback(coords[j][k][l]);
            } else if (geometry.type === 'GeometryCollection') {
                for (j = 0; j < geometry.geometries.length; j++)
                    coordEach(geometry.geometries[j], callback, excludeWrapCoord);
            } else {
                throw new Error('Unknown Geometry Type');
            }
        }
    }
}
var coordEach_1 = coordEach;

/**
 * Reduce coordinates in any GeoJSON object into a single value,
 * similar to how Array.reduce works. However, in this case we lazily run
 * the reduction, so an array of all coordinates is unnecessary.
 *
 * @name coordReduce
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (memo, value) and returns
 * a new memo
 * @param {*} memo the starting value of memo: can be any type.
 * @param {boolean=} excludeWrapCoord whether or not to include
 * the final coordinate of LinearRings that wraps the ring in its iteration.
 * @returns {*} combined value
 */
function coordReduce(layer, callback, memo, excludeWrapCoord) {
    coordEach(layer, function (coord) {
        memo = callback(memo, coord);
    }, excludeWrapCoord);
    return memo;
}
var coordReduce_1 = coordReduce;

/**
 * Iterate over property objects in any GeoJSON object, similar to
 * Array.forEach.
 *
 * @name propEach
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (value)
 * @example
 * var point = { type: 'Feature', geometry: null, properties: { foo: 1 } };
 * propEach(point, function(props) {
 *   // props is equal to { foo: 1}
 * });
 */
function propEach(layer, callback) {
    var i;
    switch (layer.type) {
    case 'FeatureCollection':
        for (i = 0; i < layer.features.length; i++) {
            callback(layer.features[i].properties, i);
        }
        break;
    case 'Feature':
        callback(layer.properties, 0);
        break;
    }
}
var propEach_1 = propEach;

/**
 * Reduce properties in any GeoJSON object into a single value,
 * similar to how Array.reduce works. However, in this case we lazily run
 * the reduction, so an array of all properties is unnecessary.
 *
 * @name propReduce
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (memo, coord) and returns
 * a new memo
 * @param {*} memo the starting value of memo: can be any type.
 * @returns {*} combined value
 * @example
 * // an example of an even more advanced function that gives you the
 * // javascript type of each property of every feature
 * function propTypes (layer) {
 *   opts = opts || {}
 *   return propReduce(layer, function (prev, props) {
 *     for (var prop in props) {
 *       if (prev[prop]) continue
 *       prev[prop] = typeof props[prop]
 *     }
 *   }, {})
 * }
 */
function propReduce(layer, callback, memo) {
    propEach(layer, function (prop, i) {
        memo = callback(memo, prop, i);
    });
    return memo;
}
var propReduce_1 = propReduce;

/**
 * Iterate over features in any GeoJSON object, similar to
 * Array.forEach.
 *
 * @name featureEach
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (value)
 * @example
 * var feature = { type: 'Feature', geometry: null, properties: {} };
 * featureEach(feature, function(feature) {
 *   // feature == feature
 * });
 */
function featureEach(layer, callback) {
    if (layer.type === 'Feature') {
        callback(layer, 0);
    } else if (layer.type === 'FeatureCollection') {
        for (var i = 0; i < layer.features.length; i++) {
            callback(layer.features[i], i);
        }
    }
}
var featureEach_1 = featureEach;

/**
 * Get all coordinates from any GeoJSON object, returning an array of coordinate
 * arrays.
 *
 * @name coordAll
 * @param {Object} layer any GeoJSON object
 * @returns {Array<Array<number>>} coordinate position array
 */
function coordAll(layer) {
    var coords = [];
    coordEach(layer, function (coord) {
        coords.push(coord);
    });
    return coords;
}
var coordAll_1 = coordAll;

/**
 * Iterate over each geometry in any GeoJSON object, similar to
 * Array.forEach.
 *
 * @name geomEach
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (value)
 * @example
 * var point = {
 *   type: 'Feature',
 *   geometry: { type: 'Point', coordinates: [0, 0] },
 *   properties: {}
 * };
 * geomEach(point, function(geom) {
 *   // geom is the point geometry
 * });
 */
function geomEach(layer, callback) {
    var i, j, g, geometry, stopG,
        geometryMaybeCollection,
        isGeometryCollection,
        isFeatureCollection = layer.type === 'FeatureCollection',
        isFeature = layer.type === 'Feature',
        stop = isFeatureCollection ? layer.features.length : 1;

  // This logic may look a little weird. The reason why it is that way
  // is because it's trying to be fast. GeoJSON supports multiple kinds
  // of objects at its root: FeatureCollection, Features, Geometries.
  // This function has the responsibility of handling all of them, and that
  // means that some of the `for` loops you see below actually just don't apply
  // to certain inputs. For instance, if you give this just a
  // Point geometry, then both loops are short-circuited and all we do
  // is gradually rename the input until it's called 'geometry'.
  //
  // This also aims to allocate as few resources as possible: just a
  // few numbers and booleans, rather than any temporary arrays as would
  // be required with the normalization approach.
    for (i = 0; i < stop; i++) {

        geometryMaybeCollection = (isFeatureCollection ? layer.features[i].geometry :
        (isFeature ? layer.geometry : layer));
        isGeometryCollection = geometryMaybeCollection.type === 'GeometryCollection';
        stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

        for (g = 0; g < stopG; g++) {
            geometry = isGeometryCollection ?
            geometryMaybeCollection.geometries[g] : geometryMaybeCollection;

            if (geometry.type === 'Point' ||
                geometry.type === 'LineString' ||
                geometry.type === 'MultiPoint' ||
                geometry.type === 'Polygon' ||
                geometry.type === 'MultiLineString' ||
                geometry.type === 'MultiPolygon') {
                callback(geometry);
            } else if (geometry.type === 'GeometryCollection') {
                for (j = 0; j < geometry.geometries.length; j++)
                    callback(geometry.geometries[j]);
            } else {
                throw new Error('Unknown Geometry Type');
            }
        }
    }
}
var geomEach_1 = geomEach;

var index$6 = {
	coordEach: coordEach_1,
	coordReduce: coordReduce_1,
	propEach: propEach_1,
	propReduce: propReduce_1,
	featureEach: featureEach_1,
	coordAll: coordAll_1,
	geomEach: geomEach_1
};

var each = index$6.coordEach;
var point$2 = index$3.point;

/**
 * Takes one or more features and calculates the centroid using
 * the mean of all vertices.
 * This lessens the effect of small islands and artifacts when calculating
 * the centroid of a set of polygons.
 *
 * @name centroid
 * @param {(Feature|FeatureCollection)} features input features
 * @return {Feature<Point>} the centroid of the input features
 * @example
 * var poly = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Polygon",
 *     "coordinates": [[
 *       [105.818939,21.004714],
 *       [105.818939,21.061754],
 *       [105.890007,21.061754],
 *       [105.890007,21.004714],
 *       [105.818939,21.004714]
 *     ]]
 *   }
 * };
 *
 * var centroidPt = turf.centroid(poly);
 *
 * var result = {
 *   "type": "FeatureCollection",
 *   "features": [poly, centroidPt]
 * };
 *
 * //=result
 */
var index$5 = function (features) {
    var xSum = 0, ySum = 0, len = 0;
    each(features, function (coord) {
        xSum += coord[0];
        ySum += coord[1];
        len++;
    }, true);
    return point$2([xSum / len, ySum / len]);
};

var getCoord$2 = index$1.getCoord;
//http://en.wikipedia.org/wiki/Haversine_formula
//http://www.movable-type.co.uk/scripts/latlong.html

/**
 * Takes two {@link Point|points} and finds the geographic bearing between them.
 *
 * @name bearing
 * @param {Feature<Point>} start starting Point
 * @param {Feature<Point>} end ending Point
 * @returns {number} bearing in decimal degrees
 * @example
 * var point1 = {
 *   "type": "Feature",
 *   "properties": {
 *     "marker-color": '#f00'
 *   },
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [-75.343, 39.984]
 *   }
 * };
 * var point2 = {
 *   "type": "Feature",
 *   "properties": {
 *     "marker-color": '#0f0'
 *   },
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [-75.534, 39.123]
 *   }
 * };
 *
 * var points = {
 *   "type": "FeatureCollection",
 *   "features": [point1, point2]
 * };
 *
 * //=points
 *
 * var bearing = turf.bearing(point1, point2);
 *
 * //=bearing
 */
var index$8 = function (start, end) {
    var degrees2radians = Math.PI / 180;
    var radians2degrees = 180 / Math.PI;
    var coordinates1 = getCoord$2(start);
    var coordinates2 = getCoord$2(end);

    var lon1 = degrees2radians * coordinates1[0];
    var lon2 = degrees2radians * coordinates2[0];
    var lat1 = degrees2radians * coordinates1[1];
    var lat2 = degrees2radians * coordinates2[1];
    var a = Math.sin(lon2 - lon1) * Math.cos(lat2);
    var b = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

    var bearing = radians2degrees * Math.atan2(a, b);

    return bearing;
};

var getCoord$3 = index$1.getCoord;
var radiansToDistance$1 = index$3.radiansToDistance;
//http://en.wikipedia.org/wiki/Haversine_formula
//http://www.movable-type.co.uk/scripts/latlong.html

/**
 * Calculates the distance between two {@link Point|points} in degrees, radians,
 * miles, or kilometers. This uses the
 * [Haversine formula](http://en.wikipedia.org/wiki/Haversine_formula)
 * to account for global curvature.
 *
 * @name distance
 * @param {Feature<Point>} from origin point
 * @param {Feature<Point>} to destination point
 * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers
 * @return {number} distance between the two points
 * @example
 * var from = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [-75.343, 39.984]
 *   }
 * };
 * var to = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [-75.534, 39.123]
 *   }
 * };
 * var units = "miles";
 *
 * var points = {
 *   "type": "FeatureCollection",
 *   "features": [from, to]
 * };
 *
 * //=points
 *
 * var distance = turf.distance(from, to, units);
 *
 * //=distance
 */
var index$9 = function (from, to, units) {
    var degrees2radians = Math.PI / 180;
    var coordinates1 = getCoord$3(from);
    var coordinates2 = getCoord$3(to);
    var dLat = degrees2radians * (coordinates2[1] - coordinates1[1]);
    var dLon = degrees2radians * (coordinates2[0] - coordinates1[0]);
    var lat1 = degrees2radians * coordinates1[1];
    var lat2 = degrees2radians * coordinates2[1];

    var a = Math.pow(Math.sin(dLat / 2), 2) +
          Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);

    return radiansToDistance$1(2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), units);
};

var units = 'meters';

function tanDeg (deg) {
  var rad = deg * Math.PI / 180;
  return Math.tan(rad)
}

function cosDeg (deg) {
  var rad = deg * Math.PI / 180;
  return Math.cos(rad)
}

function getNested (feature, options) {
  var properties = feature.properties;
  if (options.nested) {
    if (properties[options.nested]) {
      properties = properties[options.nested];
    } else {
      properties = {};
    }
  }
  return properties
}

function checkFeatures (feature, options) {
  var properties = getNested(feature, options);
  var angle = properties.angle || options.angle;

  var geometryType = feature.geometry.type;

  if (angle === undefined) {
    throw new Error('feature must include angle property, or global angle option must be set')
  }

  if (geometryType === 'LineString') {
    if (feature.geometry.coordinates.length === 2) {
      return feature
    } else {
      throw new Error('only accepts only accepts LineStrings with two points')
    }
  } else if (geometryType === 'GeometryCollection') {
    if (feature.geometry.geometries.length === 2 &&
        feature.geometry.geometries[0].type === 'Point' &&
        feature.geometry.geometries[1].type === 'Point') {
      return feature
    } else {
      throw new Error('only accepts GeometryCollections containing two Points')
    }
  } else if (geometryType === 'Point') {
    if (properties.bearing !== undefined && properties.distance !== undefined) {
      return feature
    } else {
      throw new Error('only accepts single Points with distance and bearing properties')
    }
  } else {
    throw new Error('only accepts LineStrings with two points, GeometryCollections \n' +
      'containing two Points, or single Points with distance and bearing properties')
  }
}

function processFeature (feature, options) {
  var geometryType = feature.geometry.type;
  if (geometryType === 'Point') {
    return processPoint(feature, options)
  } else if (geometryType === 'LineString') {
    return processLineString(feature, options)
  } else if (geometryType === 'GeometryCollection') {
    return processGeometryCollection(feature, options)
  }
}

function processPoint (feature, options) {
  var properties = getNested(feature, options);

  var distance = properties.distance;
  var angle = properties.angle || options.angle;

  var centroid = index(feature, distance, properties.bearing, units);

  var distCentroid = tanDeg(angle / 2) * distance;

  var points = [
    index(centroid, distCentroid, properties.bearing + 90, units),
    index(centroid, -distCentroid, properties.bearing + 90, units)
  ];

  return {
    type: 'Feature',
    properties: feature.properties,
    geometry: {
      type: 'GeometryCollection',
      geometries: [
        feature.geometry,
        {
          type: 'LineString',
          coordinates: [
            points[0].geometry.coordinates,
            points[1].geometry.coordinates
          ]
        }
      ]
    }
  }
}

function processLineString (feature, options) {
  var properties = getNested(feature, options);
  var angle = properties.angle || options.angle;

  var centroid = index$5(feature);

  var points = feature.geometry.coordinates.map(function (coordinate) {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coordinate
      }
    }
  });

  var distCentroid = index$9(points[0], centroid, units);
  var bearing = index$8(points[0], points[1]);

  var distCamera = distCentroid / tanDeg(angle / 2);
  var camera = index(centroid, distCamera, bearing + 90, units);

  return {
    type: 'Feature',
    properties: feature.properties,
    geometry: {
      type: 'GeometryCollection',
      geometries: [
        camera.geometry,
        feature.geometry
      ]
    }
  }
}

function processGeometryCollection (feature, options) {
  var properties = getNested(feature, options);
  var angle = properties.angle || options.angle;

  var camera = feature.geometry.geometries[0];
  var centroid = feature.geometry.geometries[1];

  var distance = index$9(camera, centroid, units);
  var bearing = index$8(camera, centroid);

  var distFieldOfViewCorner = distance / cosDeg(angle / 2);

  var fieldOfViewPoint1 = index(camera, distFieldOfViewCorner, bearing + angle / 2, units);
  var fieldOfViewPoint2 = index(camera, distFieldOfViewCorner, bearing - angle / 2, units);

  return {
    type: 'Feature',
    properties: Object.assign(feature.properties, {
      bearing: bearing,
      distance: distance
    }),
    geometry: {
      type: 'GeometryCollection',
      geometries: [
        camera,
        {
          type: 'LineString',
          coordinates: [
            fieldOfViewPoint1.geometry.coordinates,
            fieldOfViewPoint2.geometry.coordinates
          ]
        }
      ]
    }
  }
}

function fromFeature (feature, options) {
  options = options || {};
  feature = checkFeatures(feature, options);
  return processFeature(feature, options)
}

var GeotagPhotoCameraControl = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function initialize(geotagPhotoCamera) {
    this._geotagPhotoCamera = geotagPhotoCamera;
  },

  onAdd: function onAdd(map) {
    this._map = map;

    var controlName = 'leaflet-control-geotag-photo-';
    var container = L.DomUtil.create('div', controlName + ' leaflet-bar');

    var cameraImg = '<img src="../images/camera-icon.svg" />';
    var crosshairImg = '<img src="../images/crosshair-icon.svg" />';

    this._cameraButton = this._createButton(cameraImg, 'Move camera back to map (C)', controlName + 'camera', container, this._centerCamera);

    this._crosshairButton = this._createButton(crosshairImg, 'Move map back to camera (M)', controlName + 'crosshair', container, this._centerMap);

    this._boundMapKeyPress = this._mapKeyPress.bind(this);
    this._map.on('keypress', this._boundMapKeyPress);

    return container;
  },

  _createButton: function _createButton(html, title, className, container, fn) {
    var link = L.DomUtil.create('a', className, container);
    link.innerHTML = html;
    link.href = '#';
    link.title = title;

    /*
     * Will force screen readers like VoiceOver to read this as "Zoom in - button"
     */
    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', title);

    L.DomEvent.on(link, 'mousedown dblclick', L.DomEvent.stopPropagation).on(link, 'click', L.DomEvent.stop).on(link, 'click', fn, this).on(link, 'click', this._refocusOnMap, this);

    return link;
  },

  onRemove: function onRemove(map) {
    L.DomUtil.remove(this._element);
    map.off('keypress', this._boundMapKeyPress);
  },

  _mapKeyPress: function _mapKeyPress(evt) {
    if (evt.originalEvent.charCode === 99) {
      // C key
      this._centerCamera();
    } else if (evt.originalEvent.charCode === 109) {
      // M key
      this._centerMap();
    }
  },

  _centerCamera: function _centerCamera() {
    if (this._map && this._geotagPhotoCamera) {
      this._geotagPhotoCamera.fitBounds(this._map.getBounds());
    }
  },

  _centerMap: function _centerMap() {
    if (this._map && this._geotagPhotoCamera) {
      this._map.fitBounds(this._geotagPhotoCamera.getBounds());
    }
  }

});

L.geotagPhotoCameraControl = function (geotagPhotoCamera) {
  return new GeotagPhotoCameraControl(geotagPhotoCamera);
};

var GeotagPhotoCamera = L.FeatureGroup.extend({

  options: {},

  initialize: function initialize(lineString, options) {
    L.Util.setOptions(this, options);

    this._fieldOfView = fromFeature(lineString);
    this._angle = this._fieldOfView.properties.angle;

    this._targetMarker = null;
    this._cameraMarker = null;
    this._polygon = null;
    this._polyline = null;

    this._createLayers();
    L.LayerGroup.prototype.initialize.call(this, [this._targetMarker, this._cameraMarker, this._polyline, this._polygon]);
  },

  _createLayers: function _createLayers() {
    var cameraSvg = '../images/camera.svg';
    var targetSvg = '../images/target.svg';

    this._cameraIcon = L.icon({
      iconUrl: cameraSvg,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    this._targetIcon = L.icon({
      iconUrl: targetSvg,
      iconSize: [180, 32],
      iconAnchor: [90, 16]
    });

    var pointList = this._getPointList(this._fieldOfView);
    var cameraLatLng = this._getCameraFromPointList(pointList);
    var targetLatLng = this._getTargetFromPointList(pointList);

    this._polyline = L.polyline(pointList, {
      color: 'black',
      opacity: 0.5,
      weight: 2,
      dashArray: '5, 7',
      lineCap: 'round',
      lineJoin: 'round'
    });

    this._polygon = L.polygon(pointList, {
      weight: 0,
      className: 'field-of-view'
    });

    this._control = L.geotagPhotoCameraControl(this);

    this._cameraMarker = L.marker(cameraLatLng, {
      icon: this._cameraIcon,
      draggable: true
    }).on('drag', this._onMarkerDrag, this).on('dragend', this._onMarkerDragEnd, this);

    this._targetMarker = L.marker(targetLatLng, {
      icon: this._targetIcon,
      draggable: true
    }).on('drag', this._onMarkerDrag, this).on('dragend', this._onMarkerDragEnd, this);

    var boundUpdateMarkerBearings = this._updateMarkerBearings.bind(this);
    var markerSetPos = function markerSetPos(pos) {
      var protoMarkerSetPos = L.Marker.prototype._setPos;
      protoMarkerSetPos.call(this, pos);
      boundUpdateMarkerBearings();
    };

    this._cameraMarker._setPos = this._targetMarker._setPos = markerSetPos;
  },

  addTo: function addTo(map) {
    this._map = map;

    L.FeatureGroup.prototype.addTo.call(this, map);

    this._control.addTo(map);

    this._boundOnDocumentKeyDown = this._onDocumentKeyDown.bind(this);
    document.addEventListener('keydown', this._boundOnDocumentKeyDown);

    return this;
  },

  removeFrom: function removeFrom(map) {
    L.FeatureGroup.prototype.removeFrom.call(this, map);

    if (this._boundOnDocumentKeyDown) {
      document.removeEventListener('keydown', this._boundOnDocumentKeyDown);
    }

    return this;
  },

  _getPointList: function _getPointList(fieldOfView) {
    return [[fieldOfView.geometry.geometries[1].coordinates[0][1], fieldOfView.geometry.geometries[1].coordinates[0][0]], [fieldOfView.geometry.geometries[0].coordinates[1], fieldOfView.geometry.geometries[0].coordinates[0]], [fieldOfView.geometry.geometries[1].coordinates[1][1], fieldOfView.geometry.geometries[1].coordinates[1][0]]];
  },

  _getCameraFromPointList: function _getCameraFromPointList(pointList) {
    return [(pointList[0][0] + pointList[2][0]) / 2, (pointList[0][1] + pointList[2][1]) / 2];
  },

  _getTargetFromPointList: function _getTargetFromPointList(pointList) {
    return pointList[1];
  },

  _addRotateTransform: function _addRotateTransform(element, rotation) {
    if (!element) {
      return;
    }

    var transform = element.style[L.DomUtil.TRANSFORM];
    var rotate = 'rotate(' + rotation + ')';

    element.style.transformOrigin = 'center center';

    if (transform.includes('rotate')) {
      element.style[L.DomUtil.TRANSFORM] = transform.replace(/rotate\(.*?\)/, rotate);
    } else {
      element.style[L.DomUtil.TRANSFORM] = transform + ' ' + rotate;
    }
  },

  _updateMarkerBearings: function _updateMarkerBearings(fieldOfView) {
    fieldOfView = fieldOfView || this._fieldOfView;

    var bearing = fieldOfView.properties.bearing;
    this._addRotateTransform(this._cameraMarker._icon, bearing + 'deg');
    this._addRotateTransform(this._targetMarker._icon, bearing + 'deg');
  },

  _drawFieldOfView: function _drawFieldOfView(fieldOfView) {
    fieldOfView = fieldOfView || this._fieldOfView;

    var pointList = this._getPointList(fieldOfView);
    this._polyline.setLatLngs(pointList);
    this._polygon.setLatLngs(pointList);
  },

  _updateFieldOfView: function _updateFieldOfView() {
    if (this._cameraMarker && this._targetMarker) {
      var angle = this._angle;
      var cameraLatLng = this._cameraMarker.getLatLng();
      var targetLatLng = this._targetMarker.getLatLng();

      var cameraTarget = {
        type: 'Feature',
        properties: {
          angle: angle
        },
        geometry: {
          type: 'GeometryCollection',
          geometries: [this._geoJsonPoint(cameraLatLng), this._geoJsonPoint(targetLatLng)]
        }
      };

      this._fieldOfView = fromFeature(cameraTarget);

      this._updateMarkerBearings(this._fieldOfView);
      this._drawFieldOfView(this._fieldOfView);
    }
  },

  _onMarkerDrag: function _onMarkerDrag(evt) {
    this._updateFieldOfView();
    this.fire('input');
  },

  _onMarkerDragEnd: function _onMarkerDragEnd(evt) {
    this.fire('change');
  },

  _moveMarker: function _moveMarker(marker, offset) {
    var point = this._map.latLngToContainerPoint(marker.getLatLng());
    point = point.add(offset);
    var latLng = this._map.containerPointToLatLng(point);
    marker.setLatLng(latLng);

    this._updateFieldOfView();
    this.fire('input');
  },

  _onMarkerKeyDown: function _onMarkerKeyDown(marker, evt) {
    // TODO: use options
    var moveDelta = 20;
    if (evt.shiftKey) {
      moveDelta = moveDelta * 4;
    }

    if (evt.keyCode === 37) {
      // left
      this._moveMarker(marker, L.point(-moveDelta, 0));
    } else if (evt.keyCode === 38) {
      // up
      this._moveMarker(marker, L.point(0, -moveDelta));
    } else if (evt.keyCode === 39) {
      // right
      this._moveMarker(marker, L.point(moveDelta, 0));
    } else if (evt.keyCode === 40) {
      // down
      this._moveMarker(marker, L.point(0, moveDelta));
    }
  },

  _onDocumentKeyDown: function _onDocumentKeyDown(evt) {
    if (document.activeElement === this._cameraMarker._icon) {
      this._onMarkerKeyDown(this._cameraMarker, evt);
    } else if (document.activeElement === this._targetMarker._icon) {
      this._onMarkerKeyDown(this._targetMarker, evt);
    }
  },

  _geoJsonPoint: function _geoJsonPoint(latLng) {
    return {
      type: 'Point',
      coordinates: [latLng.lng, latLng.lat]
    };
  },

  getFieldOfView: function getFieldOfView() {
    return this._fieldOfView;
  },

  getCameraLatLng: function getCameraLatLng() {
    return this._cameraMarker.getLatLng();
  },

  getTargetLatLng: function getTargetLatLng() {
    return this._targetMarker.getLatLng();
  },

  getCameraPoint: function getCameraPoint() {
    return this._geoJsonPoint(this.getCameraLatLng());
  },

  getTargetPoint: function getTargetPoint() {
    return this._geoJsonPoint(this.getTargetLatLng());
  },

  getCenter: function getCenter() {
    return L.latLngBounds([this.getCameraLatLng(), this.getTargetLatLng()]).getCenter();
  },

  fitBounds: function fitBounds(bounds) {
    var cameraBounds = this.getBounds();

    if (!bounds.contains(cameraBounds)) {
      var center = this.getCenter();
      var cameraLatLng = this.getCameraLatLng();
      var targetLatLng = this.getTargetLatLng();

      var boundsCenter = bounds.getCenter();

      var newCameraLatLng = [boundsCenter.lat - (center.lat - cameraLatLng.lat), boundsCenter.lng - (center.lng - cameraLatLng.lng)];

      var newTargetLatLng = [boundsCenter.lat - (center.lat - targetLatLng.lat), boundsCenter.lng - (center.lng - targetLatLng.lng)];

      this.setCameraAndTargetLatLng(newCameraLatLng, newTargetLatLng);
    }
  },

  setCameraLatLng: function setCameraLatLng(latLng) {
    if (!this._cameraMarker) {
      return;
    }

    this._cameraMarker.setLatLng(latLng);
    this._updateFieldOfView();
    this.fire('change');
  },

  setTargetLatLng: function setTargetLatLng(latLng) {
    if (!this._targetMarker) {
      return;
    }

    this._targetMarker.setLatLng(latLng);
    this._updateFieldOfView();
    this.fire('change');
  },

  setCameraAndTargetLatLng: function setCameraAndTargetLatLng(cameraLatLng, targetLatLng) {
    if (!this._cameraMarker || !this._targetMarker) {
      return;
    }

    this._cameraMarker.setLatLng(cameraLatLng);
    this._targetMarker.setLatLng(targetLatLng);
    this._updateFieldOfView();
    this.fire('change');
  },

  getBounds: function getBounds() {
    if (!this._fieldOfView) {
      return;
    }

    var pointList = this._getPointList(this._fieldOfView);
    return L.latLngBounds(pointList);
  },

  setAngle: function setAngle(angle) {
    this._angle = angle;
    this._updateFieldOfView();
  }

});

L.geotagPhoto = function (type, geometry, options) {
  if (type === 'crosshair') {
    options = geometry;
    return new GeotagPhotoCrosshair(options);
  } else if (type === 'camera') {
    return new GeotagPhotoCamera(geometry, options);
  } else {
    throw new Error('type must be either crosshair or camera');
  }
};

}(L));
