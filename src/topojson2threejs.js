var THREE = require('three');
var topojson = require('topojson');
var bounds = require('topojson/lib/topojson/bounds');

module.exports = topojson2threejs;

function topojson2threejs(topology, options) {
	var simplification = 0,
	    targetWidth = NaN,
	    targetHeight = 10,
	    fixedMax = NaN,
	    extraBaseHeight = 1,
	    extrudeBy,
	    extrusionMode = 'straight',
	    verbose;

	if(options)
		"simplification" in options && (simplification = +options["simplification"]),
		"width" in options && (targetWidth = +options["width"]),
		"height" in options && (targetHeight = +options["height"]),
		"fixedMax" in options && (fixedMax = +options["fixedMax"]),
		"extraBaseHeight" in options && (extraBaseHeight = +options["extraBaseHeight"]),
		"extrudeBy" in options && (extrudeBy = options["extrudeBy"]),
		"extrusionMode" in options && (extrusionMode = options["extrusionMode"]),
		"verbose" in options && (verbose = !!options["verbose"]);

	if(extrudeBy === undefined) {
		throw new Error("nothing to extrude by");
	}
	
	flattenTopoJSON(topology);
	
	if(topology.bbox === undefined)
		topology.bbox = getBBox(topology);
	
	if(simplification > 0 && simplification < 1) {
		try {
			topology = topojson.simplify(topology, 
				{
					"coordinate-system": "spherical", 
					"retain-proportion": simplification,
					"verbose": verbose
				});
		}
		catch(e) {
			if(verbose)
				console.log("error simplifying");
		}
	}

	if(!isNaN(targetWidth))
		scaleTopoJSON(topology, targetWidth);

	if(verbose)
		console.log("making top planes");
	
	var tops    = topojson2threeJSTopPlanes(topology, extrudeBy, targetHeight, extraBaseHeight, fixedMax, extrusionMode === 'smooth');
	
	if(verbose)
		console.log("making side planes");
	
	var sides   = topojson2threeJSSides( topology, extrudeBy, targetHeight, extraBaseHeight, fixedMax, extrusionMode === 'smooth');
	
	var all = tops.concat(sides);

	if(extrusionMode === 'smooth')
		mergeZCoords(all);

	if(verbose)
		console.log("making bottom planes");
	
	var bottoms = topojson2threeJSBottomPlanes(topology);

	all = all.concat(bottoms);

	if(verbose)
		console.log("done making 3D planes");

	return all;
}

function scaleTopoJSON(topology, targetSideLength) {
	var w = topology.bbox[2] - topology.bbox[0]
	var h = topology.bbox[3] - topology.bbox[1];

	var maxSide = Math.max(w,h);
	var scale = targetSideLength / maxSide;

	topology.transform.scale = topology.transform.scale.map(function(n) { return n * scale; });
	topology.transform.translate = [0, 0];
	topology.bbox = [0, 0, w*scale, h*scale];
}

function flattenTopoJSON(topology) {
	topology.objects = flattenTopoJSONObjects(topology.objects);
}

function flattenTopoJSONObjects(objects) {
	var newObjects = [];

	for(var key in objects) {
		var object = objects[key];

		if(object.type == "GeometryCollection") {
			newObjects = newObjects.concat(object.geometries);
		}
		else if(object.type == "MultiPolygon") {
			newObjects.push(object);
		}
		else if(object.type == "Polygon") {
			newObjects.push(object);
		}
	};

	return newObjects;
}

function mergeZCoords(shapes) {
	var zValues = {};

	shapes.forEach(function(shape) {
		shape.vertices.forEach(function(vertex) {
			var key = vertex.x + " " + vertex.y;
			
			if(zValues[key] != null) {
				zValues[key] = Math.max(zValues[key], vertex.z);
			}
			else {
				zValues[key] = vertex.z;
			}
		});
	});

	shapes.forEach(function(shape) {
		shape.vertices.forEach(function(vertex) {
			var key = vertex.x + " " + vertex.y;
			
			if(vertex.z > 0)
				vertex.z = zValues[key];
		});
	});
}

