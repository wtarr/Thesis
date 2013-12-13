/**
 * Created by William on 15/11/13.
 */

function Sphere(x, y, z, r)
{
    this.radius = r;
    this.center = new THREE.Vector3(x, y, z);
}

Sphere.prototype.isColliding = function(position)
{
    var pos = position;
    var dist = this.center.distanceTo(pos);
    if (dist < this.radius)
        return true;

    return false;
}

function SculptPureVoxel() {
    var camera, controls, render, scene, cursor;
    var clock = new THREE.Clock();
    var worldSize = 300,
        blockSize = 25,

        voxelperlevel = Math.pow(worldSize / blockSize, 2),
        levels = Math.sqrt(voxelperlevel),
        totalVoxel = voxelperlevel * levels;
    var worldArray = [];

    var currentLvl = 0, currentVoxel = 0;

    var sphere = new Sphere(0, 0, 0, 140);

    var gridOpacity = 1;

    initialise();

    animate();


    function InitializeSpotLighting(pointColor) {
        var spotLight1 = new THREE.SpotLight(pointColor);
        spotLight1.position.set(0, 0, -400);
        spotLight1.castShadow = true;
        spotLight1.target = new THREE.Object3D();
        scene.add(spotLight1);

        var spotLight2 = new THREE.SpotLight(pointColor);
        spotLight2.position.set(0, 0, 400);
        spotLight2.castShadow = true;
        spotLight2.target = new THREE.Object3D();
        scene.add(spotLight2);

        var spotLight3 = new THREE.SpotLight(pointColor);
        spotLight3.position.set(-400, 0, 0);
        spotLight3.castShadow = true;
        spotLight3.target = new THREE.Object3D();
        scene.add(spotLight3);

        var spotLight4 = new THREE.SpotLight(pointColor);
        spotLight4.position.set(0, 400, 0);
        spotLight4.castShadow = true;
        spotLight4.target = new THREE.Object3D();
        scene.add(spotLight4);

        var spotLight5 = new THREE.SpotLight(pointColor);
        spotLight5.position.set(0, -400, 0);
        spotLight5.castShadow = true;
        spotLight5.target = new THREE.Object3D();
        scene.add(spotLight5);

        var spotLight6 = new THREE.SpotLight(pointColor);
        spotLight6.position.set(400, 0, 0);
        spotLight6.castShadow = true;
        spotLight6.target = new THREE.Object3D();
        scene.add(spotLight6);
    }

    function initialise() {

        if (!Detector.webgl) Detector.addGetWebGLMessage();

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, $('#webgl').width() / $('#webgl').height(), 0.1, 1500);
        camera.position.x = 500;
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
        var cubeMaterial = new THREE.MeshBasicMaterial({color: 0x7777FF });
        cursor = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cursor.position.x = worldArray[currentLvl][currentVoxel].x;
        cursor.position.y = worldArray[currentLvl][currentVoxel].y;
        cursor.position.z = worldArray[currentLvl][currentVoxel].z;

        scene.add(cursor);

        var ambColor = "#0c0c0c";
        var ambientLight = new THREE.DirectionalLight(ambColor);
        scene.add(ambientLight);

        var pointColor = "#ffffff";

        InitializeSpotLighting(pointColor);

        $("#webgl").append(render.domElement);

        draw();
    }

    function onDocumentKeyDown(event) {
        var keycode = event.which;

        if (keycode == 13) // return
        {
            currentVoxel += 1;

            if (currentVoxel >= voxelperlevel)
            {
                currentVoxel = 0;
                currentLvl += 1;
            }

            if (currentLvl >= levels)
            {
                currentLvl = 0;
                currentVoxel = 0;
            }

            cursor.position.x = worldArray[currentLvl][currentVoxel].x;
            cursor.position.y = worldArray[currentLvl][currentVoxel].y;
            cursor.position.z = worldArray[currentLvl][currentVoxel].z;

            if (sphere.isColliding(worldArray[currentLvl][currentVoxel]))
            {
                var cube;

                var cubeGeometry = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
                var cubeMaterial = new THREE.MeshPhongMaterial({color: 0xA52A2A});
                cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
                cube.position.x = worldArray[currentLvl][currentVoxel].x;
                cube.position.y = worldArray[currentLvl][currentVoxel].y;
                cube.position.z = worldArray[currentLvl][currentVoxel].z;

                scene.add(cube);

            }


        }
    }

    function build3DGrid(scene) {
        //Build 3d grid
        var geometryH = buildAxisAligned2DGrids();

        var geometryV = buildAxisAligned2DGrids();

        var material = new THREE.LineBasicMaterial({ color: 0x000000, opacity: gridOpacity });

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