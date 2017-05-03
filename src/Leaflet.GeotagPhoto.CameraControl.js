import L from 'Leaflet'

export default L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (geotagPhotoCamera, options) {
    this._geotagPhotoCamera = geotagPhotoCamera
    L.setOptions(this, options)
  },

  onAdd: function (map) {
    this._map = map

    var controlName = 'leaflet-control-geotag-photo-'
    var container = L.DomUtil.create('div', controlName + ' leaflet-bar')

    var cameraImg = '<img role="none" src="' + this.options.cameraImg + '" />'
    var crosshairImg = '<img role="none" src="' + this.options.crosshairImg + '" />'

    this._cameraButton = this._createButton(cameraImg, 'Move camera back to map (C)',
      controlName + 'camera', container, this._centerCamera)

    this._crosshairButton = this._createButton(crosshairImg, 'Move map back to camera (M)',
      controlName + 'crosshair', container, this._centerMap)

    this._boundMapKeyPress = this._mapKeyPress.bind(this)
    this._map.on('keypress', this._boundMapKeyPress)

    return container
  },

  _createButton: function (html, title, className, container, fn) {
    var link = L.DomUtil.create('a', className, container)
    link.innerHTML = html
    link.href = '#'
    link.title = title

    /*
     * Will force screen readers like VoiceOver to read this as "Zoom in - button"
     */
    link.setAttribute('role', 'button')
    link.setAttribute('aria-label', title)

    L.DomEvent
      .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
      .on(link, 'click', L.DomEvent.stop)
      .on(link, 'click', fn, this)
      .on(link, 'click', this._refocusOnMap, this)

    return link
  },

  onRemove: function (map) {
    L.DomUtil.remove(this._element)
    map.off('keypress', this._boundMapKeyPress)
  },

  _mapKeyPress: function (evt) {
    if (evt.originalEvent.charCode === 99) {
      // C key
      this._centerCamera()
    } else if (evt.originalEvent.charCode === 109) {
      // M key
      this._centerMap()
    }
  },

  _centerCamera: function () {
    if (this._map && this._geotagPhotoCamera) {
      this._geotagPhotoCamera.centerBounds(this._map.getBounds())
    }
  },

  _centerMap: function () {
    if (this._map && this._geotagPhotoCamera) {
      this._map.fitBounds(this._geotagPhotoCamera.getBounds())
    }
  }

})
