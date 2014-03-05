/**
 * Created by wtarrant on 28/02/14.
 */

/// <reference path="../lib/knockout.d.ts" />
/// <reference path="../lib/underscore.d.ts" />
/// <reference path="Utils2.ts" />

declare module THREE {
    export var OrbitControls
}

declare var Detector:any;
declare var Stats:any;
//declare module THREE { export var Octree }


module Implementation {
    export interface ICommand {
        execute() : void;
    }

    export class ToggleGridCommand implements ICommand {
        private _sculpt:Sculpt2;

        constructor(sculpt:Sculpt2) {
            this._sculpt = sculpt;
        }

        public execute():void {
            this._sculpt.toggleGrid();
        }
    }


    export class GenerateProcedurallyGeneratedSphereCommand implements ICommand {
        private _sculpt:Sculpt2;

        constructor(sculpt:Sculpt2) {
            this._sculpt = sculpt;
        }

        public execute():void {
            this._sculpt.procedurallyGenerateSphere();
        }
    }

    export class CreateSpringBetweenNodesCommand implements ICommand {
        private _sculpt:Sculpt2;

        constructor(sculpt:Sculpt2) {
            this._sculpt = sculpt;
        }

        public execute():void {
            this._sculpt.joinNodes();
        }
    }

    export class EvalVia2DSliceAnalysis implements ICommand {
        private _sculpt:Sculpt2;

        constructor(sculpt:Sculpt2) {
            this._sculpt = sculpt;
        }

        public execute():void {
            this._sculpt.EvalHorizontal2DSlice();
        }
    }

//    export class FillSphereWithFacesCommand implements ICommand {
//        private _sculpt:Sculpt2;
//
//        constructor(sculpt:Sculpt2) {
//            this._sculpt = sculpt;
//        }
//
//        public execute():void {
//            this._sculpt.fillMesh();
//        }
//    }

    export class EvaluateVoxelAndRenderBasedOnGeometrySamplingCommand implements ICommand {
        private _sculpt:Sculpt2;

        constructor(sculpt:Sculpt2) {
            this._sculpt = sculpt;
        }

        public execute():void {
            this._sculpt.voxelEvalComplex();
        }
    }

    export class MarchingCubeRenderOfSetSphereCommand implements ICommand {
        private _sculpt:Sculpt2;

        constructor(sculpt:Sculpt2) {
            this._sculpt = sculpt;
        }

        public execute():void {
            this._sculpt.renderASphereWithMarchingCubeAlgorithm();
        }
    }

    export class ToggleControlVisibility {
        private _sculpt:Sculpt2;

        constructor(sculpt:Sculpt2) {
            this._sculpt = sculpt;
        }

        public execute():void {
            this._sculpt.toggleMesh();
        }
    }

    export class MarchingCubeCommand {
        private _sculpt:Sculpt2;

        constructor(sculpt:Sculpt2) {
            this._sculpt = sculpt;
        }

        public execute():void {
            this._sculpt.generateShape();
        }
    }

    export class Button {
        public Id:string;
        public Name:string;
        public Command:ICommand;

        constructor(id:string, name:string, command:ICommand) {
            this.Id = id;
            this.Name = name;
            this.Command = command;
        }
    }

    export class GUI {
        public buttons:any;

        constructor() {
            this.buttons = ko.observableArray();
            ko.applyBindings(this);
        }

        public onButtonClick(b:Button):void {
            b.Command.execute();
        }

        public addButton(button:Button):void {
            this.buttons.push(button);
            console.log();
        }


    }

    export class Sculpt2 {
        public static GlobalControlsEnabled:boolean;
        public static Worker:any;
        private _controlSphere:Controller.ControlSphere;
        private _gui:GUI;
        private _renderingElement:any;
        private _camera:THREE.PerspectiveCamera;
        private _cameraControls:any;
        private _renderer:THREE.WebGLRenderer;
        private _scene:THREE.Scene;
        private _clock:THREE.Clock;
        private _stats:any;
        public _screenWidth:number;
        public _screenHeight:number;
        private _plane:THREE.Mesh;
        private _grid:Geometry.Grid3D;
        private _worldSize:number = 400;
        private _blockSize:number = 50;
        private _gridColor:number = 0x25F500;
        private _voxelWorld:Voxel.VoxelWorld;
        private _controllerSphereSegments:number;
        private _controllerSphereRadius:number;
        private _nodeSize:number;
        private _nodeVelocity:THREE.Vector3;
        private _nodeMass:number;
        private _project:THREE.Projector;
        private _offset:THREE.Vector3;
        private _SELECTED:any;
        private _INTERSECTED:any;
        private _springs:Array<Geometry.Spring>;
        private _cursorTracker:number;
        private _cursorLvlTracker:number;
        private _cursorDebugger:THREE.Mesh;
        private _demoSphereCenter1:THREE.Vector3 = new THREE.Vector3(0, 0, 0);
        private _runDemo:boolean = false;
        private _demoSphereRadius:number = 90;
        private _demoSphereAdd:number = 40;
        private _phongMaterial:THREE.MeshPhongMaterial;


