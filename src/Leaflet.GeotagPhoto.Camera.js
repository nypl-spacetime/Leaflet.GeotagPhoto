import L from 'Leaflet'
import { fromFeature } from 'field-of-view'

import GeotagPhotoCameraControl from './Leaflet.GeotagPhoto.CameraControl'

L.geotagPhotoCameraControl = function (geotagPhotoCamera) {
  return new GeotagPhotoCameraControl(geotagPhotoCamera)
}

export default L.FeatureGroup.extend({

  options: {

  },

  initialize: function (feature, options) {
    L.Util.setOptions(this, options)

    this._fieldOfView = fromFeature(feature)
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

  _createLayers: function () {
    var cameraSvg = '../images/camera.svg'
    var targetSvg = '../images/target.svg'

    this._cameraIcon = L.icon({
      iconUrl: cameraSvg,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    })

    this._targetIcon = L.icon({
      iconUrl: targetSvg,
      iconSize: [180, 32],
      iconAnchor: [90, 16]
    })

    var pointList = this._getPointList(this._fieldOfView)
    var cameraLatLng = this._getCameraFromPointList(pointList)
    var targetLatLng = this._getTargetFromPointList(pointList)

    this._polyline = L.polyline(pointList, {
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

    this._control = L.geotagPhotoCameraControl(this)

    this._cameraMarker = L.marker(cameraLatLng, {
      icon: this._cameraIcon,
      draggable: true
    }).on('drag', this._onMarkerDrag, this)
      .on('dragend', this._onMarkerDragEnd, this)

    this._targetMarker = L.marker(targetLatLng, {
      icon: this._targetIcon,
      draggable: true
    }).on('drag', this._onMarkerDrag, this)
      .on('dragend', this._onMarkerDragEnd, this)

    var boundUpdateMarkerBearings = this._updateMarkerBearings.bind(this)
    var markerSetPos = function (pos) {
      var protoMarkerSetPos = L.Marker.prototype._setPos
      protoMarkerSetPos.call(this, pos)
      boundUpdateMarkerBearings()
    }

    this._cameraMarker._setPos = this._targetMarker._setPos = markerSetPos
  },

  addTo: function (map) {
    this._map = map

    L.FeatureGroup.prototype.addTo.call(this, map)

    this._control.addTo(map)

    this._boundOnDocumentKeyDown = this._onDocumentKeyDown.bind(this)
    document.addEventListener('keydown', this._boundOnDocumentKeyDown)

    return this
  },

  removeFrom: function (map) {
    L.FeatureGroup.prototype.removeFrom.call(this, map)

    if (this._boundOnDocumentKeyDown) {
      document.removeEventListener('keydown', this._boundOnDocumentKeyDown)
    }

    return this
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
    ]
  },

  _getCameraFromPointList: function (pointList) {
    return pointList[1]
  },

  _getTargetFromPointList: function (pointList) {
    return [
      (pointList[0][0] + pointList[2][0]) / 2,
      (pointList[0][1] + pointList[2][1]) / 2
    ]
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

      this._fieldOfView = fromFeature(cameraTarget)

      this._updateMarkerBearings(this._fieldOfView)
      this._drawFieldOfView(this._fieldOfView)
    }
  },

  _onMarkerDrag: function (evt) {
    this._updateFieldOfView()
    this.fire('input')
  },

  _onMarkerDragEnd: function (evt) {
    this.fire('change')
  },

  _moveMarker: function (marker, offset) {
    var point = this._map.latLngToContainerPoint(marker.getLatLng())
    point = point.add(offset)
    var latLng = this._map.containerPointToLatLng(point)
    marker.setLatLng(latLng)

    this._updateFieldOfView()
    this.fire('input')
  },

  _onMarkerKeyDown: function (marker, evt) {
    // TODO: use options
    var moveDelta = 20
    if (evt.shiftKey) {
      moveDelta = moveDelta * 4
    }

    if (evt.keyCode === 37) {
      // left
      this._moveMarker(marker, L.point(-moveDelta, 0))
    } else if (evt.keyCode === 38) {
      // up
      this._moveMarker(marker, L.point(0, -moveDelta))
    } else if (evt.keyCode === 39) {
      // right
      this._moveMarker(marker, L.point(moveDelta, 0))
    } else if (evt.keyCode === 40) {
      // down
      this._moveMarker(marker, L.point(0, moveDelta))
    }
  },

  _onDocumentKeyDown: function (evt) {
    if (document.activeElement === this._cameraMarker._icon) {
      this._onMarkerKeyDown(this._cameraMarker, evt)
    } else if (document.activeElement === this._targetMarker._icon) {
      this._onMarkerKeyDown(this._targetMarker, evt)
    }
  },

  _geoJsonPoint: function (latLng) {
    return {
      type: 'Point',
      coordinates: [latLng.lng, latLng.lat]
    }
  },

  getFieldOfView: function () {
    return this._fieldOfView
  },

  getCameraLatLng: function () {
    return this._cameraMarker.getLatLng()
  },

  getTargetLatLng: function () {
    return this._targetMarker.getLatLng()
  },

  getCameraPoint: function () {
    return this._geoJsonPoint(this.getCameraLatLng())
  },

  getTargetPoint: function () {
    return this._geoJsonPoint(this.getTargetLatLng())
  },

  getCenter: function () {
    return L.latLngBounds([
      this.getCameraLatLng(),
      this.getTargetLatLng()
    ]).getCenter()
  },

  centerBounds: function (bounds) {
    var cameraBounds = this.getBounds()

    if (!bounds.contains(cameraBounds)) {
      var center = this.getCenter()
      var cameraLatLng = this.getCameraLatLng()
      var targetLatLng = this.getTargetLatLng()

      var boundsCenter = bounds.getCenter()

      var newCameraLatLng = [
        boundsCenter.lat - (center.lat - cameraLatLng.lat),
        boundsCenter.lng - (center.lng - cameraLatLng.lng)
      ]

      var newTargetLatLng = [
        boundsCenter.lat - (center.lat - targetLatLng.lat),
        boundsCenter.lng - (center.lng - targetLatLng.lng)
      ]

      this.setCameraAndTargetLatLng(newCameraLatLng, newTargetLatLng)
    }
  },

  setCameraLatLng: function (latLng) {
    if (!this._cameraMarker) {
      return
    }

    this._cameraMarker.setLatLng(latLng)
    this._updateFieldOfView()
    this.fire('change')
  },

  setTargetLatLng: function (latLng) {
    if (!this._targetMarker) {
      return
    }

    this._targetMarker.setLatLng(latLng)
    this._updateFieldOfView()
    this.fire('change')
  },

  setCameraAndTargetLatLng: function (cameraLatLng, targetLatLng) {
    if (!this._cameraMarker || !this._targetMarker) {
      return
    }

    this._cameraMarker.setLatLng(cameraLatLng)
    this._targetMarker.setLatLng(targetLatLng)
    this._updateFieldOfView()
    this.fire('change')
  },

  getBounds: function () {
    if (!this._fieldOfView) {
      return
    }

    var pointList = this._getPointList(this._fieldOfView)
    return L.latLngBounds(pointList)
  },

  setAngle: function (angle) {
    this._angle = angle
    this._updateFieldOfView()
  }

})
