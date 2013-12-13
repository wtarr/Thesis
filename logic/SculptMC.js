/**
 * Created by William on 15/11/13.
 * *
 * The face calculations and lookup tables are based on the following:
 * http://paulbourke.net/geometry/polygonise/
 * http://stemkoski.github.io/Three.js/Marching-Cubes.html
 *
 */

function Sphere(x, y, z, r) {
    this.radius = r;
    this.center = new THREE.Vector3(x, y, z);
}

Sphere.prototype.isColliding = function (position) {
    var pos = position;
    var dist = this.center.distanceTo(pos);
    if (dist < this.radius)
        return true;

    return false;
}

function SculptMC() {
    var camera, controls, render, scene, cursor;
    var clock = new THREE.Clock();
    var worldSize = 200,
        blockSize = 20,

        voxelperlevel = Math.pow(worldSize / blockSize, 2),
        levels = Math.sqrt(voxelperlevel),
        totalVoxel = voxelperlevel * levels;

    var worldArray = [];

    var currentLvl = 0, currentVoxel = 0;

    var sphere = new Sphere(0, 0, 0, 90);

    initialise();

    animate();


    function initialise() {

        if (!Detector.webgl) Detector.addGetWebGLMessage();

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, $('#webgl').width() / $('#webgl').height(), 0.1, 1500);
        camera.position.x = 300;
        camera.position.y = 100;
        camera.position.z = 0;
        camera.lookAt(scene.position);

        render = new THREE.WebGLRenderer();

        render.setClearColor(0xEEEEEE);
        render.setSize($('#webgl').width() , $('#webgl').height());

        controls = new THREE.OrbitControls(camera);

        document.addEventListener("keydown", onDocumentKeyDown, false);

        build3DGrid(scene);

        var cubeGeometry = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
        var cubeMaterial = new THREE.MeshBasicMaterial({color: 0xF50000 });
        cursor = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cursor.position.x = worldArray[currentLvl][currentVoxel].x;
        cursor.position.y = worldArray[currentLvl][currentVoxel].y;
        cursor.position.z = worldArray[currentLvl][currentVoxel].z;

        scene.add(cursor);

        var ambColor = "#0c0c0c";
        var ambientLight = new THREE.DirectionalLight(ambColor);
        ambientLight.castShadow = true;
        ambientLight.intensity = 5;
        scene.add(ambientLight);

        var pointColor = "#ffffff";
        InitializeSpotLighting(pointColor, 500);

        $("#webgl").append(render.domElement);

        draw();
    }

    function InitializeSpotLighting(pointColor, distance) {

        var spotLight1 = new THREE.SpotLight(pointColor);
        spotLight1.position.set(0, 0, -distance);
        spotLight1.castShadow = true;
        spotLight1.target = new THREE.Object3D();
        //scene.add(spotLight1);

        var spotLight2 = new THREE.SpotLight(pointColor);
        spotLight2.position.set(0, 0, distance);
        spotLight2.castShadow = true;
        spotLight2.target = new THREE.Object3D();
        scene.add(spotLight2);

        var spotLight3 = new THREE.SpotLight(pointColor);
        spotLight3.position.set(-distance, 0, 0);
        spotLight3.castShadow = true;
        spotLight3.target = new THREE.Object3D();
        scene.add(spotLight3);

        var spotLight4 = new THREE.SpotLight(pointColor);
        spotLight4.position.set(distance, 0, 0);
        spotLight4.castShadow = true;
        spotLight4.target = new THREE.Object3D();
        scene.add(spotLight4);

        var spotLight5 = new THREE.SpotLight(pointColor);
        spotLight5.position.set(0, -distance, 0);
        spotLight5.castShadow = true;
        spotLight5.target = new THREE.Object3D();
        scene.add(spotLight5);

        var spotLight6 = new THREE.SpotLight(pointColor);
        spotLight6.position.set(0, distance, 0);
        spotLight6.castShadow = true;
        spotLight6.target = new THREE.Object3D();
        scene.add(spotLight6);
    }

    function onDocumentKeyDown(event) {
        var keycode = event.which;
        var geometry = new THREE.Geometry();
        var vertexIndex = 0;
        var vlist = new Array(12);

        if (keycode == 13) // return
        {


            var count = 0;
            //while (count < totalVoxel) {

                currentVoxel += 1;


                if (currentVoxel >= voxelperlevel) {
                    currentVoxel = 0;
                    currentLvl += 1;
                }

                if (currentLvl >= levels) {
                    currentLvl = 0;
                    currentVoxel = 0;
                }

                // Voxel center
                cursor.position.x = worldArray[currentLvl][currentVoxel].x;
                cursor.position.y = worldArray[currentLvl][currentVoxel].y;
                cursor.position.z = worldArray[currentLvl][currentVoxel].z;

                var p0 = new THREE.Vector3(cursor.position.x - blockSize / 2, cursor.position.y - blockSize / 2, cursor.position.z - blockSize / 2),  //   -1, -1, -1 = 0
                    p1 = new THREE.Vector3(cursor.position.x + blockSize / 2, cursor.position.y - blockSize / 2, cursor.position.z - blockSize / 2),  //    1, -1, -1 = 1
                    p2 = new THREE.Vector3(cursor.position.x + blockSize / 2, cursor.position.y - blockSize / 2, cursor.position.z + blockSize / 2),  //    1, -1 , 1 = 2
                    p3 = new THREE.Vector3(cursor.position.x - blockSize / 2, cursor.position.y - blockSize / 2, cursor.position.z + blockSize / 2),  //   -1, -1 , 1 = 3
                    p4 = new THREE.Vector3(cursor.position.x - blockSize / 2, cursor.position.y + blockSize / 2, cursor.position.z - blockSize / 2),  //   -1,  1, -1 = 4
                    p5 = new THREE.Vector3(cursor.position.x + blockSize / 2, cursor.position.y + blockSize / 2, cursor.position.z - blockSize / 2),  //    1,  1, -1 = 5
                    p6 = new THREE.Vector3(cursor.position.x + blockSize / 2, cursor.position.y + blockSize / 2, cursor.position.z + blockSize / 2),  //    1,  1,  1 = 6
                    p7 = new THREE.Vector3(cursor.position.x - blockSize / 2, cursor.position.y + blockSize / 2, cursor.position.z + blockSize / 2);  //   -1,  1,  1 = 7

                var value0 = p0.distanceTo(sphere.center),
                    value1 = p1.distanceTo(sphere.center),

                    value2 = p2.distanceTo(sphere.center),
                    value3 = p3.distanceTo(sphere.center),

                    value4 = p4.distanceTo(sphere.center),
                    value5 = p5.distanceTo(sphere.center),
                    value6 = p6.distanceTo(sphere.center),
                    value7 = p7.distanceTo(sphere.center);


                isolevel = sphere.radius; // threshold

                var cubeindex = 0;

                if (value0 < isolevel) cubeindex |= 1; //0
                if (value1 < isolevel) cubeindex |= 2; //1
                if (value2 < isolevel) cubeindex |= 4; //2
                if (value3 < isolevel) cubeindex |= 8; //3
                if (value4 < isolevel) cubeindex |= 16; //4
                if (value5 < isolevel) cubeindex |= 32; //5
                if (value6 < isolevel) cubeindex |= 64; //6
                if (value7 < isolevel) cubeindex |= 128; //7

                var bits = THREE.edgeTable[ cubeindex ];

                //if (bits === 0 ) continue;

                var mu = 0.5;

                if (bits & 1) {
                    vlist[0] = vertexInterp(isolevel, p0, p1, value0, value1);
                }
                if (bits & 2) {
                    vlist[1] = vertexInterp(isolevel, p1, p2, value1, value2);
                }
                if (bits & 4) {
                    vlist[2] = vertexInterp(isolevel, p2, p3, value2, value3);
                }
                if (bits & 8) {
                    vlist[3] = vertexInterp(isolevel, p3, p0, value3, value0);
                }
                if (bits & 16) {
                    vlist[4] = vertexInterp(isolevel, p4, p5, value4, value5);
                }
                if (bits & 32) {
                    vlist[5] = vertexInterp(isolevel, p5, p6, value5, value6);
                }
                if (bits & 64) {
                    vlist[6] = vertexInterp(isolevel, p6, p7, value6, value7);
                }
                if (bits & 128) {
                    vlist[7] = vertexInterp(isolevel, p7, p4, value7, value4);
                }
                if (bits & 256) {
                    vlist[8] = vertexInterp(isolevel, p0, p4, value0, value4);
                }
                if (bits & 512) {
                    vlist[9] = vertexInterp(isolevel, p1, p5, value1, value5);
                }
                if (bits & 1024) {
                    vlist[10] = vertexInterp(isolevel, p2, p6, value2, value6);
                }
                if (bits & 2048) {
                    vlist[11] = vertexInterp(isolevel, p3, p7, value3, value7);
                }

                // construct triangles -- get correct vertices from triTable.
                var i = 0;
                cubeindex <<= 4;  // multiply by 16...
                // "Re-purpose cubeindex into an offset into triTable."
                //  since each row really isn't a row.

                // the while loop should run at most 5 times,
                //   since the 16th entry in each row is a -1.
                while (THREE.triTable[ cubeindex + i ] != -1) {
                    var index1 = THREE.triTable[cubeindex + i];
                    var index2 = THREE.triTable[cubeindex + i + 1];
                    var index3 = THREE.triTable[cubeindex + i + 2];

                    geometry.vertices.push(vlist[index1].clone());
                    geometry.vertices.push(vlist[index2].clone());
                    geometry.vertices.push(vlist[index3].clone());
                    var face = new THREE.Face3(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                    geometry.faces.push(face);

                    geometry.faceVertexUvs[ 0 ].push([ new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1) ]);

                    vertexIndex += 3;
                    i += 3;
                }
                count++;
            //}

            geometry.computeCentroids();
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();

            var colorMaterial = new THREE.MeshPhongMaterial({color: 0x7375C7, side: THREE.DoubleSide});
            var mesh = new THREE.Mesh(geometry, colorMaterial);

            scene.add(mesh);

        }
    }



    function vertexInterp(isolevel, p1, p2, val_1, val_2) {
        var mu = (isolevel - val_1) / (val_2 - val_1);

        var p = new THREE.Vector3();

        if (Math.abs(isolevel - val_1) < 0.00001)
            return p1;
        if (Math.abs(isolevel - val_2) < 0.00001)
            return p2;
        if (Math.abs(p1 - val_2) < 0.0001)
            return p1;

        p.x = p1.x + mu * (p2.x - p1.x);
        p.y = p1.y + mu * (p2.y - p1.y);
        p.z = p1.z + mu * (p2.z - p1.z);

        return p;
    }

    function build3DGrid(scene) {
        //Build 3d grid
        var geometryH = buildAxisAligned2DGrids();

        var geometryV = buildAxisAligned2DGrids();

        var material = new THREE.LineBasicMaterial({ color: 0x25F500, opacity: 0.5 });

        var lineH = new THREE.Line(geometryH, material);
        var lineV = new THREE.Line(geometryV, material);
        lineH.type = THREE.LinePieces;

        lineV.type = THREE.LinePieces;
        lineV.rotation.x = Math.PI / 2;

        scene.add(lineH);
        scene.add(lineV);

        buildPositionArray(scene);
    }

    function buildAxisAligned2DGrids() {
        var geometry = new THREE.Geometry();
        var size = worldSize / 2;
        var step = blockSize;

        for (var i = -size; i <= size; i += step) {
            for (var level = -size; level <= size; level += step) {
                geometry.vertices.push(new THREE.Vector3(-size, level, i));
                geometry.vertices.push(new THREE.Vector3(size, level, i));
                geometry.vertices.push(new THREE.Vector3(i, level, -size));
                geometry.vertices.push(new THREE.Vector3(i, level, size));
            }
        }
        //alert("vpl = " + voxelperlevel + " vt = " + totalVoxel);
        return geometry;

    }

    function buildPositionArray() {

        var levelArray = [];

        var start = new THREE.Vector3(-worldSize / 2, -worldSize / 2, -worldSize / 2); // lower left back corner
        var x = start.x, z = start.z, y = start.y;

        while (y < worldSize / 2) {
            while (z < worldSize / 2) {

                while (x < worldSize / 2) {

                    levelArray.push(new THREE.Vector3(x + blockSize / 2, y + blockSize / 2, z + blockSize / 2));

                    x += blockSize;
                }

                z += blockSize;
                x = start.x;
            }

            worldArray.push(levelArray);
            levelArray = [];
            y += blockSize;
            x = start.x;
            z = start.z;
        }

    }

    function update() {
        var delta = clock.getDelta();

        controls.update();

    }

    function animate() {
        requestAnimationFrame(animate);
        draw();
        update();
    }

    function draw() {
        render.render(scene, camera);
    }

}