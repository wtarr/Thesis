/**
 * Created by wtarrant on 28/02/14.
 */

/// <reference path="../lib/knockout.d.ts" />
/// <reference path="../lib/underscore.d.ts" />
/// <reference path="Utils2.ts" />

declare module THREE { export var OrbitControls }
declare var Detector: any;
declare var Stats : any;
//declare module THREE { export var Octree }


module Implementation
{
    export interface ICommand
    {
        execute() : void;
    }

    export class ToggleGridCommand implements ICommand
    {
        private _sculpt:Sculpt2;

        constructor(sculpt : Sculpt2)
        {
            this._sculpt = sculpt;
        }

        public execute() : void
        {
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

    export class FillSphereWithFacesCommand implements ICommand {
        private _sculpt:Sculpt2;

        constructor(sculpt:Sculpt2) {
            this._sculpt = sculpt;
        }

        public execute():void {
            this._sculpt.fillMesh();
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

    export class Button
    {
        public Id: string;
        public Name: string;
        public Command : ICommand;

        constructor(id: string, name: string, command : ICommand)
        {
            this.Id = id;
            this.Name = name;
            this.Command = command;
        }
    }

    export class GUI
    {
        public buttons : any;

        constructor()
        {
            this.buttons = ko.observableArray();
            ko.applyBindings(this);
        }

        public onButtonClick(b:Button):void {
            b.Command.execute();
        }

        public addButton(button : Button ) : void
        {
            this.buttons.push(button);
            console.log();
        }



    }

    export class Sculpt2
    {
        public static GlobalControlsEnabled:boolean;
        public static Worker:any;
        public static ControlSphere:Controller.ControlSphere;
        private _gui : GUI;
        private _renderingElement : any;
        private _camera:THREE.PerspectiveCamera;
        private _cameraControls : any;
        private _renderer: THREE.WebGLRenderer;
        private _scene : THREE.Scene;
        private _clock : THREE.Clock;
        private _stats : any;
        public _screenWidth:number;
        public _screenHeight:number;
        private _nodes : Voxel.Collection<Node>;
        private _plane : THREE.Mesh;
        private _grid : Voxel.Grid3D;
        private _worldSize : number = 400;
        private _blockSize : number = 100;
        private _gridColor : number = 0x25F500;
        private _voxelWorld:Voxel.VoxelWorld;
        private _controllerSphereSegments:number;
        private _controllerSphereRadius:number;
        private _sphereSkeleton:Controller.SphereSkeleton;
        private _nodeSize:number;
        private _nodeVelocity:THREE.Vector3;
        private _nodeMass:number;
        private _project:THREE.Projector;
        private _offset:THREE.Vector3;
        private _SELECTED:any;
        private _INTERSECTED:any;


        constructor(gui : GUI)
        {
            this._gui = gui;

            this.initialise();
            this.animate();
        }


        private initialise() : void
        {

            Sculpt2.Worker = new Worker('../logic/worker2.js');
            Sculpt2.Worker.addEventListener('message', this.onMessageReceived, false);
            Sculpt2.GlobalControlsEnabled = true;
            this._renderingElement = document.getElementById('webgl');
            this._stats = new Stats();
            this._stats.setMode(0);
            document.getElementById('fps').appendChild(this._stats.domElement);

            var divWH = Helper.jqhelper.getScreenWH('#webgl');
            this._screenWidth = divWH[0];
            this._screenHeight = divWH[1];

            if(!Detector.webgl) Detector.addGetWebGLMessage();

            this._scene = new THREE.Scene();

            this.initialiseCamera();
            this.initialiseLighting();

            var pointColor = '#ffffff';
            this.initialiseSpotLighting(pointColor, 1000);

            this._renderer = new THREE.WebGLRenderer();
            this._renderer.setClearColor(new THREE.Color(0xEEEfff), 1);
            this._renderer.setSize(this._screenWidth, this._screenHeight);

            this._plane = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000, 8, 8), new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.25, transparent: true, wireframe: true }));
            this._plane.visible = false;
            this._scene.add(this._plane);

            var gridCreator = new Voxel.GridCreator(this._worldSize, this._blockSize, this._gridColor);
            var gridGeometryH = gridCreator.buildAxisAligned2DGrids();
            var gridGeometryV = gridCreator.buildAxisAligned2DGrids();
            this._grid = gridCreator.build3DGrid(gridGeometryH, gridGeometryV);
            this._scene.add(this._grid.liH);
            this._scene.add(this._grid.liV);

            this._voxelWorld = new Voxel.VoxelWorld(this._worldSize, this._blockSize);
            this._controllerSphereRadius = 180;
            this._controllerSphereSegments = 15;
            this._nodeMass = 5;
            this._nodeVelocity = new THREE.Vector3();
            this._nodeSize = 5;

            document.addEventListener('keydown', this.onDocumentKeyDown, false);

            this._renderer.domElement.addEventListener('mousedown', this.nodeDrag.bind(this), false);
            this._renderer.domElement.addEventListener('mouseup', this.nodeRelease.bind(this), false);
            this._renderer.domElement.addEventListener('mousemove', this.onNodeSelect.bind(this), false);

            this._gui.addButton(new Button('toggleMesh', 'Toggle Grid', new ToggleGridCommand(this)));
            this._gui.addButton(new Button('procSphere', 'Control Sphere', new GenerateProcedurallyGeneratedSphereCommand(this)));
            /// this._gui.addButton(new Button('createSprings', 'Create Springs', new CreateSpringBetweenNodesCommand(this)));
            /// this._gui.addButton(new Button('fillMesh', 'Fill Mesh', new FillSphereWithFacesCommand(this)));
            this._gui.addButton(new Button('togVis', 'Hide All', new ToggleControlVisibility(this)));
            this._gui.addButton(new Button('marchingCube', 'Marching Cube', new MarchingCubeCommand(this)));

            var axisHelper = new THREE.AxisHelper(20);
            axisHelper.position = new THREE.Vector3(-1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20);
            this._scene.add(axisHelper);

            Helper.jqhelper.appendToScene('#webgl', this._renderer);

            Implementation.Sculpt2.ControlSphere = new Controller.ControlSphere(this._controllerSphereSegments, this._controllerSphereRadius, this._scene, this._nodeSize, this._nodeVelocity, this._nodeMass);

            this.draw();


        }

