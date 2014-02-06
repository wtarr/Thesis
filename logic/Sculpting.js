/**
 * Created by William on 25/01/14.
 */
var globalControlsEnabled = true;


function GUI() {
    var sculpt = new Sculpt();
    var btnGenerateObj = document.getElementById('generateShape');
    var btnShowNode = document.getElementById('shownodes');
    var btnfillnodes = document.getElementById('fillnodes');
    var btnSpringConnections = document.getElementById('createSpring');
    var btnToggleGrid = document.getElementById('toggleGrid');
    var btnToggleWireframe = document.getElementById('toggleWireframe');
    var btnToggleMesh = document.getElementById('toggleMesh');

    btnGenerateObj.addEventListener('click', sculpt.generateShape, false);
    btnShowNode.addEventListener('click', sculpt.toggleNodes, false);
    btnToggleGrid.addEventListener('click', sculpt.toggleGrid, false);
    btnToggleWireframe.addEventListener('click', sculpt.toggleWireframe, false);
    btnfillnodes.addEventListener('click', sculpt.fillnodes, false);
    btnSpringConnections.addEventListener('click', sculpt.connectNodesWithSprings, false);
    btnToggleMesh.addEventListener('click', sculpt.toggleMesh, false);


    this.updateGridColor = function (val) {
        sculpt.updateGridColor(val);
    }

}

