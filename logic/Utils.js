/**
 * Created by William on 25/01/14.
 *
 * ##Marching cube code inspired from##
 * http://stemkoski.github.io/Three.js/Marching-Cubes.html
 * &
 * http://paulbourke.net/geometry/polygonise/
 */

function Sphere(x, y, z, r) {
    this.radius = r;
    this.center = new THREE.Vector3(x, y, z);
}

Sphere.prototype.isColliding = function (position) {
    var dist = this.center.distanceTo(position);
    return dist < this.radius;
};

function SpotLight(options) {
    this.color = (typeof options.color === 'undefined') ? "#ffffff" : options.color;
    this.position = (typeof options.position === 'undefined') ? new THREE.Vector3(0, 0, 0) : options.position;
    this.shouldCastShadow = (typeof options.shouldCastShadow === 'undefined') ? false : options.shouldCastShadow;
    this.target = (typeof options.target === 'undefined') ? new THREE.Object3D() : options.target;

    this.spotLight = new THREE.SpotLight(this.color);
    this.spotLight.position.set(this.position.x, this.position.y, this.position.z);
    this.spotLight.castShadow = this.shouldCastShadow;
    this.spotLight.target = this.target;

    return this.spotLight;
}

function AmbientLight(options) {
    this.color = (typeof  options.color === 'undefined') ? '#0c0c0c' : options.color;

    this.ambientLight = new THREE.AmbientLight(this.color);

    return this.ambientLight;
}

function DirectionalLight(options) {
    this.color = (typeof options.color === 'undefined') ? '#ffffff' : options.color;
    this.intensity = (typeof options.intensity === 'undefined') ? 5 : options.intensity;
    this.shouldCastShadow = (typeof options.shouldCastShadow === 'undefined') ? false : options.shouldCastShadow;

    this.directionalLight = new THREE.DirectionalLight(this.color);
    this.directionalLight.intensity = this.intensity;
    this.directionalLight.castShadow = this.shouldCastShadow;

    return this.directionalLight;
};

function LightFactory() {
}

LightFactory.prototype.lightClass = SpotLight;

LightFactory.prototype.createLight = function (options) {
    if (options.lightType === "spot") {
        this.lightClass = SpotLight;
    }
    else if (options.lightType === 'directional') {
        this.lightClass = DirectionalLight;
    }
    else if (options.lightType === 'ambient') {
        this.lightClass = AmbientLight;
    }
    else {
        throw "Light factory does not contain this type";
    }

    return new this.lightClass(options);
};

function getScreenWidthHeight(id) {
    var width = $(id).width();
    var height = $(id).height();
    return [width, height];
};

function appendToScene(id, render) {
    $(id).append(render.domElement);
};

function build3DGrid(geometryH, geometryV, gridColor) {
    var gridMaterial = new THREE.LineBasicMaterial({ color: gridColor, opacity: 0.5 });

    var lineH = new THREE.Line(geometryH, gridMaterial);
    var lineV = new THREE.Line(geometryV, gridMaterial);

    lineH.type = THREE.LinePieces;
    lineV.type = THREE.LinePieces;
    lineV.rotation.x = Math.PI / 2;

    return {liH: lineH, liV: lineV};
}

function buildAxisAligned2DGrids(wSize, bSize) {
    var geometry = new THREE.Geometry();
    var size = wSize / 2;

    for (var i = -size; i <= size; i += bSize) {
        for (var level = -size; level <= size; level += bSize) {
            geometry.vertices.push(new THREE.Vector3(-size, level, i));
            geometry.vertices.push(new THREE.Vector3(size, level, i));
            geometry.vertices.push(new THREE.Vector3(i, level, -size));
            geometry.vertices.push(new THREE.Vector3(i, level, size));
        }
    }
    return geometry;
}

function buildVoxelPositionArray(wSize, bSize) {

    var levelVoxelArray = [];
    var worldVoxelArray = [];

    var start = new THREE.Vector3(-wSize / 2, -wSize / 2, -wSize / 2); // lower left back corner
    var x = start.x, z = start.z, y = start.y;

    while (y < wSize / 2) {
        while (z < wSize / 2) {

            while (x < wSize / 2) {

                var voxel = new VoxelState();
                voxel.centerPosition = new THREE.Vector3(x + bSize / 2, y + bSize / 2, z + bSize / 2);
                var cornerPos = calculateVoxelVertexPositions(voxel.centerPosition, bSize);
                voxel.setVertPositions(cornerPos);

                levelVoxelArray.push(voxel);

                x += bSize;
            }

            z += bSize;
            x = start.x;
        }

        worldVoxelArray.push(levelVoxelArray);
        levelVoxelArray = [];
        y += bSize;
        x = start.x;
        z = start.z;
    }

    return worldVoxelArray;
}

