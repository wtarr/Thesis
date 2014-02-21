/**
 * Created by William on 25/01/14.
 */
var globalControlsEnabled = true;


function GUI() {
    var sculpt = new Sculpt();
    var btnGenerateObj = document.getElementById('generateShape');
    //var btnShowNode = document.getElementById('shownodes');
//    var btnfillnodes = document.getElementById('fillnodes');
    var btnSpringConnections = document.getElementById('createSpring');
    var btnToggleGrid = document.getElementById('toggleGrid');
    var btnToggleWireframe = document.getElementById('toggleWireframe');
    var btnToggleMesh = document.getElementById('toggleMesh');
    var btnGenerateProc = document.getElementById('procgensphere');
    var btnFillMesh = document.getElementById('fillMesh');
    var btnToggleVisibility = document.getElementById('hideAll');

    var keylistner = document.addEventListener('keydown', sculpt.onDocumentKeyDown, false);

    btnGenerateObj.addEventListener('click', sculpt.generateShape, false);
    // btnShowNode.addEventListener('click', sculpt.toggleNodes, false);
    btnToggleGrid.addEventListener('click', sculpt.toggleGrid, false);
    btnToggleWireframe.addEventListener('click', sculpt.toggleWireframe, false);
//    btnfillnodes.addEventListener('click', sculpt.fillnodes, false);
    btnSpringConnections.addEventListener('click', sculpt.joinNodes, false);
//    btnToggleMesh.addEventListener('click', sculpt.toggleMesh, false);
    btnGenerateProc.addEventListener('click', sculpt.procedurallyGenerateSphere, false);
    btnFillMesh.addEventListener('click', sculpt.addMesh, false);
    btnToggleVisibility.addEventListener('click', sculpt.toggleVis, false);


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

    var worldSize = 400;
    var blockSize = 80;
    var voxelPerLevel = Math.pow(worldSize / blockSize, 2);
    var levels = Math.sqrt(voxelPerLevel);
    var grid;
    var gridColor = '#25F500';

    var cursor;
    var currentVoxel = 0;
    var currentLvl = 0;
    var complete = false;

    var colorMaterial = new THREE.MeshPhongMaterial({color: 0x7375C7});
    var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 'black'});
    var currentVoxelMaterial = colorMaterial;

    // object to render
    var sphere;
    var sphereRadius = 90;

    // drag/drop
    var plane,
        offset = new THREE.Vector3(),
        INTERSECTED,
        SELECTED;

    var octreeForNodes = new THREE.Octree();
    var octreeForFaces = new THREE.Octree(); // I want to merge these

    var procGenSphereMesh;

    //Node info
    var nodeSize = 3;
    var mass = 2;
    var vel = new THREE.Vector3(0, 0, 0);

    // visible cursor
    var cursor1;
    //var currentVoxel1 = 0;
    var currentLvl1 = 0;
    var complete1 = false;

    // WEB Worker
    var worker = new Worker("../logic/worker.js");

    var meshes = [];

    var segments = 10;

    var labels = [];


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
        initializeSpotLighting(pointColor, 1000);

        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(0xEEEfff);
        renderer.setSize(screenWidth, screenHeight);

        plane = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000, 8, 8), new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.25, transparent: true, wireframe: true }));
        plane.visible = false;
        scene.add(plane);

        var gridGeometryH = buildAxisAligned2DGrids(worldSize, blockSize);
        var gridGeometryV = buildAxisAligned2DGrids(worldSize, blockSize);
        grid = build3DGrid(gridGeometryH, gridGeometryV, gridColor);
        scene.add(grid.liH);
        scene.add(grid.liV);

        worldVoxelArray = buildVoxelPositionArray(worldSize, blockSize);

        sphere = new Sphere(0, 0, 0, sphereRadius);

        cursor = new THREE.Vector3(0, 0, 0);

        renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
        renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
        renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);

        appendToScene('#webgl', renderer);

        var axisHelper = new THREE.AxisHelper( 20 );
        axisHelper.position = (new THREE.Vector3( -1 * worldSize /2 - 20, -1 * worldSize /2 - 20, -1 * worldSize /2 - 20));
        scene.add( axisHelper );

        draw();


    }

    function initialiseCamera() {
        camera = new THREE.PerspectiveCamera(45, screenWidth / screenHeight, 0.1, 1500);
        camera.position.x = 0;
        camera.position.y = 200;
        camera.position.z = 600;
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

        _.each(meshes, function (mesh) {
            mesh.updateVertices();
            mesh.calculateNormal();
        })
    }

    function update() {
        var delta = clock.getDelta();


        _.each(labels, function(lbl){
            lbl.lookAt( camera.position );
        });



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

        octreeForNodes.update();
        octreeForFaces.update();

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


    // Node select, drag and release is based on code in a ThreeJS demonstration titled 'interactive draggable cubes'
    // http://threejs.org/examples/webgl_interactive_draggablecubes.html

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
            try {
                SELECTED.position.copy(intersects[ 0 ].point.sub(offset));
            }
            catch (e) {
                console.log("Cannot read property of undefined");
            }
            return;
        }

        var res = octreeForNodes.search(raycaster.ray.origin, raycaster.ray.far, true, raycaster.ray.direction);
        var intersects = raycaster.intersectOctreeObjects(res);

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
        var res = octreeForNodes.search(raycaster.ray.origin, raycaster.ray.far, true, raycaster.ray.direction);

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

    var cursorTracker = -1;
    var cursorLvl = 0;


    this.onDocumentKeyDown = function (event) {
        event.preventDefault();

        if (event.which === 13) {

            cursorTracker++;

            if (!cursor1)
            {
                var cubeGeometry = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
                var cubeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true });
                cursor1 = new THREE.Mesh(cubeGeometry, cubeMaterial);
                cursor1.position.x = worldVoxelArray[currentLvl][currentVoxel].centerPosition.x;
                cursor1.position.y = worldVoxelArray[currentLvl][currentVoxel].centerPosition.y;
                cursor1.position.z = worldVoxelArray[currentLvl][currentVoxel].centerPosition.z;

                scene.add(cursor1);
            }

            if (cursorTracker >= voxelPerLevel) {
                cursorTracker = 0;
                cursorLvl += 1;
            }

            if (cursorLvl >= levels) {
                cursorLvl = 0;
                cursorTracker = 0;
            }


            cursor1.position = worldVoxelArray[cursorLvl][cursorTracker].centerPosition;

            var voxCorners = calculateVoxelVertexPositions(cursor1.position, blockSize);

            //voxelEval(worldVoxelArray[cursorLvl][cursorTracker]);
            voxelEvalSimpleInsideOutsideApproach(worldVoxelArray[cursorLvl][cursorTracker]);
        }

        if (event.which === 222 ) {
            labels.forEach(function (lbl) {
                if (lbl) {
                    lbl.visible = lbl
                        .visible ? false : true;
                }

            });
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

            //var voxelCorners = calculateVoxelVertexPositions(cursor, blockSize);

            var voxelRef = worldVoxelArray[currentLvl][currentVoxel];
            var voxelValues = calculateVoxelValuesToSphereCenter(voxelRef.verts, sphere);
            voxelRef.setVertexValues(voxelValues);

            worldVoxelArray[currentLvl][currentVoxel] = MarchingCube(worldVoxelArray[currentLvl][currentVoxel], isolevel, currentVoxelMaterial);
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

    this.toggleGrid = function (event) {

        event.preventDefault();
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


    this.procedurallyGenerateSphere = function () {

        procGenSphereMesh = procedurallyGenerateSphere(segments, segments, sphereRadius);

        _.each(procGenSphereMesh.points, function (pt) {
            var geometry = new THREE.SphereGeometry(nodeSize, 5, 5); // radius, width Segs, height Segs
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
            octreeForNodes.add(particle);
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
        var res = octreeForNodes.search(ray.ray.origin, ray.ray.far, true, ray.ray.direction);
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


    this.addMesh = function () {
        var positions = [];
        _.each(particles, function (item) {
            positions.push({ id: item.id, position: item.position});
        });

        worker.postMessage({command: "calculateMeshFacePositions", particles: JSON.stringify(positions), segments: segments });
        //worker.postMessage({command: "hello"});
    }


    worker.onmessage = function (e) {

        if (e.data.commandReturn === "calculateMeshFacePositions") {
            var geom;
            _.each(e.data.faces, function (item) {
                geom = new THREE.Geometry();
                geom.vertices.push(item.a.pos, item.b.pos, item.c.pos);
                geom.faces.push(new THREE.Face3(0, 1, 2));

                geom.computeCentroids();
                geom.computeFaceNormals();
                geom.computeVertexNormals();


                var mat = new THREE.MeshNormalMaterial({color: 0xF50000});
                mat.side = THREE.DoubleSide;
                //mat.visible = false;
                var object = new extendedTHREEMesh( scene, geom,  mat );
                object.scene = scene;
                object.positionref.push(scene.getObjectById(item.a.nodeId, true), scene.getObjectById(item.b.nodeId, true), scene.getObjectById(item.c.nodeId, true));

                meshes.push(object);
                scene.add(object);
                octreeForFaces.add(object);
            });
        }
    };

    this.toggleVis = function(e)
    {
        if (particles.length>0)
        {
            _.each(particles, function(particle){
                particle.visible = particle.visible == true ? particle.visible = false : particle.visible = true;
            });
        }

        if (meshes.length>0)
        {
            _.each(meshes, function(mesh){
                mesh.visible = mesh.visible == true ? mesh.visible = false : mesh.visible = true;
            })
        }
    }



    function voxelEval(voxRef) {

        // Directions ->

        var allCorners = [];
        allCorners.push(voxRef.verts.p0, voxRef.verts.p1, voxRef.verts.p2, voxRef.verts.p3, voxRef.verts.p4, voxRef.verts.p5, voxRef.verts.p6, voxRef.verts.p7);

        var ray;
        var result;
        var intersections;

        //var direction = new THREE.Vector3();

        _.each(allCorners, function (corner) {
            var origin = corner.position;
            var hits = [];

            _.each(corner.connectedTo, function (destination) {
                var dir = new THREE.Vector3;
                dir.subVectors(destination.position, origin);
                var length = dir.length();

                ray = new THREE.Raycaster(origin, dir.normalize(), 0, blockSize);
                result = octreeForFaces.search(ray.ray.origin, ray.ray.far, true, ray.ray.direction);
                intersections = ray.intersectOctreeObjects(result);
                //console.log(intersections.length);

                if (intersections.length > 0) {
                    corner.hits++;
                    var object = intersections[0].object;
                    var face = object.normal;

                    var facing = dir.dot(face);

                    //console.log(facing);
                    hits.push(intersections[0].point);
                }

            });

            console.log("Hits :" + hits.length);

        });
    }

    var spriteRef = [];

    function voxelEvalSimpleInsideOutsideApproach(voxRef) {

        _.each(labels, function(l)
        { scene.remove(l);});
        labels.clear();

        var allCorners = [];
        allCorners.push(voxRef.verts.p0, voxRef.verts.p1, voxRef.verts.p2, voxRef.verts.p3, voxRef.verts.p4, voxRef.verts.p5, voxRef.verts.p6, voxRef.verts.p7);

        var ray;
        var result;
        var intersections;

        _.each(allCorners, function(corner) {

            var origin = corner.position;

            var lbl = createLabel("(" + origin.x + ", " + origin.y + ", " + origin.z + ")", origin, 10, "black", {r:255, g:255, b:255, a:0}
            );
            scene.add(lbl);
            labels.push(lbl);

            _.each(corner.connectedTo, function (destination) {
                var dir = new THREE.Vector3;
                //var sprite = MySprite({position: origin, message: "(" + origin.x + ", " + origin.y + ", " + origin.z + ")" });




                dir.subVectors(destination.position, origin);
                var length = dir.length();

                ray = new THREE.Raycaster(origin, dir.normalize(), 0, blockSize);
                result = octreeForFaces.search(ray.ray.origin, ray.ray.far, true, ray.ray.direction);
                intersections = ray.intersectOctreeObjects(result);
                //console.log(intersections.length);

                if (intersections.length > 0) {
                    var object = intersections[0].object;
                    var face = object.normal;
                    var facing = dir.dot(face);

                    if (facing < 0)
                    {
                        console.log("origin " + "(" + origin.x + ", " + origin.y + ", " + origin.z + ")" + " pointing " + "(" + dir.x + ", " + dir.y + ", " + dir.z + ")" + " is behind");
                    }
                    else
                    {
                        console.log("origin " + "(" + origin.x + ", " + origin.y + ", " + origin.z + ")" + " pointing " + "(" + dir.x + ", " + dir.y + ", " + dir.z + ")" + " is in front");
                    }
                }
            });
            console.log("------");
        });


    }
}



