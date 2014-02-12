/**
 * Created by William on 25/01/14.
 */
var globalControlsEnabled = true;


function GUI() {
    var sculpt = new Sculpt();
    var btnGenerateObj = document.getElementById('generateShape');
//    var btnShowNode = document.getElementById('shownodes');
//    var btnfillnodes = document.getElementById('fillnodes');
    var btnSpringConnections = document.getElementById('createSpring');
    var btnToggleGrid = document.getElementById('toggleGrid');
    var btnToggleWireframe = document.getElementById('toggleWireframe');
    var btnToggleMesh = document.getElementById('toggleMesh');
    var btnGenerateProc = document.getElementById('procgensphere');

    var keylistner = document.addEventListener("keydown", sculpt.onDocumentKeyDown, false);

    btnGenerateObj.addEventListener('click', sculpt.generateShape, false);
//    btnShowNode.addEventListener('click', sculpt.toggleNodes, false);
    btnToggleGrid.addEventListener('click', sculpt.toggleGrid, false);
    btnToggleWireframe.addEventListener('click', sculpt.toggleWireframe, false);
//    btnfillnodes.addEventListener('click', sculpt.fillnodes, false);
    btnSpringConnections.addEventListener('click', sculpt.joinNodes, false);
    btnToggleMesh.addEventListener('click', sculpt.toggleMesh, false);
    btnGenerateProc.addEventListener('click', sculpt.genSphere, false);


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
    var faces = [];

    var projector;
    var rayLine;

    var worldSize = 200;
    var blockSize = 40;
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

    var octree = new THREE.Octree();
    var procGenSphereMesh;

    //Node info
    var nodeSize = 3;
    var mass = 2;
    var vel = new THREE.Vector3(0, 0, 0);

    // visible cursor
    var cursor1;
    var currentVoxel1 = 0;
    var currentLvl1 = 0;
    var complete1 = false;

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

        var cubeGeometry = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
        var cubeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true });
        cursor1 = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cursor1.position.x = worldVoxelArray[currentLvl][currentVoxel].centerPosition.x;
        cursor1.position.y = worldVoxelArray[currentLvl][currentVoxel].centerPosition.y;
        cursor1.position.z = worldVoxelArray[currentLvl][currentVoxel].centerPosition.z;

        scene.add(cursor1);

        appendToScene('#webgl', renderer);

        draw();

    }

    function initialiseCamera() {
        camera = new THREE.PerspectiveCamera(45, screenWidth / screenHeight, 0.1, 1500);
        camera.position.x = 0;
        camera.position.y = 100;
        camera.position.z = 300;
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

        octree.update();

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

        var res = octree.search(raycaster.ray.origin, raycaster.ray.far, true, raycaster.ray.direction);
        var intersects = raycaster.intersectOctreeObjects(res);

        if (intersects.length > 0) {
            if (INTERSECTED != intersects[ 0 ].object) {
                if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);

                INTERSECTED = intersects[ 0 ].object;
                INTERSECTED.currentHex = INTERSECTED.material.color.getHex();

                plane.position.copy(INTERSECTED.position);
                plane.lookAt(camera.position);

//                _.each(INTERSECTED.neigbourNodes, function(nodes){
//                    nodes.material.color = 0xfffff;
//                })
                console.log(INTERSECTED.id);


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
        var res = octree.search(raycaster.ray.origin, raycaster.ray.far, true, raycaster.ray.direction);

        var intersects = raycaster.intersectOctreeObjects(res);

        if (intersects.length > 0) {

            cameraControls.enabled = false;

            SELECTED = intersects[ 0 ].object;

            var intersects = raycaster.intersectObject(plane);
            offset.copy(intersects[ 0 ].point).sub(plane.position);

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

    this.onDocumentKeyDown = function (event) {

        addFace();


//        if (currentVoxel1 >= voxelPerLevel) {
//            currentVoxel1 = 0;
//            currentLvl1 += 1;
//        }
//
//        if (currentLvl1 >= levels) {
//            currentLvl1 = 0;
//            currentVoxel1 = 0;
//            complete1 = true; // park the cursor
//        }
//
//        cursor1.position = worldVoxelArray[currentLvl1][currentVoxel1].centerPosition;
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


    this.genSphere = function () {
        procGenSphereMesh = procSphere(10, 10, 90);

        _.each(procGenSphereMesh.points, function (pt) {
            var geometry = new THREE.SphereGeometry(nodeSize, 70, 70); // radius, width Segs, height Segs
            var material = new THREE.MeshBasicMaterial({color: 0x8888ff});
            var particle = new Node(geometry, material);
            particle.position = pt;
            particle.velocity = vel;
            particle.mass = mass;
            particle.strength = 1;
            particle.visible = true;
            //parent.add(particle);
            particles.push(particle);
            scene.add(particle);
            octree.add(particle);
        })

    }

    this.joinNodes = function () {
        var match;
        _.each(particles, function (particle) {
            match = _.filter(procGenSphereMesh.lines, function (line) {
                return (line.geometry.vertices[0].equalsWithinTolerence(particle.position, 2)) || (line.geometry.vertices[1].equalsWithinTolerence(particle.position, 2));
            });
            _.each(match, function (l) {
                if (l.geometry.vertices[0].equalsWithinTolerence(particle.position, 2)) {
                    connectNode(particle, l.geometry.vertices[1], l.geometry.vertices[0]);
                }
                else if (l.geometry.vertices[1].equalsWithinTolerence(particle.position, 2)) {
                    connectNode(particle, l.geometry.vertices[0], l.geometry.vertices[1]);
                }
            });
        })
    }

    function connectNode(particle, v1, v2) {
        var dir = new THREE.Vector3();
        dir.subVectors(v1, v2);

        var ray = new THREE.Raycaster(particle.position, dir.normalize());
        var res = octree.search(ray.ray.origin, ray.ray.far, true, ray.ray.direction);
        var intersections = ray.intersectOctreeObjects(res);

        if (intersections.length > 0) {
            var o = intersections[0].object;
            var contains = false;
            _.each(particle.neigbourNodes, function (node) {
                if (node.position.equals(o.position)) {
                    contains = true;
                }
            })

            if (!contains) {
                particle.neigbourNodes.push(o);
                o.neigbourNodes.push(particle);
                var spring = new Spring(scene, particle, o, 0.5, (particle.position.distanceTo(o.position)));
                springs.push(spring);
            }
        }

    }

    function addFace() {

        var beginningOfOtherPole = particles.length; //???
        var vertices = 0;

        while (currentVoxel1 < beginningOfOtherPole) {

        var p = particles[currentVoxel1];
        var geom = new THREE.Geometry();
        var blockSize = 10;

        if (currentVoxel1 < blockSize) // poles block of 10
        {

            var parentPole1 = 0;
            var parentPole2 = particles.length - 1;


            if (currentVoxel1 === blockSize - 1) {
                geom.vertices.push(particles[parentPole1].position, particles[currentVoxel1 + 1].position, particles[parentPole1 + 1].position);

                var a1 = (particles.length - 1) - currentVoxel1 - 1;
                var a2 = (particles.length - 2);

                geom.vertices.push(particles[parentPole2].position, particles[a1].position, particles[a2].position);

                geom.faces.push(new THREE.Face3(vertices, vertices + 1, vertices + 2));
                geom.faces.push(new THREE.Face3(vertices + 3, vertices + 4, vertices + 5));
            }
            else {
                geom.vertices.push(particles[parentPole1].position, particles[currentVoxel1 + 1].position, particles[currentVoxel1 + 2].position);

                var a1 = (particles.length - 1) - currentVoxel1 - 1;
                var a2 = (particles.length - 1) - currentVoxel1 - 2;

                geom.vertices.push(particles[parentPole2].position, particles[a1].position, particles[a2].position);
                geom.faces.push(new THREE.Face3(vertices, vertices + 1, vertices + 2));
                geom.faces.push(new THREE.Face3(vertices + 3, vertices + 4, vertices + 5));
            }

            geom.computeCentroids();
            geom.computeFaceNormals();
            geom.computeVertexNormals();

            var object = new THREE.Mesh(geom, new THREE.MeshNormalMaterial({color: 0xF50000, side: THREE.DoubleSide }));
            scene.add(object);

        }
        else if (currentVoxel1 >= blockSize + 1 && currentVoxel1 < beginningOfOtherPole - 1) {


            if (currentVoxel1 % blockSize > 0) {
                geom.vertices.push(particles[currentVoxel1].position, particles[currentVoxel1 + 1].position, particles[currentVoxel1 - 10].position);
                geom.vertices.push(particles[currentVoxel1 + 1].position, particles[currentVoxel1 - 9].position, particles[currentVoxel1 - 10].position);
                geom.faces.push(new THREE.Face3(vertices, vertices + 1, vertices + 2));
                geom.faces.push(new THREE.Face3(vertices + 3, vertices + 4, vertices + 5));
            }
            else {
                geom.vertices.push(particles[currentVoxel1 - 9].position, particles[currentVoxel1 - 10].position, particles[currentVoxel1].position);
                geom.vertices.push(particles[currentVoxel1 - 19].position, particles[currentVoxel1 - 10].position, particles[currentVoxel1 - 9].position);
                geom.faces.push(new THREE.Face3(vertices, vertices + 1, vertices + 2));
                geom.faces.push(new THREE.Face3(vertices + 3, vertices + 4, vertices + 5));
            }

            geom.computeCentroids();
            geom.computeFaceNormals();
            geom.computeVertexNormals();

            var object = new THREE.Mesh(geom, new THREE.MeshNormalMaterial({color: 0xF50000, side: THREE.DoubleSide }));
            scene.add(object);
        }

        currentVoxel1++;
         }
    }

}



