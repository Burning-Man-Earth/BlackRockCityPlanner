## Black Rock City Planner [![Build Status](https://travis-ci.org/Burning-Man-Earth/BlackRockCityPlanner.svg?branch=master)](https://travis-ci.org/Burning-Man-Earth/BlackRockCityPlanner)

This is a collection of command line tools and scripts that generate [GeoJSON](http://geojson.org/). The GeoJSON is then used in the [iBurn](https://iburnapp.com/) app.

### Geo Data Generator

#### What we can create:
 - The centerlines of all the streets inside the fence.
 - The trash fence pentagon.
 - All the plazas and portals.
 - An outline of all the streets at proper width combined with plazas and portals (used for good looking rendereing).
 - Toilets as points or polygons

#### What we can't create:
 - Gate Road
 - Camp polygons (can geocode addresses).
 - Art locations (can geocode addresses).
 - Locations of important POI like first-aid, ranger and ice.
 - Airport 

#### Install

`npm install` or `npm install -g`

#### Use

##### Streets

`node src/layout.js -f [layout file] -o [output file] -t [type]`

- layout file: path to the [layout file](https://github.com/Burning-Man-Earth/iBurn-Data/tree/master/data). Use the latest year to see the proper format.
- output file: (optional) The output GeoJSON destination. Results from [2016](https://github.com/Burning-Man-Earth/iBurn-Data/tree/master/data/2016/geo)
- type: `streets`, `polygons`, `outline`, `fence`

##### Toilets

`node src/toilet.js -f [layout file] -t [toilet layout file] -o [output file]`

- layout file: path to the [layout file](https://github.com/Burning-Man-Earth/iBurn-Data/tree/master/data). Use the latest year to see the proper format.
- toilet layout file: path to the [toilet layout file](https://github.com/Burning-Man-Earth/iBurn-Data/blob/master/data/2016/layouts/toilet.json).
- output file: (optional) The output GeoJSON destination. Here are results for [2016](https://github.com/Burning-Man-Earth/iBurn-Data/blob/master/data/2016/geo/toilets.geojson)

### [Geocoder](src/geocoder/readme.md)
