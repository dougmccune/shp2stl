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