function calculateVoxelValuesToSphereCenter(voxelCorners, sphere) {
    return {
        v0: evaluateVertexValueToSphereCenter(voxelCorners.p0.position, sphere),
        v1: evaluateVertexValueToSphereCenter(voxelCorners.p1.position, sphere),
        v2: evaluateVertexValueToSphereCenter(voxelCorners.p2.position, sphere),
        v3: evaluateVertexValueToSphereCenter(voxelCorners.p3.position, sphere),
        v4: evaluateVertexValueToSphereCenter(voxelCorners.p4.position, sphere),
        v5: evaluateVertexValueToSphereCenter(voxelCorners.p5.position, sphere),
        v6: evaluateVertexValueToSphereCenter(voxelCorners.p6.position, sphere),
        v7: evaluateVertexValueToSphereCenter(voxelCorners.p7.position, sphere)
    }
}

function calculateVoxelValuesRelativeToMeshController()
{

}

function evaluateVertexValueToSphereCenter(p, sphere) {
    return p.distanceTo(sphere.center);
}
/*
    p4/''''''''/|p5              |y+
    /        /  |                |
 p7|''''''''|p6 |                |
   |   p0   |   |p1              |__________x+
   |        |  /                /
p3 |,,,,,,,,|/p2              /z+


 */

function calculateVoxelVertexPositions(voxCenter, bSize) {
    return {
        p0: new THREE.Vector3(voxCenter.x - bSize / 2, voxCenter.y - bSize / 2, voxCenter.z - bSize / 2),  //   -1, -1, -1 = 0
        p1: new THREE.Vector3(voxCenter.x + bSize / 2, voxCenter.y - bSize / 2, voxCenter.z - bSize / 2),  //    1, -1, -1 = 1
        p2: new THREE.Vector3(voxCenter.x + bSize / 2, voxCenter.y - bSize / 2, voxCenter.z + bSize / 2),  //    1, -1 , 1 = 2
        p3: new THREE.Vector3(voxCenter.x - bSize / 2, voxCenter.y - bSize / 2, voxCenter.z + bSize / 2),  //   -1, -1 , 1 = 3
        p4: new THREE.Vector3(voxCenter.x - bSize / 2, voxCenter.y + bSize / 2, voxCenter.z - bSize / 2),  //   -1,  1, -1 = 4
        p5: new THREE.Vector3(voxCenter.x + bSize / 2, voxCenter.y + bSize / 2, voxCenter.z - bSize / 2),  //    1,  1, -1 = 5
        p6: new THREE.Vector3(voxCenter.x + bSize / 2, voxCenter.y + bSize / 2, voxCenter.z + bSize / 2),  //    1,  1,  1 = 6
        p7: new THREE.Vector3(voxCenter.x - bSize / 2, voxCenter.y + bSize / 2, voxCenter.z + bSize / 2)  //    -1,  1,  1 = 7
    }
}


