var PhotoLocation = L.FeatureGroup.extend({

  options: {

  },

  initialize: function(lineString, options) {
    L.Util.setOptions(this, options)

    this._fieldOfView = FieldOfView.fromFeature(lineString)
    this._angle = this._fieldOfView.properties.angle

    this._targetMarker = null
    this._cameraMarker = null
    this._polygon = null
    this._polyline = null

    this._createLayers()
    L.LayerGroup.prototype.initialize.call(this,
      [
        this._targetMarker,
        this._cameraMarker,
        this._polyline,
        this._polygon
      ]
    )
  },

  _createLayers: function() {
    var opts = this.options

    var cameraSvg = '../images/camera.svg'
    var targetSvg = '../images/target.svg'

    this._cameraIcon = new L.Icon({
      iconUrl: cameraSvg,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    })

    this._targetIcon = new L.Icon({
      iconUrl: targetSvg,
      iconSize: [180, 32],
      iconAnchor: [90, 16]
    })

    // ayer.setRotationOrigin('13px 13px');

    var pointList = this._getPointList(this._fieldOfView)
    var cameraLatLng = this._getCameraLatLng(pointList)
    var targetLatLng = this._getTargetLatLng(pointList)

    this._polyline = new L.Polyline(pointList, {
      color: 'black',
      opacity: 0.5,
      weight: 2,
      dashArray: '5, 7',
      lineCap: 'round',
      lineJoin: 'round'
    })

    this._polygon = L.polygon(pointList, {
      weight: 0,
      className: 'field-of-view'
    })

    this._cameraMarker = new L.Marker(cameraLatLng, {
      icon: this._cameraIcon,
      draggable: true
    }).on('drag', this._onMarkerDrag, this)
      .on('dragstart', this._onMarkerDragStart, this)
      .on('dragend', this._onMarkerDragEnd, this)

    this._targetMarker = new L.Marker(targetLatLng, {
      icon: this._targetIcon,
      draggable: true
    }).on('drag', this._onMarkerDrag, this)
      .on('dragstart', this._onMarkerDragStart, this)
      .on('dragend', this._onMarkerDragEnd, this)

    boundUpdateMarkerBearings = this._updateMarkerBearings.bind(this)
    var markerSetPos = function (pos) {
      var protoMarkerSetPos = L.Marker.prototype._setPos
      protoMarkerSetPos.call(this, pos)
      boundUpdateMarkerBearings()
    }

    this._cameraMarker._setPos = markerSetPos
    this._targetMarker._setPos = markerSetPos

    L.DomEvent.on(this._cameraMarker, 'keypress', this._onMarkerKeyPress, this)
    L.DomEvent.on(this._targetMarker, 'keypress', this._onMarkerKeyPress, this)
  },

  _getPointList: function (fieldOfView) {
    return [
      [
        fieldOfView.geometry.geometries[1].coordinates[0][1],
        fieldOfView.geometry.geometries[1].coordinates[0][0]
      ],
      [
        fieldOfView.geometry.geometries[0].coordinates[1],
        fieldOfView.geometry.geometries[0].coordinates[0]
      ],
      [
        fieldOfView.geometry.geometries[1].coordinates[1][1],
        fieldOfView.geometry.geometries[1].coordinates[1][0]
      ]
    ];
  },

  _getCameraLatLng: function (pointList) {
    return [
      (pointList[0][0] + pointList[2][0]) / 2,
      (pointList[0][1] + pointList[2][1]) / 2,
    ]
  },

  _getTargetLatLng: function (pointList) {
    return pointList[1]
  },

  _addRotateTransform: function (element, rotation) {
    if (!element) {
      return
    }

    var transform = element.style[L.DomUtil.TRANSFORM]
    var rotate = 'rotate(' + rotation + ')'

    element.style.transformOrigin = 'center center'

    if (transform.includes('rotate')) {
      element.style[L.DomUtil.TRANSFORM] = transform.replace(/rotate\(.*?\)/, rotate)
    } else {
      element.style[L.DomUtil.TRANSFORM] = transform + ' ' + rotate
    }
  },

  _updateMarkerBearings: function (fieldOfView) {
    fieldOfView = fieldOfView || this._fieldOfView

    var bearing = fieldOfView.properties.bearing
    this._addRotateTransform(this._cameraMarker._icon, bearing + 'deg')
    this._addRotateTransform(this._targetMarker._icon, bearing + 'deg')
  },

  _drawFieldOfView: function (fieldOfView) {
    fieldOfView = fieldOfView || this._fieldOfView

    var pointList = this._getPointList(fieldOfView)
    this._polyline.setLatLngs(pointList)
    this._polygon.setLatLngs(pointList)
  },

  _updateFieldOfView: function () {
    if (this._cameraMarker && this._targetMarker) {
      var angle = this._angle
      var cameraLatLng = this._cameraMarker.getLatLng()
      var targetLatLng = this._targetMarker.getLatLng()

      var cameraTarget = {
        type: 'Feature',
        properties: {
          angle: angle
        },
        geometry: {
          type: 'GeometryCollection',
          geometries: [
            this._geoJsonPoint(cameraLatLng),
            this._geoJsonPoint(targetLatLng)
          ]
        }
      }

      this._fieldOfView = FieldOfView.fromFeature(cameraTarget)

      this._updateMarkerBearings(this._fieldOfView)
      this._drawFieldOfView(this._fieldOfView)
    }
  },

  _onMarkerDragStart: function (evt) {
    this.fire('dragstart')
  },

  _onMarkerDrag: function (evt) {
    this._updateFieldOfView()
    this.fire('drag')
  },

  _onMarkerDragEnd: function (evt) {
    this.fire('dragend')
  },

  _onMarkerKeyPress: function (evt) {
    console.log('ijsdosaidjodijdsaoijd')
  },

  _geoJsonPoint: function(latLng) {
    return {
      type: 'Point',
      coordinates: [latLng.lng, latLng.lat]
    }
  },

  getFieldOfView: function () {
    return this._fieldOfView
  },

  getCameraLocation: function () {
    return this._geoJsonPoint(this._cameraMarker.getLatLng())
  },

  getTargetLocation: function () {
    return this._geoJsonPoint(this._targetMarker.getLatLng())
  },

  setAngle: function (angle) {
    this._angle = angle
    this._updateFieldOfView()
  }

})

