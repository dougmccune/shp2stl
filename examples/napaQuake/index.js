var fs = require('fs');
var shp2stl = require('../../.');

var file = 'pga.shp';

shp2stl.shp2stl(file, 
	{
		width: 100, //in STL arbitrary units, but typically 3D printers use mm
		height: 10,
		extraBaseHeight: 1,
		extrudeBy: "VALUE",
		simplification: 0,

		destSRS: "EPSG:900913", //this requires ogr2ogr command-line tool to already be installed separately on your system
		
		binary: true,
		cutoutHoles: false,
		verbose: true,
		extrusionMode: 'straight'
	},
	function(err, stl) {
		fs.writeFileSync('pga.stl',  stl);
	}
);