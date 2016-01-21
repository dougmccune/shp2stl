var fs = require('fs');
var shapefile = require('shapefile');

var threejs2stl = require('./threejs2stl');
var topojson2threejs = require('./topojson2threejs');
var geojson2topojson = require('./geojson2topojson');

var ogr2ogr = require('ogr2ogr');

module.exports.shp2stl = shp2stl;
module.exports.geojson2stl = geojson2stl;
module.exports.reprojectGeoJSON = reprojectGeoJSON;

function shp2stl(shpfile, options, callback) {

	shapefile.read(shpfile, function(err, geojson) {
		
		if('destSRS' in options && !('sourceSRS' in options)) {

			var prjFile = shpfile.replace(/\.shp$/, '.prj');
			if (fs.existsSync(prjFile)) {
				options.sourceSRS = prjFile;
			}
			else {
				options.sourceSRS = 'EPSG:4326';
			}
		}

		geojson2stl(geojson, options, callback);
	});
}

function reprojectGeoJSON(geojson, sourceSRS, destSRS, callback) {
	ogr2ogr(geojson)
		.project(destSRS, sourceSRS)
		.exec(function (er, geojson) {
	  		callback(er, geojson);
		});
}

function geojson2stl(json, options, callback) {
	var cutoutHoles = false,
	    destSRS,
	    sourceSRS,
	    verbose,
	    filterFunction;

	if(options)
		"cutoutHoles" in options && (cutoutHoles = !!options["cutoutHoles"]),
		"destSRS" in options && (destSRS = options["destSRS"]),
		"sourceSRS" in options && (sourceSRS = options["sourceSRS"]),
		"verbose" in options && (verbose = !!options["verbose"]),
		"filterFunction" in options && (filterFunction = options["filterFunction"]);

	if(sourceSRS != null && destSRS != null) {
		if(verbose)
			console.log("reprojecting from " + sourceSRS + " to " + destSRS);

		reprojectGeoJSON(json, sourceSRS, destSRS, function(err, json) {
			if(err)
				callback(err, null);
			else
				callback(null, topojson2stl( geojson2topojson(json, cutoutHoles, filterFunction, verbose), options) );
		});
	}
	else {
		callback(null, topojson2stl( geojson2topojson(json, cutoutHoles, filterFunction, verbose), options) );
	}
}

function topojson2stl(topology, options) {
	var binary = true;

	if(options)
		"binary" in options && (binary = !!options["binary"]);

	var threeJSModel = topojson2threejs(topology, options);
	return threejs2stl(threeJSModel, binary);
}
