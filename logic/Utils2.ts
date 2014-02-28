/// <reference path="../lib/three.d.ts" />
module Voxel {

    export interface IException
    {
        name : string;
        message? : string;
    }

    export interface INode
    {
        getNodePosition() : THREE.Vector3;
        getMass() : number ;
        setMass(mass : number);
        addToNeigbourhoodNodes(node : INode) : void;
        update(delta : number , force : THREE.Vector3 ) : void;
        getNeigbourhoodNodes() : Collection<INode>;
    }

    export interface ISpring
    {
        update( delta : number );
    }


    export class Node extends  THREE.Mesh implements INode
    {
        private _mass : number;
        private _neighbourhoodNodes : Collection<INode>;

        constructor(geom : THREE.Geometry, mat : THREE.Material)
        {
            super();
            this.geometry = geom;
            this.material = mat;
            this._neighbourhoodNodes = new Collection<INode>();
        }

        public getMass() : number {
            return this._mass;
        }

        public setMass( mass : number) {
            this._mass = mass;
        }

        public addToNeigbourhoodNodes(node : INode) : void
        {
            this._neighbourhoodNodes.add(node);
        }

        public getNeigbourhoodNodes() : Collection<INode>
        {
            return this._neighbourhoodNodes;
        }

        public getNodePosition() : THREE.Vector3
        {
            return this.position;
        }

        public update (delta : number, force : THREE.Vector3)
        {
            // TODO
        }
    }

    export class Spring implements ISpring
    {
        private _node1 : INode;
        private _node2 : INode;
        private _length : number;
        private _distance : number;
        private _strength : number;
        private _lineGeo : THREE.Geometry;
        private _line : THREE.Line;
        private _visible : boolean = false;

        constructor(scene : THREE.Scene, node1 : INode, node2 : INode, strength : number, length : number)
        {
            this._node1 = node1;
            this._node2 = node2;

            // Helper / Debug code
            this._lineGeo = new THREE.Geometry();
            this._lineGeo.vertices.push(
                this._node1.getNodePosition(),
                this._node2.getNodePosition()
            )
            this._lineGeo.computeLineDistances();
            this._lineGeo.dynamic = true;

            var lineMAT = new THREE.LineBasicMaterial({ color : 0xCC0000 });
            this._line = new THREE.Line(this._lineGeo, lineMAT);
            this._line.visible = this._visible;

            scene.add(this._line);

        }

        public update( delta : number ) : void
        {
            var force = (this._length - this.getDistance()) * this._strength;

            var a1 = force / this._node1.getMass();
            var a2 = force / this._node2.getMass();
        }

        public getDistance() : number
        {
            return this._node1.getNodePosition().distanceTo(this._node2.getNodePosition());
        }

    }

    export class Sphere2 {
        private radius:number;
        private center:THREE.Vector3;

        constructor(x:number, y:number, z:number, r:number) {
            this.radius = r;
            this.center = new THREE.Vector3(x, y, z);
        }

        public isColliding(position:THREE.Vector3):boolean {
            var distance = this.center.distanceTo(position);
            return distance < this.radius;
        }
    }

    export interface Grid3D {
        liH: THREE.Line;
        liV: THREE.Line;
    }

