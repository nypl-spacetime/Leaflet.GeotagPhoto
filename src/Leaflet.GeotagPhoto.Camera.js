import L from 'Leaflet'
import { fromFeature } from 'field-of-view'

import GeotagPhotoCameraControl from './Leaflet.GeotagPhoto.CameraControl'

L.geotagPhotoCameraControl = function (geotagPhotoCamera, options) {
  return new GeotagPhotoCameraControl(geotagPhotoCamera, options)
}

export default L.FeatureGroup.extend({

  options: {
    // Whether the camera is draggable with mouse/touch or not
    draggable: true,

    // Whether to show camera control buttons
    control: true,

    // Whether the angle of the field-of-view can be changed with a draggable marker
    angleMarker: true,

    minAngle: 5,
    maxAngle: 120,

    // Control button images
    controlCameraImg: '../images/camera-icon.svg',
    controlCrosshairImg: '../images/crosshair-icon.svg',

    cameraIcon: L.icon({
      iconUrl: '../images/camera.svg',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    }),

    targetIcon: L.icon({
      iconUrl: '../images/marker.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    }),

    angleIcon: L.icon({
      iconUrl: '../images/marker.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    }),

    outlineStyle: {
      color: 'black',
      opacity: 0.5,
      weight: 2,
      dashArray: '5, 7',
      lineCap: 'round',
      lineJoin: 'round'
    },

    fillStyle: {
      weight: 0,
      fillOpacity: 0.2,
      fillColor: '#3388ff'
    }
  },

  initialize: function (feature, options) {
    L.setOptions(this, options)

    this.options.minAngle = Math.max(this.options.minAngle, 1)
    this.options.maxAngle = Math.min(this.options.maxAngle, 179)

    this._fieldOfView = fromFeature(feature)
    this._angle = this._fieldOfView.properties.angle

    var layers = this._createLayers()
    L.LayerGroup.prototype.initialize.call(this, layers)

    this.setDraggable(this.options.draggable)
  },

  _createLayers: function () {
    this._cameraIcon = this.options.cameraIcon
    this._targetIcon = this.options.targetIcon
    this._angleIcon = this.options.angleIcon

    var pointList = this._getPointList(this._fieldOfView)
    var cameraLatLng = this._getCameraFromPointList(pointList)
    var targetLatLng = this._getTargetFromPointList(pointList)
    var angleLatLng = this._getAngleFromPointList(pointList)

    this._polyline = L.polyline(pointList, this.options.outlineStyle)
    this._polygon = L.polygon(pointList, Object.assign(this.options.fillStyle, {
      className: 'field-of-view'
    }))

    this._control = L.geotagPhotoCameraControl(this, {
      cameraImg: this.options.controlCameraImg,
      crosshairImg: this.options.controlCrosshairImg
    })

    this._cameraMarker = L.marker(cameraLatLng, {
      icon: this._cameraIcon,
      draggable: this.options.draggable,
      zIndexOffset: 600,
      title: 'Camera',
      alt: 'Location of the camera'
    }).on('drag', this._onMarkerDrag, this)
      .on('dragend', this._onMarkerDragEnd, this)

    this._targetMarker = L.marker(targetLatLng, {
      icon: this._targetIcon,
      draggable: this.options.draggable,
      zIndexOffset: 200,
      title: 'Target',
      alt: 'Location of the target'
    }).on('drag', this._onMarkerDrag, this)
      .on('dragend', this._onMarkerDragEnd, this)

    this._angleMarker = L.marker(angleLatLng, {
      icon: this._angleIcon,
      draggable: this.options.draggable,
      zIndexOffset: 400,
      title: 'Angle',
      alt: 'Field of view angle'
    }).on('drag', this._onAngleMarkerDrag, this)
      .on('dragend', this._onMarkerDragEnd, this)

    var boundUpdateMarkerBearings = this._updateMarkerBearings.bind(this)
    var markerSetPos = function (pos) {
      var protoMarkerSetPos = L.Marker.prototype._setPos
      protoMarkerSetPos.call(this, pos)
      boundUpdateMarkerBearings()
    }

    this._cameraMarker._setPos = this._targetMarker._setPos = markerSetPos

    return [
      this._polygon,
      this._polyline,
      this._targetMarker,
      this._angleMarker,
      this._cameraMarker
    ]
  },

  addTo: function (map) {
    this._map = map

    L.FeatureGroup.prototype.addTo.call(this, map)

    if (this.options.control) {
      this._control.addTo(map)
    }

    this._boundOnDocumentKeyDown = this._onDocumentKeyDown.bind(this)
    document.addEventListener('keydown', this._boundOnDocumentKeyDown)

    this.setDraggable(this.options.draggable)
    this._updateMarkerBearings(this._fieldOfView)

    return this
  },

  removeFrom: function (map) {
    this._map = undefined

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

  _getAngleFromPointList: function (pointList) {
    return pointList[2]
  },

  _addRotateTransform: function (element, rotation) {
    if (!element) {
      return
    }

    var transform = element.style[L.DomUtil.TRANSFORM]
    var rotate = 'rotate(' + rotation + ')'

    element.style.transformOrigin = 'center center'

    if (transform.indexOf('rotate') !== -1) {
      element.style[L.DomUtil.TRANSFORM] = transform.replace(/rotate\(.*?\)/, rotate)
    } else {
      element.style[L.DomUtil.TRANSFORM] = transform + ' ' + rotate
    }
  },

  _updateMarkerBearings: function (fieldOfView) {
    fieldOfView = fieldOfView || this._fieldOfView

    var bearing = fieldOfView.properties.bearing
    var angle = fieldOfView.properties.angle
    this._addRotateTransform(this._cameraMarker._icon, bearing + 'deg')
    this._addRotateTransform(this._targetMarker._icon, bearing + 'deg')
    this._addRotateTransform(this._angleMarker._icon, (bearing + angle / 2) + 'deg')
  },

  _drawFieldOfView: function (fieldOfView) {
    fieldOfView = fieldOfView || this._fieldOfView

    var pointList = this._getPointList(fieldOfView)
    this._polyline.setLatLngs(pointList)
    this._polygon.setLatLngs(pointList)
  },

  _updateFieldOfView: function () {
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

    var angleLatLng = this._getAngleFromPointList(this._getPointList(this._fieldOfView))
    this._angleMarker.setLatLng(angleLatLng)

    this._updateMarkerBearings(this._fieldOfView)
    this._drawFieldOfView(this._fieldOfView)
  },

  _onAngleMarkerDrag: function (evt) {
    var cameraLatLng = this._cameraMarker.getLatLng()
    var targetLatLng = this._targetMarker.getLatLng()
    var angleLatLng = this._angleMarker.getLatLng()

    var points = {
      type: 'Feature',
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          this._geoJsonPoint(cameraLatLng),
          this._geoJsonPoint(targetLatLng),
          this._geoJsonPoint(angleLatLng)
        ]
      }
    }

    this._fieldOfView = fromFeature(points)
    this.setAngle(this._fieldOfView.properties.angle)
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
    this.fire('change')
  },

  _onMarkerKeyDown: function (marker, evt) {
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

  _onAngleMarkerKeyDown: function (evt) {
    var angleDelta = 2.5
    if (evt.shiftKey) {
      angleDelta = angleDelta * 4
    }

    if (evt.keyCode === 37) {
      // left
      this.setAngle(this._angle - angleDelta)
    } else if (evt.keyCode === 39) {
      // right
      this.setAngle(this._angle + angleDelta)
    }
  },

  _onDocumentKeyDown: function (evt) {
    if (document.activeElement === this._cameraMarker._icon) {
      this._onMarkerKeyDown(this._cameraMarker, evt)
    } else if (document.activeElement === this._targetMarker._icon) {
      this._onMarkerKeyDown(this._targetMarker, evt)
    } else if (document.activeElement === this._angleMarker._icon) {
      this._onAngleMarkerKeyDown(evt)
    }
  },

  _setMarkerVisible: function (marker, visible) {
    marker._icon.style.display = visible ? 'inherit' : 'none'
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
    if (!this._map) {
      return
    }

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
    if (!this._map) {
      return
    }

    this._cameraMarker.setLatLng(latLng)
    this._updateFieldOfView()
    this.fire('change')
  },

  setTargetLatLng: function (latLng) {
    if (!this._map) {
      return
    }

    this._targetMarker.setLatLng(latLng)
    this._updateFieldOfView()
    this.fire('change')
  },

  setCameraAndTargetLatLng: function (cameraLatLng, targetLatLng) {
    if (!this._map) {
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
    this._angle = Math.max(Math.min(angle, this.options.maxAngle), this.options.minAngle)
    this._updateFieldOfView()
    this.fire('input')
  },

  setDraggable: function (draggable) {
    if (!this._map) {
      return
    }

    if (draggable) {
      this._cameraMarker.dragging.enable()
      this._targetMarker.dragging.enable()
      this._angleMarker.dragging.enable()
    } else {
      this._cameraMarker.dragging.disable()
      this._targetMarker.dragging.disable()
      this._angleMarker.dragging.disable()
    }

    this._setMarkerVisible(this._targetMarker, draggable)
    this._setMarkerVisible(this._angleMarker, draggable && this.options.angleMarker)
  }

})
