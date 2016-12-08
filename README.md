# Leaflet.GeotagPhoto

Leaflet plugin for photo geotagging.

Examples:

- [Crosshair mode](http://spacetime.nypl.org/Leaflet.GeotagPhoto/examples/crosshair.html)
- [Camera mode](http://spacetime.nypl.org/Leaflet.GeotagPhoto/examples/camera.html)

[![Screenshot of camera module](images/screenshot.png)](http://spacetime.nypl.org/Leaflet.GeotagPhoto/examples/camera.html)

## Usage

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet-geotag-photo/dist/Leaflet.GeotagPhoto.css" />
<script src="https://unpkg.com/leaflet-geotag-photo/dist/Leaflet.GeotagPhoto.min.js"></script>
```

Example:

```js
var cameraPoint = [6.83442, 52.43369]
var targetPoint = [6.83342, 52.43469]

var points = {
  type: 'Feature',
  properties: {
    angle: 20
  },
  geometry: {
    type: 'GeometryCollection',
    geometries: [
      {
        type: 'Point',
        coordinates: cameraPoint
      },
      {
        type: 'Point',
        coordinates: targetPoint
      }
    ]
  }
}

L.GeotagPhoto.camera('camera', points).addTo(map)
  .on('change', function (event) {
    // Get camera field of view
    // See:
    //   https://github.com/nypl-spacetime/field-of-view#output
    var fieldOfView = this.getFieldOfView()
  })
```

## Modes

### L.GeotagPhoto.Crosshair

L.GeotagPhoto.Crosshair extends [L.Evented](http://leafletjs.com/reference-1.0.0.html#evented).

#### API

`addTo`

`removeFrom`

`getCrosshairLatLng ()`

`getCrosshairPoint ()`

#### Options

Coming soon.

### L.GeotagPhoto.Camera

L.GeotagPhoto.Camera extends [L.FeatureGroup](http://leafletjs.com/reference-1.0.0.html#featuregroup).

#### API

`getFieldOfView ()`

Returns field of view of camera; see https://github.com/nypl-spacetime/field-of-view#output

`getCameraLatLng ()`

`getTargetLatLng ()`

`getCameraPoint ()`

`getTargetPoint ()`

`getCenter ()`

`getBounds ()`

`fitBounds (bounds)`

`setCameraLatLng (latLng)`

`setTargetLatLng (latLng)`

`setAngle (angle)`

`setCameraAndTargetLatLng (cameraLatLng, targetLatLng)`

#### Options

Coming soon.

#### Keyboard navigation
