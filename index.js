'use strict'

import L from 'Leaflet'
import GeotagPhotoCrosshair from './src/Leaflet.GeotagPhoto.Crosshair'
import GeotagPhotoCamera from './src/Leaflet.GeotagPhoto.Camera'

// Object.assign polyfill, for IE<=11. From:
//   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
if (typeof Object.assign !== 'function') {
  Object.assign = function (target, varArgs) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }

    var to = Object(target)

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index]

      if (nextSource != null) {
        for (var nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey]
          }
        }
      }
    }
    return to
  }
}

L.GeotagPhoto = {
  Crosshair: GeotagPhotoCrosshair,
  crosshair: function (options) {
    return new GeotagPhotoCrosshair(options)
  },
  Camera: GeotagPhotoCamera,
  camera: function (feature, options) {
    return new GeotagPhotoCamera(feature, options)
  }
}