function topojson2threeJSSides(topology, extrudeBy, targetHeight, extraBaseHeight, fixedMax, onlyEdges) {
	var topoShapes = [];

	var max = -Infinity;

	var fixedMaxSet = !isNaN(fixedMax);
	if(fixedMaxSet)
		max = fixedMax;


	var isFunction = typeof extrudeBy === "function";

	var arcZValues = [];

	topology.objects.forEach(function(topoObj) {
		var extrusionValue = isFunction ? extrudeBy(topoObj) : parseFloat(topoObj.properties[extrudeBy]);
		if(isNaN(extrusionValue))
			extrusionValue = 0;

		if(!fixedMaxSet)
			max = Math.max(extrusionValue, max);

		for(var i=0; i<topoObj.arcs.length; i++) {
			var arcArray = topoObj.arcs[i];

			//TODO: revisit this
			if(arcArray instanceof Array && arcArray[0] instanceof Array)
				arcArray = arcArray[0];
			
			arcArray.forEach(function(arcIndex) {
				//turn negative indexes into their positive versions
				//negative arc indices in topojson indicate the arc should be in reverse order
				if(arcIndex < 0)
					arcIndex = (arcIndex * -1) - 1;

				if(arcZValues[arcIndex] == null) {
					arcZValues[arcIndex] = [];
				}

				arcZValues[arcIndex].push(extrusionValue);
			});
		}
	});


	for(var i=0; i<topology.arcs.length; i++) {
		var arc = topology.arcs[i];

		var zValues = arcZValues[i];

		var decoded = decodeArc(topology, arc);

		for(var j=0; j<decoded.length-1; j++) {
			var cur  = decoded[j];
			var next = decoded[j+1];

			var z1 = 0;
			var z2 = 0;

			if(zValues == null) {
				continue
			}
			else if(zValues.length == 2) {
				zValues.sort();

				z1 = getZ(zValues[0]/max, targetHeight, extraBaseHeight);
				z2 = getZ(zValues[1]/max, targetHeight, extraBaseHeight);
			}
			else if(zValues.length == 1) {
				z2 = getZ(zValues[0]/max, targetHeight, extraBaseHeight);
			}
			else {
				continue;
			}
			
			if(!onlyEdges || z1 == 0 || z2 == 0) {
				try {
					var geometry = makeFace(cur[0], cur[1], z1, next[0], next[1], z2);
					topoShapes.push(geometry);
				}
				catch(e) {
					console.log("error creating side face");
				}
			}
			
		}
		
	}

	return topoShapes;
}

function makeFace(x1, y1, z1, x2, y2, z2) {
	var a = new THREE.Vector3(x1, y1, z1);
	var b = new THREE.Vector3(x1, y1, z2);
	var c = new THREE.Vector3(x2, y2, z2);
	var d = new THREE.Vector3(x2, y2, z1);
	
	var vertices = [a, b, c, d];
	
	var geometry = new THREE.Geometry();
	geometry.faces = [
		new THREE.Face3(0, 1, 2, new THREE.Vector3(0,0,-1) ),
		new THREE.Face3(2, 3, 0, new THREE.Vector3(0,0,-1) )
	];

	geometry.vertices = vertices;
	geometry.computeFaceNormals();
	
	return geometry;
}

function getBBox(topology) {
	var decodedArcs = decodeAllArcs(topology);
	
	var minX = Infinity;
	var minY = Infinity;
	var maxX = -Infinity;
	var maxY = -Infinity;

	decodedArcs.forEach(function(coords) {
		if(coords[0] < minX)
			minX = coords[0];

		if(coords[1] < minY)
			minY = coords[1];

		if(coords[0] > maxX)
			maxX = coords[0];

		if(coords[1] > maxY)
			maxY = coords[1];
	});

	return [minX, minY, maxX, maxY];
}

function decodeAllArcs(topology) {
	var all = [];
	topology.arcs.forEach(function(arc) {
		all = all.concat(decodeArc(topology, arc));
	});

	return all;
}

function decodeArc(topology, arc) {
	var x = 0, y = 0;
	
	return arc.map(function(position) {
		position = position.slice();
		position[0] = (x += position[0]) * topology.transform.scale[0] + topology.transform.translate[0];
		position[1] = (y += position[1]) * topology.transform.scale[1] + topology.transform.translate[1];
		return position;
	});

}