// Marching cube algorithm that evaluates per voxel
function MarchingCube(voxel, isolevel, material) {
    var geometry = new THREE.Geometry();
    var vertexIndex = 0;
    var vlist = new Array(12);

    var cubeIndex = 0;

    if (voxel.verts.p0.value < isolevel) {
        cubeIndex |= 1;
        voxel.verts.p0.inside = true;
    }   //0
    if (voxel.verts.p1.value < isolevel) {
        cubeIndex |= 2;
        voxel.verts.p1.inside = true;
    }  //1
    if (voxel.verts.p2.value < isolevel) {
        cubeIndex |= 4;
        voxel.verts.p2.inside = true;
    } //2
    if (voxel.verts.p3.value < isolevel) {
        cubeIndex |= 8;
        voxel.verts.p3.inside = true;
    }  //3
    if (voxel.verts.p4.value < isolevel) {
        cubeIndex |= 16;
        voxel.verts.p4.inside = true;
    }   //4
    if (voxel.verts.p5.value < isolevel) {
        cubeIndex |= 32;
        voxel.verts.p5.inside = true;
    }  //5
    if (voxel.verts.p6.value < isolevel) {
        cubeIndex |= 64;
        voxel.verts.p6.inside = true;
    } //6
    if (voxel.verts.p7.value < isolevel) {
        cubeIndex |= 128;
        voxel.verts.p7.inside = true;
    }  //7

    var bits = THREE.edgeTable[ cubeIndex ];
    //if (bits === 0 ) continue;

    if (bits & 1) {
        vlist[0] = vertexInterpolation(isolevel, voxel.verts.p0.position, voxel.verts.p1.position, voxel.verts.p0.value, voxel.verts.p1.value);
    }
    if (bits & 2) {
        vlist[1] = vertexInterpolation(isolevel, voxel.verts.p1.position, voxel.verts.p2.position, voxel.verts.p1.value, voxel.verts.p2.value);
    }
    if (bits & 4) {
        vlist[2] = vertexInterpolation(isolevel, voxel.verts.p2.position, voxel.verts.p3.position, voxel.verts.p2.value, voxel.verts.p3.value);
    }
    if (bits & 8) {
        vlist[3] = vertexInterpolation(isolevel, voxel.verts.p3.position, voxel.verts.p0.position, voxel.verts.p3.value, voxel.verts.p0.value);
    }
    if (bits & 16) {
        vlist[4] = vertexInterpolation(isolevel, voxel.verts.p4.position, voxel.verts.p5.position, voxel.verts.p4.value, voxel.verts.p5.value);
    }
    if (bits & 32) {
        vlist[5] = vertexInterpolation(isolevel, voxel.verts.p5.position, voxel.verts.p6.position, voxel.verts.p5.value, voxel.verts.p6.value);
    }
    if (bits & 64) {
        vlist[6] = vertexInterpolation(isolevel, voxel.verts.p6.position, voxel.verts.p7.position, voxel.verts.p6.value, voxel.verts.p7.value);
    }
    if (bits & 128) {
        vlist[7] = vertexInterpolation(isolevel, voxel.verts.p7.position, voxel.verts.p4.position, voxel.verts.p7.value, voxel.verts.p4.value);
    }
    if (bits & 256) {
        vlist[8] = vertexInterpolation(isolevel, voxel.verts.p0.position, voxel.verts.p4.position, voxel.verts.p0.value, voxel.verts.p4.value);
    }
    if (bits & 512) {
        vlist[9] = vertexInterpolation(isolevel, voxel.verts.p1.position, voxel.verts.p5.position, voxel.verts.p1.value, voxel.verts.p5.value);
    }
    if (bits & 1024) {
        vlist[10] = vertexInterpolation(isolevel, voxel.verts.p2.position, voxel.verts.p6.position, voxel.verts.p2.value, voxel.verts.p6.value);
    }
    if (bits & 2048) {
        vlist[11] = vertexInterpolation(isolevel, voxel.verts.p3.position, voxel.verts.p7.position, voxel.verts.p3.value, voxel.verts.p7.value);
    }

    // The following is from Lee Stemkoski's example and
    // deals with construction of the polygons and adding to
    // the scene.
    // http://stemkoski.github.io/Three.js/Marching-Cubes.html
    // construct triangles -- get correct vertices from triTable.
    var i = 0;
    cubeIndex <<= 4;  // multiply by 16...
    // "Re-purpose cubeindex into an offset into triTable."
    //  since each row really isn't a row.
    // the while loop should run at most 5 times,
    //   since the 16th entry in each row is a -1.
    while (THREE.triTable[ cubeIndex + i ] != -1) {
        var index1 = THREE.triTable[cubeIndex + i];
        var index2 = THREE.triTable[cubeIndex + i + 1];
        var index3 = THREE.triTable[cubeIndex + i + 2];
        geometry.vertices.push(vlist[index1].clone());
        geometry.vertices.push(vlist[index2].clone());
        geometry.vertices.push(vlist[index3].clone());
        var face = new THREE.Face3(vertexIndex, vertexIndex + 1, vertexIndex + 2);
        geometry.faces.push(face);
        geometry.faceVertexUvs[ 0 ].push([ new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1) ]);
        vertexIndex += 3;
        i += 3;
    }

    geometry.computeCentroids();
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    voxel.geometry = geometry;
    voxel.material = material;
    return voxel;
}

