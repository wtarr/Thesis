/**
 * ##Marching cube code inspired from##
 * http://stemkoski.github.io/Three.js/Marching-Cubes.html
 * &
 * http://paulbourke.net/geometry/polygonise/
 */

/// <reference path="../lib/three.d.ts" />
/// <reference path="../lib/jquery.d.ts"/>
/// <reference path="../lib/underscore.d.ts"/>
/// <reference path="./Sculpting2.ts"/>

declare module THREE {
    export var Octree
}
declare module THREE {
    export var triTable
}
declare module THREE {
    export var edgeTable
}

module Geometry {

    export interface ILine {
        start: Geometry.Vector3Extended;
        end: Geometry.Vector3Extended;
        equals(other:ILine) : boolean;
        getDirection() : THREE.Vector3;
    }

    export class Line implements ILine {

        public start:Geometry.Vector3Extended;
        public end:Geometry.Vector3Extended;

        constructor(start:Geometry.Vector3Extended, end:Geometry.Vector3Extended) {
            this.start = start;
            this.end = end;
        }

        public getDirection():THREE.Vector3 {
            var temp = new THREE.Vector3();
            temp.subVectors(this.end, this.start).normalize;
            return temp;
        }

        public equals(other:Geometry.Line):boolean {
            if (other.start.equals(this.start) && other.end.equals(this.end))
                return true;
            return false;
        }

    }

    export class GeometryHelper {

        public static cross(a:THREE.Vector3, b:THREE.Vector3):THREE.Vector3 {
            return new THREE.Vector3();
        }

        public static dot(a:THREE.Vector3, b:THREE.Vector3):number {
            return 0;
        }

        public static calculateDistanceBetweenTwoVector3(origin:THREE.Vector3, target:THREE.Vector3) {
            var temp = GeometryHelper.vectorBminusVectorA(target, origin);
            return temp.length();
        }

        public static vectorBminusVectorA(b:THREE.Vector3, a:THREE.Vector3) {
            var temp = new THREE.Vector3();
            return temp.subVectors(b, a);
        }

        public static calculateShortestDistanceFromPointToLine(origin:THREE.Vector3, start:THREE.Vector3, finish:THREE.Vector3):number {
            var lineMag = new THREE.Vector3();
            lineMag.subVectors(finish, start);
            var len = lineMag.length();

            var u = (((origin.x - start.x ) * (finish.x - start.x)) + ((origin.y - start.y) * (finish.y - start.y)) + ((origin.z - start.z) * (finish.z - start.z))) / (Math.pow(len, 2));

            var x = start.x + u * ( finish.x - start.x);
            var y = start.y + u * ( finish.y - start.y);
            var z = start.z + u * ( finish.z - start.z);

            var poc = new THREE.Vector3(x, y, z);
            return (poc.sub(origin)).length();


        }

        public static calculateShortestDistanceToPlane(origin:THREE.Vector3, pointOnPlane:THREE.Vector3, normal:THREE.Vector3):number {
            return Math.abs(GeometryHelper.vectorBminusVectorA(origin, pointOnPlane).dot(normal) / normal.length());
        }

        //http://stackoverflow.com/a/328122
        //http://www.mathworks.com/matlabcentral/newsreader/view_thread/170200
        public static isBetween(a:THREE.Vector3, b:THREE.Vector3, c:THREE.Vector3):boolean {
            var epsilon = 0.001;

            // (b - c) x (a - b) = 0

            var b_minus_c = new THREE.Vector3();
            b_minus_c.subVectors(b, c);
            var a_minus_b = new THREE.Vector3();
            a_minus_b.subVectors(b, a);
            var cross = new Geometry.Vector3Extended();
            cross.crossVectors(b_minus_c, a_minus_b);
            if (Math.abs(cross.x) > epsilon || Math.abs(cross.y) > epsilon || Math.abs(cross.z) > epsilon)
                return false;

            var b_minus_a = new THREE.Vector3();
            b_minus_a.subVectors(b, a);
            var c_minus_a = new THREE.Vector3();
            c_minus_a.subVectors(c, a);
            var dot = b_minus_a.dot(c_minus_a);
            if (dot < 0) return false;

            var lengthSqrd = Math.pow(b_minus_a.length(), 2);
            if (dot > lengthSqrd) return false;

            return true;
        }

        public static shortestDistanceBetweenTwoVector3(point:THREE.Vector3, v1:THREE.Vector3, v2:THREE.Vector3):number {
            var distance1 = point.distanceTo(v1);
            var distance2 = point.distanceTo(v2);

            if (distance1 < distance2)
                return distance1;
            else
                return distance2;
        }
    }


    export class MeshExtended extends THREE.Mesh {
        public positionRef:Array<Geometry.Node>;
        private _scene:THREE.Scene;
        private _normal:THREE.Vector3;
        private _lineGeo:THREE.Geometry;
        private _lineMaterial:THREE.LineBasicMaterial;
        private _line:THREE.Line;

