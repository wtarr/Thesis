/**
 * Created by William on 15/11/13.
 * *
 * The face calculations and lookup tables are based on the following:
 * http://paulbourke.net/geometry/polygonise/
 *
 * The construction of the polygons is taken from
 * http://stemkoski.github.io/Three.js/Marching-Cubes.html
 *
 */

function MarchingCubeSphere() {
    var camera, controls, render, scene, cursor, sphere, ControlPanel, gridColor='#25F500',
        gridMaterial,
        lineV,
        lineH,
        gridVisible = true;
    var clock = new THREE.Clock();
    var worldSize = 200,
        blockSize = 20,
        voxelperlevel = Math.pow(worldSize / blockSize, 2),
        levels = Math.sqrt(voxelperlevel),
        totalVoxel = voxelperlevel * levels;

    var worldVoxelArray = [];
    var currentLvl = 0, currentVoxel = 0;
    var complete = false;

    initialise();

    animate();


    function initialise() {

        if (!Detector.webgl) Detector.addGetWebGLMessage();

        scene = new THREE.Scene();

        sphere = new Sphere(0, 0, 0, 90);

        initializeCamera();

        render = new THREE.WebGLRenderer();

        render.setClearColor(0xEEEEEE);
        render.setSize($('#webgl').width() , $('#webgl').height());

        controls = new THREE.OrbitControls(camera);

        document.addEventListener("keydown", onDocumentKeyDown, false);

        build3DGrid();

        var cubeGeometry = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
        var cubeMaterial = new THREE.MeshBasicMaterial({color: 0xF50000 });
        cursor = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cursor.position.x = worldVoxelArray[currentLvl][currentVoxel].x;
        cursor.position.y = worldVoxelArray[currentLvl][currentVoxel].y;
        cursor.position.z = worldVoxelArray[currentLvl][currentVoxel].z;

        scene.add(cursor);

        var dirColor = "#0c0c0c";
        InitializeDirectionalLighting(dirColor);
        var pointColor = "#ffffff";
        InitializeSpotLighting(pointColor, 500);

        $("#webgl").append(render.domElement);

        ControlPanel = function(){
            this.color = gridColor;
        }

        ControlPanel = function(){
            this.color = gridColor;
            this.toggleVisible = function()
            {
                if (gridVisible)
                    gridVisible = false;
                else
                    gridVisible = true;

                lineH.visible = gridVisible;
                lineV.visible = gridVisible;
            }
        }

        var text = new ControlPanel();
        var gui = new dat.GUI({ autoPlace: false });
        var addColor = gui.addColor(text, 'color');

        addColor.onChange(function(value) {
            gridColor = value.replace('#', '0x' );
            gridMaterial.color.setHex(gridColor);
        });

        gui.add(text, 'toggleVisible');

        $('#datGUI').append(gui.domElement);

        draw();
    }

    function initializeCamera()
    {
        camera = new THREE.PerspectiveCamera(45, $('#webgl').width() / $('#webgl').height(), 0.1, 1500);
        camera.position.x = 300;
        camera.position.y = 100;
        camera.position.z = 0;
        camera.lookAt(scene.position);
    }

    function InitializeDirectionalLighting(color)
    {
        var lightFactory = new LightFactory();
        var d1 = lightFactory.createLight(
            {
                lightType: "directional",
                color: color,
                shouldCastShadow: true,
                intensity: 5
            }
        );

        scene.add(d1);
    }

    function InitializeSpotLighting(pointColor, distance) {

        var lightFactory = new LightFactory();

        var s1 = lightFactory.createLight({
            lightType: "spot",
            color: pointColor,
            position: new THREE.Vector3( 0, 0, distance),
            shouldCastShadow: true
        });

        var s2 = lightFactory.createLight({
                lightType: "spot",
                color: pointColor,
                position: new THREE.Vector3(-distance, 0, 0),
                shouldCastShadow: true
        });

        var s3 = lightFactory.createLight({
            lightType: "spot",
            color: pointColor,
            position: new THREE.Vector3(distance, 0, 0),
            shouldCastShadow: true
        });

        var s4 = lightFactory.createLight({
            lightType: "spot",
            color: pointColor,
            position: new THREE.Vector3(0, -distance, 0),
            shouldCastShadow: true
        });

        var s5 = lightFactory.createLight({
            lightType: "spot",
            color: pointColor,
            position: new THREE.Vector3(0, distance, 0),
            shouldCastShadow: true
        });

        scene.add(s1);
        scene.add(s2);
        scene.add(s3);
        scene.add(s4);
        scene.add(s5);
    }

    function MarchingCube() {
        var geometry = new THREE.Geometry();
        var vertexIndex = 0;
        var vlist = new Array(12);
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
            complete = true;
        }
        // Voxel center
        cursor.position.x = worldVoxelArray[currentLvl][currentVoxel].centerPosition.x;
        cursor.position.y = worldVoxelArray[currentLvl][currentVoxel].centerPosition.y;
        cursor.position.z = worldVoxelArray[currentLvl][currentVoxel].centerPosition.z;

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
            vlist[0] = vertexInterpolation(isolevel, p0, p1, value0, value1);
        }
        if (bits & 2) {
            vlist[1] = vertexInterpolation(isolevel, p1, p2, value1, value2);
        }
        if (bits & 4) {
            vlist[2] = vertexInterpolation(isolevel, p2, p3, value2, value3);
        }
        if (bits & 8) {
            vlist[3] = vertexInterpolation(isolevel, p3, p0, value3, value0);
        }
        if (bits & 16) {
            vlist[4] = vertexInterpolation(isolevel, p4, p5, value4, value5);
        }
        if (bits & 32) {
            vlist[5] = vertexInterpolation(isolevel, p5, p6, value5, value6);
        }
        if (bits & 64) {
            vlist[6] = vertexInterpolation(isolevel, p6, p7, value6, value7);
        }
        if (bits & 128) {
            vlist[7] = vertexInterpolation(isolevel, p7, p4, value7, value4);
        }
        if (bits & 256) {
            vlist[8] = vertexInterpolation(isolevel, p0, p4, value0, value4);
        }
        if (bits & 512) {
            vlist[9] = vertexInterpolation(isolevel, p1, p5, value1, value5);
        }
        if (bits & 1024) {
            vlist[10] = vertexInterpolation(isolevel, p2, p6, value2, value6);
        }
        if (bits & 2048) {
            vlist[11] = vertexInterpolation(isolevel, p3, p7, value3, value7);
        }
        // The following is from Lee Stemkoski example and
        // deals with construction of the polygons and adding to
        // the scene.
        // http://stemkoski.github.io/Three.js/Marching-Cubes.html
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

    function onDocumentKeyDown(event) {
        var keycode = event.which;
        var complete;

        if (keycode == 13 && !complete) // return
        {
            MarchingCube();
        }
    }

    function vertexInterpolation(isolevel, p1, p2, val_1, val_2) {
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

    function build3DGrid() {
        //Build 3d grid
        var geometryH = buildAxisAligned2DGrids();

        var geometryV = buildAxisAligned2DGrids();

        gridMaterial = new THREE.LineBasicMaterial({ color: gridColor, opacity: 0.5 });

        lineH = new THREE.Line(geometryH, gridMaterial);
        lineV = new THREE.Line(geometryV, gridMaterial);

        lineH.type = THREE.LinePieces;
        lineV.type = THREE.LinePieces;
        lineV.rotation.x = Math.PI / 2;

        scene.add(lineH);
        scene.add(lineV);

        buildVoxelPositionArray();
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

    function buildVoxelPositionArray() {

        var levelVoxelArray = [];

        var start = new THREE.Vector3(-worldSize / 2, -worldSize / 2, -worldSize / 2); // lower left back corner
        var x = start.x, z = start.z, y = start.y;

        while (y < worldSize / 2) {
            while (z < worldSize / 2) {

                while (x < worldSize / 2) {

                    var voxel = new VoxelState(
                        {
                            centerPosition: new THREE.Vector3(x + blockSize / 2, y + blockSize / 2, z + blockSize / 2)
                        }
                    );

                    levelVoxelArray.push(voxel);

                    x += blockSize;
                }

                z += blockSize;
                x = start.x;
            }

            worldVoxelArray.push(levelVoxelArray);
            levelVoxelArray = [];
            y += blockSize;
            x = start.x;
            z = start.z;
        }

    }

    function update() {
        var delta = clock.getDelta();

        if (!complete) {
            MarchingCube();
        }

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

function VoxelState( options )
{
    this.centerPosition = options.centerPosition;

    this.p0;
    this.p1;
    this.p4;
    this.p5;

    this.p3;
    this.p2;
    this.p7;
    this.p6;
}

function SpotLight( options )
{
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

function AmbientLight( options )
{
    this.ambientLight = new THREE.AmbientLight();
}

function DirectionalLight( options )
{
    this.color = (typeof options.color === 'undefined') ? '#ffffff' : options.color;
    this.intensity = (typeof options.intensity === 'undefined') ? 5 : options.intensity;
    this.shouldCastShadow = (typeof options.shouldCastShadow === 'undefined') ? false : options.shouldCastShadow;

    this.directionalLight = new THREE.DirectionalLight(this.color);
    this.directionalLight.intensity = this.intensity;
    this.directionalLight.castShadow = this.shouldCastShadow;

    return this.directionalLight;
}

function LightFactory() {}

LightFactory.prototype.lightClass = SpotLight;

LightFactory.prototype.createLight = function ( options )
{
    if (options.lightType === "spot" )
    {
        this.lightClass = SpotLight;
    }
    else if (options.lightType === 'directional')
    {
        this.lightClass = DirectionalLight;
    }
    else
    {
        throw "Light factory does not contain this type";
    }

    return new this.lightClass( options );
}