function VoxelState() {

    THREE.Mesh.apply(this, arguments);

    //this.voxMesh = null;
    this.centerPosition;

    this.verts = {
        p0: { inside: false, node: false, position: new THREE.Vector3, value: 1000 },
        p1: { inside: false, node: false, position: new THREE.Vector3, value: 1000 },
        p2: { inside: false, node: false, position: new THREE.Vector3, value: 1000 },
        p3: { inside: false, node: false, position: new THREE.Vector3, value: 1000 },
        p4: { inside: false, node: false, position: new THREE.Vector3, value: 1000 },
        p5: { inside: false, node: false, position: new THREE.Vector3, value: 1000 },
        p6: { inside: false, node: false, position: new THREE.Vector3, value: 1000 },
        p7: { inside: false, node: false, position: new THREE.Vector3, value: 1000 }
    };
}

VoxelState.prototype = Object.create(THREE.Mesh.prototype);
VoxelState.prototype.constructor = VoxelState;
VoxelState.prototype.setVertPositions = function(verts)
{
    this.verts.p0.position = verts.p0;
    this.verts.p1.position = verts.p1;
    this.verts.p2.position = verts.p2;
    this.verts.p3.position = verts.p3;

    this.verts.p4.position = verts.p4;
    this.verts.p5.position = verts.p5;
    this.verts.p6.position = verts.p6;
    this.verts.p7.position = verts.p7;
}

VoxelState.prototype.setVertexValues = function(values)
{
    this.verts.p0.value = values.v0;
    this.verts.p1.value = values.v1;
    this.verts.p2.value = values.v2;
    this.verts.p3.value = values.v3;

    this.verts.p4.value = values.v4;
    this.verts.p5.value = values.v5;
    this.verts.p6.value = values.v6;
    this.verts.p7.value = values.v7;
}

function vertexInterpolation(threshold, p1, p2, val_1, val_2) {
    var mu = (threshold - val_1) / (val_2 - val_1);

    var p = new THREE.Vector3();

    if (Math.abs(threshold - val_1) < 0.00001)
        return p1;
    if (Math.abs(threshold - val_2) < 0.00001)
        return p2;
    if (Math.abs(p1 - val_2) < 0.0001)
        return p1;

    p.x = p1.x + mu * (p2.x - p1.x);
    p.y = p1.y + mu * (p2.y - p1.y);
    p.z = p1.z + mu * (p2.z - p1.z);

    return p;
}

function Spring(scene, node1, node2, strength, length) {
    this.node1 = node1;
    this.node2 = node2;
    this.length = length;
    this.distance = this.node1.position.distanceTo(this.node2.position);
    this.strength = strength;
    this.lineGeo = new THREE.Geometry();

    this.lineGeo.vertices.push(
        this.node1.position,
        this.node2.position);
    this.lineGeo.computeLineDistances();
    this.lineGeo.dynamic = true;

    this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xCC0000 });
    this.line = new THREE.Line(this.lineGeo, this.lineMaterial);
    this.line.visible = false;
    scene.add(this.line);
}

Spring.prototype.update = function (delta) {

    var force = (this.length - this.getDistance()) * this.strength;

    var a1 = force / this.node1.mass;
    var a2 = force / this.node2.mass;

    var n1 = new THREE.Vector3,
        n2 = new THREE.Vector3;

    n1.subVectors(this.node1.position, this.node2.position).normalize().multiplyScalar(a1);
    n2.subVectors(this.node2.position, this.node1.position).normalize().multiplyScalar(a2);

    this.node1.move(delta, n1);
    this.node2.move(delta, n2);

    this.lineGeo.vertices[0] = this.node1.position;
    this.lineGeo.vertices[1] = this.node2.position;

    this.lineGeo.verticesNeedUpdate = true;
};

Spring.prototype.getDistance = function () {
    return this.node1.position.distanceTo(this.node2.position);
};


function Node() {
    THREE.Mesh.apply(this, arguments);

    this.mass;
    this.velocity;
    this.neigbourNodes = [];

    this.verticesNeedUpdate = true;
    this.normalsNeedUpdate = true;

    this.move = function (delta, force) {
        this.velocity.add(force);
        this.velocity.multiplyScalar(delta);
        this.position.add(this.velocity);
    };

}

Node.prototype = Object.create(THREE.Mesh.prototype);
Node.prototype.constructor = Node;

