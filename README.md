shp2stl
=======
Utility for converting a shapefile to a 3D model. You can specify a property (or function) to use for the height of each shape. 

Usage
=====

```JavaScript
var fs = require('fs');
var shp2stl = require('shp2stl');

var file = 'SanFranciscoPopulation.shp';

shp2stl.shp2stl(file, 
	{
		width: 100, //in STL arbitrary units, but typically 3D printers use mm
		height: 10,
		extraBaseHeight: 0,
		extrudeBy: "Pop_psmi",
		simplification: .8,
		
		binary: true,
		cutoutHoles: false,
		verbose: true,
		extrusionMode: 'straight'
	},
	function(err, stl) {
		fs.writeFileSync('SanFranciscoPopulation.stl',  stl);
	}
);
```

Methods
=========
shp2stl(shapefilePath, options, callback)
---------------------------------------

Takes a path to a .shp file and a set of configuration options (see below). The provided callback will be called once complete with the bytes of the STL file in the result for you to save.

Options
=======
* `extrudeBy` - Either the name of the property in the shapefile to use for the z-axis extrusion, or a function that takes a topojson object representing each shape and returns a number. Required.
* `width` - The width in STL units to resize the 3D model to. Most 3D printers operate in millimeter units, so typically you'll want to set this to the desired mm. If this is unset then the model will not be resized and will be created in the map units, which will depend on your map's projection and bounds. Optional, but recommended.
* `height` - The height in STL units to make the model. This will be the height of the highest poly in your shapefile. Required.
* `extraBaseHeight` - You can add extra height across the board for all shapes. This can be useful if trying to ensure that there's enough of a base for your model for 3D printing. Defaults to `0`. Optional.
* `simplification` - Percentage to attempt to simplify the polygons before converting to a 3D model. This will use topojson's simplification method. Value should be between 0-1, where 0 will mean no simplification, .8 would attempt to reduce the number of points to 80% of the total, etc. Defaults to `0`. Optional.
* `binary` - If `true` will generate a binary STL file. If `false` will generate an ASCII STL file. Binary is going to result in much smaller file sizes. Defaults to `true`. Optional.
* `cutoutHoles` - If `true` shp2stl will try to add inner rings for shapes that fully contain other shapes. If your shapefile already has holes properly cut out then there's no need for this. But if you have a shapefile with shapes that fully contain others, but isn't already properly "donutted" then try using this. Defaults to `false`. Optional.
* `verbose` - If `true` will log a bit of output to the console as things run. Optional.
* `extrusionMode` - Can be set to `'straight'` or`'smooth'`. If set to `'straight'` it will generate perfectly flat horizontal planes that are connected together with perpendicular vertical planes for the sides. If set to `'smooth'` there will be no explicit vertical side planes  generated, but the horizontal planes will have their edges merged with the adjoining plane. Defaults to `'straight'`. Optional.
* `destSRS` - You can allow shp2stl to reproject your data if you'd like. This uses ogr2ogr and requires the ogr2ogr command-line tool installed separately. [Download page for gdal/ogr](http://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries). You can specify various forms of projection strings that ogr2ogr understands, such as `'EPSG:4326'`. Optional.
* `sourceSRS` - If you are using `destSRS` you can also optionally specify the source SRS of your shapefile. If you leave this blank then ogr2ogr will try to read the prj file and figure it out on its own. But if you don't have a prj file, or the default behavior of ogr2ogr doesn't work, you can specify it manually. Optional.
* `filterFunction` - If specified will allow you to filter out shapes before the conversion to the 3D model. Optional.
* `fixedMax` - Typically the shape with the highest value (as specified via the extrudeBy param) will be 100% of the height of the model (as specified by the height param). But if you want to change this you can manually set a `fixedMax` value. The height of a given poly will then be calculated by figuring out the poly's value as a percentage of the fixedMax times the height of the model. Optional.


License
=======
The MIT License (MIT)

Copyright (c) 2014 Doug McCune &lt;doug@dougmccune.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
