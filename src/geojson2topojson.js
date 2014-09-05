var inside = require('point-in-polygon');
var deepcopy = require('deepcopy');
var topojson = require('topojson');

module.exports = geojson2topojson;

function geojson2topojson(json, cutoutHoles, filterFunction, verbose) {
	json.features = getOnlyPolygonFeatures(json);

	if(filterFunction != null) {
		json.features = json.features.filter(filterFunction);
	}

	if(cutoutHoles) {
		var holesAdded = addInnerHolesForOverlappingShapes(json);
		
		if(verbose)
			console.log(holesAdded + " inner holes added");
	}

	var topology = topojson.topology(json.features, 
		{
			"property-transform": function(feature) { return feature.properties; },
			"quantization": 1e8,
			"coodinate-system": "spherical",
			"verbose": verbose,
			"force-clockwise": true
		});

	if(verbose)
		console.log("topojson done");
	
	return topology;
}

function getOnlyPolygonFeatures(json) {
	var convertedSingles = convertMultiPolys(json);
	
	var existingSingles = json.features.filter(function(feature) {
		return feature.geometry.type == "Polygon";
	});

	return existingSingles.concat(convertedSingles);
}

function convertMultiPolys(json) {
	var multiPolys = json.features.filter(function(feature) {
		return feature.geometry.type == "MultiPolygon";
	});

	var convertedSingles = [];
	multiPolys.forEach(function(feature) {
		feature.geometry.coordinates.forEach(function(coords) {
			var clone = deepcopy(feature);
			clone.geometry.coordinates = coords;
			clone.geometry.type = "Polygon";
			
			convertedSingles.push(clone);
		});
	});

	return convertedSingles;
}

function addInnerHolesForOverlappingShapes(json) {
	json.features.forEach(function(feature) {
		feature.properties["perim"] = polygonArea(feature);
	});

	json.features.sort(function(a, b) {
		if(a.properties.perim < b.properties.perim)
			return -1;
		else if(a.properties.perim > b.properties.perim)
			return 1;
		else
			return 0
	});

	var holesAdded = 0;

	for(var i=0; i<json.features.length; i++) {
		
		var smaller = json.features[i];

		for(var j=i+1; j<json.features.length; j++) {
			
			var larger = json.features[j];

			if(polyContainedByPoly(smaller, larger)) {
				holesAdded++;
				larger.geometry.coordinates.push(deepcopy(getOuterRing(smaller)).reverse());
				break;
			}
			
		}
	}

	return holesAdded
}

function polygonArea(feature) {
	var outerRing = getOuterRing(feature);
	var area = 0;
	var n = outerRing.length-1;

	var j = n-1;
	
	for (i=0; i<n; i++) { 
    	var coordA = outerRing[i];
    	var coordB = outerRing[j];
		
		area += (coordB[0]+coordA[0]) * (coordB[1]-coordA[1]);
    	j = i;
    }

    return area/2;
}

function getOuterRing(feature) {
	return feature.geometry.coordinates[0];
}

function polyContainedByPoly(innerFeature, outerFeature) {
	var outerPoly = getOuterRing(outerFeature);
	var innerPoly = getOuterRing(innerFeature);

	return ringContainedByRing(innerPoly, outerPoly);
}

function ringContainedByRing(innerPoly, outerPoly) {
	for(var i=0; i<innerPoly.length; i++) {
		var innerCoord = innerPoly[i];
		
		var pointIsIn = inside(innerCoord, outerPoly);

		if(!pointIsIn)
			return false;
	}

	return true;
}