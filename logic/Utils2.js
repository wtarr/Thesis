var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../lib/three.d.ts" />
/// <reference path="../lib/jquery.d.ts"/>
var Voxel;
(function (Voxel) {
    var Node = (function (_super) {
        __extends(Node, _super);
        function Node(geom, mat) {
            _super.call(this);
            this.geometry = geom;
            this.material = mat;
            this._velocity = new THREE.Vector3();
            this._neighbourhoodNodes = new Collection();
        }
        Node.prototype.getMass = function () {
            return this._mass;
        };

        Node.prototype.setMass = function (mass) {
            this._mass = mass;
        };

        Node.prototype.getVelocity = function () {
            return undefined;
        };

        Node.prototype.setVelocity = function (velocity) {
            this._velocity = velocity;
        };

        Node.prototype.addToNeigbourhoodNodes = function (node) {
            this._neighbourhoodNodes.add(node);
        };

        Node.prototype.getNeigbourhoodNodes = function () {
            return this._neighbourhoodNodes;
        };

        Node.prototype.getNodePosition = function () {
            return this.position;
        };

        Node.prototype.update = function (delta, force) {
            this.getVelocity().add(force);
            this.getVelocity().multiplyScalar(delta);
            this.getNodePosition().add(this._velocity);
        };
        return Node;
    })(THREE.Mesh);
    Voxel.Node = Node;

    var Spring = (function () {
        function Spring(scene, node1, node2, strength, length) {
            this._visible = false;
            this._node1 = node1;
            this._node2 = node2;
            this._length = length;
            this._strength = strength;
            this._distance = this._node1.getNodePosition().distanceTo(this._node2.getNodePosition());

            // Helper / Debug code
            this._lineGeo = new THREE.Geometry();
            this._lineGeo.vertices.push(this._node1.getNodePosition(), this._node2.getNodePosition());
            this._lineGeo.computeLineDistances();
            this._lineGeo.dynamic = true;

            var lineMAT = new THREE.LineBasicMaterial({ color: 0xCC0000 });
            this._line = new THREE.Line(this._lineGeo, lineMAT);
            this._line.visible = this._visible;

            scene.add(this._line);
        }
        Spring.prototype.update = function (delta) {
            var force = (this._length - this.getDistance()) * this._strength;

            var a1 = force / this._node1.getMass();
            var a2 = force / this._node2.getMass();

            var n1 = new THREE.Vector3, n2 = new THREE.Vector3;

            n1.subVectors(this._node1.getNodePosition(), this._node2.getNodePosition()).normalize().multiplyScalar(a1);
            n2.subVectors(this._node2.getNodePosition(), this._node2.getNodePosition()).normalize().multiplyScalar(a2);

            this._node1.update(delta, n1);
            this._node2.update(delta, n2);

            this._lineGeo.vertices[0] = this._node1.getNodePosition();
            this._lineGeo.vertices[1] = this._node2.getNodePosition();

            this._lineGeo.verticesNeedUpdate = true;
        };

        Spring.prototype.getDistance = function () {
            return this._node1.getNodePosition().distanceTo(this._node2.getNodePosition());
        };
        return Spring;
    })();
    Voxel.Spring = Spring;

    var Sphere2 = (function () {
        function Sphere2(x, y, z, r) {
            this.radius = r;
            this.center = new THREE.Vector3(x, y, z);
        }
        Sphere2.prototype.isColliding = function (position) {
            var distance = this.center.distanceTo(position);
            return distance < this.radius;
        };
        return Sphere2;
    })();
    Voxel.Sphere2 = Sphere2;

    var GridCreator = (function () {
        function GridCreator(wSize, bSize, gridColor) {
            this._geo = new THREE.Geometry();
            this._color = 0x25F500;
            this._gridMaterial = new THREE.LineBasicMaterial({ color: this._color, opacity: 0.5 });
            this._size = wSize / 2;
            this._blockSize = bSize;
            this._color = gridColor;
        }
        GridCreator.prototype.buildAxisAligned2DGrids = function () {
            for (var i = -this._size; i <= this._size; i += this._blockSize) {
                for (var level = -this._size; level <= this._size; level += this._blockSize) {
                    this._geo.vertices.push(new THREE.Vector3(-this._size, level, i));
                    this._geo.vertices.push(new THREE.Vector3(this._size, level, i));
                    this._geo.vertices.push(new THREE.Vector3(i, level, -this._size));
                    this._geo.vertices.push(new THREE.Vector3(i, level, this._size));
                }
            }
            return this._geo;
        };

        GridCreator.prototype.build3DGrid = function (geometryH, geometryV) {
            var lineH = new THREE.Line(geometryH, this._gridMaterial);
            var lineV = new THREE.Line(geometryV, this._gridMaterial);

            lineH.type = THREE.LinePieces;
            lineV.type = THREE.LinePieces;
            lineV.rotation.x = Math.PI / 2;

            return { liH: lineH, liV: lineV };
        };
        return GridCreator;
    })();
    Voxel.GridCreator = GridCreator;

    var Collection = (function () {
        function Collection() {
            this._array = [];
        }
        Collection.prototype.add = function (item) {
            // TODO
            this._array.push(item);
        };

        Collection.prototype.clearAll = function () {
            // TODO
        };

        Collection.prototype.removeSpecific = function () {
            // TODO
        };

        Collection.prototype.length = function () {
            return this._array.length;
        };
        return Collection;
    })();
    Voxel.Collection = Collection;

    var VoxelCornerInfo = (function () {
        function VoxelCornerInfo() {
            this._id = '';
            this._inside = false;
            this._position = new THREE.Vector3(0, 0, 0);
            this._value = 0;
            this._connectedTo = [];
        }
        VoxelCornerInfo.prototype.getId = function () {
            return this._id;
        };

        VoxelCornerInfo.prototype.getIsInside = function () {
            return this._inside;
        };

        VoxelCornerInfo.prototype.setPostion = function (position) {
            this._position = position;
        };

        VoxelCornerInfo.prototype.getPosition = function () {
            return this._position;
        };

        VoxelCornerInfo.prototype.getValue = function () {
            return this._value;
        };

        VoxelCornerInfo.prototype.getConnectedTo = function () {
            return this._connectedTo;
        };

        VoxelCornerInfo.prototype.setConnectedTo = function (points) {
            this._connectedTo = points;
        };
        return VoxelCornerInfo;
    })();
    Voxel.VoxelCornerInfo = VoxelCornerInfo;

    var Verts = (function () {
        function Verts() {
            this.p0 = new VoxelCornerInfo();
            this.p1 = new VoxelCornerInfo();
            this.p2 = new VoxelCornerInfo();
            this.p3 = new VoxelCornerInfo();
            this.p4 = new VoxelCornerInfo();
            this.p5 = new VoxelCornerInfo();
            this.p6 = new VoxelCornerInfo();
            this.p7 = new VoxelCornerInfo();
        }
        return Verts;
    })();
    Voxel.Verts = Verts;

    var VoxelState2 = (function (_super) {
        __extends(VoxelState2, _super);
        function VoxelState2(center, blockSize) {
            _super.call(this);
            this._centerPosition = center;
            this._blockSize = blockSize;
            this._verts = new Verts();
        }
        VoxelState2.prototype.getCenter = function () {
            return this._centerPosition;
        };

        VoxelState2.prototype.getVerts = function () {
            return this._verts;
        };

        VoxelState2.prototype.calculateVoxelVertexPositions = function () {
            this._verts.p0.setPostion(new THREE.Vector3(this._centerPosition.x - this._blockSize / 2, this._centerPosition.y - this._blockSize / 2, this._centerPosition.z - this._blockSize / 2)); //   -1, -1, -1 = 0
            this._verts.p1.setPostion(new THREE.Vector3(this._centerPosition.x + this._blockSize / 2, this._centerPosition.y - this._blockSize / 2, this._centerPosition.z - this._blockSize / 2)); //    1, -1, -1 = 1
            this._verts.p2.setPostion(new THREE.Vector3(this._centerPosition.x + this._blockSize / 2, this._centerPosition.y - this._blockSize / 2, this._centerPosition.z + this._blockSize / 2)); //    1, -1 , 1 = 2
            this._verts.p3.setPostion(new THREE.Vector3(this._centerPosition.x - this._blockSize / 2, this._centerPosition.y - this._blockSize / 2, this._centerPosition.z + this._blockSize / 2)); //   -1, -1 , 1 = 3
            this._verts.p4.setPostion(new THREE.Vector3(this._centerPosition.x - this._blockSize / 2, this._centerPosition.y + this._blockSize / 2, this._centerPosition.z - this._blockSize / 2)); //   -1,  1, -1 = 4
            this._verts.p5.setPostion(new THREE.Vector3(this._centerPosition.x + this._blockSize / 2, this._centerPosition.y + this._blockSize / 2, this._centerPosition.z - this._blockSize / 2)); //    1,  1, -1 = 5
            this._verts.p6.setPostion(new THREE.Vector3(this._centerPosition.x + this._blockSize / 2, this._centerPosition.y + this._blockSize / 2, this._centerPosition.z + this._blockSize / 2)); //    1,  1,  1 = 6
            this._verts.p7.setPostion(new THREE.Vector3(this._centerPosition.x - this._blockSize / 2, this._centerPosition.y + this._blockSize / 2, this._centerPosition.z + this._blockSize / 2)); //    -1,  1,  1 = 7
        };

        VoxelState2.prototype.setVertexValues = function () {
            // TODO
        };

        VoxelState2.prototype.setConnectedTos = function () {
            this._verts.p0.setConnectedTo([this._verts.p1, this._verts.p3, this._verts.p4]);
            this._verts.p1.setConnectedTo([this._verts.p0, this._verts.p2, this._verts.p5]);
            this._verts.p2.setConnectedTo([this._verts.p1, this._verts.p3, this._verts.p6]);
            this._verts.p3.setConnectedTo([this._verts.p0, this._verts.p2, this._verts.p7]);

            this._verts.p4.setConnectedTo([this._verts.p0, this._verts.p5, this._verts.p7]);
            this._verts.p5.setConnectedTo([this._verts.p1, this._verts.p4, this._verts.p6]);
            this._verts.p6.setConnectedTo([this._verts.p2, this._verts.p5, this._verts.p7]);
            this._verts.p7.setConnectedTo([this._verts.p3, this._verts.p4, this._verts.p6]);
        };
        return VoxelState2;
    })(THREE.Mesh);
    Voxel.VoxelState2 = VoxelState2;

    var Level = (function () {
        function Level() {
            this._level = new Array();
        }
        Level.prototype.addToLevel = function (vox) {
            this._level.push(vox);
        };

        Level.prototype.getLevel = function () {
            return this._level;
        };
        return Level;
    })();
    Voxel.Level = Level;

    var VoxelWorld = (function () {
        function VoxelWorld(worldSize, voxelSize) {
            this._worldSize = worldSize;
            this._voxelSize = voxelSize;
            this._worldVoxelArray = [];
            this._voxelPerLevel = Math.pow(worldSize / voxelSize, 2);
            this._numberlevels = Math.sqrt(this._voxelPerLevel);

            this.buildWorldVoxelPositionArray();
        }
        VoxelWorld.prototype.getWorldVoxelArray = function () {
            return this._worldVoxelArray;
        };

        VoxelWorld.prototype.getNumberOfVoxelsPerLevel = function () {
            return this._voxelPerLevel;
        };

        VoxelWorld.prototype.getNumberOfLevelsInVoxelWorld = function () {
            return this._numberlevels;
        };

        VoxelWorld.prototype.buildWorldVoxelPositionArray = function () {
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
        };
        return VoxelWorld;
    })();
    Voxel.VoxelWorld = VoxelWorld;
})(Voxel || (Voxel = {}));

var Helper;
(function (Helper) {
    var jqhelper = (function () {
        function jqhelper() {
        }
        jqhelper.getScreenWH = function (id) {
            var wh = [];
            var w = $(id).width();
            var h = $(id).height();
            wh.push(w, h);
            return wh;
        };

        jqhelper.appendToScene = function (id, renderer) {
            $(id).append(renderer.domElement);
        };
        return jqhelper;
    })();
    Helper.jqhelper = jqhelper;
})(Helper || (Helper = {}));

var testModule;
(function (testModule) {
    var test1 = (function () {
        function test1(name) {
            this._name = name;
        }
        test1.prototype.getName = function () {
            return this._name;
        };
        return test1;
    })();
    testModule.test1 = test1;

    var test2 = (function () {
        function test2(name) {
            this._t1 = new test1(name);
        }
        test2.prototype.getName = function () {
            return this._t1.getName();
        };
        return test2;
    })();
    testModule.test2 = test2;
})(testModule || (testModule = {}));
//# sourceMappingURL=Utils2.js.map
