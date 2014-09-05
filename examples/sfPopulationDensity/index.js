var fs = require('fs');
var geo2stl = require('../../.');

var file = 'SanFranciscoPopulation.shp';

geo2stl.shp2stl(file, 
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
		fs.writeFileSync(removeExtension(file) + '.stl',  stl);
	}
);

function removeExtension(file) {
	return file.substring(0, file.lastIndexOf('.'));
}