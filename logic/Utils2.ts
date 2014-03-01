/// <reference path="../lib/three.d.ts" />
/// <reference path="../lib/jquery.d.ts"/>
/// <reference path="../lib/underscore.d.ts"/>
/// <reference path="../logic/Sculpting2.ts"/>

declare module THREE {
    export var Octree
}

module Voxel {

    export interface IException {
        name : string;
        message? : string;
    }

    export interface INode {
        getId() : number;
        getNodePosition() : THREE.Vector3;
        getMass() : number ;
        setMass(mass:number);
        getVelocity() : THREE.Vector3;
        setVelocity(velocity:THREE.Vector3) : void;
        addToNeigbourhoodNodes(node:INode) : void;
        update(delta:number, force:THREE.Vector3) : void;
        getNeigbourhoodNodes() : Collection<INode>;
    }

    export interface ISpring {
        update(delta:number);
    }

    export class MeshExtended extends THREE.Mesh {
        public positionRef:Array<Voxel.Node>;
        private scene:THREE.Scene;
        private normal:THREE.Vector3;
        private lineGeo:THREE.Geometry;
        private lineMaterial:THREE.LineBasicMaterial;
        private line:THREE.Line;

        constructor(scene:THREE.Scene, geo:THREE.Geometry, mat:THREE.MeshNormalMaterial) {
            super();
            this.positionRef = [];
            this.scene = scene;
            this.geometry = geo;
            this.material = mat;
            this.lineGeo = new THREE.Geometry();
            this.lineGeo.vertices.push(
                new THREE.Vector3,
                new THREE.Vector3
            );

            this.lineGeo.computeLineDistances();
            this.lineGeo.dynamic = true;
            this.lineMaterial = new THREE.LineBasicMaterial({color: 0xCC0000});
            this.line = new THREE.Line(this.lineGeo, this.lineMaterial);
            this.scene.add(this.line);

            this.geometry.verticesNeedUpdate = true;
            this.geometry.normalsNeedUpdate = true;

        }

        public updateVertices():void {
            this.geometry.vertices = [];
            this.geometry.vertices.push(this.positionRef[0].position, this.positionRef[1].position, this.positionRef[2].position);
            this.geometry.verticesNeedUpdate = true;
            this.geometry.elementsNeedUpdate = true;
            // this.geometry.morphTargetsNeedUpdate = true;
            this.geometry.uvsNeedUpdate = true;
            this.geometry.normalsNeedUpdate = true;
            this.geometry.colorsNeedUpdate = true;
            this.geometry.tangentsNeedUpdate = true;
        }

        public calculateNormal():void {
            this.geometry.computeCentroids();
            this.geometry.computeFaceNormals();
            this.geometry.computeVertexNormals();

            var vector1 = new THREE.Vector3();
            var vector2 = new THREE.Vector3();
            var crossedVector = new THREE.Vector3();

            vector1.subVectors(this.positionRef[2].position, this.positionRef[0].position);
            vector2.subVectors(this.positionRef[1].position, this.positionRef[0].position);
            crossedVector.crossVectors(vector2, vector1).normalize().multiplyScalar(5);

            var headOfNormal = new THREE.Vector3();
            headOfNormal.addVectors(this.geometry.faces[0].centroid, crossedVector);

            this.line.geometry.vertices[0] = this.geometry.faces[0].centroid;
            this.line.geometry.vertices[1] = headOfNormal;

            this.normal.subVectors(this.line.geometry.vertices[0], this.line.geometry.vertices[1]).normalize();

            this.lineGeo.verticesNeedUpdate = true;
        }
    }


    export class Vector3Extended extends THREE.Vector3 {
        constructor(x:number, y:number, z:number) {
            super(x, y, z);
        }

        public equalsWithinTolerence(other:THREE.Vector3, tolerence:number):boolean {
            var dist = this.distanceTo(other);
            return dist <= tolerence;
        }
    }

    export class Node extends THREE.Mesh implements INode {

        private _mass:number;
        private _velocity:THREE.Vector3;
        private _neighbourhoodNodes:Collection<INode>;