        constructor(scene:THREE.Scene, geo:THREE.Geometry, mat:THREE.MeshNormalMaterial) {
            super();
            this.positionRef = [];
            this._scene = scene;
            this.geometry = geo;
            this.material = mat;
            this._normal = new THREE.Vector3();
            this._lineGeo = new THREE.Geometry();
            this._lineGeo.vertices.push(
                new THREE.Vector3,
                new THREE.Vector3
            );

            this._lineGeo.computeLineDistances();
            this._lineGeo.dynamic = true;
            this._lineMaterial = new THREE.LineBasicMaterial({color: 0xCC0000});
            this._line = new THREE.Line(this._lineGeo, this._lineMaterial);
            this._scene.add(this._line);

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

        public calculateNormal(inverted:number):void {
            this.geometry.computeCentroids();
            this.geometry.computeFaceNormals();
            this.geometry.computeVertexNormals();

            var vector1 = new THREE.Vector3();
            var vector2 = new THREE.Vector3();
            var crossedVector = new THREE.Vector3();

            //vector1.subVectors(this.positionRef[2].position, this.positionRef[0].position);
            //vector2.subVectors(this.positionRef[1].position, this.positionRef[0].position);

            if (inverted === 1) {
                vector1.subVectors(this.positionRef[2].position, this.positionRef[0].position);
                vector2.subVectors(this.positionRef[1].position, this.positionRef[0].position);
                crossedVector.crossVectors(vector2, vector1).normalize().multiplyScalar(-5);
            }
            else if (inverted === 0) {
                vector1.subVectors(this.positionRef[2].position, this.positionRef[0].position);
                vector2.subVectors(this.positionRef[1].position, this.positionRef[0].position);
                crossedVector.crossVectors(vector2, vector1).normalize().multiplyScalar(5);
            }

            //crossedVector.crossVectors(vector2, vector1).normalize().multiplyScalar(5);


            var headOfNormal = new THREE.Vector3();
            headOfNormal.addVectors(this.geometry.faces[0].centroid, crossedVector);

            this._line.geometry.vertices[0] = this.geometry.faces[0].centroid;
            this._line.geometry.vertices[1] = headOfNormal;

            this._normal.subVectors(this._line.geometry.vertices[0], this._line.geometry.vertices[1]).normalize();

            this._lineGeo.verticesNeedUpdate = true;
        }

        public getNormal():THREE.Vector3 {
            return this._normal;
        }

        public toggleNormalVisibility():void {
            this._line.visible = this._line.visible !== true;
        }
    }

//    export interface INode {
//        getId() : number;
//        getNodePosition() : THREE.Vector3;
//        getMass() : number ;
//        setMass(mass:number);
//        getVelocity() : THREE.Vector3;
//        setVelocity(velocity:THREE.Vector3) : void;
//        addToNeigbourhoodNodes(node:Node) : void;
//        update(delta:number, force:THREE.Vector3) : void;
//        getNeigbourhoodNodes() : Collection<INode>;
//        toggleVisibility() : void;
//    }

    export interface ISpring {
        update(delta:number);
    }

    export class Vector3Extended extends THREE.Vector3 {
        constructor(x?:number, y?:number, z?:number) {
            var _x = (x === undefined) ? 0 : x;
            var _y = (y === undefined) ? 0 : y;
            var _z = (z === undefined) ? 0 : z;

            super(_x, _y, _z);
        }

        public equalsWithinTolerence(other:THREE.Vector3, tolerence:number):boolean {
            var dist = this.distanceTo(other);
            return dist <= tolerence;
        }

    }

    export class Node extends THREE.Mesh {

        private _mass:number;
        private _velocity:THREE.Vector3;
        private _neighbourhoodNodes:Collection<Node>;

        constructor(geom:THREE.Geometry, mat:THREE.Material) {
            super();
            this.geometry = geom;
            this.material = mat;
            this._velocity = new THREE.Vector3();
            this._neighbourhoodNodes = new Collection<Node>();
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
            return this._velocity;
        }

        setVelocity(velocity:THREE.Vector3):void {
            this._velocity = velocity;
        }


        public addToNeigbourhoodNodes(node:Node):void {
            this._neighbourhoodNodes.add(node);
        }

        public getNeigbourhoodNodes():Collection<Node> {
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
        private _node1:Node;
        private _node2:Node;
        private _length:number;
        private _distance:number;
        private _strength:number;
        private _lineGeo:THREE.Geometry;
        private _line:THREE.Line;
        private _visible:boolean = false;

        constructor(scene:THREE.Scene, node1:Node, node2:Node, strength:number, length:number) {
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
            n2.subVectors(this._node2.getNodePosition(), this._node1.getNodePosition()).normalize().multiplyScalar(a2);

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
            this._array.push(item);
        }

        public addUnique(item:T):void {
            if (this._array.length === 0) {
                this._array.push(item);
            }
            else {
                if (!this.contains(item, (a, b) => {
                    if (a.equals(b))
                        return true;
                    else
                        return false;
                })) {
                    this._array.push(item);
                }
            }
        }

        public get(i:number):T {
            return this._array[i];
        }

        public length():number {
            return this._array.length;
        }

        public makeUnique():void {
            var uniq = new Collection<T>();

            for (var i = 0; i < this._array.length; i++) {
                if (!uniq.contains(this._array[i], (a, b) => {
                    if (a.equals(b))
                        return true;
                    else
                        return false;
                })) {
                    uniq.add(this._array[i]);
                }
            }

            this._array = uniq.getArray();
        }

        public setArray(array:Array<T>):void {
            this._array = array;
        }

        public getArray():Array<T> {
            return this._array;
        }

        public contains(value:T, equalsFunction:any):boolean {
            if (this._array.length > 0) {
                for (var i = 0; i < this._array.length; i++) {
                    if (equalsFunction(value, this._array[i]))
                        return true;
                }
            }
            return false;
        }
    }
}

module Voxel {

    export interface IException {
        name : string;
        message? : string;
    }


    export class VoxelCornerInfo {
        private _id:string;
        private _inside:boolean;
        private _position:THREE.Vector3;
        private _value:number;
        private _connectedTo:Array<VoxelCornerInfo>;
        private _containedInRayLine:Geometry.Collection<Geometry.ILine>;

        constructor(id:string) {
            this._id = id;
            this._inside = false;
            this._position = new THREE.Vector3(0, 0, 0);
            this._value = 0;
            this._connectedTo = [];
            this._containedInRayLine = new Geometry.Collection<Geometry.ILine>();
        }

        public getId():string {
            return this._id;
        }

        public getIsInside():boolean {
            return this._inside;
        }