L.photoLocation = function (type, geometry, options) {
  // two types: crosshair + camera
  return new PhotoLocation(geometry, options)
}

// ======================================================================
// FieldOfView class
//   TODO:
//    - use http://github.com/nypl-spacetime/field-of-view,
//    - include with rollup.js
// ======================================================================

var FieldOfView = function() {
  return {
    units: 'meters',

    // ======================================================================
    // The following code is copied/modified from http://turfjs.org/:
    //
    // The MIT License (MIT)
    //
    // Copyright (c) 2013 Morgan Herlocker
    //
    // Permission is hereby granted, free of charge, to any person obtaining a copy of
    // this software and associated documentation files (the "Software"), to deal in
    // the Software without restriction, including without limitation the rights to
    // use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    // the Software, and to permit persons to whom the Software is furnished to do so,
    // subject to the following conditions:
    //
    // The above copyright notice and this permission notice shall be included in all
    // copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
    // FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
    // COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
    // IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    // CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    // ======================================================================

    factors: {
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
    },

    feature: function (geometry, properties) {
      return {
        type: 'Feature',
        properties: properties || {},
        geometry: geometry
      }
    },

    point: function (coordinates, properties) {
      if (!Array.isArray(coordinates)) throw new Error('Coordinates must be an array');
      if (coordinates.length < 2) throw new Error('Coordinates must be at least 2 numbers long');
      return this.feature({
        type: 'Point',
        coordinates: coordinates.slice()
      }, properties);
    },

    radiansToDistance: function (radians, units) {
      var factor = this.factors[units || 'kilometers'];
      if (factor === undefined) {
        throw new Error('Invalid unit');
      }
      return radians * factor;
    },

    distanceToRadians: function (distance, units) {
      var factor = this.factors[units || 'kilometers']
      if (factor === undefined) {
        throw new Error('Invalid unit')
      }
      return distance / factor
    },

    coordEach: function (layer, callback, excludeWrapCoord) {
      var i, j, k, g, l, geometry, stopG, coords,
          geometryMaybeCollection,
          wrapShrink = 0,
          isGeometryCollection,
          isFeatureCollection = layer.type === 'FeatureCollection',
          isFeature = layer.type === 'Feature',
          stop = isFeatureCollection ? layer.features.length : 1;

      for (i = 0; i < stop; i++) {
          geometryMaybeCollection = (isFeatureCollection ? layer.features[i].geometry :
          (isFeature ? layer.geometry : layer))
          isGeometryCollection = geometryMaybeCollection.type === 'GeometryCollection'
          stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1

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
    },

    getCoord: function (obj) {
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
          return obj.coordinates
        }
      }
      throw new Error('A coordinate, feature, or point geometry is required')
    },

    centroid: function (features) {
      var xSum = 0
      var ySum = 0
      var len = 0
      this.coordEach(features, function (coord) {
        xSum += coord[0]
        ySum += coord[1]
        len++
      }, true)
      return this.point([xSum / len, ySum / len])
    },

    distance: function (from, to, units) {
      var degrees2radians = Math.PI / 180
      var coordinates1 = this.getCoord(from)
      var coordinates2 = this.getCoord(to)
      var dLat = degrees2radians * (coordinates2[1] - coordinates1[1])
      var dLon = degrees2radians * (coordinates2[0] - coordinates1[0])
      var lat1 = degrees2radians * coordinates1[1]
      var lat2 = degrees2radians * coordinates2[1]

      var a = Math.pow(Math.sin(dLat / 2), 2) +
        Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2)

      return this.radiansToDistance(2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), units)
    },

    destination: function (from, distance, bearing, units) {
      var degrees2radians = Math.PI / 180
      var radians2degrees = 180 / Math.PI
      var coordinates1 = this.getCoord(from)
      var longitude1 = degrees2radians * coordinates1[0]
      var latitude1 = degrees2radians * coordinates1[1]
      var bearing_rad = degrees2radians * bearing

      var radians = this.distanceToRadians(distance, units)

      var latitude2 = Math.asin(Math.sin(latitude1) * Math.cos(radians) +
          Math.cos(latitude1) * Math.sin(radians) * Math.cos(bearing_rad))
      var longitude2 = longitude1 + Math.atan2(Math.sin(bearing_rad) *
          Math.sin(radians) * Math.cos(latitude1),
          Math.cos(radians) - Math.sin(latitude1) * Math.sin(latitude2))

      return this.point([radians2degrees * longitude2, radians2degrees * latitude2])
    },

    bearing: function (start, end) {
      var degrees2radians = Math.PI / 180
      var radians2degrees = 180 / Math.PI
      var coordinates1 = this.getCoord(start)
      var coordinates2 = this.getCoord(end)

      var lon1 = degrees2radians * coordinates1[0]
      var lon2 = degrees2radians * coordinates2[0]
      var lat1 = degrees2radians * coordinates1[1]
      var lat2 = degrees2radians * coordinates2[1]
      var a = Math.sin(lon2 - lon1) * Math.cos(lat2)
      var b = Math.cos(lat1) * Math.sin(lat2) -
          Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)

      var bearing = radians2degrees * Math.atan2(a, b)

      return bearing
    },

    // ======================================================================
    // End Turf.js code
    // ======================================================================

    tanDeg: function (deg) {
      var rad = deg * Math.PI / 180
      return Math.tan(rad)
    },

    cosDeg: function (deg) {
      var rad = deg * Math.PI / 180
      return Math.cos(rad)
    },

    getNested: function (feature, options) {
      var properties = feature.properties
      if (options.nested) {
        if (properties[options.nested]) {
          properties = properties[options.nested]
        } else {
          properties = {}
        }
      }
      return properties
    },

    checkFeatures: function (feature, options) {
      var properties = this.getNested(feature, options)
      var angle = properties.angle || options.angle

      var geometryType = feature.geometry.type

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
    },

    processFeature: function (feature, options) {
      var geometryType = feature.geometry.type
      if (geometryType === 'Point') {
        return this.processPoint(feature, options)
      } else if (geometryType === 'LineString') {
        return this.processLineString(feature, options)
      } else if (geometryType === 'GeometryCollection') {
        return this.processGeometryCollection(feature, options)
      }
    },

    processPoint: function (feature, options) {
      var properties = this.getNested(feature, options)

      var distance = properties.distance
      var angle = properties.angle || options.angle

      var centroid = this.destination(feature, distance, properties.bearing, this.units)

      var distCentroid = this.tanDeg(angle / 2) * distance

      var points = [
        this.destination(centroid, distCentroid, properties.bearing + 90, this.units),
        this.destination(centroid, -distCentroid, properties.bearing + 90, this.units)
      ]

      return {
        type: 'Feature',
        properties: Object.assign(feature.properties, {
          angle: angle,
          distance: distance
        }),
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
    },

    processLineString: function (feature, options) {
      var properties = this.getNested(feature, options)
      var angle = properties.angle || options.angle

      var centroid = this.centroid(feature)

      var points = feature.geometry.coordinates.map(function (coordinate) {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coordinate
          }
        }
      })

      var distCentroid = this.distance(points[0], centroid, this.units)
      var bearing = this.bearing(points[0], points[1])

      var distCamera = distCentroid / this.tanDeg(angle / 2)
      var camera = this.destination(centroid, distCamera, bearing + 90, this.units)

      return {
        type: 'Feature',
        properties: Object.assign(feature.properties, {
          bearing: bearing,
          distance: distCamera
        }),
        geometry: {
          type: 'GeometryCollection',
          geometries: [
            camera.geometry,
            feature.geometry
          ]
        }
      }
    },

    processGeometryCollection: function (feature, options) {
      var properties = this.getNested(feature, options)
      var angle = properties.angle || options.angle

      var camera = feature.geometry.geometries[0]
      var centroid = feature.geometry.geometries[1]

      var distance = this.distance(camera, centroid, this.units)
      var bearing = this.bearing(camera, centroid)

      var distFieldOfViewCorner = distance / this.cosDeg(angle / 2)

      var fieldOfViewPoint1 = this.destination(camera, distFieldOfViewCorner, bearing + angle / 2, this.units)
      var fieldOfViewPoint2 = this.destination(camera, distFieldOfViewCorner, bearing - angle / 2, this.units)

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
    },

    fromFeature: function (feature, options) {
      options = options || {}
      feature = this.checkFeatures(feature, options)
      return this.processFeature(feature, options)
    }
  }
}()
