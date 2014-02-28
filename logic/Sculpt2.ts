/**
 * Created by wtarrant on 28/02/14.
 */

/// <reference path="../lib/knockout.d.ts" />
/// <reference path="Utils2.ts" />

declare module THREE { export var OrbitControls }
declare var Stats : any;

module Implementation
{
    export class Button
    {
        private _id : string;
        private _name: string;
        private _command : any;

        constructor(id: string, name: string, command : any)
        {
            this._id = id;
            this._name = name;
            this._command = command;
        }

        public getId() : string
        {
            return this._id;
        }

        public getName() : string
        {
            return this._name;
        }

    }

    export class GUI
    {
        public buttons : any;

        constructor()
        {
            this.buttons = ko.observableArray();
        }

        public onButtonClick( e : Event ) : void
        {
            // TODO
        }

        public addButton(button : Button ) : void
        {
            // TODO
        }

    }

    class Sculpt2
    {
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
        //private


        constructor(gui : GUI)
        {
            this._gui = gui;
        }

        private initialise() : void
        {
            this._stats = new Stats();
        }

        private initialiseCamera() : void
        {
            // TODO
        }

        private initialiseLighting() : void
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

        public toggleGrid( e : Event ) : void
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

    }

}