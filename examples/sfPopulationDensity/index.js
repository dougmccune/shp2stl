var fs = require('fs');
var shp2stl = require('../../.');

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