        public setIsInside(isInside:boolean):void {
            this._inside = isInside;
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

        public setValue(value:number):void {
            this._value = value;
        }

        public getConnectedTo():Array<VoxelCornerInfo> {
            return this._connectedTo;
        }

        public setConnectedTo(points:Array<VoxelCornerInfo>):void {
            this._connectedTo = points;
        }

        public setVoxelValueAsDistanceToSpecifiedPosition(position:THREE.Vector3):void {
            this._value = Math.abs(this._position.distanceTo(position));
        }

        public isPointContainedInAnyRayLines(allTheHorizontalLines:Geometry.Collection<Geometry.ILine>, allTheVerticalLines:Geometry.Collection<Geometry.ILine>):boolean {
            var result = false;

            for (var i = 0; i < allTheVerticalLines.length(); i++) {
                if (Geometry.GeometryHelper.isBetween(allTheVerticalLines.get(i).start, allTheVerticalLines.get(i).end, this.getPosition()) === true) {
                    this._containedInRayLine.addUnique(allTheVerticalLines.get(i));
                    result = true;
                }
            }
            for (var i = 0; i < allTheHorizontalLines.length(); i++) {
                if (Geometry.GeometryHelper.isBetween(allTheHorizontalLines.get(i).start, allTheHorizontalLines.get(i).end, this.getPosition()) === true) {
                    this._containedInRayLine.addUnique(allTheHorizontalLines.get(i));
                    result = true;
                }
            }
            return result;
        }

        public isPointContainedInRayLine(rayline:Geometry.ILine):boolean {
            if (!rayline) {
                console.log();
            }

            if (Geometry.GeometryHelper.isBetween(rayline.start, rayline.end, this.getPosition()) === true) {
                return true;
            }

            return false;
        }

        public getAllContainingRayLines():Geometry.Collection<Geometry.ILine> {
            return this._containedInRayLine;
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
            this.p0 = new VoxelCornerInfo('p0');
            this.p1 = new VoxelCornerInfo('p1');
            this.p2 = new VoxelCornerInfo('p2');
            this.p3 = new VoxelCornerInfo('p3');
            this.p4 = new VoxelCornerInfo('p4');
            this.p5 = new VoxelCornerInfo('p5');
            this.p6 = new VoxelCornerInfo('p6');
            this.p7 = new VoxelCornerInfo('p7');
        }

    }

    export class VoxelState2 {
        private _mesh:THREE.Mesh;
        private _centerPosition:THREE.Vector3;
        private _blockSize:number;
        private _verts:Verts;

