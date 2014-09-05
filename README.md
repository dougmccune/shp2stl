shp2stl
=======
Utility for converting a shapefile to a 3D model. You can specify a property (or function) to use for the height of each shape. 

Example usage:

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

Options
=======
Details coming soon...


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
