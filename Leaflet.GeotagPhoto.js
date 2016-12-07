'use strict'

import L from 'Leaflet'
import GeotagPhotoCrosshair from './src/Leaflet.GeotagPhoto.Crosshair'
import GeotagPhotoCamera from './src/Leaflet.GeotagPhoto.Camera'

L.geotagPhoto = function (type, geometry, options) {
  if (type === 'crosshair') {
    options = geometry
    return new GeotagPhotoCrosshair(options)
  } else if (type === 'camera') {
    return new GeotagPhotoCamera(geometry, options)
  } else {
    throw new Error('type must be either crosshair or camera')
  }
}