        constructor(center:THREE.Vector3, blockSize:number) {
            //super();
            this._mesh = null;
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

        public getMesh():THREE.Mesh {
            return  this._mesh;
        }

        public setMesh(scene:THREE.Scene, mesh:THREE.Mesh):void {
            // find the mesh in the scene
            if (this._mesh != null) {
                scene.remove(scene.getObjectById(this._mesh.id, true));
                this._mesh = mesh;
                scene.add(this._mesh);
            }
            else {
                this._mesh = mesh;
                scene.add(this._mesh);
            }
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

        public calculateVoxelVertexValuesFromJSONPixelDataFile(voxpos:number, voxlvl:number, data:any):void {
            //this._verts.p0.setValue(0);
            var forTheBtm = data[voxlvl][voxpos];
            var forTheTop = data[voxlvl + 1][voxpos];

            // var dat = forTheBtm.cornerdata[0].px[0];

            this._verts.p0.setValue(forTheBtm.cornerdata[0].px[0]);
            this._verts.p1.setValue(forTheBtm.cornerdata[1].px[0]);
            this._verts.p2.setValue(forTheBtm.cornerdata[3].px[0]);
            this._verts.p3.setValue(forTheBtm.cornerdata[2].px[0]);

            this._verts.p4.setValue(forTheTop.cornerdata[0].px[0]);
            this._verts.p5.setValue(forTheTop.cornerdata[1].px[0]);
            this._verts.p6.setValue(forTheTop.cornerdata[3].px[0]);
            this._verts.p7.setValue(forTheTop.cornerdata[2].px[0]);


            console.log();
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
            this._level = [];
        }

        public addToLevel(vox:VoxelState2):void {
            this._level.push(vox);
        }

        public getAllVoxelsAtThisLevel():Array<VoxelState2> {
            return this._level;
        }

        public getVoxel(voxel:number):VoxelState2 {
            return this._level[voxel];
        }
    }

    export class VoxelWorld {
        private _sceneRef:THREE.Scene;
        private _worldSize:number;
        private _voxelSize:number;
        private _voxelPerLevel:number;
        private _stride:number;
        private _numberlevels:number;
        private _level:Level;
        private _worldVoxelArray:Array<Level>;
        private _start:THREE.Vector3;
        private _labels:Array<THREE.Mesh>;
        private _data:any;

        constructor(worldSize:number, voxelSize:number, scene:THREE.Scene, data?:any) {
            this._sceneRef = scene;
            this._worldSize = worldSize;
            this._voxelSize = voxelSize;

            this._worldVoxelArray = [];
            this._stride = worldSize / voxelSize;
            this._voxelPerLevel = Math.pow(this._stride, 2);
            this._numberlevels = Math.sqrt(this._voxelPerLevel);
            this._labels = [];

            if (data) this._data = data;

            this.buildWorldVoxelPositionArray();
        }


        public getWorldVoxelArray():Array<Level> {
            return this._worldVoxelArray;
        }

        public getLevel(level:number):Level {
            return this._worldVoxelArray[level];
        }

        public getStride():number {
            return this._stride;
        }

        public getNumberOfVoxelsPerLevel():number {
            return this._voxelPerLevel;
        }

        public getNumberOfLevelsInVoxelWorld():number {
            return this._numberlevels;
        }

        //if data


        public buildWorldVoxelPositionArray():void {
            var voxCounter = 0, lvlCounter = 0;
            this._level = new Level;
            this._start = new THREE.Vector3(-this._worldSize / 2, -this._worldSize / 2, -this._worldSize / 2);

            var x = this._start.x, z = this._start.z, y = this._start.y;

            while (y < this._worldSize / 2) { // level
                voxCounter = 0;

                while (z < this._worldSize / 2) {

                    while (x < this._worldSize / 2) {
                        var voxel = new VoxelState2(new THREE.Vector3(x + this._voxelSize / 2, y + this._voxelSize / 2, z + this._voxelSize / 2), this._voxelSize);
                        voxel.calculateVoxelVertexPositions();
                        if (this._data) voxel.calculateVoxelVertexValuesFromJSONPixelDataFile(voxCounter, lvlCounter, this._data);
                        voxel.setConnectedTos();
                        this._level.addToLevel(voxel);
                        //this._sceneRef.add(voxel);
                        x += this._voxelSize;
                        voxCounter++;
                    }

                    z += this._voxelSize;
                    x = this._start.x;
                }

                this._worldVoxelArray.push(this._level);
                this._level = new Level;

                y += this._voxelSize;
                x = this._start.x;
                z = this._start.z;

                lvlCounter++;
            }
        }

        //https://gist.github.com/ekeneijeoma/1186920
        public createLabel(text:string, position:THREE.Vector3, size:number, color:String, backGroundColor:any, visibile:boolean, backgroundMargin?:number):THREE.Mesh {
            if (!backgroundMargin)
                backgroundMargin = 5;

            var canvas = <HTMLCanvasElement>document.createElement("canvas");

            var context = canvas.getContext("2d");
            context.font = size + "pt Arial";

            var textWidth = context.measureText(text).width;

            canvas.width = ( textWidth + backgroundMargin ) * 2;
            canvas.height = ( size + backgroundMargin ) * 2;
            context = canvas.getContext("2d");
            context.font = size + "pt Arial";

            if (backGroundColor) {
                context.fillStyle = "rgba(" + backGroundColor.r + "," + backGroundColor.g + "," + backGroundColor.b + "," + backGroundColor.a + ")";
                context.fillRect(canvas.width / 2 - textWidth / 2 - backgroundMargin / 2, canvas.height / 2 - size / 2 - +backgroundMargin / 2, textWidth + backgroundMargin, size + backgroundMargin);
            }

            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = color;
            context.fillText(text, canvas.width / 4, canvas.height / 4);

            // context.strokeStyle = "black";
            // context.strokeRect(0, 0, canvas.width, canvas.height);

            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;

            var material = new THREE.MeshBasicMaterial({
                map: texture, transparent: true, opacity: 0.7, color: 0xFF0000
            });

            var mesh = new THREE.Mesh(new THREE.PlaneGeometry(canvas.width / 2, canvas.height / 2), material);
            // mesh.overdraw = tr
            // ue;
            // = THREE.DoubleSide;
            mesh.position.x = position.x;
            mesh.position.y = position.y;
            mesh.position.z = position.z;

            mesh.visible = visibile;

            this._labels.push(mesh);
            return mesh;
        }

        public clearLabels():void {
            for (var i = 0; i < this._labels.length; i++) {
                this._sceneRef.remove(this._sceneRef.getObjectById(this._labels[i].id, true));
            }
            this._labels = [];
        }

        public update(camera:THREE.Camera, visible:boolean):void {
            for (var i = 0; i < this._labels.length; i++) {
                this._labels[i].lookAt(camera.position);
                this._labels[i].visible = visible;
            }
        }

        public static projectIntoVolume(projectiondirections:Array<THREE.Vector3>, projectionOriginations:Array<THREE.Vector3>, controllerSphereReference:Array<Controller.ControlSphere>):Array<Geometry.ILine> {

            var linesToDraw = new Array<Geometry.ILine>();

            // foreach direction find shortest distance to POC
            for (var b = 0; b < projectiondirections.length; b++) {
                var ray = new THREE.Raycaster(projectionOriginations[b], projectiondirections[b].normalize(), 0, Infinity);
                var result = [];
                for (var i = 0; i < controllerSphereReference.length; i++) {
                    result = result.concat(controllerSphereReference[i].getOctreeForFaces().search(ray.ray.origin, ray.far, true, ray.ray.direction));
                }
                var intersections = ray.intersectOctreeObjects(result);
                if (intersections.length > 0) {

                    var sortedArray = intersections.sort((p1, p2) => p1.distance - p2.distance);

                    // entry exit store line
                    var entry, exit;
                    for (var i = 0; i < sortedArray.length; i++) {

                        var object = <Geometry.MeshExtended>sortedArray[i].object;
                        var face = object.getNormal();
                        var facing = projectiondirections[b].dot(face);
                        var inside;

                        if (facing < 0) {
                            inside = true;
                            exit = sortedArray[i].point;
                            if (entry) linesToDraw.push(new Geometry.Line(entry, exit));
                            entry = null, exit = null;
                        }
                        else {
                            inside = false;
                            entry = sortedArray[i].point;
                        }


                    }
                }
            }

            return linesToDraw;
        }
    }

    enum Color { red, blue, green }

    export class MarchingCubeRendering {
        //Marching cube algorithm that evaluates per voxel

        public static msgQueue = new Array<any>();
        public static busy : boolean = false;

        public static MarchingCube(voxel:VoxelState2, isolevel:number):THREE.Geometry {
            //console.log(JSON.stringify(voxel));

            var geometry = new THREE.Geometry();
            var vertexIndex = 0;
            var vertexlist = [];

            var cubeIndex = 0;

            console.log(voxel.getVerts().p0.getValue());
            if (voxel.getVerts().p0.getValue() < isolevel) {
                cubeIndex |= 1;
                voxel.getVerts().p0.setIsInside(true);
                //console.log("p0");
            }   //0
            if (voxel.getVerts().p1.getValue() < isolevel) {
                cubeIndex |= 2;
                voxel.getVerts().p1.setIsInside(true);
                //console.log("p1");
            }  //1
            if (voxel.getVerts().p2.getValue() < isolevel) {
                cubeIndex |= 4;
                voxel.getVerts().p2.setIsInside(true);
                //console.log("p2");
            } //2
            if (voxel.getVerts().p3.getValue() < isolevel) {
                cubeIndex |= 8;
                voxel.getVerts().p3.setIsInside(true);
                // console.log("p3");
            }  //3
            if (voxel.getVerts().p4.getValue() < isolevel) {
                cubeIndex |= 16;
                voxel.getVerts().p4.setIsInside(true);
                //console.log("p4");
            }   //4
            if (voxel.getVerts().p5.getValue() < isolevel) {
                cubeIndex |= 32;
                voxel.getVerts().p5.setIsInside(true);
                //console.log("p5");
            }  //5
            if (voxel.getVerts().p6.getValue() < isolevel) {
                cubeIndex |= 64;
                voxel.getVerts().p6.setIsInside(true);
                //console.log("p6");
            } //6
            if (voxel.getVerts().p7.getValue() < isolevel) {
                cubeIndex |= 128;
                voxel.getVerts().p7.setIsInside(true);
                // console.log("p7");
            }  //7

            var bits = THREE.edgeTable[ cubeIndex ];
            //if (bits === 0 ) continue;

            if (bits & 1) {
                vertexlist[0] = MarchingCubeRendering.VertexInterpolate(isolevel, voxel.getVerts().p0.getPosition(), voxel.getVerts().p1.getPosition(), voxel.getVerts().p0.getValue(), voxel.getVerts().p1.getValue());
            }
            if (bits & 2) {
                vertexlist[1] = MarchingCubeRendering.VertexInterpolate(isolevel, voxel.getVerts().p1.getPosition(), voxel.getVerts().p2.getPosition(), voxel.getVerts().p1.getValue(), voxel.getVerts().p2.getValue());
            }
            if (bits & 4) {
                vertexlist[2] = MarchingCubeRendering.VertexInterpolate(isolevel, voxel.getVerts().p2.getPosition(), voxel.getVerts().p3.getPosition(), voxel.getVerts().p2.getValue(), voxel.getVerts().p3.getValue());
            }
            if (bits & 8) {
                vertexlist[3] = MarchingCubeRendering.VertexInterpolate(isolevel, voxel.getVerts().p3.getPosition(), voxel.getVerts().p0.getPosition(), voxel.getVerts().p3.getValue(), voxel.getVerts().p0.getValue());
            }
            if (bits & 16) {
                vertexlist[4] = MarchingCubeRendering.VertexInterpolate(isolevel, voxel.getVerts().p4.getPosition(), voxel.getVerts().p5.getPosition(), voxel.getVerts().p4.getValue(), voxel.getVerts().p5.getValue());
            }
            if (bits & 32) {
                vertexlist[5] = MarchingCubeRendering.VertexInterpolate(isolevel, voxel.getVerts().p5.getPosition(), voxel.getVerts().p6.getPosition(), voxel.getVerts().p5.getValue(), voxel.getVerts().p6.getValue());
            }
            if (bits & 64) {
                vertexlist[6] = MarchingCubeRendering.VertexInterpolate(isolevel, voxel.getVerts().p6.getPosition(), voxel.getVerts().p7.getPosition(), voxel.getVerts().p6.getValue(), voxel.getVerts().p7.getValue());
            }
            if (bits & 128) {
                vertexlist[7] = MarchingCubeRendering.VertexInterpolate(isolevel, voxel.getVerts().p7.getPosition(), voxel.getVerts().p4.getPosition(), voxel.getVerts().p7.getValue(), voxel.getVerts().p4.getValue());
            }
            if (bits & 256) {
                vertexlist[8] = MarchingCubeRendering.VertexInterpolate(isolevel, voxel.getVerts().p0.getPosition(), voxel.getVerts().p4.getPosition(), voxel.getVerts().p0.getValue(), voxel.getVerts().p4.getValue());
            }
            if (bits & 512) {
                vertexlist[9] = MarchingCubeRendering.VertexInterpolate(isolevel, voxel.getVerts().p1.getPosition(), voxel.getVerts().p5.getPosition(), voxel.getVerts().p1.getValue(), voxel.getVerts().p5.getValue());
            }
            if (bits & 1024) {
                vertexlist[10] = MarchingCubeRendering.VertexInterpolate(isolevel, voxel.getVerts().p2.getPosition(), voxel.getVerts().p6.getPosition(), voxel.getVerts().p2.getValue(), voxel.getVerts().p6.getValue());
            }
            if (bits & 2048) {
                vertexlist[11] = MarchingCubeRendering.VertexInterpolate(isolevel, voxel.getVerts().p3.getPosition(), voxel.getVerts().p7.getPosition(), voxel.getVerts().p3.getValue(), voxel.getVerts().p7.getValue());
            }

            // The following is from Lee Stemkoski's example and
            // deals with construction of the polygons and adding to
            // the scene.
            // http://stemkoski.github.io/Three.js/Marching-Cubes.html
            // construct triangles -- get correct vertices from triTable.
            var i = 0;
            cubeIndex <<= 4;  // multiply by 16...
            // "Re-purpose cubeindex into an offset into triTable."
            //  since each row really isn't a row.
            // the while loop should run at most 5 times,
            //   since the 16th entry in each row is a -1.
            while (THREE.triTable[ cubeIndex + i ] != -1) {
                var index1 = THREE.triTable[cubeIndex + i];
                var index2 = THREE.triTable[cubeIndex + i + 1];
                var index3 = THREE.triTable[cubeIndex + i + 2];
                geometry.vertices.push(vertexlist[index1].clone());
                geometry.vertices.push(vertexlist[index2].clone());
                geometry.vertices.push(vertexlist[index3].clone());
                var face = new THREE.Face3(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                geometry.faces.push(face);
                geometry.faceVertexUvs[ 0 ].push([ new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1) ]);
                vertexIndex += 3;
                i += 3;
            }

            geometry.computeCentroids();
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();


            //console.log(geometry.vertices.length);

            return geometry;
        }


        public static MarchingCubeCustom(voxelRef:Voxel.VoxelState2, horizontalLines:Geometry.Collection<Geometry.ILine>, verticalLines:Geometry.Collection<Geometry.ILine>, worldSize:number, blockSize:number, material:THREE.MeshPhongMaterial):THREE.Mesh {

            // Top Slice 4, 5, 6, 7
            // Bottom Slice 0, 1, 2, 3
            // Near 0, 1, 4, 5
            // Far 2, 3, 6, 7

            // Complie cube index simalar to previous MC algorithm and check color for each of the vox corners with the relevant image slice and check
            // for the matching color
            var geometry = new THREE.Geometry();
            var vertexIndex = 0;
            var vertexlist = [];

            var cubeIndex = 0;

            if (voxelRef.getVerts().p0.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 1;
                voxelRef.getVerts().p0.setIsInside(true);
            }   //0
            if (voxelRef.getVerts().p1.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 2;
                voxelRef.getVerts().p1.setIsInside(true);
            }  //1
            if (voxelRef.getVerts().p2.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 4;
                voxelRef.getVerts().p2.setIsInside(true);
            } //2
            if (voxelRef.getVerts().p3.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 8;
                voxelRef.getVerts().p3.setIsInside(true);
            }  //3
            if (voxelRef.getVerts().p4.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 16;
                voxelRef.getVerts().p4.setIsInside(true);
            }   //4
            if (voxelRef.getVerts().p5.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 32;
                voxelRef.getVerts().p5.setIsInside(true);
            }  //5
            if (voxelRef.getVerts().p6.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 64;
                voxelRef.getVerts().p6.setIsInside(true);
            } //6
            if (voxelRef.getVerts().p7.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 128;
                voxelRef.getVerts().p7.setIsInside(true);
            }  //7

            // then perforom custom vertex interpolation where we walk along a line and determine where the transition from inside to
            // outside takes place and we mark (may need to do some interpolation) where that vertex should go.
            var bits = THREE.edgeTable[ cubeIndex ];
            //if (bits === 0 ) continue;

            if (bits & 1) {
                vertexlist[0] = MarchingCubeRendering.CalculateAValueForEachVertexPassedIn(voxelRef.getVerts().p0, voxelRef.getVerts().p1); // p0 p1 H
            }
            if (bits & 2) {
                vertexlist[1] = MarchingCubeRendering.CalculateAValueForEachVertexPassedIn(voxelRef.getVerts().p1, voxelRef.getVerts().p2); // 1 2 H
            }
            if (bits & 4) {
                vertexlist[2] = MarchingCubeRendering.CalculateAValueForEachVertexPassedIn(voxelRef.getVerts().p2, voxelRef.getVerts().p3); // 2 3 H
            }
            if (bits & 8) {
                vertexlist[3] = MarchingCubeRendering.CalculateAValueForEachVertexPassedIn(voxelRef.getVerts().p3, voxelRef.getVerts().p0); // 3 0 H
            }
            if (bits & 16) {
                vertexlist[4] = MarchingCubeRendering.CalculateAValueForEachVertexPassedIn(voxelRef.getVerts().p4, voxelRef.getVerts().p5); // 4 5 H
            }
            if (bits & 32) {
                vertexlist[5] = MarchingCubeRendering.CalculateAValueForEachVertexPassedIn(voxelRef.getVerts().p5, voxelRef.getVerts().p6); // 5 6 H
            }
            if (bits & 64) {
                vertexlist[6] = MarchingCubeRendering.CalculateAValueForEachVertexPassedIn(voxelRef.getVerts().p6, voxelRef.getVerts().p7); // 6 7 H
            }
            if (bits & 128) {
                vertexlist[7] = MarchingCubeRendering.CalculateAValueForEachVertexPassedIn(voxelRef.getVerts().p7, voxelRef.getVerts().p4); // 7 4 H
            }
            if (bits & 256) {
                vertexlist[8] = MarchingCubeRendering.CalculateAValueForEachVertexPassedIn(voxelRef.getVerts().p0, voxelRef.getVerts().p4); // 0 4 V
            }
            if (bits & 512) {
                vertexlist[9] = MarchingCubeRendering.CalculateAValueForEachVertexPassedIn(voxelRef.getVerts().p1, voxelRef.getVerts().p5); // 1 5 V
            }
            if (bits & 1024) {
                vertexlist[10] = MarchingCubeRendering.CalculateAValueForEachVertexPassedIn(voxelRef.getVerts().p2, voxelRef.getVerts().p6); // 2 6 V
            }
            if (bits & 2048) {
                vertexlist[11] = MarchingCubeRendering.CalculateAValueForEachVertexPassedIn(voxelRef.getVerts().p3, voxelRef.getVerts().p7); // 3 7 V
            }

            // The following is from Lee Stemkoski's example and
            // deals with construction of the polygons and adding to
            // the scene.
            // http://stemkoski.github.io/Three.js/Marching-Cubes.html
            // construct triangles -- get correct vertices from triTable.
            var i = 0;
            cubeIndex <<= 4;  // multiply by 16...
            // "Re-purpose cubeindex into an offset into triTable."
            //  since each row really isn't a row.
            // the while loop should run at most 5 times,
            //   since the 16th entry in each row is a -1.
            while (THREE.triTable[ cubeIndex + i ] != -1) {
                var index1 = THREE.triTable[cubeIndex + i];
                var index2 = THREE.triTable[cubeIndex + i + 1];
                var index3 = THREE.triTable[cubeIndex + i + 2];
                geometry.vertices.push(vertexlist[index1].clone());
                geometry.vertices.push(vertexlist[index2].clone());
                geometry.vertices.push(vertexlist[index3].clone());
                var face = new THREE.Face3(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                geometry.faces.push(face);
                geometry.faceVertexUvs[ 0 ].push([ new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1) ]);
                vertexIndex += 3;
                i += 3;
            }

            geometry.computeCentroids();
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();

            console.log("Array => " + geometry.vertices.length);

            return new THREE.Mesh(geometry, material);
        }

        public static CalculateAValueForEachVertexPassedIn(c1:Voxel.VoxelCornerInfo, c2:Voxel.VoxelCornerInfo):THREE.Vector3 {

            var array = new Geometry.Collection<Geometry.ILine>();
            // Find common matching line which:
            // is parallel
            // and at least one point is contained on that line
            var direction = new THREE.Vector3();
            direction.subVectors(c2.getPosition(), c1.getPosition());
            direction.normalize();

            // x - x -> Horizontal
            if (direction.angleTo(new THREE.Vector3(1, 0, 0)) * (180 / Math.PI) === 0 || direction.angleTo(new THREE.Vector3(1, 0, 0)) * (180 / Math.PI) === 180) {
                if (c1.getIsInside()) {
                    _.each(c1.getAllContainingRayLines().getArray(), elm => {
                        var el = <Geometry.ILine>elm;
                        var angle = el.getDirection().angleTo(direction) * (180 / Math.PI);
                        if (angle === 0 || angle === 180) {
                            array.addUnique(elm);
                        }
                    });
                }

                if (c2.getIsInside()) {
                    _.each(c2.getAllContainingRayLines().getArray(), elm => {
                        var el = <Geometry.ILine>elm;
                        var angle = el.getDirection().angleTo(direction) * (180 / Math.PI);
                        if (angle === 0 || angle === 180) {
                            array.addUnique(elm);
                        }
                    });
                }

            }

            // z - z -> Horizontal
            if (direction.angleTo(new THREE.Vector3(0, 0, 1)) * (180 / Math.PI) === 0 || direction.angleTo(new THREE.Vector3(0, 0, 1)) * (180 / Math.PI) === 180) {
                if (c1.getIsInside()) {
                    _.each(c1.getAllContainingRayLines().getArray(), elm => {
                        var el = <Geometry.ILine>elm;
                        var angle = el.getDirection().angleTo(direction) * (180 / Math.PI);
                        if (angle === 0 || angle === 180) {
                            array.addUnique(elm);
                        }
                    });
                }

                if (c2.getIsInside()) {
                    _.each(c2.getAllContainingRayLines().getArray(), elm => {
                        var el = <Geometry.ILine>elm;
                        var angle = el.getDirection().angleTo(direction) * (180 / Math.PI);
                        if (angle === 0 || angle === 180) {
                            array.addUnique(elm);
                        }
                    });
                }

            }

            // or

            // y - y -> Vertical
            if (direction.angleTo(new THREE.Vector3(0, 1, 0)) * (180 / Math.PI) === 0 || direction.angleTo(new THREE.Vector3(0, 1, 0)) * (180 / Math.PI) === 180) {
                if (c1.getIsInside()) {
                    _.each(c1.getAllContainingRayLines().getArray(), elm => {
                        var el = <Geometry.ILine>elm;
                        var angle = el.getDirection().angleTo(direction) * (180 / Math.PI);
                        if (angle === 0 || angle === 180) {
                            array.addUnique(elm);
                        }
                    });
                }

                if (c2.getIsInside()) {
                    _.each(c2.getAllContainingRayLines().getArray(), elm => {
                        var el = <Geometry.ILine>elm;
                        var angle = el.getDirection().angleTo(direction) * (180 / Math.PI);
                        if (angle === 0 || angle === 180) {
                            array.addUnique(elm);
                        }
                    });
                }

            }

            if (array.length() > 0) {
                c1.setValue(Math.abs(Geometry.GeometryHelper.shortestDistanceBetweenTwoVector3(c1.getPosition(), array.get(0).start, array.get(0).end)));
                if (c1.getIsInside()) c1.setValue(c1.getValue() * -1)

                c2.setValue(Math.abs(Geometry.GeometryHelper.shortestDistanceBetweenTwoVector3(c2.getPosition(), array.get(0).start, array.get(0).end)));
                if (c2.getIsInside()) c2.setValue(c2.getValue() * -1)
            }

            return MarchingCubeRendering.VertexInterpolate(0, c1.getPosition(), c2.getPosition(), c1.getValue(), c2.getValue());
        }


        public static VertexInterpolate(threshold:number, p1pos:THREE.Vector3, p2pos:THREE.Vector3, v1Value:number, v2Value:number):THREE.Vector3 {
            // http://paulbourke.net/geometry/polygonise/
            console.log("Interpolationg... ");
            var mu = (threshold - v1Value) / (v2Value - v1Value);

            var p = new THREE.Vector3();

            if (Math.abs(threshold - v1Value) < 0.00001)
                return p1pos;
            if (Math.abs(threshold - v2Value) < 0.00001)
                return p2pos;
            if (Math.abs(v1Value - v2Value) < 0.00001)
                return p1pos;

            p.x = p1pos.x + mu * (p2pos.x - p1pos.x);
            p.y = p1pos.y + mu * (p2pos.y - p1pos.y);
            p.z = p1pos.z + mu * (p2pos.z - p1pos.z);

            return p;
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

module Imaging {

    export interface IHorizontalImageSlice {
        top : HTMLCanvasElement;
        bottom : HTMLCanvasElement;
    }

    export interface IVerticalImageSlice {
        near : HTMLCanvasElement;
        far : HTMLCanvasElement;
    }

    export class CanvasRender {
        public drawCanvas(name:string, arrayOfLines:Array<Geometry.ILine>, translateTo:THREE.Vector3, orientation:number, drawGrid:boolean, worldSize:number, blockSize:number):HTMLCanvasElement {
            var trans = Geometry.GeometryHelper.vectorBminusVectorA(new THREE.Vector3(0, 0, 0), translateTo);

            var lines2D = [];

            //var test2 = new THREE.Vector3().addVectors(test, trans);
            for (var i = 0; i < arrayOfLines.length; i++) {
                var pt3entry = new THREE.Vector3().addVectors(arrayOfLines[i].start, trans);
                var pt3exit = new THREE.Vector3().addVectors(arrayOfLines[i].end, trans);

                if (orientation === 0) // hor
                {
                    var pt2entry = new THREE.Vector2(Math.abs(pt3entry.x), Math.abs(pt3entry.z));
                    var pt2exit = new THREE.Vector2(Math.abs(pt3exit.x), Math.abs(pt3exit.z));
                }
                else // vert
                {
                    var pt2entry = new THREE.Vector2(Math.abs(pt3entry.x), Math.abs(pt3entry.y));
                    var pt2exit = new THREE.Vector2(Math.abs(pt3exit.x), Math.abs(pt3exit.y));
                }

                lines2D.push({entry: pt2entry, exit: pt2exit});
            }

            var canvas = <HTMLCanvasElement>document.createElement('canvas');
            canvas.width = worldSize;
            canvas.height = worldSize;

            if (canvas.getContext) {
                ctx = canvas.getContext('2d');

                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.beginPath();

                if (drawGrid) {
                    ctx.lineWidth = 1;
                    for (var i = 0; i <= canvas.width; i += blockSize) {
                        ctx.moveTo(i, 0);
                        ctx.lineTo(i, canvas.height + 0.5);
                        ctx.moveTo(0, i);
                        ctx.lineTo(canvas.width + 0.5, i);
                        ctx.strokeStyle = "white";
                        ctx.stroke();
                        ctx.fill();
                    }
                }

                ctx.fillStyle = 'white'
                ctx.font = "bold 12px sans-serif";
                ctx.fillText(name, 10, 20);

                ctx.fill();
                ctx.closePath();

                var ctx = canvas.getContext('2d');
                //ctx.clearRect(0, 0, 1200, 400);
                //canvas.width = canvas.width;

                for (var a = 0; a < lines2D.length; a++) {
                    ctx.beginPath();
                    ctx.moveTo(lines2D[a].entry.x, lines2D[a].entry.y);
                    ctx.lineTo(lines2D[a].exit.x, lines2D[a].exit.y);
                    ctx.strokeStyle = "red";
                    ctx.stroke();
                    ctx.fill();
                    ctx.closePath();
                }
            }

            return canvas;
        }

        public drawImage(canvasID:string, imageToSuperImpose:any) {
            var canvas = <HTMLCanvasElement>document.getElementById(canvasID);
            var f = imageToSuperImpose.height / imageToSuperImpose.width;
            var newHeight = canvas.width * f;
            canvas.getContext('2d').drawImage(imageToSuperImpose, 0, 0, imageToSuperImpose.width, imageToSuperImpose.height, 0, 0, canvas.width, newHeight);

        }

        // Same as above but cant overload like typ OO method as this being compiled to JS and JS doesnt recognise types
        public drawImage2(canvas:HTMLCanvasElement, imageToSuperImpose:any) {
            var f = imageToSuperImpose.height / imageToSuperImpose.width;
            var newHeight = canvas.width * f;
            canvas.getContext('2d').drawImage(imageToSuperImpose, 0, 0, imageToSuperImpose.width, imageToSuperImpose.height, 0, 0, canvas.width, newHeight);

        }

        public drawAllImages(arrayOfHorizontalSlices:Array<IHorizontalImageSlice>, arrayOfVerticalSlices:Array<IVerticalImageSlice>, horizontalElemID:string, verticalElemID:string):void {

            var elem = <HTMLElement>document.getElementById(horizontalElemID);

            _.each(arrayOfHorizontalSlices, (slice) => {
                var i = <IHorizontalImageSlice>slice;

                var canvasL = <HTMLCanvasElement>document.createElement('canvas');
                canvasL.width = 400;
                canvasL.height = 400;
                var canvasR = <HTMLCanvasElement>document.createElement('canvas');
                canvasR.width = 400;
                canvasR.height = 400;

                this.drawImage2(canvasL, i.bottom);
                elem.appendChild(canvasL);

                this.drawImage2(canvasR, i.top);
                elem.appendChild(canvasR);

                var br = document.createElement('br');
                elem.appendChild(br);
            });

            elem = <HTMLElement>document.getElementById(verticalElemID);

            _.each(arrayOfVerticalSlices, (slice) => {
                var i = <IVerticalImageSlice>slice;

                var canvasL = <HTMLCanvasElement>document.createElement('canvas');
                canvasL.width = 400;
                canvasL.height = 400;


                var canvasR = <HTMLCanvasElement>document.createElement('canvas');
                canvasR.width = 400;
                canvasR.height = 400;


                this.drawImage2(canvasL, i.near);
                elem.appendChild(canvasL);

                this.drawImage2(canvasR, i.far);
                elem.appendChild(canvasR);

                var br = document.createElement('br');
                elem.appendChild(br);
            });


        }

    }


}

module Controller {


    export interface ISphereSkeleton {
        points : Array<THREE.Vector3>;
        lines : Array<THREE.Line>;
    }

    export class ControlSphere {
        private id:number;
        private N:number;
        private M:number;
        private radius:number;
        private _scene:THREE.Scene;
        private _nodeSize:number;
        private _nodeVelocity:THREE.Vector3;
        private _nodeMass:number;
        private _nodes:Array<Geometry.Node>;
        private _faces:Array<Geometry.MeshExtended>;
        private _octreeForNodes:any;
        private _octreeForFaces:any;
        private _sphereSkeleton:ISphereSkeleton;

        constructor(id:number, segments:number, radius:number, scene:THREE.Scene, size:number, velocity:THREE.Vector3, mass:number) {
            this.id = id;
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

        public getNodes():Array<Geometry.Node> {
            return this._nodes;
        }

        public getSphereSkeleton():ISphereSkeleton {
            return this._sphereSkeleton
        }


        public getOctreeForNodes():any {
            return this._octreeForNodes;
        }

        public getOctreeForFaces():any {
            return this._octreeForFaces;
        }

        public toggleVisibility():void {
            for (var i = 0; i < this._faces.length; i++) {
                this._faces[i].visible = this._faces[i].visible !== true;
                this._faces[i].toggleNormalVisibility();
            }

            for (var i = 0; i < this._nodes.length; i++) {
                this._nodes[i].visible = this._nodes[i].visible !== true;
            }
        }


        private generateSphereVerticesandLineConnectors():void {
            var points = [];
            var lines = [];
            for (var m = 0; m < this.M + 1; m++)
                for (var n = 0; n < this.N; n++) {
                    // http://stackoverflow.com/a/4082020
                    var x = (Math.sin(Math.PI * m / this.M) * Math.cos(2 * Math.PI * n / this.N)) * this.radius;
                    var y = (Math.sin(Math.PI * m / this.M) * Math.sin(2 * Math.PI * n / this.N)) * this.radius;
                    var z = (Math.cos(Math.PI * m / this.M)) * this.radius;

                    var p = new Geometry.Vector3Extended(x, y, z);

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

            this._sphereSkeleton = {points: unique, lines: lines };

        }


        public generateSphere():void {

            this.generateSphereVerticesandLineConnectors();


            for (var i = 0; i < this._sphereSkeleton.points.length; i++) {
                var point = this._sphereSkeleton.points[i];
                var geometry = new THREE.SphereGeometry(this._nodeSize, 5, 5);
                var material = new THREE.MeshBasicMaterial({color: 0x8888ff});
                var node = new Geometry.Node(geometry, material);
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

            Implementation.Sculpt2.Worker.postMessage({id: this.id, command: "calculateMeshFacePositions", particles: JSON.stringify(positions), segments: this.N});

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
                var object = new Geometry.MeshExtended(this._scene, geom, mat);
                object.positionRef.push(this._scene.getObjectById(item.a.nodeId, true), this._scene.getObjectById(item.b.nodeId, true), this._scene.getObjectById(item.c.nodeId, true));

                this._faces.push(object);
                this._scene.add(object);
                this._octreeForFaces.add(object);
            }
        }

        public update(inverted:number):void {
            if (this._faces) {
                _.each(this._faces, (face) => {
                    face.updateVertices();
                    face.calculateNormal(inverted);
                });
            }

            if (this._octreeForFaces && this._octreeForNodes) {
                this._octreeForFaces.update();
                this._octreeForNodes.update();
            }
        }
    }
}