        constructor(geom:THREE.Geometry, mat:THREE.Material) {
            super();
            this.geometry = geom;
            this.material = mat;
            this._velocity = new THREE.Vector3();
            this._neighbourhoodNodes = new Collection<INode>();
        }

        public getId():number {
            return this.id;
        }

        public getMass():number {
            return this._mass;
        }

        public setMass(mass:number) {
            this._mass = mass;
        }

        getVelocity():THREE.Vector3 {
            return undefined;
        }

        setVelocity(velocity:THREE.Vector3):void {
            this._velocity = velocity;
        }


        public addToNeigbourhoodNodes(node:INode):void {
            this._neighbourhoodNodes.add(node);
        }

        public getNeigbourhoodNodes():Collection<INode> {
            return this._neighbourhoodNodes;
        }

        public getNodePosition():THREE.Vector3 {
            return this.position;
        }

        public setNodePosition(position:THREE.Vector3):void {
            this.position = position;
        }

        public update(delta:number, force:THREE.Vector3) {
            this.getVelocity().add(force);
            this.getVelocity().multiplyScalar(delta);
            this.getNodePosition().add(this._velocity);
        }
    }

    export class Spring implements ISpring {
        private _node1:INode;
        private _node2:INode;
        private _length:number;
        private _distance:number;
        private _strength:number;
        private _lineGeo:THREE.Geometry;
        private _line:THREE.Line;
        private _visible:boolean = false;

        constructor(scene:THREE.Scene, node1:INode, node2:INode, strength:number, length:number) {
            this._node1 = node1;
            this._node2 = node2;
            this._length = length;
            this._strength = strength;
            this._distance = this._node1.getNodePosition().distanceTo(this._node2.getNodePosition());


            // Helper / Debug code
            this._lineGeo = new THREE.Geometry();
            this._lineGeo.vertices.push(
                this._node1.getNodePosition(),
                this._node2.getNodePosition()
            );
            this._lineGeo.computeLineDistances();
            this._lineGeo.dynamic = true;

            var lineMAT = new THREE.LineBasicMaterial({ color: 0xCC0000 });
            this._line = new THREE.Line(this._lineGeo, lineMAT);
            this._line.visible = this._visible;

            scene.add(this._line);

        }

        public update(delta:number):void {
            var force = (this._length - this.getDistance()) * this._strength;

            var a1 = force / this._node1.getMass();
            var a2 = force / this._node2.getMass();

            var n1 = new THREE.Vector3,
                n2 = new THREE.Vector3;

            n1.subVectors(this._node1.getNodePosition(), this._node2.getNodePosition()).normalize().multiplyScalar(a1);
            n2.subVectors(this._node2.getNodePosition(), this._node2.getNodePosition()).normalize().multiplyScalar(a2);

            this._node1.update(delta, n1);
            this._node2.update(delta, n2);

            this._lineGeo.vertices[0] = this._node1.getNodePosition();
            this._lineGeo.vertices[1] = this._node2.getNodePosition();

            this._lineGeo.verticesNeedUpdate = true;
        }