function topojson2threeJSTopPlanes(topology, extrudeBy, targetHeight, extraBaseHeight, fixedMax, mergeZValues) {
	var shapes = [];

	var isFunction = typeof extrudeBy === "function";

	var maxValue = -Infinity;

	if(isNaN(fixedMax)) {
		topology.objects.forEach(function(feature) {
			var extrusionValue = isFunction ? extrudeBy(feature) : parseFloat(feature.properties[extrudeBy]);
			if(isNaN(extrusionValue))
				extrusionValue = 0;

		 	maxValue = Math.max(maxValue, extrusionValue);
		});
	}
	else {
		maxValue = fixedMax;
	}
	
	topology.objects.forEach(function(object) {

		var shape = topoShape2threeShape(topology, object);
		if(shape) {
			var top = shape.makeGeometry();

			var value = isFunction ? extrudeBy(object) : parseFloat(object.properties[extrudeBy]);
			if(isNaN(value))
				value = 0;

			var extrusionAmount = getZ(value / maxValue, targetHeight, extraBaseHeight);
			top.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, extrusionAmount ) );
			
			shapes.push(top);
		}
	});	

	return shapes;
}

function topojson2threeJSBottomPlanes(topology) {
	var multi = topojson.mergeArcs(topology, topology.objects);
	var mergedBottomGeoms = [];
	var errorMakingMergedBottom = false;

	multi.arcs.forEach(function(singlePolyArcs) {
		var singlePolyShape = topoShape2threeShape(topology, {arcs: singlePolyArcs});
		if(singlePolyShape) {
			var bottom = singlePolyShape.makeGeometry();
			bottom.flipped = true;
			mergedBottomGeoms.push(bottom);
		}
		else {
			errorMakingMergedBottom = true;
		}
	});

	if(!errorMakingMergedBottom) {
		return mergedBottomGeoms;
	}
	else {
		var shapes = [];

		topology.objects.forEach(function(object) {
		
			var shape = topoShape2threeShape(topology, object);
			if(shape) {
				var bottom = shape.makeGeometry();
				shapes.push(bottom);
			}
		});	

		return shapes;
	}
}

function getZ(percent, targetHeight, extraBaseHeight) {
	return percent * (targetHeight - extraBaseHeight) + extraBaseHeight;
}

function topoShape2threeShape(topology, object) {

	if(object.arcs.length == 0)
		return null;

	var outer = decodeTopoRing(topology, object.arcs[0]);
	var holes = [];

	if(object.arcs.length > 1) {
		holes = object.arcs.slice(1).map(function(innerRing){
			return decodeTopoRing(topology, innerRing);
		});
	}

	if(outer.length <= 1) {
		return null;
	}
	if(outer.length == 3 && outer[0].x == outer[2].x && outer[0].y == outer[2].y) {
		return null;
	}
	else if(outer.length == 2 && outer[0].x == outer[1].x && outer[0].y == outer[1].y) {
		return null;
	}

	var shape = coords2three(outer);
	
	shape.holes = holes.filter(function(hole) { return hole.length > 2; }).map(function(hole) {
		return coords2three(hole);
	});
	
	return shape;
}

function decodeTopoRing(topology, arcSegments) {
	var decodedRing = [];

	for(var i=0; i<arcSegments.length; i++) {
		var arcIndex = arcSegments[i];

		//TODO: revisit this
		if(arcIndex instanceof Array && arcIndex[0] instanceof Array)
			arcIndex = arcIndex[0];

		var reversed = false;
		if(arcIndex < 0) {
			reversed = true;
			arcIndex = (arcIndex * -1) - 1;
		}

		var arc = topology.arcs[arcIndex];
		
		if(arc === undefined || arc.length == 0)
			continue;

		var decodedSegment = decodeArc(topology, arc);
		
		if(reversed) {
			decodedSegment.reverse();
		}

		if(i > 0)
			decodedSegment = decodedSegment.slice(1);

		decodedRing = decodedRing.concat(decodedSegment);
	};

	decodedRing.pop();

	return decodedRing;
}

function coords2three(coords) {
	return new THREE.Shape(
		coords.map(function(coord) {
			return new THREE.Vector2(coord[0], coord[1]);
		})
	);
}