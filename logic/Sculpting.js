/**
 * Created by William on 25/01/14.
 */
var globalArrayOfDetectableNodes = [];
var globalControlsEnabled = true;

function Spring(scene, node1, node2, strength, length) {
    this.node1 = node1;
    this.node2 = node2;
    this.length = length;
    this.distance = this.node1.getPosition().distanceTo(this.node2.getPosition());
    this.strength = strength;
    this.lineGeo = new THREE.Geometry();

    this.lineGeo.vertices.push(
        this.node1.getPosition(),
        this.node2.getPosition());
    this.lineGeo.computeLineDistances();
    this.lineGeo.dynamic = true;


    this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xCC0000 });
    this.line = new THREE.Line(this.lineGeo, this.lineMaterial);
    scene.add(this.line);
}

Spring.prototype.update = function (delta) {

    var force = (this.length - this.getDistance()) * this.strength;

    var a1 = force / this.node1.mass;
    var a2 = force / this.node2.mass;

    var n1 = new THREE.Vector3,
        n2 = new THREE.Vector3;

    n1.subVectors(this.node1.getPosition(), this.node2.getPosition()).normalize().multiplyScalar(a1);
    n2.subVectors(this.node2.getPosition(), this.node1.getPosition()).normalize().multiplyScalar(a2);

    this.node1.move(delta, n1);
    this.node2.move(delta, n2);

    this.lineGeo.vertices[0] = this.node1.getPosition();
    this.lineGeo.vertices[1] = this.node2.getPosition();

    this.lineGeo.verticesNeedUpdate = true;
};

Spring.prototype.getDistance = function () {
    return this.node1.getPosition().distanceTo(this.node2.getPosition());
};


function Node(scene, pos, velocity, radius, mass, speed, drag, elasticity) {
    this.sphereGeometry = new THREE.SphereGeometry(radius, 20, 20); // radius, width Segs, height Segs
    this.sphereMaterial = new THREE.MeshBasicMaterial({color: 0x7777ff});
    this.sphere = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this.sphere.visible = false;
    this.setPosition(pos);
    this.position = this.getPosition();
    this.mass = mass;
    this.speed = speed;
    this.drag = drag;
    this.elasticity = elasticity;
    this.velocity = velocity;

    scene.add(this.sphere);
    globalArrayOfDetectableNodes.push(this.sphere);
}

Node.prototype.getPosition = function () {
    this.position = this.sphere.position;
    return this.position;
};

Node.prototype.setPosition = function (vec) {
    this.sphere.position.set(vec.x, vec.y, vec.z);
    this.position = this.getPosition();
};

Node.prototype.move = function (delta, force) {
    var p = this.getPosition();

    this.velocity.add(force);
    this.velocity.multiplyScalar(delta);
    p.add(this.velocity);
    this.setPosition(p);

};

Node.prototype.accelerate = function () {

};

Node.prototype.update = function (delta) {
};

function GUI() {
    var sculpt = new Sculpt();
    var btnShowNode = document.getElementById('shownodes');
    var btnShowPlane = document.getElementById('showplane');
    btnShowNode.addEventListener('click', sculpt.toggleNodes, false);
    btnShowPlane.addEventListener('click', sculpt.togglePlane, false);

}