function Sculpt() {
    var worldVoxelArray;
    var renderingElement = document.getElementById('webgl');
    var camera, cameraControls, renderer, scene;
    var clock = new THREE.Clock();
    var screenWidth, screenHeight;
    var stats;

    var particles = [];

    var springs = [];

    var projector;
    var rayLine;

    var worldSize = 200;
    var blockSize = 20;
    var voxelPerLevel = Math.pow(worldSize / blockSize, 2);
    var levels = Math.sqrt(voxelPerLevel);
    var grid;
    var gridColor = '#25F500';

    var cursor;
    var currentVoxel = 0;
    var currentLvl = 0;
    var complete = false;

    var colorMaterial = new THREE.MeshPhongMaterial({color: 0x7375C7, side: THREE.DoubleSide});
    var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 'black'});
    var currentVoxelMaterial = colorMaterial;

    // object to render
    var sphere;

    // drag/drop
    var plane,
        offset = new THREE.Vector3(),
        INTERSECTED,
        SELECTED;

    function initialise() {

        stats = new Stats();
        stats.setMode(0);
        document.getElementById('fps').appendChild(stats.domElement);


        var divWidthHeight = getScreenWidthHeight('#webgl');
        screenWidth = divWidthHeight[0];
        screenHeight = divWidthHeight[1];

        if (!Detector.webgl) Detector.addGetWebGLMessage();

        scene = new THREE.Scene();

        initialiseCamera();
        initialiseLighting();
        var pointColor = "#ffffff";
        initializeSpotLighting(pointColor, 500);

        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(0xEEEfff);
        renderer.setSize(screenWidth, screenHeight);

        plane = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 8, 8), new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.25, transparent: true, wireframe: true }));
        plane.visible = false;
        scene.add(plane);

        var gridGeometryH = buildAxisAligned2DGrids(worldSize, blockSize);
        var gridGeometryV = buildAxisAligned2DGrids(worldSize, blockSize);
        grid = build3DGrid(gridGeometryH, gridGeometryV, gridColor);
        scene.add(grid.liH);
        scene.add(grid.liV);

        worldVoxelArray = buildVoxelPositionArray(worldSize, blockSize);

        sphere = new Sphere(0, 0, 0, 90);

        cursor = new THREE.Vector3(0, 0, 0);

        renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
        renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
        renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);

        //demo();

        appendToScene('#webgl', renderer);

        draw();

    }

    function initialiseCamera() {
        camera = new THREE.PerspectiveCamera(45, screenWidth / screenHeight, 0.1, 1500);
        camera.position.x = 300;
        camera.position.y = 100;
        camera.position.z = 0;
        camera.lookAt(scene.position);
        cameraControls = new THREE.OrbitControls(camera);
        cameraControls.domElement = renderingElement;
        scene.add(camera);
    }

    function initialiseLighting() {
        var lightFactory = new LightFactory();
        var amb1 = lightFactory.createLight({ lightType: 'ambient'});
        scene.add(amb1);

    }

    function initializeSpotLighting(pointColor, distance) {

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

    initialise();
    animate();


    function animate() {
        requestAnimationFrame(animate);
        update();
        draw();
        stats.update();
    }

    function update() {
        var delta = clock.getDelta();

        if (globalControlsEnabled) {
            cameraControls.enabled = true;
            cameraControls.update();
        }
        else {
            cameraControls.enabled = false;
        }

        springs.forEach(function (item) {
            item.update(delta);
        });


    }

    function draw() {
        renderer.render(scene, camera);
    }


    function onDocumentMouseMove(event) {
        nodeSelect(event);
    }

    function onDocumentMouseDown(event) {
        nodeDrag(event);
    }

    function onDocumentMouseUp(event) {
        nodeRelease(event);
    }


    function nodeSelect(event) {
        event.preventDefault();

        var clientXRel = event.pageX - $('#webgl').offset().left;
        var clientYRel = event.pageY - $('#webgl').offset().top;

        var vector = new THREE.Vector3(( clientXRel / screenWidth) * 2 - 1, -( clientYRel / screenHeight ) * 2 + 1, 0.5);

        //var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
        projector = new THREE.Projector();
        projector.unprojectVector(vector, camera);

        var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

        if (SELECTED) {
            var intersects = raycaster.intersectObject(plane);
            SELECTED.position.copy(intersects[ 0 ].point.sub(offset));
            return;
        }

        var intersects = raycaster.intersectObjects(particles);

        if (intersects.length > 0) {
            if (INTERSECTED != intersects[ 0 ].object) {
                if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);

                INTERSECTED = intersects[ 0 ].object;
                INTERSECTED.currentHex = INTERSECTED.material.color.getHex();

                plane.position.copy(INTERSECTED.position);
                plane.lookAt(camera.position);


            }
        }
    }

    function nodeDrag(event) {
        event.preventDefault();

        var clientXRel = event.pageX - $('#webgl').offset().left;
        var clientYRel = event.pageY - $('#webgl').offset().top;

        var vector = new THREE.Vector3(( clientXRel / screenWidth) * 2 - 1, -( clientYRel / screenHeight ) * 2 + 1, 0.5);

        //var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
        projector = new THREE.Projector();
        projector.unprojectVector(vector, camera);

        var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

        var intersects = raycaster.intersectObjects(particles);

        if (intersects.length > 0) {

            cameraControls.enabled = false;

            SELECTED = intersects[ 0 ].object;

            var intersects = raycaster.intersectObject(plane);
            offset.copy(intersects[ 0 ].point).sub(plane.position);

//            if (rayLine) scene.remove( rayLine );

//            var lineGeo = new THREE.Geometry();
//            lineGeo.vertices.push(new THREE.Vector3(camera.position.x, camera.position.y-100, camera.position.z) , intersects[ 0 ].point );
//            lineGeo.computeLineDistances();
//            var lineMaterial = new THREE.LineBasicMaterial( { color: 0xCC0000 });
//            rayLine = new THREE.Line( lineGeo, lineMaterial);
//            scene.add(rayLine);

        }
    }

    function nodeRelease(event) {
        event.preventDefault();

        cameraControls.enabled = true;

        if (INTERSECTED) {
            plane.position.copy(INTERSECTED.position);

            SELECTED = null;
        }
    }

    // Privileged method to toggle draggable nodes visible/invisible
    this.toggleNodes = function () {
        particles.forEach(function (node) {
            node.visible = node.visible ? false : true;
        });
    }

    this.togglePlane = function () {
        plane.visible = (plane.visible === true) ? false : true;
    }

    this.generateShape = function () {
        while (!complete) {
            if (currentVoxel >= voxelPerLevel) {
                currentVoxel = 0;
                currentLvl++;
            }

            if (currentLvl >= levels) {
                currentLvl = 0;
                currentVoxel = 0;
                complete = true; // flag to prevent recycling around
            }

            // Voxel center

            cursor.set(
                worldVoxelArray[currentLvl][currentVoxel].centerPosition.x,
                worldVoxelArray[currentLvl][currentVoxel].centerPosition.y,
                worldVoxelArray[currentLvl][currentVoxel].centerPosition.z
            );

            var isolevel = sphere.radius;

            var voxelCorners = calculateVoxelVertexPositions(cursor, blockSize);
            var voxelValues = calculateVoxelValuesToSphereCenter(voxelCorners, sphere);


            worldVoxelArray[currentLvl][currentVoxel] = MarchingCube(worldVoxelArray[currentLvl][currentVoxel], voxelCorners, voxelValues, isolevel, currentVoxelMaterial);
            scene.add(worldVoxelArray[currentLvl][currentVoxel]);
            // do stuff

            currentVoxel++;
        }


    }

    this.updateGridColor = function (val) {
        gridColor = '0x' + val;
        grid.liH.material.color.setHex(gridColor);
        grid.liV.material.color.setHex(gridColor);
    }

    this.toggleGrid = function () {
        if (grid.liV.visible) {
            grid.liV.visible = false;
            grid.liH.visible = false;
        }
        else {
            grid.liV.visible = true;
            grid.liH.visible = true;
        }
    }

    this.toggleWireframe = function () {
        if (complete) {
            worldVoxelArray.forEach(function (level) {
                level.forEach(function (voxel) {
                    if (voxel) {
                        if (voxel.material === colorMaterial) {
                            currentVoxelMaterial = wireframeMaterial;
                            voxel.material = currentVoxelMaterial;
                        }
                        else {
                            currentVoxelMaterial = colorMaterial;
                            voxel.material = currentVoxelMaterial;
                        }
                    }

                });
            });
        }
    }

    this.toggleMesh = function () {
        if (complete) {
            worldVoxelArray.forEach(function (level) {
                level.forEach(function (voxel) {
                    if (voxel) {
                        voxel.visible = voxel.visible ? false : true;
                    }

                });
            });
        }
    }

    this.fillnodes = function () {


        // Fill internal with nodes
        worldVoxelArray.forEach(function (level) {
            level.forEach(function (voxel) {

                var nodeSize = 3;
                var mass = 2;
                var vel = new THREE.Vector3(0, 0, 0);

                for (var vert in voxel.verts) {
                    var obj = voxel.verts[vert];
                    if (obj.inside && !obj.node) {
                        var skip = false;
                        particles.forEach(function (p) {
                            if (p.position.equals(obj.position)) {
                                // already set by another voxel
                                obj.node = true;
                                skip = true;
                            }
                        });
                        if (!skip) {
                            var geometry = new THREE.SphereGeometry(nodeSize, 20, 20); // radius, width Segs, height Segs
                            var material = new THREE.MeshBasicMaterial({color: 0x8888ff});
                            var particle = new Node(geometry, material);
                            particle.position = obj.position;
                            particle.velocity = vel;
                            particle.mass = mass;
                            particle.strength = 1;
                            particle.visible = true;
                            //obj.position, vel, nodeSize, mass, 1, 1, 1
                            obj.node = true;
                            scene.add(particle);
                            particles.push(particle);
                        }
                    }
                }
            });
        });

//        var position = new THREE.Vector3(300, 0, 0);
//        var ray = new THREE.Raycaster(position, new THREE.Vector3(-1, 0, 0));
//
//        var intersections = ray.intersectObjects(worldVoxelArray[5]);
//        if (intersections.length > 0) {
//
//            var geometry = new THREE.SphereGeometry(5, 20, 20); // radius, width Segs, height Segs
//            var material = new THREE.MeshBasicMaterial({color: 0x7777ff});
//            var particle = new Node(geometry, material);
//            particle.position = intersections[0].point;
//            scene.add(particle);
//        }


    }

    this.connectNodesWithSprings = function () {

        var direction = [];
        direction.push({name: 'Zpos', direction: new THREE.Vector3(0, 0, 1)});
        direction.push({name: 'Zneg', direction: new THREE.Vector3(0, 0, -1)});
        direction.push({name: 'Xpos', direction: new THREE.Vector3(1, 0, 0)});
        direction.push({name: 'Xneg', direction: new THREE.Vector3(-1, 0, 0)});
        direction.push({name: 'Ypos', direction: new THREE.Vector3(0, 1, 0)});
        direction.push({name: 'Yneg', direction: new THREE.Vector3(0, -1, 0)});


        particles.forEach(function (particle) {

            direction.forEach(function (dir) {

                var ray = new THREE.Raycaster(particle.position, dir.direction); // Z positive

                var intersections = ray.intersectObjects(particles);
                if (intersections.length > 0) {
                    if (!particle.neigbourNodes[dir.name]) {
                        var obj = intersections[0].object;
                        particle.neigbourNodes[dir.name] = obj;
                        var spring = new Spring(scene, particle, obj, 0.5, (particle.position.distanceTo(obj.position)));
                        springs.push(spring);
                    }
                }
            });
        });
    }

}