        public getDistance():number {
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
        private _array:Array < T >;

        constructor() {
            this._array = [];
        }

        public add(item:T):void {
            // TODO
            this._array.push(item);
        }

        public clearAll():void {
            // TODO
        }

        public removeSpecific():void {
            // TODO
        }

        public length():number {
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


module Helper {

    export class jqhelper {
        static getScreenWH(id:string):Array<number> {
            var wh = [];
            var w = $(id).width();
            var h = $(id).height();
            wh.push(w, h);
            return wh;
        }

        static appendToScene(id:string, renderer:THREE.WebGLRenderer):void {
            $(id).append(renderer.domElement);
        }
    }
}

module Controller {


    export interface SphereSkeleton {
        points : Array<THREE.Vector3>;
        lines : Array<THREE.Line>;
    }

    export class ControlSphere {
        private N:number;
        private M:number;
        private radius:number;
        private _scene:THREE.Scene;
        private _nodeSize:number;
        private _nodeVelocity:THREE.Vector3;
        private _nodeMass:number;
        private _nodes:Array<Voxel.INode>;
        private _faces:Array<THREE.Mesh>;
        private _octreeForNodes:any;
        private _octreeForFaces:any;

        constructor(segments:number, radius:number, scene:THREE.Scene, size:number, velocity:THREE.Vector3, mass:number) {
            this.N = segments;
            this.M = segments;
            this.radius = radius;
            this._scene = scene;
            this._nodeSize = size;
            this._nodeVelocity = velocity;
            this._nodeMass = mass;
            this._nodes = [];
            this._faces = [];
            this._octreeForFaces = new THREE.Octree();
            this._octreeForNodes = new THREE.Octree();

        }

        public getOctreeForNodes():any {
            return this._octreeForNodes;
        }

        public getOctreeForFaces():any {
            return this._octreeForFaces;
        }


        private generateSphereVerticesandLineConnectors():SphereSkeleton {
            var points = [];
            var lines = [];
            for (var m = 0; m < this.M + 1; m++)
                for (var n = 0; n < this.N; n++) {
                    // http://stackoverflow.com/a/4082020
                    var x = (Math.sin(Math.PI * m / this.M) * Math.cos(2 * Math.PI * n / this.N)) * this.radius;
                    var y = (Math.sin(Math.PI * m / this.M) * Math.sin(2 * Math.PI * n / this.N)) * this.radius;
                    var z = (Math.cos(Math.PI * m / this.M)) * this.radius;

                    var p = new THREE.Vector3(x, y, z);

                    points.push(p);
                }

            // Draw the pole-pole lines (longitudinal)
            for (var s = 0; s < points.length - this.N; s++) {
                var lineGeo = new THREE.Geometry();
                lineGeo.vertices.push(
                    points[s],
                    points[s + this.N]);

                lineGeo.computeLineDistances();

                var lineMaterial = new THREE.LineBasicMaterial({ color: 0xCC0000 });
                var line = new THREE.Line(lineGeo, lineMaterial);

                lines.push(line);
            }

            // Draw lines along latitude
            var count = 0;
            for (var s = this.N; s < points.length - this.N; s++) {
                var a, b;

                if (count === this.N - 1) {
                    a = points[s];
                    b = points[s - this.N + 1];
                    count = 0;
                }
                else {
                    a = points[s];
                    b = points[s + 1];
                    count++;
                }

                var lineGeo = new THREE.Geometry();
                lineGeo.vertices.push(
                    a,
                    b);

                lineGeo.computeLineDistances();

                var lineMaterial = new THREE.LineBasicMaterial({ color: 0xCC0000 });
                var line = new THREE.Line(lineGeo, lineMaterial);

                lines.push(line);

            }

            // trim start and end
            var unique = points.slice(this.N - 1, points.length - this.N + 1);

            return {points: unique, lines: lines };

        }


        public generateSphere():void {
            var sphereSkel = this.generateSphereVerticesandLineConnectors();


            for (var i = 0; i < sphereSkel.points.length; i++) {
                var point = sphereSkel.points[i];
                var geometry = new THREE.SphereGeometry(this._nodeSize, 5, 5);
                var material = new THREE.MeshBasicMaterial({color: 0x8888ff});
                var node = new Voxel.Node(geometry, material);
                node.setNodePosition(point);
                node.setVelocity(this._nodeVelocity);
                node.setMass(this._nodeMass);
                node.visible = true;
                this._scene.add(node);
                this._nodes.push(node);
                this._octreeForNodes.add(node);
            }

            this.calculateFaces();

        }

        public calculateFaces():void {
            var positions = [];

            _.each(this._nodes, function (item) {
                positions.push({ id: item.getId(), position: item.getNodePosition()});
            });

            Implementation.Sculpt2.Worker.postMessage({command: "calculateMeshFacePositions2", particles: JSON.stringify(positions), segments: this.N});

        }

        public static calculateMeshFacePositions(particles:any, segments:any):Array<any> {
            var particles = JSON.parse(particles);
            var listOfObjects = [];
            var beginningOfOtherPole = particles.length;
            var current = 0;

            while (current < beginningOfOtherPole) {
                if (current < segments) // poles block of 10
                {

                    var theFirstPole = 0;
                    var theOtherPole = particles.length - 1;


                    if (current === segments - 1) {
                        listOfObjects.push(
                            {
                                a: { pos: particles[theFirstPole].position, nodeId: particles[theFirstPole].id },
                                b: { pos: particles[current + 1].position, nodeId: particles[current + 1].id },
                                c: { pos: particles[theFirstPole + 1].position, nodeId: particles[theFirstPole + 1].id }
                            });

                        listOfObjects.push(
                            {
                                a: { pos: particles[theOtherPole].position, nodeId: particles[theOtherPole].id },
                                b: { pos: particles[(particles.length - 1) - current - 1].position, nodeId: particles[(particles.length - 1) - current - 1].id },
                                c: { pos: particles[particles.length - 2].position, nodeId: particles[particles.length - 2].id }
                            });
                    }
                    else {

                        listOfObjects.push(
                            {
                                a: { pos: particles[theFirstPole].position, nodeId: particles[theFirstPole].id },
                                b: { pos: particles[current + 1].position, nodeId: particles[current + 1].id },
                                c: { pos: particles[current + 2].position, nodeId: particles[current + 2].id }
                            });

                        listOfObjects.push(
                            {
                                a: { pos: particles[theOtherPole].position, nodeId: particles[theOtherPole].id },
                                b: { pos: particles[(particles.length - 1) - current - 1].position, nodeId: particles[(particles.length - 1) - current - 1].id },
                                c: { pos: particles[(particles.length - 1) - current - 2].position, nodeId: particles[(particles.length - 1) - current - 2].id }
                            });
                    }
                }

                else if (current >= segments + 1 && current < beginningOfOtherPole - 1) {

                    if (current % segments > 0) {
                        listOfObjects.push(
                            {
                                a: { pos: particles[current].position, nodeId: particles[current].id },
                                b: { pos: particles[current + 1].position, nodeId: particles[current + 1].id },
                                c: { pos: particles[current - segments].position, nodeId: particles[current - segments].id }
                            });
                        listOfObjects.push(
                            {
                                a: { pos: particles[current + 1].position, nodeId: particles[current + 1].id },
                                b: { pos: particles[current - (segments - 1)].position, nodeId: particles[current - (segments - 1)].id },
                                c: { pos: particles[current - segments].position, nodeId: particles[current - segments].id }
                            });
                    }
                    else {
                        listOfObjects.push(
                            {
                                a: { pos: particles[current - segments].position, nodeId: particles[current - segments].id},
                                b: { pos: particles[current].position, nodeId: particles[current].id },
                                c: { pos: particles[current - segments + 1].position, nodeId: particles[current - segments + 1].id}
                            });
                        listOfObjects.push(
                            {
                                a: { pos: particles[current - segments].position, nodeId: particles[current - segments].id },
                                b: { pos: particles[current - segments + 1].position, nodeId: particles[current - segments + 1].id},
                                c: { pos: particles[current - (segments * 2) + 1].position, nodeId: particles[current - (segments * 2) + 1].id}
                            });
                    }
                }

                current++;
            }

            return listOfObjects;


        }

        public addFaces(verts:any):void {

            var geom;
            for (var i = 0; i < verts.length; i++) {
                var item = verts[i];

                geom = new THREE.Geometry();
                geom.vertices.push(item.a.pos, item.b.pos, item.c.pos);
                geom.faces.push(new THREE.Face3(0, 1, 2));

                geom.computeCentroids();
                geom.computeFaceNormals();
                geom.computeVertexNormals();


                var mat = new THREE.MeshNormalMaterial({color: 0xF50000});
                mat.side = THREE.DoubleSide;
                //mat.visible = false;
                var object = new Voxel.MeshExtended(this._scene, geom, mat);
                object.positionRef.push(this._scene.getObjectById(item.a.nodeId, true), this._scene.getObjectById(item.b.nodeId, true), this._scene.getObjectById(item.c.nodeId, true));

                this._faces.push(object);
                this._scene.add(object);
                this._octreeForFaces.add(object);
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




