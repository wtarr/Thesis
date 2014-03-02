/**
 * Created by wtarrant on 28/02/14.
 */
/// <reference path="../lib/knockout.d.ts" />
/// <reference path="../lib/underscore.d.ts" />
/// <reference path="Utils2.ts" />

//declare module THREE { export var Octree }
var Implementation;
(function (Implementation) {
    var ToggleGridCommand = (function () {
        function ToggleGridCommand(sculpt) {
            this._sculpt = sculpt;
        }

        ToggleGridCommand.prototype.execute = function () {
            this._sculpt.toggleGrid();
        };
        return ToggleGridCommand;
    })();
    Implementation.ToggleGridCommand = ToggleGridCommand;

    var GenerateProcedurallyGeneratedSphereCommand = (function () {
        function GenerateProcedurallyGeneratedSphereCommand(sculpt) {
            this._sculpt = sculpt;
        }

        GenerateProcedurallyGeneratedSphereCommand.prototype.execute = function () {
            this._sculpt.procedurallyGenerateSphere();
        };
        return GenerateProcedurallyGeneratedSphereCommand;
    })();
    Implementation.GenerateProcedurallyGeneratedSphereCommand = GenerateProcedurallyGeneratedSphereCommand;

    var CreateSpringBetweenNodesCommand = (function () {
        function CreateSpringBetweenNodesCommand(sculpt) {
            this._sculpt = sculpt;
        }

        CreateSpringBetweenNodesCommand.prototype.execute = function () {
            this._sculpt.joinNodes();
        };
        return CreateSpringBetweenNodesCommand;
    })();
    Implementation.CreateSpringBetweenNodesCommand = CreateSpringBetweenNodesCommand;

    var FillSphereWithFacesCommand = (function () {
        function FillSphereWithFacesCommand(sculpt) {
            this._sculpt = sculpt;
        }

        FillSphereWithFacesCommand.prototype.execute = function () {
            this._sculpt.fillMesh();
        };
        return FillSphereWithFacesCommand;
    })();
    Implementation.FillSphereWithFacesCommand = FillSphereWithFacesCommand;

    var ToggleControlVisibility = (function () {
        function ToggleControlVisibility(sculpt) {
            this._sculpt = sculpt;
        }

        ToggleControlVisibility.prototype.execute = function () {
            this._sculpt.toggleMesh();
        };
        return ToggleControlVisibility;
    })();
    Implementation.ToggleControlVisibility = ToggleControlVisibility;

    var MarchingCubeCommand = (function () {
        function MarchingCubeCommand(sculpt) {
            this._sculpt = sculpt;
        }

        MarchingCubeCommand.prototype.execute = function () {
            this._sculpt.generateShape();
        };
        return MarchingCubeCommand;
    })();
    Implementation.MarchingCubeCommand = MarchingCubeCommand;

    var Button = (function () {
        function Button(id, name, command) {
            this.Id = id;
            this.Name = name;
            this.Command = command;
        }

        return Button;
    })();
    Implementation.Button = Button;

    var GUI = (function () {
        function GUI() {
            this.buttons = ko.observableArray();
            ko.applyBindings(this);
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
    Implementation.GUI = GUI;

    var Sculpt2 = (function () {
        function Sculpt2(gui) {
            this._worldSize = 400;
            this._blockSize = 100;
            this._gridColor = 0x25F500;
            this._gui = gui;

            this.initialise();
            this.animate();
        }

        Sculpt2.prototype.initialise = function () {
            this._clock = new THREE.Clock();
            Sculpt2.Worker = new Worker('../logic/worker2.js');
            Sculpt2.Worker.addEventListener('message', this.onMessageReceived.bind(this), false);
            Sculpt2.GlobalControlsEnabled = true;
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
            this.initialiseLighting();

            var pointColor = '#ffffff';
            this.initialiseSpotLighting(pointColor, 1000);

            this._renderer = new THREE.WebGLRenderer();
            this._renderer.setClearColor(new THREE.Color(0xEEEfff), 1);
            this._renderer.setSize(this._screenWidth, this._screenHeight);

            // Mouse Node select drag and release
            this._plane = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000, 8, 8), new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.25, transparent: true, wireframe: true }));
            this._plane.visible = true;
            this._scene.add(this._plane);

            var gridCreator = new Geometry.GridCreator(this._worldSize, this._blockSize, this._gridColor);
            var gridGeometryH = gridCreator.buildAxisAligned2DGrids();
            var gridGeometryV = gridCreator.buildAxisAligned2DGrids();
            this._grid = gridCreator.build3DGrid(gridGeometryH, gridGeometryV);
            this._scene.add(this._grid.liH);
            this._scene.add(this._grid.liV);

            this._voxelWorld = new Voxel.VoxelWorld(this._worldSize, this._blockSize);
            this._controllerSphereRadius = 180;
            this._controllerSphereSegments = 15;
            this._nodeMass = 2;
            this._nodeVelocity = new THREE.Vector3(0, 0, 0);
            this._nodeSize = 5;
            this._springs = [];

            document.addEventListener('keydown', this.onDocumentKeyDown.bind(this), false);

            this._renderer.domElement.addEventListener('mousedown', this.nodeDrag.bind(this), false);
            this._renderer.domElement.addEventListener('mouseup', this.nodeRelease.bind(this), false);
            this._renderer.domElement.addEventListener('mousemove', this.onNodeSelect.bind(this), false);

            this._gui.addButton(new Button('toggleMesh', 'Toggle Grid', new ToggleGridCommand(this)));
            this._gui.addButton(new Button('procSphere', 'Control Sphere', new GenerateProcedurallyGeneratedSphereCommand(this)));
            this._gui.addButton(new Button('createSprings', 'Create Springs', new CreateSpringBetweenNodesCommand(this)));

            /// this._gui.addButton(new Button('fillMesh', 'Fill Mesh', new FillSphereWithFacesCommand(this)));
            this._gui.addButton(new Button('togVis', 'Hide All', new ToggleControlVisibility(this)));
            this._gui.addButton(new Button('marchingCube', 'Marching Cube', new MarchingCubeCommand(this)));

            var axisHelper = new THREE.AxisHelper(20);
            axisHelper.position = new THREE.Vector3(-1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20);
            this._scene.add(axisHelper);

            Helper.jqhelper.appendToScene('#webgl', this._renderer);

            this._controlSphere = new Controller.ControlSphere(this._controllerSphereSegments, this._controllerSphereRadius, this._scene, this._nodeSize, this._nodeVelocity, this._nodeMass);

            this._offset = new THREE.Vector3();

            this._cursorTracker = -1;
            this._cursorLvlTracker = 0;

            this.draw();
        };

        Sculpt2.prototype.initialiseCamera = function () {
            this._camera = new THREE.PerspectiveCamera(45, this._screenWidth / this._screenHeight, 0.1, 1500);
            this._camera.position = new THREE.Vector3(0, 200, 600);
            this._camera.lookAt(this._scene.position);
            this._cameraControls = new THREE.OrbitControls(this._camera);
            this._cameraControls.domElement = this._renderingElement;
            this._scene.add(this._camera);
        };

        Sculpt2.prototype.initialiseLighting = function () {
            // TODO
        };

        Sculpt2.prototype.initialiseSpotLighting = function (color, distance) {
            // TODO
        };

        Sculpt2.prototype.updateGridColor = function (val) {
            this._gridColor = parseInt(("0x" + val), 16);
            this._grid.liH.material.color.setHex(this._gridColor);
            this._grid.liV.material.color.setHex(this._gridColor);
        };

        Sculpt2.prototype.animate = function () {
            window.requestAnimationFrame(this.animate.bind(this));
            this.update();
            this.draw();
            this._stats.update();
            // TODO
            // Stuff that needs updating
        };

        Sculpt2.prototype.update = function () {
            var delta = this._clock.getDelta();

            if (Sculpt2.GlobalControlsEnabled) {
                this._cameraControls.enabled = true;
                this._cameraControls.update();
            } else {
                this._cameraControls.enabled = false;
            }

            for (var i = 0; i < this._springs.length; i++) {
                this._springs[i].update(delta);
            }

            this._controlSphere.update();
        };

        Sculpt2.prototype.draw = function () {
            this._renderer.render(this._scene, this._camera);
        };

        Sculpt2.prototype.onNodeSelect = function (e) {
            e.preventDefault();

            var clientXRel = e.x - $('#webgl').offset().left;
            var clientYRel = e.y - $('#webgl').offset().top;

            var vector = new THREE.Vector3((clientXRel / this._screenWidth) * 2 - 1, -(clientYRel / this._screenHeight) * 2 + 1, 0.5);

            //var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
            this._project = new THREE.Projector();
            this._project.unprojectVector(vector, this._camera);

            var raycaster = new THREE.Raycaster(this._camera.position, vector.sub(this._camera.position).normalize(), 0, Infinity);

            if (this._SELECTED) {
                var intersects1 = raycaster.intersectObject(this._plane);
                try {
                    this._SELECTED.position.copy(intersects1[0].point.sub(this._offset));
                } catch (e) {
                    console.log("Cannot read property of undefined");
                }
                return;
            }

            var oct = this._controlSphere.getOctreeForNodes();
            var res = oct.search(raycaster.ray.origin, raycaster.far, true, raycaster.ray.direction);
            var intersects = raycaster.intersectOctreeObjects(res);

            if (intersects.length > 0) {
                if (this._INTERSECTED != intersects[0].object) {
                    if (this._INTERSECTED)
                        this._INTERSECTED.material.color.setHex(this._INTERSECTED.currentHex);

                    this._INTERSECTED = intersects[0].object;

                    //console.log(this._INTERSECTED.id);
                    this._INTERSECTED.currentHex = this._INTERSECTED.material.color.getHex();

                    this._plane.position.copy(this._INTERSECTED.position);
                    this._plane.lookAt(this._camera.position);
                }
            }
        };

        Sculpt2.prototype.nodeDrag = function (e) {
            event.preventDefault();

            var clientXRel = e.x - $('#webgl').offset().left;
            var clientYRel = e.y - $('#webgl').offset().top;

            var vector = new THREE.Vector3((clientXRel / this._screenWidth) * 2 - 1, -(clientYRel / this._screenHeight) * 2 + 1, 0.5);

            //var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
            this._project = new THREE.Projector();
            this._project.unprojectVector(vector, this._camera);

            var raycaster = new THREE.Raycaster(this._camera.position, vector.sub(this._camera.position).normalize(), 0, Infinity);

            var res = this._controlSphere.getOctreeForNodes().search(raycaster.ray.origin, raycaster.far, true, raycaster.ray.direction);

            var intersects = raycaster.intersectOctreeObjects(res);

            if (intersects.length > 0) {
                this._cameraControls.enabled = false;

                this._SELECTED = intersects[0].object;

                var intersectsP = raycaster.intersectObject(this._plane);
                this._offset.copy(intersectsP[0].point).sub(this._plane.position);
            }
        };

        Sculpt2.prototype.nodeRelease = function (e) {
            event.preventDefault();

            this._cameraControls.enabled = true;

            if (this._INTERSECTED) {
                this._plane.position.copy(this._INTERSECTED.position);

                this._SELECTED = null;
            }
        };

        Sculpt2.prototype.onDocumentKeyDown = function (e) {
            if (e.keyCode === 13) {
                this._cursorTracker++;

                if (!this._cursorDebugger) {
                    var cubeGeo = new THREE.CubeGeometry(this._blockSize, this._blockSize, this._blockSize);
                    var cubeMat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
                    this._cursorDebugger = new THREE.Mesh(cubeGeo, cubeMat);
                    this._cursorDebugger.position = this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker).getCenter();

                    this._scene.add(this._cursorDebugger);
                }

                if (this._cursorTracker >= this._voxelWorld.getNumberOfVoxelsPerLevel()) {
                    this._cursorTracker = 0;
                    this._cursorLvlTracker += 1;
                }

                if (this._cursorLvlTracker >= this._voxelWorld.getWorldVoxelArray().length) {
                    this._cursorLvlTracker = 0;
                    this._cursorTracker = 0;
                }

                this._cursorDebugger.position = this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker).getCenter();
                //var voxCorners = calculateVoxelVertexPositions(cursor1.position, blockSize);
            }
        };

        Sculpt2.prototype.generateShape = function () {
            // TODO
        };

        Sculpt2.prototype.updateColor = function (val) {
            // TODO
        };

        Sculpt2.prototype.toggleGrid = function () {
            if (this._grid.liH.visible) {
                this._grid.liH.visible = false;
                this._grid.liV.visible = false;
            } else {
                this._grid.liH.visible = true;
                this._grid.liV.visible = true;
            }
        };

        Sculpt2.prototype.toggleWireFrame = function () {
            // TODO
        };

        Sculpt2.prototype.toggleMesh = function () {
            // TODO
        };

        Sculpt2.prototype.procedurallyGenerateSphere = function () {
            // TODO
            console.log(this);
            this._controlSphere.generateSphere();
            //this._sphereSkeleton = controlGenerator.generateNodePoints();
        };

        Sculpt2.prototype.joinNodes = function () {
            //            // TODO
            var match;

            for (var x = 0; x < this._controlSphere.getNodes().length; x++) {
                var node = this._controlSphere.getNodes()[x];

                match = _.filter(this._controlSphere.getSphereSkeleton().lines, function (line) {
                    var v1 = line.geometry.vertices[0];
                    var v2 = line.geometry.vertices[1];

                    return (v1.equalsWithinTolerence(node.getNodePosition(), 2)) || (v2.equalsWithinTolerence(node.getNodePosition(), 2));
                });

                for (var i = 0; i < match.length; i++) {
                    var v1 = match[i].geometry.vertices[0];
                    var v2 = match[i].geometry.vertices[1];

                    if (v1.equalsWithinTolerence(node.getNodePosition(), 5)) {
                        this.connectNode(node, v2, v1);
                    } else if (v2.equalsWithinTolerence(node.getNodePosition(), 5)) {
                        this.connectNode(node, v1, v2);
                    }
                }
            }
            //});
        };

        Sculpt2.prototype.connectNode = function (node, v1, v2) {
            var dir = new THREE.Vector3();
            dir.subVectors(v1, v2);

            var ray = new THREE.Raycaster(node.getNodePosition(), dir.normalize(), 0, Infinity);
            var res = this._controlSphere.getOctreeForNodes().search(ray.ray.origin, ray.far, true, ray.ray.direction);
            var intersections = ray.intersectOctreeObjects(res);

            if (intersections.length > 0) {
                var o = intersections[0].object;
                var contains = false;

                for (var i = 0; i < node.getNeigbourhoodNodes().length(); i++) {
                    var n = node.getNeigbourhoodNodes().get(i);

                    if (n.getNodePosition().equals(o.getNodePosition())) {
                        contains = true;
                    }
                }

                //})
                if (!contains) {
                    node.getNeigbourhoodNodes().add(o);
                    o.getNeigbourhoodNodes().add(node);
                    var va = (node.getNodePosition());
                    var vb = (o.getNodePosition());
                    var spring = new Geometry.Spring(this._scene, node, o, 0.5, (node.getNodePosition().distanceTo(o.getNodePosition())));
                    this._springs.push(spring);
                }
            }
        };

        Sculpt2.prototype.fillMesh = function () {
            // TODO
        };

        Sculpt2.prototype.voxelEvalComplex = function (voxRef) {
            // TODO
        };

        Sculpt2.prototype.onMessageReceived = function (e) {
            // TODO
            if (e.data.commandReturn === 'calculateMeshFacePositions') {
                console.log(this);
                if (this._controlSphere) {
                    this._controlSphere.addFaces(e.data.faces);
                }
            }
        };
        return Sculpt2;
    })();
    Implementation.Sculpt2 = Sculpt2;
})(Implementation || (Implementation = {}));
//# sourceMappingURL=Sculpting2.js.map