        private initialiseCamera() : void
        {
            this._camera = new THREE.PerspectiveCamera(45, this._screenWidth / this._screenHeight, 0.1, 1500);
            this._camera.position = new THREE.Vector3(0, 200, 600);
            this._camera.lookAt(this._scene.position);
            this._cameraControls = new THREE.OrbitControls(this._camera);
            this._cameraControls.domElement = this._renderingElement;
            this._scene.add(this._camera);

        }

        private initialiseLighting() : void
        {
            // TODO
        }

        private initialiseSpotLighting(color : string, distance : number)
        {
            // TODO
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

        private update()
        {
            if (Sculpt2.GlobalControlsEnabled) {
                this._cameraControls.enabled = true;
                this._cameraControls.update();
            }
            else {
                this._cameraControls.enabled = false;
            }
        }

        private draw()
        {
            this._renderer.render(this._scene, this._camera);
        }

        private onDocumentMouseDown(e:UIEvent):void {
            this.nodeDrag(e);
        }

        private onDocumentMouseUp(e:UIEvent):void {
            this.nodeRelease(e);
        }

        private onNodeSelect(e:UIEvent):void {
            e.preventDefault();

            var clientXRel = e.clientX - $('#webgl').offset().left;
            var clientYRel = e.clientY - $('#webgl').offset().top;

            var vector = new THREE.Vector3(( clientXRel / this._screenWidth) * 2 - 1, -( clientYRel / this._screenHeight ) * 2 + 1, 0.5);

            //var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
            this._project = new THREE.Projector();
            this._project.unprojectVector(vector, this._camera);

            var raycaster = new THREE.Raycaster(this._camera.position, vector.sub(this._camera.position).normalize());

            if (this._SELECTED) {
                var intersects = raycaster.intersectObject(this._plane);
                try {
                    this._SELECTED.position.copy(intersects[ 0 ].point.sub(this._offset));
                }
                catch (e) {
                    console.log("Cannot read property of undefined");
                }
                return;
            }

            var res = Implementation.Sculpt2.ControlSphere.getOctreeForNodes().search(raycaster.ray.origin, raycaster.ray.ray, true, raycaster.ray.direction);
            var intersects = raycaster.intersectOctreeObjects(res);

            if (intersects.length > 0) {
                if (this._INTERSECTED != intersects[ 0 ].object) {
                    if (this._INTERSECTED) this._INTERSECTED.material.color.setHex(this._INTERSECTED.currentHex);

                    this._INTERSECTED = intersects[ 0 ].object;

                    this._INTERSECTED.currentHex = this._INTERSECTED.material.color.getHex();

                    this._plane.position.copy(this._INTERSECTED.position);
                    this._plane.lookAt(this._camera.position);

                }
            }
        }

        private nodeDrag(e : Event ) : void
        {
            event.preventDefault();

            var clientXRel = e.pageX - $('#webgl').offset().left;
            var clientYRel = e.pageY - $('#webgl').offset().top;

            var vector = new THREE.Vector3(( clientXRel / this._screenWidth) * 2 - 1, -( clientYRel / this._screenHeight ) * 2 + 1, 0.5);

            //var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
            this._project = new THREE.Projector();
            this._project.unprojectVector(vector, this._camera);

            var raycaster = new THREE.Raycaster(this._camera.position, vector.sub(this._camera.position).normalize());
            var res = Implementation.Sculpt2.ControlSphere.getOctreeForNodes().search(raycaster.ray.origin, raycaster.ray.far, true, raycaster.ray.direction);

            var intersects = raycaster.intersectOctreeObjects(res);

            if (intersects.length > 0) {

                this._cameraControls.enabled = false;

                this._SELECTED = intersects[ 0 ].object;

                var intersects = raycaster.intersectObject(this._plane);
                offset.copy(intersects[ 0 ].point).sub(this._plane.position);

            }
        }

        private nodeRelease(e : Event ) : void
        {
            event.preventDefault();

            this._cameraControls.enabled = true;

            if (this._INTERSECTED) {
                this._plane.position.copy(this._INTERSECTED.position);

                this._SELECTED = null;
            }
        }

        private onDocumentKeyDown( e : Event ) : void
        {
            // TODO
        }

        public generateShape() : void
        {
            // TODO
        }

        public updateColor( val : any ) : void
        {
            // TODO
        }

        public toggleGrid( ) : void
        {
            if (this._grid.liH.visible) {
                this._grid.liH.visible = false;
                this._grid.liV.visible = false;
            }
            else {
                this._grid.liH.visible = true;
                this._grid.liV.visible = true;
            }
        }

        public toggleWireFrame( ) : void
        {
            // TODO
        }

        public toggleMesh() : void
        {
            // TODO
        }

        public procedurallyGenerateSphere() : void
        {
            // TODO
            console.log(this);
            Implementation.Sculpt2.ControlSphere.generateSphere();
            //this._sphereSkeleton = controlGenerator.generateNodePoints();
        }

        public joinNodes() : void
        {
            // TODO
        }

        private connectNode( node : Node, v1 : THREE.Vector3, v2 : THREE.Vector3) : void
        {
            // TODO
        }

        public fillMesh():void {
            // TODO
        }

        private voxelEvalComplex(voxRef : Voxel.VoxelState2) : void
        {
            // TODO
        }

        private onMessageReceived(e:MessageEvent) {
            // TODO
            if (e.data.commandReturn === 'calculateMeshFacePositions') {

                console.log(this);
                if (Implementation.Sculpt2.ControlSphere) {
                    Implementation.Sculpt2.ControlSphere.addFaces(e.data.faces);
                }

            }

        }


    }

}