    export class GridCreator {
        private _geo:THREE.Geometry = new THREE.Geometry();
        private _color:number = 0x25F500;
        private _gridMaterial:THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: this._color, opacity: 0.5 });
        private _size:number;
        private _blockSize:number;

        constructor(wSize:number, bSize:number, gridColor?:number) {
            this._size = wSize / 2;
            this._blockSize = bSize;
            this._color = gridColor;
        }

        public buildAxisAligned2DGrids():THREE.Geometry {
            for (var i = -this._size; i <= this._size; i += this._blockSize) {
                for (var level = -this._size; level <= this._size; level += this._blockSize) {
                    this._geo.vertices.push(new THREE.Vector3(-this._size, level, i));
                    this._geo.vertices.push(new THREE.Vector3(this._size, level, i));
                    this._geo.vertices.push(new THREE.Vector3(i, level, -this._size));
                    this._geo.vertices.push(new THREE.Vector3(i, level, this._size));
                }
            }
            return this._geo;
        }

        public build3DGrid(geometryH:THREE.Geometry, geometryV:THREE.Geometry):Grid3D {
            var lineH:THREE.Line = new THREE.Line(geometryH, this._gridMaterial);
            var lineV:THREE.Line = new THREE.Line(geometryV, this._gridMaterial);

            lineH.type = THREE.LinePieces;
            lineV.type = THREE.LinePieces;
            lineV.rotation.x = Math.PI / 2;

            return {liH: lineH, liV: lineV}

        }

    }

    export class Collection< T > {
        private _array : Array < T >;

        constructor() {
            this._array = [];
        }

        public add(item : T):void {
            // TODO
            this._array.push(item);
        }

        public clearAll():void {
            // TODO
        }

        public removeSpecific():void {
            // TODO
        }

        public length() : number
        {
            return this._array.length;
        }
    }

    export class VoxelCornerInfo {
        private _id:string;
        private _inside:boolean;
        private _position:THREE.Vector3;
        private _value:number;
        private _connectedTo:Array<VoxelCornerInfo>;

        constructor() {
            this._id = '';
            this._inside = false;
            this._position = new THREE.Vector3(0, 0, 0);
            this._value = 0;
            this._connectedTo = [];
        }

        public getId():string {
            return this._id;
        }

        public getIsInside():boolean {
            return this._inside;
        }

        public setPostion(position:THREE.Vector3):void {
            this._position = position;
        }

        public getPosition():THREE.Vector3 {
            return this._position;
        }


        public getValue():number {
            return this._value;
        }

        public getConnectedTo():Array<VoxelCornerInfo> {
            return this._connectedTo;
        }

        public setConnectedTo(points:Array<VoxelCornerInfo>):void {
            this._connectedTo = points;
        }
    }

    export class Verts {

        public p0:VoxelCornerInfo;
        public p1:VoxelCornerInfo;
        public p2:VoxelCornerInfo;
        public p3:VoxelCornerInfo;
        public p4:VoxelCornerInfo;
        public p5:VoxelCornerInfo;
        public p6:VoxelCornerInfo;
        public p7:VoxelCornerInfo;

        constructor() {
            this.p0 = new VoxelCornerInfo();
            this.p1 = new VoxelCornerInfo();
            this.p2 = new VoxelCornerInfo();
            this.p3 = new VoxelCornerInfo();
            this.p4 = new VoxelCornerInfo();
            this.p5 = new VoxelCornerInfo();
            this.p6 = new VoxelCornerInfo();
            this.p7 = new VoxelCornerInfo();
        }

    }

    export class VoxelState2 extends THREE.Mesh {
        private _centerPosition:THREE.Vector3;
        private _blockSize:number;
        private _verts:Verts;

        constructor(center:THREE.Vector3, blockSize:number) {
            super();
            this._centerPosition = center;
            this._blockSize = blockSize;
            this._verts = new Verts();
        }

        public getCenter():THREE.Vector3 {
            return this._centerPosition;
        }

        public getVerts():Verts {
            return this._verts;
        }

        public calculateVoxelVertexPositions():void {
            this._verts.p0.setPostion(new THREE.Vector3(this._centerPosition.x - this._blockSize / 2, this._centerPosition.y - this._blockSize / 2, this._centerPosition.z - this._blockSize / 2));  //   -1, -1, -1 = 0
            this._verts.p1.setPostion(new THREE.Vector3(this._centerPosition.x + this._blockSize / 2, this._centerPosition.y - this._blockSize / 2, this._centerPosition.z - this._blockSize / 2));  //    1, -1, -1 = 1
            this._verts.p2.setPostion(new THREE.Vector3(this._centerPosition.x + this._blockSize / 2, this._centerPosition.y - this._blockSize / 2, this._centerPosition.z + this._blockSize / 2));  //    1, -1 , 1 = 2
            this._verts.p3.setPostion(new THREE.Vector3(this._centerPosition.x - this._blockSize / 2, this._centerPosition.y - this._blockSize / 2, this._centerPosition.z + this._blockSize / 2));  //   -1, -1 , 1 = 3
            this._verts.p4.setPostion(new THREE.Vector3(this._centerPosition.x - this._blockSize / 2, this._centerPosition.y + this._blockSize / 2, this._centerPosition.z - this._blockSize / 2));  //   -1,  1, -1 = 4
            this._verts.p5.setPostion(new THREE.Vector3(this._centerPosition.x + this._blockSize / 2, this._centerPosition.y + this._blockSize / 2, this._centerPosition.z - this._blockSize / 2));  //    1,  1, -1 = 5
            this._verts.p6.setPostion(new THREE.Vector3(this._centerPosition.x + this._blockSize / 2, this._centerPosition.y + this._blockSize / 2, this._centerPosition.z + this._blockSize / 2));  //    1,  1,  1 = 6
            this._verts.p7.setPostion(new THREE.Vector3(this._centerPosition.x - this._blockSize / 2, this._centerPosition.y + this._blockSize / 2, this._centerPosition.z + this._blockSize / 2));  //    -1,  1,  1 = 7
        }

        public setVertexValues():void {
            // TODO
        }

        public setConnectedTos():void {
            this._verts.p0.setConnectedTo([this._verts.p1, this._verts.p3, this._verts.p4]);
            this._verts.p1.setConnectedTo([this._verts.p0, this._verts.p2, this._verts.p5]);
            this._verts.p2.setConnectedTo([this._verts.p1, this._verts.p3, this._verts.p6]);
            this._verts.p3.setConnectedTo([this._verts.p0, this._verts.p2, this._verts.p7]);

            this._verts.p4.setConnectedTo([this._verts.p0, this._verts.p5, this._verts.p7]);
            this._verts.p5.setConnectedTo([this._verts.p1, this._verts.p4, this._verts.p6]);
            this._verts.p6.setConnectedTo([this._verts.p2, this._verts.p5, this._verts.p7]);
            this._verts.p7.setConnectedTo([this._verts.p3, this._verts.p4, this._verts.p6]);
        }

    }

    export class Level {

        private _level:Array<VoxelState2>;

        constructor() {
            this._level = new Array<Voxel.VoxelState2>();
        }

        public addToLevel(vox:VoxelState2):void {
            this._level.push(vox);
        }

        public getLevel():Array<VoxelState2> {
            return this._level;
        }
    }

    export class VoxelWorld {
        private _worldSize:number;
        private _voxelSize:number;
        private _voxelPerLevel:number;
        private _numberlevels:number;
        private _level:Level;
        private _worldVoxelArray:Array<Level>;
        private _start:THREE.Vector3;

        constructor(worldSize:number, voxelSize:number) {
            this._worldSize = worldSize;
            this._voxelSize = voxelSize;
            this._worldVoxelArray = [];
            this._voxelPerLevel = Math.pow(worldSize / voxelSize, 2);
            this._numberlevels = Math.sqrt(this._voxelPerLevel);


            this.buildWorldVoxelPositionArray();
        }

        public getWorldVoxelArray():Array<Level> {
            return this._worldVoxelArray;
        }

        public getNumberOfVoxelsPerLevel():number {
            return this._voxelPerLevel;
        }

        public getNumberOfLevelsInVoxelWorld():number {
            return this._numberlevels;
        }

        public buildWorldVoxelPositionArray():void {
            this._level = new Level;
            this._start = new THREE.Vector3(-this._worldSize / 2, -this._worldSize / 2, -this._worldSize / 2);

            var x = this._start.x, z = this._start.z, y = this._start.y;

            while (y < this._worldSize / 2) {
                while (z < this._worldSize / 2) {

                    while (x < this._worldSize / 2) {
                        var voxel = new VoxelState2(new THREE.Vector3(x + this._voxelSize / 2, y + this._voxelSize / 2, z + this._voxelSize / 2), this._voxelSize);
                        voxel.calculateVoxelVertexPositions();
                        voxel.setConnectedTos();
                        this._level.addToLevel(voxel);
                        x += this._voxelSize;
                    }

                    z += this._voxelSize;
                    x = this._start.x;
                }

                this._worldVoxelArray.push(this._level);
                this._level = new Level;

                y += this._voxelSize;
                x = this._start.x;
                z = this._start.z;
            }
        }
    }
}


module testModule {

    export class test1 {
        private _name:string;

        constructor(name:string) {
            this._name = name;
        }

        public getName():string {
            return this._name;
        }
    }

    export class test2 {
        private _t1:test1;

        constructor(name:string) {
            this._t1 = new test1(name);
        }

        public getName():string {
            return this._t1.getName();
        }
    }

}