        constructor(gui:GUI) {
            this._gui = gui;

            this.initialise();
            this.animate();
        }


        private initialise():void {

            this._clock = new THREE.Clock();
            Sculpt2.Worker = new Worker('../src/worker2.js');
            Sculpt2.Worker.addEventListener('message', this.onMessageReceived.bind(this), false); // listen for callbacks

            Sculpt2.GlobalControlsEnabled = true;
            this._renderingElement = document.getElementById('webgl');
            this._stats = new Stats();
            this._stats.setMode(0);
            document.getElementById('fps').appendChild(this._stats.domElement);

            var divWH = Helper.jqhelper.getScreenWH('#webgl');
            this._screenWidth = divWH[0];
            this._screenHeight = divWH[1];

            if (!Detector.webgl) Detector.addGetWebGLMessage();

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
            this._scene.add(this._grid.liH);
            this._scene.add(this._grid.liV);

            this._voxelWorld = new Voxel.VoxelWorld(this._worldSize, this._blockSize, this._scene);
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
            this._gui.addButton(new Button('procSphere', 'Controller Object Sphere', new GenerateProcedurallyGeneratedSphereCommand(this)));
            this._gui.addButton(new Button('createSprings', 'Create Springs', new CreateSpringBetweenNodesCommand(this)));
            /// this._gui.addButton(new Button('fillMesh', 'Fill Mesh', new FillSphereWithFacesCommand(this)));
            this._gui.addButton(new Button('togVis', 'Hide All', new ToggleControlVisibility(this)));
            //this._gui.addButton(new Button('marchingCube', 'Marching Cube', new MarchingCubeCommand(this)));
            this._gui.addButton(new Button('Sphere', 'Basic Sphere', new MarchingCubeRenderOfSetSphereCommand(this)));
            //this._gui.addButton(new Button('Eval', 'Geo Sample render', new EvalVia2DSliceAnalysis(this)));


            var axisHelper = new THREE.AxisHelper(20);
            axisHelper.position = new THREE.Vector3(-1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20);
            this._scene.add(axisHelper);

            Helper.jqhelper.appendToScene('#webgl', this._renderer);

            this._controlSphere = new Controller.ControlSphere(this._controllerSphereSegments, this._controllerSphereRadius, this._scene, this._nodeSize, this._nodeVelocity, this._nodeMass);

            this._offset = new THREE.Vector3();

            this._cursorTracker = -1;
            this._cursorLvlTracker = 0;

            this._phongMaterial = new THREE.MeshPhongMaterial();
            this._phongMaterial.specular = new THREE.Color(0X9FCFF);
            this._phongMaterial.color = new THREE.Color(0x7375C7);
            this._phongMaterial.emissive = new THREE.Color(0X006063);
            this._phongMaterial.shininess = 10;
            this._phongMaterial.side = THREE.DoubleSide;

            this.draw();


        }

        private initialiseCamera():void {
            this._camera = new THREE.PerspectiveCamera(45, this._screenWidth / this._screenHeight, 0.1, 1500);
            this._camera.position = new THREE.Vector3(0, 200, 600);
            this._camera.lookAt(this._scene.position);
            this._cameraControls = new THREE.OrbitControls(this._camera);
            this._cameraControls.domElement = this._renderingElement;
            this._scene.add(this._camera);

        }

        private initialiseLighting():void {
            // TODO
            var amb = new THREE.AmbientLight();
            amb.color = new THREE.Color(0X0c0c0c);
            this._scene.add(amb);

            var directionalLight = new THREE.DirectionalLight(0xffffff);
            directionalLight.position.set(1, 1, 1).normalize();
            this._scene.add(directionalLight);

        }

