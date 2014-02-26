/**
 * Created by William on 15/11/13.
 */

function PureVoxelSphere() {
    var camera,
        controls,
        render,
        scene,
        cursor,
        ControlPanel,
        gridColor='#25F500',
        gridMaterial,
        gridVisible = true,lineV, lineH;
    var clock = new THREE.Clock();
    var worldSize = 300,
        blockSize = 25,

        voxelperlevel = Math.pow(worldSize / blockSize, 2),
        levels = Math.sqrt(voxelperlevel),
        totalVoxel = voxelperlevel * levels;
    var worldVoxelArray = [];
    var grid;

    var currentLvl = 0, currentVoxel = 0;

    var sphere = new Sphere(0, 0, 0, 140);

    var gridOpacity = 1;

    var complete = false;
    var moveCursor = false;

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

        render.setClearColor('#EEEEEE');
        render.setSize($('#webgl').width() , $('#webgl').height());

        controls = new THREE.OrbitControls(camera);

        //document.addEventListener("keydown", onDocumentKeyDown, false);

        //build3DGrid(scene);
        var gridCreator = new Grid(worldSize, blockSize);
        var gridGeometryH = gridCreator.buildAxisAligned2DGrids();
        var gridGeometryV = gridCreator.buildAxisAligned2DGrids();

        grid = build3DGrid(gridGeometryH, gridGeometryV, gridColor);
        scene.add(grid.liH);
        scene.add(grid.liV);

        worldVoxelArray = buildVoxelPositionArray(worldSize, blockSize);

        var cubeGeometry = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
        var cubeMaterial = new THREE.MeshBasicMaterial({color: 0x7777FF });
        cursor = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cursor.position = worldVoxelArray[currentLvl][currentVoxel].centerPosition;

        scene.add(cursor);

        var ambColor = "#0c0c0c";
        var ambientLight = new THREE.DirectionalLight(ambColor);
        scene.add(ambientLight);

        var pointColor = "#ffffff";

        InitializeSpotLighting(pointColor);

        $("#webgl").append(render.domElement);

        ControlPanel = function(){
            this.color = gridColor;
            this.toggleVisible = function()
            {
                if (gridVisible)
                    gridVisible = false;
                else
                    gridVisible = true;

                grid.liH.visible = gridVisible;
                grid.liV.visible = gridVisible;
            }
            this.toggleCursor = function()
            {
                if (moveCursor)
                    moveCursor = false;
                else
                    moveCursor = true;
            }
        }

        var text = new ControlPanel();
        var gui = new dat.GUI({ autoPlace: false });
        var addColor = gui.addColor(text, 'color');

        addColor.onChange(function(value) {
            //alert(value);
            gridColor = value.replace('#', '0x' );
            grid.liH.material.color.setHex(gridColor);
            grid.liV.material.color.setHex(gridColor);
        });

        gui.add(text, 'toggleVisible');
        gui.add(text, 'toggleCursor');

        $('#datGUI').append(gui.domElement);

        draw();
    }

    function onDocumentKeyDown(event) {
        var keycode = event.which;

        if (keycode == 13 && !complete) // return
        {
        }
    }

    function evaluateVoxel()
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
            complete = true; // park the cursor
        }

        cursor.position = worldVoxelArray[currentLvl][currentVoxel].centerPosition;

        if (sphere.isColliding(worldVoxelArray[currentLvl][currentVoxel].centerPosition))
        {
            var cube;

            var cubeGeometry = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
            var cubeMaterial = new THREE.MeshPhongMaterial({color: 0xA52A2A});
            cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cube.position = worldVoxelArray[currentLvl][currentVoxel].centerPosition;

            scene.add(cube);

        }
    }

    function update() {
        var delta = clock.getDelta();

        if (!complete && moveCursor)
        {
            evaluateVoxel();
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