function Sculpt() {
    var renderingElement = document.getElementById('webgl');
    var camera, cameraControls, renderer, scene;
    var clock = new THREE.Clock();
    var screenWidth, screenHeight;
    var stats;

    var particles = [];

    var springs = [];

    var projector;
    var rayLine;

    // drag/drop
    var plane,
        offset = new THREE.Vector3(),
        INTERSECTED,
        SELECTED;

    function initialise() {

        stats = new Stats();
        stats.setMode(0);
        document.body.appendChild(stats.domElement);

        var divWidthHeight = getScreenWidthHeight('#webgl');
        screenWidth = divWidthHeight[0];
        screenHeight = divWidthHeight[1];

        if (!Detector.webgl) Detector.addGetWebGLMessage();

        scene = new THREE.Scene();

        initialiseCamera();
        initialiseLighting();

        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(0xEEEfff);
        renderer.setSize(screenWidth, screenHeight);

        var pos = new THREE.Vector3(-100, -100, -100);
        var vel = new THREE.Vector3(0, 10, 0);
        var particle = new Node(scene, pos, vel, 10, 2, 1, 1, 1);
        particles.push(particle);

        pos = new THREE.Vector3(-100, 100, -100);
        vel = new THREE.Vector3(10, 0, 0);
        particle = new Node(scene, pos, vel, 10, 2, 1, 1, 1);
        particles.push(particle);

        pos = new THREE.Vector3(100, -100, -100);
        vel = new THREE.Vector3(0, 0, 0);
        particle = new Node(scene, pos, vel, 10, 2, 1, 1, 1);
        particles.push(particle);

        pos = new THREE.Vector3(100, 100, -100);
        vel = new THREE.Vector3(0, 0, 0);
        particle = new Node(scene, pos, vel, 10, 2, 1, 1, 1);
        particles.push(particle);


        pos = new THREE.Vector3(-100, -100, 100);
        vel = new THREE.Vector3(0, 10, 0);
        particle = new Node(scene, pos, vel, 10, 2, 1, 1, 1);
        particles.push(particle);

        pos = new THREE.Vector3(-100, 100, 100);
        vel = new THREE.Vector3(10, 0, 0);
        particle = new Node(scene, pos, vel, 10, 2, 1, 1, 1);
        particles.push(particle);

        pos = new THREE.Vector3(100, -100, 100);
        vel = new THREE.Vector3(0, 0, 0);
        particle = new Node(scene, pos, vel, 10, 2, 1, 1, 1);
        particles.push(particle);

        pos = new THREE.Vector3(100, 100, 100);
        vel = new THREE.Vector3(0, 0, 0);
        particle = new Node(scene, pos, vel, 10, 2, 1, 1, 1);
        particles.push(particle);


        springs.push(new Spring(scene, particles[0], particles[1], 0.5, 200));
        springs.push(new Spring(scene, particles[2], particles[3], 0.5, 200));
        springs.push(new Spring(scene, particles[3], particles[1], 0.5, 200));
        springs.push(new Spring(scene, particles[2], particles[0], 0.5, 200));

        springs.push(new Spring(scene, particles[5], particles[7], 0.5, 200));
        springs.push(new Spring(scene, particles[4], particles[6], 0.5, 200));
        springs.push(new Spring(scene, particles[4], particles[5], 0.5, 200));
        springs.push(new Spring(scene, particles[6], particles[7], 0.5, 200));

        springs.push(new Spring(scene, particles[3], particles[7], 0.5, 200));
        springs.push(new Spring(scene, particles[1], particles[5], 0.5, 200));
        springs.push(new Spring(scene, particles[2], particles[6], 0.5, 200));
        springs.push(new Spring(scene, particles[0], particles[4], 0.5, 200));


        plane = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 8, 8), new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.25, transparent: true, wireframe: true }));
        plane.visible = false;
        scene.add(plane);

        renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
        renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
        renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);


        appendToScene('#webgl', renderer);

        draw();

    }

    function initialiseCamera() {
        camera = new THREE.PerspectiveCamera(45, screenWidth / screenHeight, 0.1, 1500);
        camera.position.x = 1000;
        camera.position.y = 40;
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

        var intersects = raycaster.intersectObjects(globalArrayOfDetectableNodes);

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

        var intersects = raycaster.intersectObjects(globalArrayOfDetectableNodes);

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
        springs.forEach(function (item) {
            item.node1.sphere.visible = (item.node1.sphere.visible === true) ? false : true;
            item.node2.sphere.visible = (item.node2.sphere.visible === true) ? false : true;
        });
    }

    this.togglePlane = function() {
        plane.visible = (plane.visible === true) ? false : true;
    }
}