        private initialiseSpotLighting(distance:number, pointcolor:number):void {
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
        }

        public updateGridColor(val:string):void {
            this._gridColor = parseInt(("0x" + val), 16);
            this._grid.liH.material.color.setHex(this._gridColor);
            this._grid.liV.material.color.setHex(this._gridColor);
        }

        public animate():void {
            window.requestAnimationFrame(this.animate.bind(this));
            this.update();
            this.draw();
            this._stats.update();

            // TODO
            // Stuff that needs updating

        }

        private update() {
            var delta = this._clock.getDelta();

            if (Sculpt2.GlobalControlsEnabled) {
                this._cameraControls.enabled = true;
                this._cameraControls.update();
            }
            else {
                this._cameraControls.enabled = false;
            }

            for (var i = 0; i < this._springs.length; i++) {
                this._springs[i].update(delta);
            }

            this._controlSphere.update();
        }

        private draw() {
            this._renderer.render(this._scene, this._camera);
        }


        private onNodeSelect(e:MouseEvent):void {
            e.preventDefault();

            var clientXRel = e.x - $('#webgl').offset().left;
            var clientYRel = e.y - $('#webgl').offset().top;

            var vector = new THREE.Vector3(( clientXRel / this._screenWidth) * 2 - 1, -( clientYRel / this._screenHeight ) * 2 + 1, 0.5);

            //var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
            this._project = new THREE.Projector();
            this._project.unprojectVector(vector, this._camera);

            var raycaster = new THREE.Raycaster(this._camera.position, vector.sub(this._camera.position).normalize(), 0, Infinity);

            if (this._SELECTED) {
                var intersects1 = raycaster.intersectObject(this._plane);
                try {
                    this._SELECTED.position.copy(intersects1[ 0 ].point.sub(this._offset));
                }
                catch (e) {
                    console.log("Cannot read property of undefined");
                }
                return;
            }

            var oct = this._controlSphere.getOctreeForNodes();
            var res = oct.search(raycaster.ray.origin, raycaster.far, true, raycaster.ray.direction);
            var intersects = raycaster.intersectOctreeObjects(res);

            if (intersects.length > 0) {
                if (this._INTERSECTED != intersects[ 0 ].object) {
                    if (this._INTERSECTED) this._INTERSECTED.material.color.setHex(this._INTERSECTED.currentHex);

                    this._INTERSECTED = intersects[ 0 ].object;
                    //console.log(this._INTERSECTED.id);

                    this._INTERSECTED.currentHex = this._INTERSECTED.material.color.getHex();

                    this._plane.position.copy(this._INTERSECTED.position);
                    this._plane.lookAt(this._camera.position);

                }
            }
        }

        private nodeDrag(e:MouseEvent):void {
            event.preventDefault();

            var clientXRel = e.x - $('#webgl').offset().left;
            var clientYRel = e.y - $('#webgl').offset().top;

            var vector = new THREE.Vector3(( clientXRel / this._screenWidth) * 2 - 1, -( clientYRel / this._screenHeight ) * 2 + 1, 0.5);

            //var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
            this._project = new THREE.Projector();
            this._project.unprojectVector(vector, this._camera);

            var raycaster = new THREE.Raycaster(this._camera.position, vector.sub(this._camera.position).normalize(), 0, Infinity);


            var res = this._controlSphere.getOctreeForNodes().search(raycaster.ray.origin, raycaster.far, true, raycaster.ray.direction);

            var intersects = raycaster.intersectOctreeObjects(res);

            if (intersects.length > 0) {

                this._cameraControls.enabled = false;

                this._SELECTED = intersects[ 0 ].object;

                var intersectsP = raycaster.intersectObject(this._plane);
                this._offset.copy(intersectsP[ 0 ].point).sub(this._plane.position);

            }
        }

        private nodeRelease(e:MouseEvent):void {
            event.preventDefault();

            this._cameraControls.enabled = true;

            if (this._INTERSECTED) {
                this._plane.position.copy(this._INTERSECTED.position);

                this._SELECTED = null;
            }
        }

