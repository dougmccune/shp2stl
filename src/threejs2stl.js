var THREE = require('three');

module.exports = threejs2stl;

function threejs2stl(geometries, binary) {
	return binary ? threejs2STLB(geometries) : threejs2STLA(geometries);
}

function threejs2STLA(geometries) {
	var ascii = 'solid  \n';
	
	geometries.forEach(function(geometry) {
		var vertices = geometry.vertices;
	
		geometry.faces.forEach(function(face) {
			
			var va = vertices[ face.a ];
			var vb = vertices[ face.b ];
			var vc = vertices[ face.c ];
			
			if(geometry.flipped === true) {
				var tmp = va;
				va = vb;
				vb = tmp;
			}
			
			ascii += "\tfacet normal " + stringifyVector( face.normal ) + " \n";
			ascii += "\t\touter loop \n";
			ascii += "\t\t\t" + stringifyVertex( va );
			ascii += "\t\t\t" + stringifyVertex( vb );
			ascii += "\t\t\t" + stringifyVertex( vc );
			ascii += "\t\tendloop \n";
			ascii += "\tendfacet \n";
			
			if(face instanceof THREE.Face4) {

				var vd = vertices[ face.d ];

				if(geometry.flipped === true) {
					var tmp = vc;
					vc = vd;
					vd = tmp;

					console.log('clock: ' + THREE.Shape.Utils.isClockWise([vc, vd, va]));
				}

				ascii += "\tfacet normal " + stringifyVector( face.normal ) + " \n";
				ascii += "\t\touter loop \n";
				ascii += "\t\t\t" + stringifyVertex( vc );
				ascii += "\t\t\t" + stringifyVertex( vd );
				ascii += "\t\t\t" + stringifyVertex( va );
				ascii += "\t\tendloop \n";
				ascii += "\tendfacet \n";
			}		
		});	
	});

	ascii += 'endsolid ';

	return ascii;
}

function stringifyVector(vec){
	return ""+vec.x+" "+vec.y+" "+vec.z;
}

function stringifyVertex(vec){
	return "vertex "+stringifyVector(vec)+" \n";
}

function threejs2STLB(geometries) {
	var count = countTriangles(geometries);

	var ret = new Buffer(84 +  count*12*4 + count*2);
	ret.fill(0, 0, 80);
	ret.write('');
	ret.writeUInt32LE(count, 80);

	var offset = 84;

	var vertices = null;

	var writeFloat = function(val) {
		ret.writeFloatLE(val, offset);
		offset+=4;
    };

    var writeVertex = function(vertex) {
		writeFloat(vertex.x);
		writeFloat(vertex.y);
		writeFloat(vertex.z);
    };

    var writeFace = function(face, a, b, c, flipped) {
		writeVertex(face.normal);
		
		if(!flipped) {
			writeVertex(a);
			writeVertex(b);
			writeVertex(c);
		}
		else {
			writeVertex(b);
			writeVertex(a);
			writeVertex(c);
		}

		ret.writeUInt16LE(0, offset);
    	offset+=2;
    };

    geometries.forEach(function(geometry) {
		vertices = geometry.vertices;

		geometry.faces.forEach(function(face) {
			writeFace(face, vertices[face.a], vertices[face.b], vertices[face.c], geometry.flipped);

			if(face instanceof THREE.Face4) {
				writeFace(face, vertices[face.c], vertices[face.d], vertices[face.a], geometry.flipped);
			}
		});
	});
    
    
    return ret;
}

function countTriangles(geometries) {
	var count = 0;

	geometries.forEach(function(geometry) {
		geometry.faces.forEach(function(face) {
			count += (face instanceof THREE.Face4) ? 2 : 1;
		});
	});

	return count;
}