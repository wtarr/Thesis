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

var globalControlsEnabled = true;

function MarchingCubeSphere() {
    var camera, controls, render, scene, cursor, sphere, ControlPanel, gridColor = '#25F500',
        grid,
        screenWidth, screenHeight;
    var stats;

    var clock = new THREE.Clock();
    var worldSize = 200,
        blockSize = 20,
        voxelPerLevel = Math.pow(worldSize / blockSize, 2),
        levels = Math.sqrt(voxelPerLevel),
        totalVoxel = voxelPerLevel * levels;

    var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 'black'});
    var colorMaterial = new THREE.MeshPhongMaterial({color: 0x7375C7, side: THREE.DoubleSide});
    var currentVoxelMaterial = colorMaterial;

    var worldVoxelArray = [];
    var currentLvl = 0, currentVoxel = 0;
    var moveCursor = false;
    var complete = false;

    initialise();

    animate();


    function initialise() {
        stats = new Stats();
        stats.setMode(0);
        document.body.appendChild(stats.domElement);

        if (!Detector.webgl) Detector.addGetWebGLMessage();

        var divWidthHeight = getScreenWidthHeight('#webgl');
        screenWidth = divWidthHeight[0];
        screenHeight = divWidthHeight[1];

        scene = new THREE.Scene();

        sphere = new Sphere(0, 0, 0, 90);

        initializeCamera();

        render = new THREE.WebGLRenderer();

        render.setClearColor(0xEEEEEE);
        render.setSize(screenWidth, screenHeight);

        controls = new THREE.OrbitControls(camera);

        //document.addEventListener("keydown", onDocumentKeyDown, false);

        //var gridCreator = new GridCreator(worldSize, blockSize);
        var gridGeometryH = buildAxisAligned2DGrids(worldSize, blockSize);
        var gridGeometryV = buildAxisAligned2DGrids(worldSize, blockSize);
        grid = build3DGrid(gridGeometryH, gridGeometryV, gridColor);
        scene.add(grid.liH);
        scene.add(grid.liV);

        worldVoxelArray = buildVoxelPositionArray(worldSize, blockSize);

        var cubeGeometry = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
        var cubeMaterial = new THREE.MeshBasicMaterial({color: 0xF50000 });
        cursor = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cursor.position.x = worldVoxelArray[0][0].x;
        cursor.position.y = worldVoxelArray[0][0].y;
        cursor.position.z = worldVoxelArray[0][0].z;

        scene.add(cursor);

        var dirColor = "#0c0c0c";
        InitializeDirectionalLighting(dirColor);
        var pointColor = "#ffffff";
        InitializeSpotLighting(pointColor, 500);

        $("#webgl").append(render.domElement);

        ControlPanel = function () {
            this.running = false;
            this.color = gridColor;
            this.toggleVisible = function () {
                if (grid.liV.visible) {
                    grid.liV.visible = false;
                    grid.liH.visible = false;
                }
                else {
                    grid.liV.visible = true;
                    grid.liH.visible = true;
                }
            }

            this.toggleCursor = function () {
                if (moveCursor)
                    moveCursor = false
                else
                    moveCursor = true;
            }

            this.toggleWireframe = function () {
                if (complete)
                    wf();


            }

            var wf = function () {
                worldVoxelArray.forEach(function (level) {
                    level.forEach(function (voxel) {
                        if (voxel.voxMesh) {
                            if (voxel.voxMesh.material === colorMaterial) {
                                currentVoxelMaterial = wireframeMaterial;
                                voxel.voxMesh.material = currentVoxelMaterial;
                            }
                            else {
                                currentVoxelMaterial = colorMaterial;
                                voxel.voxMesh.material = currentVoxelMaterial;
                            }
                        }

                    });
                });
            };
        }


        var text = new ControlPanel();
        var gui = new dat.GUI({ autoPlace: false });
        var addColor = gui.addColor(text, 'color');

        addColor.onChange(function (value) {
            gridColor = value.replace('#', '0x');
            grid.liH.material.color.setHex(gridColor);
            grid.liV.material.color.setHex(gridColor);
        });

        gui.add(text, 'toggleVisible');
        gui.add(text, 'toggleCursor');
        //gui.add(text, 'toggleWireframe');
        $('#datGUI').append(gui.domElement);

        draw();
    }

    function initializeCamera() {
        camera = new THREE.PerspectiveCamera(45, $('#webgl').width() / $('#webgl').height(), 0.1, 1500);
        camera.position.x = 300;
        camera.position.y = 100;
        camera.position.z = 0;
        camera.lookAt(scene.position);
    }

    function InitializeDirectionalLighting(color) {
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
            position: new THREE.Vector3(0, 0, distance),
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

    function performObjectRendering() {
        if (currentVoxel >= voxelPerLevel) {
            currentVoxel = 0;
            currentLvl++;
        }

        if (currentLvl >= levels) {
            currentLvl = 0;
            currentVoxel = 0;
            complete = true; // flag to prevent recycling around
        }

        var currentVox = worldVoxelArray[currentLvl][currentVoxel];

        // Voxel center
        cursor.position.x = currentVox.centerPosition.x;
        cursor.position.y = currentVox.centerPosition.y;
        cursor.position.z = currentVox.centerPosition.z;

        var isolevel = sphere.radius;

        //var voxelCorners = calculateVoxelVertexPositions(cursor.position, blockSize);
        var voxelValues = calculateVoxelValuesToSphereCenter(currentVox, sphere);

        currentVox.setVertexValues(voxelValues);

        //worldVoxelArray[currentLvl][currentVoxel] = MarchingCube(worldVoxelArray[currentLvl][currentVoxel], voxelCorners, voxelValues, isolevel, colorMaterial);
        currentVox = MarchingCube(currentVox, isolevel, colorMaterial);
        scene.add(currentVox);
        // do stuff

        currentVoxel++;

    }

    function update() {
        var delta = clock.getDelta();

        if (!complete && moveCursor) {
            performObjectRendering();
        }

        if (globalControlsEnabled) {
            controls.enabled = true;
            controls.update();
        }
        else {
            controls.enabled = false;
        }

    }

    function animate() {
        requestAnimationFrame(animate);
        draw();
        update();
        stats.update();
    }

    function draw() {
        render.render(scene, camera);
    }

}