        public onDocumentKeyDown(e:KeyboardEvent):void {

            e.preventDefault();

            if (e.keyCode === 13) {

                this._cursorTracker++;

                if (!this._cursorDebugger) {
                    var cubeGeo = new THREE.CubeGeometry(this._blockSize, this._blockSize, this._blockSize);
                    var cubeMat = new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true});
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

                this.imageSlice(this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker));


            }
        }


        public generateShape():void {
            // TODO
        }

        public updateColor(val:any):void {
            // TODO
        }

        public toggleGrid():void {
            if (this._grid.liH.visible) {
                this._grid.liH.visible = false;
                this._grid.liV.visible = false;
            }
            else {
                this._grid.liH.visible = true;
                this._grid.liV.visible = true;
            }
        }

        public toggleWireFrame():void {
            // TODO
        }

        public toggleMesh():void {

            this._controlSphere.toggleVisibility();

        }

        public procedurallyGenerateSphere():void {
            // TODO
            //console.log(this);
            this._controlSphere.generateSphere();
            //this._sphereSkeleton = controlGenerator.generateNodePoints();
        }


        public joinNodes():void {

            // TODO : Move this to controller sphere
            var match;
            for (var x = 0; x < this._controlSphere.getNodes().length; x++) {
                var node = this._controlSphere.getNodes()[x];
                match = _.filter(this._controlSphere.getSphereSkeleton().lines, function (line) {
                    var lin = <THREE.Line>line;
                    var v1 = <Geometry.Vector3Extended>lin.geometry.vertices[0];
                    var v2 = <Geometry.Vector3Extended>lin.geometry.vertices[1];
                    return (v1.equalsWithinTolerence(node.getNodePosition(), 2)) || (v2.equalsWithinTolerence(node.getNodePosition(), 2));
                });
                for (var i = 0; i < match.length; i++) {
                    var v1 = <Geometry.Vector3Extended>match[i].geometry.vertices[0];
                    var v2 = <Geometry.Vector3Extended>match[i].geometry.vertices[1];
                    if (v1.equalsWithinTolerence(node.getNodePosition(), 5)) {
                        this.connectNode(node, v2, v1);
                    }
                    else if (v2.equalsWithinTolerence(node.getNodePosition(), 5)) {
                        this.connectNode(node, v1, v2);
                    }
                }
            }
        }

        public connectNode(node:Geometry.Node, v1:THREE.Vector3, v2:THREE.Vector3):void {
            // TODO : Move this to controller sphere
            var dir = new THREE.Vector3();
            dir.subVectors(v1, v2);

            var ray = new THREE.Raycaster(node.getNodePosition(), dir.normalize(), 0, Infinity);
            var res = this._controlSphere.getOctreeForNodes().search(ray.ray.origin, ray.far, true, ray.ray.direction);
            var intersections = ray.intersectOctreeObjects(res);

            if (intersections.length > 0) {
                var o = <Geometry.Node>intersections[0].object;
                var contains = false;
                for (var i = 0; i < node.getNeigbourhoodNodes().length(); i++) {
                    var n = <Geometry.Node>node.getNeigbourhoodNodes().get(i);

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
        }

        private onMessageReceived(e:MessageEvent) {
            // TODO
            if (e.data.commandReturn === 'calculateMeshFacePositions') {

                ///console.log(this);
                if (this._controlSphere) {
                    this._controlSphere.addFaces(e.data.faces);
                }

            }

        }

        public renderASphereWithMarchingCubeAlgorithm():void {

            //this._runDemo = (this._runDemo) ? false : true;




                var complete = false;
                var currentVoxel = 0;
                var currentLvl = 0;
                var voxelPerLevel = this._voxelWorld.getNumberOfVoxelsPerLevel();
                var levels = this._voxelWorld.getNumberOfLevelsInVoxelWorld();

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

                    var lvl = this._voxelWorld.getLevel(0);
                    var vox = lvl.getVoxel(0);
                    var voxelRef = <Voxel.VoxelState2>this._voxelWorld.getLevel(currentLvl).getVoxel(currentVoxel);

                    voxelRef.getVerts().p0.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                    voxelRef.getVerts().p1.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                    voxelRef.getVerts().p2.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                    voxelRef.getVerts().p3.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                    voxelRef.getVerts().p4.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                    voxelRef.getVerts().p5.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                    voxelRef.getVerts().p6.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                    voxelRef.getVerts().p7.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);

                    var mesh = <THREE.Mesh>Voxel.MarchingCubeRendering.MarchingCube(voxelRef, this._demoSphereRadius, this._phongMaterial);
                    voxelRef.setMesh(this._scene, mesh);

                    currentVoxel++;
                }


                if (this._demoSphereCenter1.x > this._worldSize / 2) {
                    this._demoSphereAdd *= -1;
                }

                if (this._demoSphereCenter1.x < (this._worldSize / 2) * -1) {
                    this._demoSphereAdd *= -1;
                }

                this._demoSphereCenter1.x += this._demoSphereAdd;


        }

        public voxelEvalComplex():void {
            var complete = false;
            var currentVoxel = 0;
            var currentLvl = 0;
            var voxelPerLevel = this._voxelWorld.getNumberOfVoxelsPerLevel();
            var levels = this._voxelWorld.getNumberOfLevelsInVoxelWorld();

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

                var lvl = this._voxelWorld.getLevel(0);
                var vox = lvl.getVoxel(0);
                var voxelRef = <Voxel.VoxelState2>this._voxelWorld.getLevel(currentLvl).getVoxel(currentVoxel);

                var allCorners = [];
                allCorners.push(
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p0,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p1,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p2,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p3,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p4,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p5,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p6,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p7
                );

                var ray;
                var result;
                var intersections;

                for (var a = 0; a < allCorners.length; a++) // each corner
                {
                    var points = [];
                    var origin = allCorners[a].getPosition();

                    for (var b = 0; b < allCorners[a].getConnectedTo().length; b++) // each of the corners adjacency's (b)
                    {
                        var direction = new THREE.Vector3();
                        direction.subVectors(allCorners[a].getConnectedTo()[b].getPosition(), origin);
                        var length = direction.length();

                        ray = new THREE.Raycaster(origin, direction.normalize(), 0, this._blockSize);
                        result = this._controlSphere.getOctreeForFaces().search(ray.ray.origin, ray.far, true, ray.ray.direction);
                        intersections = ray.intersectOctreeObjects(result);

                        if (intersections.length > 0) {
                            var object = <Geometry.MeshExtended>intersections[0].object;
                            var face = object.getNormal();
                            var facing = direction.dot(face);
                            var inside;

                            if (facing < 0) {
                                inside = true;
                            }
                            else {
                                inside = false;
                            }

                            points.push({ point: intersections[0].point, inside: inside });
                        }
                    }

                    var len = points.length;
                    switch (len) {
                        case 0:
                            allCorners[a].setValue(0); // This is just plain wrong WRONG!!!
                            break;
                        case 1:
                            var isInside = points[0].inside === true ? -1 : 1;
                            allCorners[a].setValue(Geometry.GeometryHelper.calculateDistanceBetweenTwoVector3(origin, points[0].point) * isInside);
                            break;
                        case 2:
                            var isInside = points[0].inside === true ? -1 : 1;
                            allCorners[a].setValue(Geometry.GeometryHelper.calculateShortestDistanceFromPointToLine(origin, points[0].point, points[1].point) * isInside);
                            break;
                        case 3:
                            var isInside = points[0].inside === true ? -1 : 1;
                            var n = new THREE.Vector3();
                            n.crossVectors(points[1].point, points[0].point);
                            allCorners[a].setValue(Geometry.GeometryHelper.calculateShortestDistanceToPlane(origin, points[0].point, n) * isInside);

                    }

                }

                var mesh = <THREE.Mesh>Voxel.MarchingCubeRendering.MarchingCube(voxelRef, 1.5, this._phongMaterial);
                voxelRef.setMesh(this._scene, mesh);

                currentVoxel++;
            }

            console.log("Done");

        }

        public EvalHorizontal2DSlice():void {
            var complete = false;
            var currentVoxel = 0;
            var currentLvl = 0;
            var voxelPerLevel = this._voxelWorld.getNumberOfVoxelsPerLevel();
            var levels = this._voxelWorld.getNumberOfLevelsInVoxelWorld();
            var highest = 0;

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

                var lvl = this._voxelWorld.getLevel(0);
                var vox = lvl.getVoxel(0);
                var voxelRef = <Voxel.VoxelState2>this._voxelWorld.getLevel(currentLvl).getVoxel(currentVoxel);

                var allCorners = [];
                allCorners.push(
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p0,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p1,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p2,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p3,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p4,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p5,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p6,
                    <Voxel.VoxelCornerInfo>voxelRef.getVerts().p7
                );

                var ray;
                var result;
                var intersections;

                var dir = [];
                dir.push(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1));


                for (var a = 0; a < allCorners.length; a++) // each corner
                {
                    var origin = allCorners[a].getPosition();


                    // TODO work magic here !!!!
                    // Shoot fore, aft, port, starport

                    var shortest = 10000;

                    // foreach direction find shortest distance to POC
                    for (var b = 0; b < dir.length; b++) {
                        ray = new THREE.Raycaster(origin, dir[b], 0, Infinity);
                        result = this._controlSphere.getOctreeForFaces().search(ray.ray.origin, ray.far, true, ray.ray.direction);
                        intersections = ray.intersectOctreeObjects(result);
                        if (intersections.length > 0) {
                            var object = <Geometry.MeshExtended>intersections[0].object;
                            var face = object.getNormal();
                            var newDir = origin.add(dir[b]);
                            var facing = newDir.dot(face);
                            var inside;

                            if (facing < 0) {
                                inside = true;
                            }
                            else {
                                inside = false;
                            }

                            //if (!shortest) shortest = origin.distanceTo(intersections[0].point);
                            if (origin.distanceTo(intersections[0].point) < shortest && inside === true) shortest = origin.distanceTo(intersections[0].point);
                            if (origin.distanceTo(intersections[0].point) > highest) {
                                highest = origin.distanceTo(intersections[0].point);
                            }
                        }
                    }

                }

                for (var a = 0; a < allCorners.length; a++) // each corner
                {
                    if (allCorners[a].getValue() >= 10000) allCorners[a].setValue(highest);
                }

                var mesh = <THREE.Mesh>Voxel.MarchingCubeRendering.MarchingCube(voxelRef, 50, this._phongMaterial);
                voxelRef.setMesh(this._scene, mesh);

                currentVoxel++;
            }

            console.log("Done");

        }

        public imageSlice(voxel:Voxel.VoxelState2):void {
            // split top from bottom
            // sample btm and create image 0 1 2 3
            var ray;
            var result;
            var intersections;
            var btmCorners = [];
            var origin;
            var pointsToDraw = [];


            // Bottom
            btmCorners.push(
                <Voxel.VoxelCornerInfo>voxel.getVerts().p0,
                <Voxel.VoxelCornerInfo>voxel.getVerts().p1,
                <Voxel.VoxelCornerInfo>voxel.getVerts().p2,
                <Voxel.VoxelCornerInfo>voxel.getVerts().p3
            );

            for (var i = 0; i < btmCorners.length; i++) {
                origin = btmCorners[i].getPosition();

                for (var index = 0; index < btmCorners[i].getConnectedTo().length; index++) {
                    var connectedTo = btmCorners[i].getConnectedTo()[index];

                    var directionVector = new THREE.Vector3();
                    directionVector = Geometry.GeometryHelper.vectorBminusVectorA(connectedTo.getPosition(), origin);

                    //var direction = <THREE.Vector3>btmCorners[i].getConnectedTo()[index].getPosition();
                    // check that its not in the up direction before proceeding
                    if (directionVector.dot(new THREE.Vector3(0, 1, 0)) === 0) {


                        ray = new THREE.Raycaster(origin, directionVector.normalize(), 0, Infinity);
                        result = this._controlSphere.getOctreeForFaces().search(ray.ray.origin, ray.far, true, ray.ray.direction);
                        intersections = ray.intersectOctreeObjects(result);
                        if (intersections.length > 0) {
                            var object = <Geometry.MeshExtended>intersections[0].object;
                            var face = object.getNormal();
                            //var newDir = origin.add(dir[b]);
                            var facing = directionVector.dot(face);
                            var inside;

                            if (facing < 0) {

                                inside = true;
                                pointsToDraw.push(origin);
                                if (origin.distanceTo(intersections[0].point) <= this._blockSize) {
                                    pointsToDraw.push(intersections[0].point);
                                }
                            }
                            else {
                                inside = false;
                            }

                        }
                    }
                }
            }
            if (pointsToDraw.length > 0) {
                var canvas = <HTMLCanvasElement>document.getElementById('canvas');
                var ctx = canvas.getContext('2d');
                ctx.fillStyle = "black";

                for (var elems = 0; elems < pointsToDraw.length; elems++) {

                }


            }


            // sample top and create image 4 5 6 7


        }


    }

}