function radiusAtHeightOfSphere(height, radius) {
    return Math.sqrt(height * (2 * radius - height));
};

function testForIntersectionWithTriangle() {

    // copyright notice - http://geomalgorithms.com/a06-_intersect-2.html

    return null;
}

function procedurallyGenerateSphere(N, M, r) {
    var points = [];
    var lines = [];
    for (var m = 0; m < M + 1; m++)
        for (var n = 0; n < N; n++) {
            // http://stackoverflow.com/a/4082020
            var x = (Math.sin(Math.PI * m / M) * Math.cos(2 * Math.PI * n / N)) * r;
            var y = (Math.sin(Math.PI * m / M) * Math.sin(2 * Math.PI * n / N)) * r;
            var z = (Math.cos(Math.PI * m / M)) * r;

            var p = new THREE.Vector3(x, y, z);

            points.push(p);
        }

    // Draw the pole-pole lines (longitudinal)
    for (var s = 0; s < points.length - N; s++) {
        var lineGeo = new THREE.Geometry();
        lineGeo.vertices.push(
            points[s],
            points[s + N]);

        lineGeo.computeLineDistances();

        var lineMaterial = new THREE.LineBasicMaterial({ color: 0xCC0000 });
        var line = new THREE.Line(lineGeo, lineMaterial);

        lines.push(line);
    }

    // Draw lines along latitude
    var count = 0;
    for (var s = N; s < points.length - N; s++) {
        var a, b;

        if (count === N - 1) {
            a = points[s];
            b = points[s - N + 1];
            count = 0;
        }
        else {
            a = points[s];
            b = points[s + 1];
            count++;
        }

        var lineGeo = new THREE.Geometry();
        lineGeo.vertices.push(
            a,
            b);

        lineGeo.computeLineDistances();

        var lineMaterial = new THREE.LineBasicMaterial({ color: 0xCC0000 });
        var line = new THREE.Line(lineGeo, lineMaterial);

        lines.push(line);

    }

    // trim start and end
    var unique = points.slice(N - 1, points.length - N + 1);

    return {points: unique, lines: lines };
}

function calculateShortestDistanceFromPointToLine(p, s, f) {
    // http://paulbourke.net/geometry/pointlineplane/
    var lineMag = new THREE.Vector2();
    lineMag.subVectors(f, s);
    var len = lineMag.length();


    var u = (((p.x - s.x ) * (f.x - s.x)) + ((p.y - s.y) * (f.y - s.y))) / (Math.pow(len, 2));

    var x = s.x + u * ( f.x - s.x);
    var y = s.y + u * ( f.y - s.y);

    var poc = new THREE.Vector2(x, y);
    var l = (poc.sub(p)).length();

    return { poc: poc, distance: l};
}

function getEquationOfPlaneFromThreePoints(pt1, pt2, pt3) {
    // http://paulbourke.net/geometry/pointlineplane/
    var aX = pt1.y * (pt2.z - pt3.z) + pt2.y * (pt3.z - pt1.z) + pt3.y * (pt1.z - pt2.z);
    var bY = pt1.z * (pt2.x - pt3.x) + pt2.z * (pt3.x - pt1.x) + pt3.z * (pt1.x - pt2.x);
    var cZ = pt1.x * (pt2.y - pt3.y) + pt2.x * (pt3.y - pt1.y) + pt3.x * (pt1.y - pt2.y);
    var d = pt1.x * (pt2.y * pt3.z - pt3.y * pt2.z) + pt2.x * (pt3.y * pt1.z - pt1.y * pt3.z ) + pt3.x * (pt1.y * pt2.z - pt2.y * pt1.z);
    return { aX: aX, bY: bY, cZ: cZ, d: d};
}

THREE.Vector3.prototype.equalsWithinTolerence = function (other, distance) {
    var dist = this.distanceTo(other);
    return dist <= distance;

};

Array.prototype.clear = function () {
    while (this.length > 0) {
        this.pop();
    }
};

Array.prototype.removeVector3 = function (value) {
    var idx = -1;
    for (var i = 0; i < this.length; i++) {
        if (value.equals(this[i])) {
            idx = i;
            break;
        }
    }

    if (idx != -1) {
        return this.splice(idx, 1);
    }

    return false;
};

function containsVector3(arr, vector) {
    var matches = _.filter(arr, function (value) {
        if (value.equals(vector)) {
            return value;
        }
    });

    return matches;
}

