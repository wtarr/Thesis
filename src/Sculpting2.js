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

    var MoveCursorCommand = (function () {
        function MoveCursorCommand(sculpt, wait) {
            this._wait = 2;
            this._sculpt = sculpt;
            if (wait)
                this._wait = wait;
        }
        MoveCursorCommand.prototype.execute = function () {
            var _this = this;
            this._shouldMove = !this._shouldMove;

            http:
            if (this._shouldMove) {
                this._timeout = setInterval(function () {
                    _this._sculpt.moveCursor();
                }, this._wait);
            }

            if (!this._shouldMove) {
                clearInterval(this._timeout);
            }
        };
        return MoveCursorCommand;
    })();
    Implementation.MoveCursorCommand = MoveCursorCommand;

    var MoveCursorIndividuallyCommand = (function () {
        function MoveCursorIndividuallyCommand(sculpt) {
            this._sculpt = sculpt;
        }
        MoveCursorIndividuallyCommand.prototype.execute = function () {
            this._sculpt.moveCursor();
        };
        return MoveCursorIndividuallyCommand;
    })();
    Implementation.MoveCursorIndividuallyCommand = MoveCursorIndividuallyCommand;

    var GenerateLargeProcedurallyGeneratedSphereCommand = (function () {
        function GenerateLargeProcedurallyGeneratedSphereCommand(sculpt) {
            this._sculpt = sculpt;
        }
        GenerateLargeProcedurallyGeneratedSphereCommand.prototype.execute = function () {
            this._sculpt.procedurallyGenerateSphere();
        };
        return GenerateLargeProcedurallyGeneratedSphereCommand;
    })();
    Implementation.GenerateLargeProcedurallyGeneratedSphereCommand = GenerateLargeProcedurallyGeneratedSphereCommand;

    var GenerateSmallerInvertedProcedurallyGeneratedSphereCommand = (function () {
        function GenerateSmallerInvertedProcedurallyGeneratedSphereCommand(sculpt) {
            this._sculpt = sculpt;
        }
        GenerateSmallerInvertedProcedurallyGeneratedSphereCommand.prototype.execute = function () {
            this._sculpt.procedurallyGenerateSmallerInvertedSphere();
        };
        return GenerateSmallerInvertedProcedurallyGeneratedSphereCommand;
    })();
    Implementation.GenerateSmallerInvertedProcedurallyGeneratedSphereCommand = GenerateSmallerInvertedProcedurallyGeneratedSphereCommand;

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

    var TakeHVslicesCommand = (function () {
        function TakeHVslicesCommand(sculpt) {
            this._sculpt = sculpt;
        }
        TakeHVslicesCommand.prototype.execute = function () {
            this._sculpt.clearOldData();
            this._sculpt.takeHorizontalImageSlice();
            this._sculpt.takeVerticalImageSlice();
            this._sculpt.drawAllSampledData();
        };
        return TakeHVslicesCommand;
    })();
    Implementation.TakeHVslicesCommand = TakeHVslicesCommand;

    var ToggleControlVisibilityCommand = (function () {
        function ToggleControlVisibilityCommand(cont) {
            this._cont = cont;
        }
        ToggleControlVisibilityCommand.prototype.execute = function () {
            this._cont.toggleVisibility();
        };
        return ToggleControlVisibilityCommand;
    })();
    Implementation.ToggleControlVisibilityCommand = ToggleControlVisibilityCommand;

    var ToggleVolumeVisibilityCommand = (function () {
        function ToggleVolumeVisibilityCommand(sculpt) {
            this._sculpt = sculpt;
        }
        ToggleVolumeVisibilityCommand.prototype.execute = function () {
            this._sculpt.toggleVolumeVisibility();
        };
        return ToggleVolumeVisibilityCommand;
    })();
    Implementation.ToggleVolumeVisibilityCommand = ToggleVolumeVisibilityCommand;

    var InfoViewModel = (function () {
        function InfoViewModel() {
            this.CursorPos = ko.observable();
            this.CursorLvl = ko.observable();
            this.DebugMsg = ko.observable();
        }
        return InfoViewModel;
    })();
    Implementation.InfoViewModel = InfoViewModel;

    var Sculpt2 = (function () {
        function Sculpt2(gui) {
            this._worldSize = 400;
            this._blockSize = 40;
            this._gridColor = 0x25F500;
            this._cursorTracker = -1;
            this._cursorLvlTracker = 0;
            this._demoSphereCenter1 = new THREE.Vector3(0, 0, 0);
            this._runDemo = false;
            this._demoSphereRadius = 90;
            this._demoSphereAdd = 40;
            this._lblVisibility = true;
            this._horizontalImagesDivID = 'horizontal';
            this._verticalImagesDivID = 'vertical';
            this._renderGridOnSliceImages = true;
            this._verticalSlice = 0;
            this._gui = gui;

            this.info = new InfoViewModel();
            ko.applyBindings(this.info, $('#info')[0]);

            this.info.CursorPos(this._cursorTracker);
            this.info.CursorLvl(this._cursorLvlTracker);

            this.initialise();
            this.animate();
        }
        Sculpt2.prototype.initialise = function () {
            var _this = this;
            this.Clock = new THREE.Clock();
            try  {
                Sculpt2.Worker = new Worker('../src/worker2.js');
                Sculpt2.Worker.addEventListener('message', this.onMessageReceived.bind(this), false); // listen for callbacks
            } catch (e) {
                alert("Unable to load worker");
            }

            Sculpt2.GlobalControlsEnabled = true;
            this._renderingElement = document.getElementById('webgl');
            this._stats = new Stats();
            this._stats.setMode(0);
            document.getElementById('fps').appendChild(this._stats.domElement);

            var divWH = Helper.JQueryHelper.GetScreenWH('#webgl');
            this._screenWidth = divWH[0];
            this._screenHeight = divWH[1];

            if (!Detector.webgl)
                Detector.addGetWebGLMessage();

            this._scene = new THREE.Scene();

            this.initialiseCamera();

            //this.initialiseLighting();
            var pointColor = 0xFFFFFF;
            this.initialiseSpotLighting(pointColor, 7000);

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

            if (this._blockSize >= 10) {
                this._scene.add(this._grid.liH);
                this._scene.add(this._grid.liV);
            }
            this._voxelWorld = new Voxel.VoxelWorld(this._worldSize, this._blockSize, this._scene);

            this._controllerSphereRadius = 180;
            this._controllerSphereSegments = 12;
            this._nodeMass = 2;
            this._nodeVelocity = new THREE.Vector3(0, 0, 0);
            this._nodeSize = 5;
            this._springs = [];

            //this._renderer.domElement.addEventListener('mousedown', this.nodeDrag.bind(this), false);
            //this._renderer.domElement.addEventListener('mouseup', this.nodeRelease.bind(this), false);
            //this._renderer.domElement.addEventListener('mousemove', this.onNodeSelect.bind(this), false);
            $('#webgl').mousedown(function (event) {
                return _this.nodeDrag(event);
            });
            $('#webgl').mouseup(function (event) {
                return _this.nodeRelease(event);
            });
            $('#webgl').mousemove(function (event) {
                return _this.onNodeSelect(event);
            });

            this._controlSphere = new Controller.ControlSphere(1, this._controllerSphereSegments, this._controllerSphereRadius, this._scene, this._nodeSize, this._nodeVelocity, this._nodeMass);
            this._controlSphereInner = new Controller.ControlSphere(2, this._controllerSphereSegments, 90, this._scene, this._nodeSize, this._nodeVelocity, this._nodeMass);

            this._gui.addButton(new GUIUTILS.Button('toggleMesh', 'Toggle Grid', 'Allows grid to be toggled on or off', new ToggleGridCommand(this)));
            this._gui.addButton(new GUIUTILS.Button('procSphere', 'Controller Sphere (L)', 'Generates a the larger procedural sphere that acts as a base object ' + 'that can be sampled', new GenerateLargeProcedurallyGeneratedSphereCommand(this)));
            this._gui.addButton(new GUIUTILS.Button('togVisProcL', 'Hide Proc L', 'Hides the larger controller sphere', new ToggleControlVisibilityCommand(this._controlSphere)));
            this._gui.addButton(new GUIUTILS.Button('procSphere', 'Controller Sphere (S)', 'Generates a the smaller procedural sphere with inverted normals to demonstrate' + 'an internal object with hollow core', new GenerateSmallerInvertedProcedurallyGeneratedSphereCommand(this)));
            this._gui.addButton(new GUIUTILS.Button('togVisProc', 'Hide Proc S', 'Hides the smaller controller sphere', new ToggleControlVisibilityCommand(this._controlSphereInner)));
            this._gui.addButton(new GUIUTILS.Button('createSprings', 'Create Springs', 'Applies Hookes law to the connectors between nodes ' + 'and allows for a spring like effect when nodes are manipulated', new CreateSpringBetweenNodesCommand(this)));
            this._gui.addButton(new GUIUTILS.Button('togVisVol', 'Hide Vol', 'Hides the volume rendered object', new ToggleVolumeVisibilityCommand(this)));
            this._gui.addButton(new GUIUTILS.Button('Sampler', 'Sampler', 'Samples the base controller sphere and produces data that can be used by the Marching cube algorithm ' + 'to produce an voxelised object copy', new TakeHVslicesCommand(this)));
            this._gui.addButton(new GUIUTILS.Button('Move', 'Auto cursor', 'Starts the Marching cube rendering process', new MoveCursorCommand(this)));
            this._gui.addButton(new GUIUTILS.Button('Move', 'Step cursor ', 'Starts the Marching cube rendering process', new MoveCursorIndividuallyCommand(this)));

            var axisHelper = new THREE.AxisHelper(20);
            axisHelper.position = new THREE.Vector3(-1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20);
            this._scene.add(axisHelper);

            Helper.JQueryHelper.AppendToScene('#webgl', this._renderer);

            this._offset = new THREE.Vector3();

            this._cursorLvlTracker = 0;

            this._phongMaterial = new THREE.MeshPhongMaterial();
            this._phongMaterial.specular = new THREE.Color(0X9FCFF);
            this._phongMaterial.color = new THREE.Color(0x7375C7);
            this._phongMaterial.emissive = new THREE.Color(0X006063);
            this._phongMaterial.shininess = 10;
            this._phongMaterial.side = THREE.DoubleSide;

            this._arrayOfHorizontalSlices = new Array();
            this._arrayOfVerticalSlices = new Array();

            this._canvasRender = new Imaging.CanvasRender();

            this._horizontalLines = new Geometry.Collection();
            this._verticalLines = new Geometry.Collection();

            this._arrayOfVisualRaylines = new Array();

            this.draw();
        };

        Sculpt2.prototype.initialiseCamera = function () {
            this._camera = new THREE.PerspectiveCamera(45, this._screenWidth / this._screenHeight, 0.1, 1500);
            this._camera.position = new THREE.Vector3(0, 200, 600);
            this._camera.lookAt(this._scene.position);
            this._cameraControls = new THREE.OrbitControls(this._camera, this._renderingElement);
            this._cameraControls.domElement = this._renderingElement;
            this._scene.add(this._camera);
        };

        Sculpt2.prototype.initialiseSpotLighting = function (distance, pointcolor) {
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
        };

        Sculpt2.prototype.update = function () {
            var delta = this.Clock.getDelta();
            if (Sculpt2.GlobalControlsEnabled) {
                this._cameraControls.enabled = true;
                this._cameraControls.update();
            } else {
                this._cameraControls.enabled = false;
            }

            for (var i = 0; i < this._springs.length; i++) {
                this._springs[i].update(0.05);
            }

            if (this._controlSphere) {
                this._controlSphere.update(0);
            }
            ;

            if (this._controlSphereInner) {
                this._controlSphereInner.update(1);
            }
            ;

            this._voxelWorld.update(this._camera, this._lblVisibility);
        };

        Sculpt2.prototype.draw = function () {
            this._renderer.render(this._scene, this._camera);
        };

        // Author : Mr Doob
        // Source : Node select, drag and release is based on code in a packaged ThreeJS demonstration titled 'interactive draggable cubes'
        //          http://threejs.org/examples/webgl_interactive_draggablecubes.html
        // Purpose : used for selecting and dragging the nodes in the controller sphere.
        Sculpt2.prototype.onNodeSelect = function (event) {
            event.preventDefault();

            var elem = $('#webgl');
            var clientXRel = event.clientX - elem.offset().left;
            var clientYRel = event.clientY - elem.offset().top;

            var vector = new THREE.Vector3((clientXRel / this._screenWidth) * 2 - 1, -(clientYRel / this._screenHeight) * 2 + 1, 0.5);

            //var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
            this._project = new THREE.Projector();
            this._project.unprojectVector(vector, this._camera);

            var raycaster = new THREE.Raycaster(this._camera.position, vector.sub(this._camera.position).normalize(), 0, Infinity);

            if (this._SELECTED) {
                var intersects1 = raycaster.intersectObject(this._plane);
                try  {
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

        Sculpt2.prototype.nodeDrag = function (event) {
            event.preventDefault();

            var clientXRel = event.clientX - $('#webgl').offset().left;
            var clientYRel = event.clientY - $('#webgl').offset().top;

            var vector = new THREE.Vector3((clientXRel / this._screenWidth) * 2 - 1, -(clientYRel / this._screenHeight) * 2 + 1, 0.5);

            //var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
            this._project = new THREE.Projector();
            this._project.unprojectVector(vector, this._camera);

            var raycaster = new THREE.Raycaster(this._camera.position, vector.sub(this._camera.position).normalize(), 0, Infinity);

            var res = this._controlSphere.getOctreeForNodes().search(raycaster.ray.origin, raycaster.far, true, raycaster.ray.direction);

            var intersects = raycaster.intersectOctreeObjects(res);

            if (intersects.length > 0) {
                this._cameraControls.enabled = false;
                Sculpt2.GlobalControlsEnabled = false;

                this._SELECTED = intersects[0].object;

                var intersectsP = raycaster.intersectObject(this._plane);
                this._offset.copy(intersectsP[0].point).sub(this._plane.position);
            }
        };

        Sculpt2.prototype.nodeRelease = function (event) {
            event.preventDefault();

            Sculpt2.GlobalControlsEnabled = true;
            this._cameraControls.enabled = true;

            if (this._INTERSECTED) {
                this._plane.position.copy(this._INTERSECTED.position);

                this._SELECTED = null;
            }
        };

        Sculpt2.prototype.moveCursor = function () {
            this._cursorTracker++;

            if (!this._cursorDebugger) {
                var cubeGeo = new THREE.CubeGeometry(this._blockSize, this._blockSize, this._blockSize);
                var cubeMat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
                this._cursorDebugger = new THREE.Mesh(cubeGeo, cubeMat);
                this._cursorDebugger.position = this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker).getCenter();

                this._scene.add(this._cursorDebugger);
            }

            if (this._cursorTracker >= this._voxelWorld.getLevel(this._cursorLvlTracker).getAllVoxelsAtThisLevel().length) {
                this._cursorTracker = 0;
                this._cursorLvlTracker += 1;
                this._verticalSlice = 0;
            }

            if (this._cursorLvlTracker >= this._voxelWorld.getWorldVoxelArray().length) {
                this._cursorLvlTracker = 0;
                this._cursorTracker = 0;
                this._verticalSlice = 0;
            }

            this._cursorDebugger.position = this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker).getCenter();

            //var voxCorners = calculateVoxelVertexPositions(cursor1.position, blockSize);
            //this.imageSlice(this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker));
            this.createHelperLabels(this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker));

            //this.info = { Cursor: this._cursorTracker, CursorLevel: this._cursorLvlTracker};
            if (this._cursorTracker % this._voxelWorld.getStride() == 0 && this._cursorTracker != 0) {
                this._verticalSlice++;
            }

            var theVoxelInQuestion = this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker);
            theVoxelInQuestion.resetVoxelValues();

            var mesh = Voxel.MarchingCubeRendering.MarchingCubeCustom(theVoxelInQuestion, this._horizontalLines, this._verticalLines, this._worldSize, this._blockSize, this._phongMaterial);

            this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker).setMesh(this._scene, mesh);

            this.info.CursorPos(this._cursorTracker);
            this.info.CursorLvl(this._cursorLvlTracker);
        };

        Sculpt2.prototype.createHelperLabels = function (voxel) {
            this._voxelWorld.clearLabels();

            var verts = this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker).getVerts();

            var lbl0 = this._voxelWorld.createLabel(verts.p0.getId() + " (" + verts.p0.getPosition().x + ", " + verts.p0.getPosition().y + ", " + verts.p0.getPosition().z + ")", verts.p0.getPosition(), 8, "black", { r: 255, g: 255, b: 255, a: 0 }, this._lblVisibility);
            var lbl1 = this._voxelWorld.createLabel(verts.p1.getId() + " (" + verts.p1.getPosition().x + ", " + verts.p1.getPosition().y + ", " + verts.p1.getPosition().z + ")", verts.p1.getPosition(), 8, "black", { r: 255, g: 255, b: 255, a: 0 }, this._lblVisibility);
            var lbl2 = this._voxelWorld.createLabel(verts.p2.getId() + " (" + verts.p2.getPosition().x + ", " + verts.p2.getPosition().y + ", " + verts.p2.getPosition().z + ")", verts.p2.getPosition(), 8, "black", { r: 255, g: 255, b: 255, a: 0 }, this._lblVisibility);
            var lbl3 = this._voxelWorld.createLabel(verts.p3.getId() + " (" + verts.p3.getPosition().x + ", " + verts.p3.getPosition().y + ", " + verts.p3.getPosition().z + ")", verts.p3.getPosition(), 8, "black", { r: 255, g: 255, b: 255, a: 0 }, this._lblVisibility);

            var lbl4 = this._voxelWorld.createLabel(verts.p4.getId() + " (" + verts.p4.getPosition().x + ", " + verts.p4.getPosition().y + ", " + verts.p4.getPosition().z + ")", verts.p4.getPosition(), 8, "black", { r: 255, g: 255, b: 255, a: 0 }, this._lblVisibility);
            var lbl5 = this._voxelWorld.createLabel(verts.p5.getId() + " (" + verts.p5.getPosition().x + ", " + verts.p5.getPosition().y + ", " + verts.p5.getPosition().z + ")", verts.p5.getPosition(), 8, "black", { r: 255, g: 255, b: 255, a: 0 }, this._lblVisibility);
            var lbl6 = this._voxelWorld.createLabel(verts.p6.getId() + " (" + verts.p6.getPosition().x + ", " + verts.p6.getPosition().y + ", " + verts.p6.getPosition().z + ")", verts.p6.getPosition(), 8, "black", { r: 255, g: 255, b: 255, a: 0 }, this._lblVisibility);
            var lbl7 = this._voxelWorld.createLabel(verts.p7.getId() + " (" + verts.p7.getPosition().x + ", " + verts.p7.getPosition().y + ", " + verts.p7.getPosition().z + ")", verts.p7.getPosition(), 8, "black", { r: 255, g: 255, b: 255, a: 0 }, this._lblVisibility);

            this._scene.add(lbl0);
            this._scene.add(lbl1);
            this._scene.add(lbl2);
            this._scene.add(lbl3);

            this._scene.add(lbl4);
            this._scene.add(lbl5);
            this._scene.add(lbl6);
            this._scene.add(lbl7);
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

        Sculpt2.prototype.toggleMesh = function () {
            this._controlSphere.toggleVisibility();
            this._controlSphereInner.toggleVisibility();
        };

        Sculpt2.prototype.toggleVolumeVisibility = function () {
            this._voxelWorld.toggleVolumeVisibility();
        };

        Sculpt2.prototype.procedurallyGenerateSphere = function () {
            this._controlSphere.generateSphere();
        };

        Sculpt2.prototype.procedurallyGenerateSmallerInvertedSphere = function () {
            this._controlSphereInner.generateSphere();
        };

        Sculpt2.prototype.joinNodes = function () {
            var match;
            for (var x = 0; x < this._controlSphere.getNodes().length; x++) {
                var node = this._controlSphere.getNodes()[x];
                match = _.filter(this._controlSphere.getSphereSkeleton().lines, function (line) {
                    var lin = line;
                    var v1 = lin.geometry.vertices[0];
                    var v2 = lin.geometry.vertices[1];
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

        Sculpt2.prototype.onMessageReceived = function (e) {
            if (e.data.commandReturn === 'calculateMeshFacePositions' && e.data.id === 1) {
                ///console.log(this);
                if (this._controlSphere) {
                    this._controlSphere.addFaces(e.data.faces);
                }
            }

            if (e.data.commandReturn === 'calculateMeshFacePositions' && e.data.id === 2) {
                if (this._controlSphereInner) {
                    this._controlSphereInner.addFaces(e.data.faces);
                }
            }
        };

        Sculpt2.prototype.clearOldData = function () {
            var _this = this;
            _.each(this._arrayOfVisualRaylines, function (line) {
                _this._scene.remove(line);
            });

            this._arrayOfVisualRaylines = [];
            this._arrayOfHorizontalSlices = [];
            this._arrayOfVerticalSlices = [];
            this._canvasRender.clearAllImages(this._horizontalImagesDivID, this._verticalImagesDivID);
            this._horizontalLines = new Geometry.Collection();
            this._verticalLines = new Geometry.Collection();
        };

        Sculpt2.prototype.takeHorizontalImageSlice = function () {
            //this._horizontalLines
            var _this = this;
            // Z - Z Sampling
            this._cursorTracker = 0;
            this._cursorLvlTracker = 0;

            for (var i = 0; i < this._voxelWorld.getStride(); i++) {
                var complete = false;

                //this._cursorLvlTracker = 0;
                var voxelPerLevel = this._voxelWorld.getNumberOfVoxelsPerLevel();
                var levels = this._voxelWorld.getNumberOfLevelsInVoxelWorld();
                var stride = this._voxelWorld.getStride();
                var linesToDrawBtm = [];
                var linesToDrawTop = [];

                while (!complete) {
                    if (this._cursorTracker + 1 >= stride) {
                        this._cursorTracker = 0;
                        complete = true;
                        break;
                    } else {
                        this._cursorTracker++;
                    }

                    var voxelRef = this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker);

                    var directionBtmSIDE1 = [];
                    var originBtmSIDE1 = [];

                    var directTopSIDE1 = [];
                    var originTopSIDE1 = [];

                    originBtmSIDE1.push(voxelRef.getVerts().p0.getPosition(), voxelRef.getVerts().p1.getPosition());
                    directionBtmSIDE1.push(Geometry.GeometryHelper.vectorBminusVectorA(voxelRef.getVerts().p3.getPosition(), voxelRef.getVerts().p0.getPosition()));
                    directionBtmSIDE1.push(Geometry.GeometryHelper.vectorBminusVectorA(voxelRef.getVerts().p2.getPosition(), voxelRef.getVerts().p1.getPosition()));

                    originTopSIDE1.push(voxelRef.getVerts().p4.getPosition(), voxelRef.getVerts().p5.getPosition());
                    directTopSIDE1.push(Geometry.GeometryHelper.vectorBminusVectorA(voxelRef.getVerts().p7.getPosition(), voxelRef.getVerts().p4.getPosition()));
                    directTopSIDE1.push(Geometry.GeometryHelper.vectorBminusVectorA(voxelRef.getVerts().p6.getPosition(), voxelRef.getVerts().p5.getPosition()));

                    // for btm
                    // p0 -> p3
                    // p1 -> p2
                    // for top
                    // p5 -> p6
                    // p4 -> p7
                    var lines = Voxel.VoxelWorld.projectIntoVolume(directionBtmSIDE1, originBtmSIDE1, [this._controlSphere, this._controlSphereInner]);
                    lines.forEach(function (elm) {
                        linesToDrawBtm.push(elm);
                        _this._horizontalLines.addUnique(new Geometry.Line(elm.start, elm.end));
                    });

                    lines = Voxel.VoxelWorld.projectIntoVolume(directTopSIDE1, originTopSIDE1, [this._controlSphere, this._controlSphereInner]);
                    lines.forEach(function (elm) {
                        linesToDrawTop.push(elm);

                        _this._horizontalLines.addUnique(new Geometry.Line(elm.start, elm.end));
                    });

                    console.log();
                }

                // X - X Sampling
                // WOW, much repeat, such delight!
                complete = false;
                this._cursorTracker = 0;

                while (!complete) {
                    //this._cursorTracker += this._voxelWorld.getStride();
                    var c = Math.pow(stride, 2);
                    if (this._cursorTracker + stride >= c) {
                        this._cursorTracker = 0;
                        if (this._cursorLvlTracker + 1 === levels)
                            this._cursorLvlTracker = 0;
                        else
                            this._cursorLvlTracker += 1;
                        complete = true;
                        break;
                    } else {
                        this._cursorTracker += stride;
                    }

                    if (this._cursorLvlTracker >= levels) {
                        this._cursorTracker = 0;
                        this._cursorLvlTracker = 0;
                        complete = true;
                        break;
                    }

                    var voxelRef = this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker);

                    var directionBtmSIDE2 = [];
                    var originBtmSIDE2 = [];

                    var directTopSIDE2 = [];
                    var originTopSIDE2 = [];

                    originBtmSIDE2.push(voxelRef.getVerts().p0.getPosition(), voxelRef.getVerts().p3.getPosition());
                    directionBtmSIDE2.push(Geometry.GeometryHelper.vectorBminusVectorA(voxelRef.getVerts().p1.getPosition(), voxelRef.getVerts().p0.getPosition()));
                    directionBtmSIDE2.push(Geometry.GeometryHelper.vectorBminusVectorA(voxelRef.getVerts().p2.getPosition(), voxelRef.getVerts().p3.getPosition()));

                    originTopSIDE2.push(voxelRef.getVerts().p4.getPosition(), voxelRef.getVerts().p7.getPosition());
                    directTopSIDE2.push(Geometry.GeometryHelper.vectorBminusVectorA(voxelRef.getVerts().p5.getPosition(), voxelRef.getVerts().p4.getPosition()));
                    directTopSIDE2.push(Geometry.GeometryHelper.vectorBminusVectorA(voxelRef.getVerts().p6.getPosition(), voxelRef.getVerts().p7.getPosition()));

                    // other way
                    // btm
                    // p0 -> p1
                    // p3 -> p2
                    // top
                    // p4 -> p5
                    // p7 -> p6
                    var lines = Voxel.VoxelWorld.projectIntoVolume(directionBtmSIDE2, originBtmSIDE2, [this._controlSphere, this._controlSphereInner]);
                    lines.forEach(function (elm) {
                        linesToDrawBtm.push(elm);
                        _this._horizontalLines.addUnique(new Geometry.Line(elm.start, elm.end));
                    });

                    lines = Voxel.VoxelWorld.projectIntoVolume(directTopSIDE2, originTopSIDE2, [this._controlSphere, this._controlSphereInner]);
                    lines.forEach(function (elm) {
                        linesToDrawTop.push(elm);
                        _this._horizontalLines.addUnique(new Geometry.Line(elm.start, elm.end));
                    });
                }

                this.info.CursorPos(this._cursorTracker);
                var lvl = function () {
                    if (_this._cursorLvlTracker === levels) {
                        return levels;
                    } else {
                        return _this._cursorLvlTracker - 1;
                    }
                };
                this.info.CursorLvl(lvl());

                var b = this._canvasRender.drawCanvas('bottom', linesToDrawBtm, new THREE.Vector3(-1 * this._worldSize / 2, 0, this._worldSize / 2), 0, this._renderGridOnSliceImages, this._worldSize, this._blockSize);
                var t = this._canvasRender.drawCanvas('top', linesToDrawTop, new THREE.Vector3(-1 * this._worldSize / 2, 0, this._worldSize / 2), 0, this._renderGridOnSliceImages, this._worldSize, this._blockSize);
                this._arrayOfHorizontalSlices.push({ bottom: b, top: t });
            }

            console.log(this._arrayOfHorizontalSlices.length);
        };

        Sculpt2.prototype.takeVerticalImageSlice = function () {
            var _this = this;
            this._cursorTracker = 0;
            this._cursorLvlTracker = 0;

            for (var i = 0; i < this._voxelWorld.getStride(); i++) {
                var complete = false;
                var linesToDrawNear = [];
                var linesToDrawFar = [];

                while (!complete) {
                    if (this._cursorTracker % this._voxelWorld.getStride() === 0 && this._cursorTracker != 0) {
                        this.info.CursorPos(this._cursorTracker);
                        var n = this._canvasRender.drawCanvas('near - vertSlice ' + i, linesToDrawNear, new THREE.Vector3(-1 * this._worldSize / 2, -1 * this._worldSize / 2, 0), 1, this._renderGridOnSliceImages, this._worldSize, this._blockSize);
                        var f = this._canvasRender.drawCanvas('far - vertSlice ' + i, linesToDrawFar, new THREE.Vector3(-1 * this._worldSize / 2, -1 * this._worldSize / 2, 0), 1, this._renderGridOnSliceImages, this._worldSize, this._blockSize);
                        this._arrayOfVerticalSlices.push({ near: n, far: f });
                        linesToDrawNear = [];
                        linesToDrawFar = [];
                        this._cursorTracker++;
                        break;
                    } else {
                        var directionNear = [];
                        var originNear = [];

                        var directFar = [];
                        var originFar = [];

                        var voxelRef = this._voxelWorld.getLevel(0).getVoxel(this._cursorTracker);

                        originNear.push(voxelRef.getVerts().p0.getPosition(), voxelRef.getVerts().p1.getPosition());
                        directionNear.push(Geometry.GeometryHelper.vectorBminusVectorA(voxelRef.getVerts().p4.getPosition(), voxelRef.getVerts().p0.getPosition()));
                        directionNear.push(Geometry.GeometryHelper.vectorBminusVectorA(voxelRef.getVerts().p5.getPosition(), voxelRef.getVerts().p1.getPosition()));

                        originFar.push(voxelRef.getVerts().p2.getPosition(), voxelRef.getVerts().p3.getPosition());
                        directFar.push(Geometry.GeometryHelper.vectorBminusVectorA(voxelRef.getVerts().p6.getPosition(), voxelRef.getVerts().p2.getPosition()));
                        directFar.push(Geometry.GeometryHelper.vectorBminusVectorA(voxelRef.getVerts().p7.getPosition(), voxelRef.getVerts().p3.getPosition()));

                        var lines = Voxel.VoxelWorld.projectIntoVolume(directionNear, originNear, [this._controlSphere, this._controlSphereInner]);
                        lines.forEach(function (elm) {
                            linesToDrawNear.push(elm);

                            _this._verticalLines.addUnique(new Geometry.Line(elm.start, elm.end));
                        });

                        lines = Voxel.VoxelWorld.projectIntoVolume(directFar, originFar, [this._controlSphere, this._controlSphereInner]);
                        lines.forEach(function (elm) {
                            linesToDrawFar.push(elm);

                            _this._verticalLines.addUnique(new Geometry.Line(elm.start, elm.end));
                        });

                        this._cursorTracker++;
                    }
                }
            }

            console.log(this._arrayOfVerticalSlices.length);
            this._cursorLvlTracker = 0;
            this._cursorTracker = -1;

            this.info.CursorPos(this._cursorTracker);
            this.info.CursorLvl(this._cursorTracker);
            //return false;
        };

        Sculpt2.prototype.drawAllSampledData = function () {
            // for debugging purposes will render the lines to scene to see what the issue is
            var iter = this._horizontalLines.createInterator();

            while (iter.hasNext()) {
                var elm = iter.next();

                var lineGeo = new THREE.Geometry();
                lineGeo.vertices.push(elm.start, elm.end);

                lineGeo.computeLineDistances();

                var lineMaterial = new THREE.LineBasicMaterial({ color: 0xCC0000 });
                var line = new THREE.Line(lineGeo, lineMaterial);

                this._arrayOfVisualRaylines.push(line);
                this._scene.add(line);
            }

            iter = this._verticalLines.createInterator();

            while (iter.hasNext()) {
                var elm = iter.next();
                var lineGeo = new THREE.Geometry();
                lineGeo.vertices.push(elm.start, elm.end);

                lineGeo.computeLineDistances();

                var lineMaterial = new THREE.LineBasicMaterial({ color: 0xCC0000 });
                var line = new THREE.Line(lineGeo, lineMaterial);

                this._arrayOfVisualRaylines.push(line);
                this._scene.add(line);
            }

            this._canvasRender.drawAllImages(this._arrayOfHorizontalSlices, this._arrayOfVerticalSlices, this._horizontalImagesDivID, this._verticalImagesDivID);
        };
        return Sculpt2;
    })();
    Implementation.Sculpt2 = Sculpt2;
})(Implementation || (Implementation = {}));
//# sourceMappingURL=Sculpting2.js.map
