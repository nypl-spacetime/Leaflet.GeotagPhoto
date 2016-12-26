import L from 'Leaflet'

export default L.Evented.extend({
  options: {
    crosshairHTML: '<img src="../images/crosshair.svg" width="100px" />'
  },

  initialize: function (options) {
    // Don't know why L.Util.setOptions(this, options) doesn't work
    //   (like it does in other Leaflet plugins)
    // `this` seems to be new class of Camera prototype,
    // and therefore this.hasOwnProperty('options') === false (used in setOptions function)
    this.options = Object.assign(this.options, options)
  },

  addTo: function (map) {
    this._map = map
    var container = map.getContainer()
    this._element = L.DomUtil.create('div', 'leaflet-geotag-photo-crosshair', container)
    this._element.innerHTML = this.options.crosshairHTML

    this._boundOnInput = this._onInput.bind(this)
    this._boundOnChange = this._onChange.bind(this)

    this._map.on('move', this._boundOnInput)
    this._map.on('moveend', this._boundOnChange)

    return this
  },

  removeFrom: function (map) {
    if (this._map && this._boundOnInput && this._boundOnChange) {
      this._map.off('move', this._boundOnInput)
      this._map.off('moveend', this._boundOnChange)
    }

    if (this._element) {
      L.DomUtil.remove(this._element)
    }

    return this
  },

  _onInput: function () {
    this.fire('input')
  },

  _onChange: function () {
    this.fire('change')
  },

  getCrosshairLatLng: function () {
    return this._map.getCenter()
  },

  getCrosshairPoint: function () {
    if (this._map) {
      var center = this.getCrosshairLatLng()
      return {
        type: 'Point',
        coordinates: [
          center.lng,
          center.lat
        ]
      }
    }
  }

})
