/**
 * Created by wtarrant on 28/02/14.
 */

/// <reference path="../lib/knockout.d.ts" />
/// <reference path="Utils2.ts" />

declare module THREE { export var OrbitControls }
declare var Detector: any;
declare var Stats : any;

module Implementation
{
    export interface ICommand
    {
        execute() : void;
    }

    export class ToggleGridCommand implements ICommand
    {
        private sculpt : Sculpt2;

        constructor(sculpt : Sculpt2)
        {
            this.sculpt = sculpt;
        }

        public execute() : void
        {
            this.sculpt.toggleGrid();
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

        public onButtonClick( e : Event ) : void
        {
            // TODO
            console.log();
        }

        public addButton(button : Button ) : void
        {
            this.buttons.push(button);
            console.log();
        }



    }

    export class Sculpt2
    {
        public static GlobalControlsEnabled: boolean = true;
        private _gui : GUI;
        private _renderingElement : any;
        private _camera : THREE.Camera;
        private _cameraControls : any;
        private _renderer: THREE.WebGLRenderer;
        private _scene : THREE.Scene;
        private _clock : THREE.Clock;
        private _stats : any;
        private _screenWidth : number;
        private _screenHeight : number;
        private _nodes : Voxel.Collection<Node>;
        private _plane : THREE.Mesh;
        private _grid : Voxel.Grid3D;
        private _worldSize : number = 400;
        private _blockSize : number = 100;
        private _gridColor : number = 0x25F500;
        private _voxelWorld : Voxel.VoxelWorld = new Voxel.VoxelWorld(this._worldSize, this._blockSize);

        constructor(gui : GUI)
        {
            this._gui = gui;

            this.initialise();
        }

        private initialise() : void
        {
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

            document.addEventListener('keydown', this.onDocumentKeyDown, false);
            this._renderer.domElement.addEventListener('mousedown', this.onDocumentMouseDown, false);
            this._renderer.domElement.addEventListener('mouseup', this.onDocumentMouseUp, false);
            this._renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove, false);

            var  b = new Button('toggleMesh', 'Toggle Grid', new ToggleGridCommand(this));
            this._gui.addButton(b);

            Helper.jqhelper.appendToScene('#webgl', this._renderer);



            this.draw();



        }

        private initialiseCamera() : void
        {
            // TODO
        }

        private initialiseLighting() : void
        {
            // TODO
        }

        private initialiseSpotLighting(color : string, distance : number)
        {
            // TODO
        }

        private animate() : void
        {
             // TODO
        }

        private update()
        {
            // TODO
        }

        private draw()
        {
            // TODO
        }

        private onDocumentMouseMove(e : Event) : void
        {
        // TODO
        }

        private onDocumentMouseDown(e : Event) : void
        {
        // TODO
        }

        private onDocumentMouseUp(e : Event) : void
        {
            // TODO
        }

        private onNodeSelect(e : Event ) : void
        {
            // TODO
        }

        private nodeDrag(e : Event ) : void
        {
            // TODO
        }

        private nodeRelease(e : Event ) : void
        {
            // TODO
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
            // TODO
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
        }

        public joinNodes() : void
        {
            // TODO
        }

        private connectNode( node : Node, v1 : THREE.Vector3, v2 : THREE.Vector3) : void
        {
            // TODO
        }

        private addMesh()
        {
            // TODO
        }

        private voxelEvalComplex(voxRef : Voxel.VoxelState2) : void
        {
            // TODO
        }

        private draw() : void
        {
            this._renderer.render(this._scene, this._camera);
        }

    }

}