function calculateMeshFacePositions(particles, segments) {

    var particles = JSON.parse(particles);

    var listOfObjects = [];
    var beginningOfOtherPole = particles.length;
    var current = 0;

    while (current < beginningOfOtherPole) {
        if (current < segments) // poles block of 10
        {

            var theFirstPole = 0;
            var theOtherPole = particles.length - 1;


            if (current === segments - 1) {
                listOfObjects.push(
                    {
                        a: { pos: particles[theFirstPole].position, nodeId: particles[theFirstPole].id },
                        b: { pos: particles[current + 1].position, nodeId : particles[current + 1].id },
                        c: { pos: particles[theFirstPole + 1].position, nodeId: particles[theFirstPole + 1].id }
                    });

                listOfObjects.push(
                    {
                        a: { pos: particles[theOtherPole].position, nodeId: particles[theOtherPole].id },
                        b: { pos: particles[(particles.length - 1) - current - 1].position, nodeId : particles[(particles.length - 1) - current - 1].id },
                        c: { pos: particles[particles.length - 2].position, nodeId: particles[particles.length - 2].id }
                    });
            }
            else {

                listOfObjects.push(
                    {
                        a: { pos: particles[theFirstPole].position, nodeId: particles[theFirstPole].id },
                        b: { pos: particles[current + 1].position, nodeId : particles[current + 1].id },
                        c: { pos: particles[current + 2].position, nodeId: particles[current + 2].id }
                    });

                listOfObjects.push(
                    {
                        a: { pos: particles[theOtherPole].position, nodeId: particles[theOtherPole].id },
                        b: { pos: particles[(particles.length - 1) - current - 1].position, nodeId : particles[(particles.length - 1) - current - 1].id },
                        c: { pos: particles[(particles.length - 1) - current - 2].position, nodeId: particles[(particles.length - 1) - current - 2].id }
                    });
            }
        }

        else if (current >= segments + 1 && current < beginningOfOtherPole - 1) {

            if (current % segments > 0) {
                listOfObjects.push(
                    {
                        a: { pos: particles[current].position, nodeId: particles[current].id },
                        b: { pos: particles[current + 1].position, nodeId :particles[current + 1].id },
                        c: { pos: particles[current - segments].position, nodeId: particles[current - segments].id }
                    });
                listOfObjects.push(
                    {
                        a: { pos: particles[current + 1].position, nodeId: particles[current + 1].id },
                        b: { pos: particles[current - (segments - 1)].position, nodeId: particles[current - (segments - 1)].id },
                        c: { pos: particles[current - segments].position, nodeId: particles[current - segments].id }
                    });
            }
            else {
                listOfObjects.push(
                    {
                        a: { pos: particles[current - segments].position, nodeId: particles[current - segments].id},
                        b: { pos: particles[current].position, nodeId: particles[current].id },
                        c: { pos: particles[current - segments + 1].position, nodeId: particles[current - segments + 1].id}
                    });
                listOfObjects.push(
                    {
                        a: { pos: particles[current - segments].position, nodeId: particles[current - segments].id },
                        b: { pos: particles[current - segments + 1].position, nodeId : particles[current - segments + 1].id},
                        c: { pos: particles[current - (segments * 2) + 1].position, nodeId: particles[current - (segments * 2) + 1].id}
                    });
            }
        }

        current++;
    }

    return listOfObjects;
}

function extendedTHREEMesh() {
    THREE.Mesh.apply(this, arguments);
    this.positionref = [];

    this.verticesNeedUpdate = true;
    this.normalsNeedUpdate = true;
}

extendedTHREEMesh.prototype = Object.create(THREE.Mesh.prototype);
extendedTHREEMesh.prototype.constructor = Node;

extendedTHREEMesh.prototype.updateVertices = function () {
    this.geometry.vertices.clear();
    this.geometry.vertices.push(this.positionref[0].position, this.positionref[1].position, this.positionref[2].position);
    this.geometry.verticesNeedUpdate = true;
    this.geometry.elementsNeedUpdate = true;
    this.geometry.morphTargetsNeedUpdate = true;
    this.geometry.uvsNeedUpdate = true;
    this.geometry.normalsNeedUpdate = true;
    this.geometry.colorsNeedUpdate = true;
    this.geometry.tangentsNeedUpdate = true;

};