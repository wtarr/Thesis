/**
* Created by wtarrant on 28/02/14.
*/
/// <reference path="../lib/knockout.d.ts" />
/// <reference path="../lib/underscore.d.ts" />
/// <reference path="Utils2.ts" />

//declare module THREE { export var Octree }
var Implementation2;
(function (Implementation2) {
    var ToggleGridCommand = (function () {
        function ToggleGridCommand(sculpt) {
            this._sculpt = sculpt;
        }
        ToggleGridCommand.prototype.execute = function () {
            this._sculpt.toggleGrid();
        };
        return ToggleGridCommand;
    })();
    Implementation2.ToggleGridCommand = ToggleGridCommand;

    var MoveCursor = (function () {
        function MoveCursor(sculpt, wait) {
            this._wait = 1;
            this._sculpt = sculpt;
            if (wait)
                this._wait = wait;
        }
        MoveCursor.prototype.execute = function () {
            this._shouldMove = !this._shouldMove;
            this._sculpt.moveCursor();
        };
        return MoveCursor;
    })();
    Implementation2.MoveCursor = MoveCursor;

    var ToggleControlVisibility = (function () {
        function ToggleControlVisibility(sculpt) {
            this._sculpt = sculpt;
        }
        ToggleControlVisibility.prototype.execute = function () {
            this._sculpt.toggleMesh();
        };
        return ToggleControlVisibility;
    })();
    Implementation2.ToggleControlVisibility = ToggleControlVisibility;

    var Button = (function () {
        function Button(id, name, command) {
            this.Id = id;
            this.Name = name;
            this.Command = command;
        }
        return Button;
    })();
    Implementation2.Button = Button;

    var GUI = (function () {
        function GUI() {
            this.buttons = ko.observableArray();
            ko.applyBindings(this, $('#buttons')[0]);
        }
        GUI.prototype.onButtonClick = function (b) {
            b.Command.execute();
        };

        GUI.prototype.addButton = function (button) {
            this.buttons.push(button);
            console.log();
        };
        return GUI;
    })();
    Implementation2.GUI = GUI;

    var InfoViewModel = (function () {
        function InfoViewModel() {
            this.CursorPos = ko.observable();
            this.CursorLvl = ko.observable();
            this.DebugMsg = ko.observable();
        }
        return InfoViewModel;
    })();
    Implementation2.InfoViewModel = InfoViewModel;

    var NoiseRender = (function () {
        function NoiseRender(gui) {
            this._worldSize = 400;
            this._blockSize = 80;
            this._gridColor = 0x25F500;
            this._cursorTracker = -1;
            this._cursorLvlTracker = 0;
            this._lblVisibility = true;
            this._locked = false;
            this._gui = gui;

            this.info = new InfoViewModel();
            ko.applyBindings(this.info, $('#info')[0]);

            this.info.CursorPos(this._cursorTracker);
            this.info.CursorLvl(this._cursorLvlTracker);

            this.initialise();
            this.animate();
        }
        NoiseRender.prototype.initialise = function () {
            var _this = this;
            this._clock = new THREE.Clock();

            try  {
                NoiseRender.Worker = new Worker('../src/worker2.js');
                NoiseRender.Worker.addEventListener('message', this.onMessageReceived.bind(this), false); // listen for callbacks
            } catch (e) {
                alert("Unable to load worker");
            }

            NoiseRender.GlobalControlsEnabled = true;
            this._renderingElement = document.getElementById('webgl');
            this._stats = new Stats();
            this._stats.setMode(0);
            document.getElementById('fps').appendChild(this._stats.domElement);

            var divWH = Helper.jqhelper.getScreenWH('#webgl');
            this._screenWidth = divWH[0];
            this._screenHeight = divWH[1];

            if (!Detector.webgl)
                Detector.addGetWebGLMessage();

            this._scene = new THREE.Scene();

            this.initialiseCamera();

            var pointColor = 0xFFFFFF;
            this.initialiseSpotLighting(pointColor, 7000);

            this._renderer = new THREE.WebGLRenderer();
            this._renderer.setClearColor(new THREE.Color(0xEEEfff), 1);
            this._renderer.setSize(this._screenWidth, this._screenHeight);

            var gridCreator = new Geometry.GridCreator(this._worldSize, this._blockSize, this._gridColor);
            var gridGeometryH = gridCreator.buildAxisAligned2DGrids();
            var gridGeometryV = gridCreator.buildAxisAligned2DGrids();
            this._grid = gridCreator.build3DGrid(gridGeometryH, gridGeometryV);
            if (this._blockSize >= 10) {
                this._scene.add(this._grid.liH);
                this._scene.add(this._grid.liV);
            }

            this._gui.addButton(new Button('Toggle', 'Toggle Grid', new ToggleGridCommand(this)));

            var axisHelper = new THREE.AxisHelper(20);
            axisHelper.position = new THREE.Vector3(-1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20);
            this._scene.add(axisHelper);

            Helper.jqhelper.appendToScene('#webgl', this._renderer);

            this._cursorLvlTracker = 0;

            this._phongMaterial = new THREE.MeshPhongMaterial();
            this._phongMaterial.specular = new THREE.Color(0X9FCFF);
            this._phongMaterial.color = new THREE.Color(0x7375C7);
            this._phongMaterial.emissive = new THREE.Color(0X006063);
            this._phongMaterial.shininess = 10;
            this._phongMaterial.side = THREE.DoubleSide;

            $.ajax({
                dataType: "json",
                url: '..//data//perlin//data.json',
                success: function (data) {
                    _this._voxelWorld = new Voxel.VoxelWorld(_this._worldSize, _this._blockSize, _this._scene, data);
                    var slim = _this._voxelWorld.getSlimWorldVoxelArray();
                    Implementation2.NoiseRender.Worker.postMessage({ command: "calculateVoxelGeometry", data: slim, threshold: parseInt($('#amount').text()) });
                }
            });

            //            this._voxelWorld = new Voxel.VoxelWorld(this._worldSize, this._blockSize, this._scene);
            //            var slim = this._voxelWorld.getSlimWorldVoxelArray();
            //            Implementation2.NoiseRender.Worker.postMessage({command: "calculateVoxelGeometry", data: slim, threshold: parseInt($('#amount').text())});
            this.draw();
        };

        NoiseRender.prototype.getCursor = function () {
            return this._cursorTracker;
        };

        NoiseRender.prototype.getCursorLvl = function () {
            return this._cursorLvlTracker;
        };

        NoiseRender.prototype.initialiseCamera = function () {
            this._camera = new THREE.PerspectiveCamera(45, this._screenWidth / this._screenHeight, 0.1, 1500);
            this._camera.position = new THREE.Vector3(0, 200, 600);
            this._camera.lookAt(this._scene.position);
            this._cameraControls = new THREE.OrbitControls(this._camera, this._renderingElement);
            this._cameraControls.domElement = this._renderingElement;
            this._scene.add(this._camera);
        };

        NoiseRender.prototype.initialiseLighting = function () {
            // TODO
            var amb = new THREE.AmbientLight();
            amb.color = new THREE.Color(0X0c0c0c);
            this._scene.add(amb);

            var directionalLight = new THREE.DirectionalLight(0xffffff);
            directionalLight.position.set(1, 1, 1).normalize();
            this._scene.add(directionalLight);
        };

        NoiseRender.prototype.initialiseSpotLighting = function (distance, pointcolor) {
            var spot = new THREE.SpotLight();
            spot.color = new THREE.Color(pointcolor);
            spot.position = new THREE.Vector3(0, 0, distance);
            spot.castShadow = true;
            spot.target = new THREE.Object3D();
            this._scene.add(spot);

            spot = new THREE.SpotLight();
            spot.color = new THREE.Color(pointcolor);
            spot.position = new THREE.Vector3(0, 0, -distance);
            spot.castShadow = true;
            spot.target = new THREE.Object3D();

            // spot.distance = distance/2;
            this._scene.add(spot);

            spot = new THREE.SpotLight();
            spot.color = new THREE.Color(pointcolor);
            spot.position = new THREE.Vector3(-distance, 0, 0);
            spot.castShadow = true;
            spot.target = new THREE.Object3D();
            this._scene.add(spot);

            spot = new THREE.SpotLight();
            spot.color = new THREE.Color(pointcolor);
            spot.position = new THREE.Vector3(distance, 0, 0);
            spot.castShadow = true;
            spot.target = new THREE.Object3D();
            this._scene.add(spot);

            spot = new THREE.SpotLight();
            spot.color = new THREE.Color(pointcolor);
            spot.position = new THREE.Vector3(0, -distance, 0);
            spot.castShadow = true;
            spot.target = new THREE.Object3D();
            this._scene.add(spot);

            spot = new THREE.SpotLight();
            spot.color = new THREE.Color(pointcolor);
            spot.position = new THREE.Vector3(0, distance, 0);
            spot.castShadow = true;
            spot.target = new THREE.Object3D();
            this._scene.add(spot);
        };

        NoiseRender.prototype.updateGridColor = function (val) {
            this._gridColor = parseInt(("0x" + val), 16);
            this._grid.liH.material.color.setHex(this._gridColor);
            this._grid.liV.material.color.setHex(this._gridColor);
        };

        NoiseRender.prototype.animate = function () {
            window.requestAnimationFrame(this.animate.bind(this));
            this.update();
            this.draw();
            this._stats.update();
            // TODO
            // Stuff that needs updating
        };

        NoiseRender.prototype.update = function () {
            var delta = this._clock.getDelta();

            if (NoiseRender.GlobalControlsEnabled) {
                this._cameraControls.enabled = true;
                this._cameraControls.update();
            } else {
                this._cameraControls.enabled = false;
            }

            if (this._voxelWorld) {
                this._voxelWorld.update(this._camera, this._lblVisibility);
                //this.moveCursor();
            }
        };

        NoiseRender.prototype.draw = function () {
            this._renderer.render(this._scene, this._camera);
        };

        NoiseRender.prototype.moveCursor = function () {
            this._cursorTracker++;

            if (this._cursorTracker >= this._voxelWorld.getLevel(this._cursorLvlTracker).getAllVoxelsAtThisLevel().length) {
                this._cursorTracker = 0;
                this._cursorLvlTracker += 1;
            }

            if (this._cursorLvlTracker >= this._voxelWorld.getWorldVoxelArray().length) {
                this._cursorLvlTracker = 0;
                this._cursorTracker = 0;
            }

            var stuff = this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker);

            var adapter = {
                p0: { position: stuff.getVerts().p0.getPosition(), value: stuff.getVerts().p0.getValue() },
                p1: { position: stuff.getVerts().p1.getPosition(), value: stuff.getVerts().p1.getValue() },
                p2: { position: stuff.getVerts().p2.getPosition(), value: stuff.getVerts().p2.getValue() },
                p3: { position: stuff.getVerts().p3.getPosition(), value: stuff.getVerts().p3.getValue() },
                p4: { position: stuff.getVerts().p4.getPosition(), value: stuff.getVerts().p4.getValue() },
                p5: { position: stuff.getVerts().p5.getPosition(), value: stuff.getVerts().p5.getValue() },
                p6: { position: stuff.getVerts().p6.getPosition(), value: stuff.getVerts().p6.getValue() },
                p7: { position: stuff.getVerts().p7.getPosition(), value: stuff.getVerts().p7.getValue() } };

            // var t = this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker);
            Implementation2.NoiseRender.Worker.postMessage({ command: "calculateVoxelGeometry", voxelInfo: adapter, level: this._cursorLvlTracker, cursortracker: this._cursorTracker, threshold: parseInt($('#amount').text()) });

            this.info.CursorPos(this._cursorTracker);
            this.info.CursorLvl(this._cursorLvlTracker);
        };

        NoiseRender.prototype.updateColor = function (val) {
            // TODO
        };

        NoiseRender.prototype.toggleGrid = function () {
            if (this._grid.liH.visible) {
                this._grid.liH.visible = false;
                this._grid.liV.visible = false;
            } else {
                this._grid.liH.visible = true;
                this._grid.liV.visible = true;
            }
        };

        NoiseRender.prototype.toggleWireFrame = function () {
            // TODO
        };

        NoiseRender.prototype.toggleMesh = function () {
            this._controlSphere.toggleVisibility();
            this._controlSphereInner.toggleVisibility();
        };

        NoiseRender.prototype.regenerateWithNewThreshold = function () {
            if (this._voxelWorld && !this._locked) {
                var slim = this._voxelWorld.getSlimWorldVoxelArray();
                Implementation2.NoiseRender.Worker.postMessage({ command: "calculateVoxelGeometry", data: slim, threshold: parseInt($('#amount').text()) });
            }
        };

        NoiseRender.prototype.onMessageReceived = function (e) {
            if (e.data.commandReturn === 'calculatedVoxelGeometry') {
                this.setMesh(e.data.data);
                console.log();
            }
        };

        NoiseRender.prototype.setMesh = function (data) {
            //data.geometry.verticesNeedUpdate = true;
            this._locked = true;

            for (var lvl = 0; lvl < data.length; lvl++) {
                for (var vox = 0; vox < data[lvl].length; vox++) {
                    // TODO - needs investigation into why geometry is sometimes null
                    if (data[lvl][vox].geometry) {
                        var geometry = new THREE.Geometry();
                        geometry.vertices = data[lvl][vox].geometry.vertices;
                        geometry.faces = data[lvl][vox].geometry.faces;
                        geometry.faceVertexUvs = data[lvl][vox].geometry.faceVertexUvs;

                        var m = new THREE.Mesh(geometry, this._phongMaterial);
                        this._voxelWorld.getLevel(lvl).getVoxel(vox).setMesh(this._scene, m);
                    }
                }
            }

            this._locked = false;
            //var m = new THREE.Mesh(<THREE.Geometry>data.data, this._phongMaterial);
            //this._voxelWorld.getLevel(data.level).getVoxel(data.cursorTracker).setMesh(this._scene, m);
        };
        return NoiseRender;
    })();
    Implementation2.NoiseRender = NoiseRender;
})(Implementation2 || (Implementation2 = {}));
//# sourceMappingURL=noiseRendering.js.map
