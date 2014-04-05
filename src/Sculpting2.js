/**
* Created by wtarrant on 28/02/14.
*/
/// <reference path="../lib/knockout.d.ts" />
/// <reference path="../lib/underscore.d.ts" />
/// <reference path="Utils2.ts" />

//declare module THREE { export var Octree }
var NoiseRenderingImplementation;
(function (NoiseRenderingImplementation) {
    var ToggleGridCommand = (function () {
        function ToggleGridCommand(sculpt) {
            this._sculpt = sculpt;
        }
        ToggleGridCommand.prototype.execute = function () {
            this._sculpt.toggleGrid();
        };
        return ToggleGridCommand;
    })();
    NoiseRenderingImplementation.ToggleGridCommand = ToggleGridCommand;

    var ImageItem = (function () {
        function ImageItem(src, caption) {
            this.src = src;
            this.caption = caption;
        }
        return ImageItem;
    })();
    NoiseRenderingImplementation.ImageItem = ImageItem;

    var GUI = (function () {
        function GUI() {
            this.buttons = ko.observableArray();
            ko.applyBindings(this, $('#buttons')[0]);
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
    NoiseRenderingImplementation.GUI = GUI;

    var InfoViewModel = (function () {
        function InfoViewModel() {
            this.CursorPos = ko.observable();
            this.CursorLvl = ko.observable();
            this.DebugMsg = ko.observable();
        }
        return InfoViewModel;
    })();
    NoiseRenderingImplementation.InfoViewModel = InfoViewModel;

    var NoiseRender = (function () {
        function NoiseRender(gui) {
            this._worldSize = 400;
            this._blockSize = 20;
            this._gridColor = 0x25F500;
            this._lblVisibility = true;
            this._gui = gui;
            this.info = new InfoViewModel();
            ko.applyBindings(this.info, $('#info')[0]);
            this.initialise();
            this.animate();
        }
        NoiseRender.prototype.initialise = function () {
            var _this = this;
            this._clock = new THREE.Clock();

            try  {
                NoiseRender.Worker = new Worker('../src/worker2.js');
                NoiseRender.Worker.addEventListener('message', this.onMessageReceived.bind(this), false); // listen for callbacks
            } catch (e) {
                alert("Unable to load worker");
            }

            NoiseRender.GlobalControlsEnabled = true;
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

            var pointColor = 0xFFFFFF;
            this.initialiseSpotLighting(pointColor, 7000);

            this._renderer = new THREE.WebGLRenderer();
            this._renderer.setClearColor(new THREE.Color(0xEEEfff), 1);
            this._renderer.setSize(this._screenWidth, this._screenHeight);

            var gridCreator = new Geometry.GridCreator(this._worldSize, this._blockSize, this._gridColor);
            var gridGeometryH = gridCreator.buildAxisAligned2DGrids();
            var gridGeometryV = gridCreator.buildAxisAligned2DGrids();
            this._grid = gridCreator.build3DGrid(gridGeometryH, gridGeometryV);
            if (this._blockSize >= 10) {
                this._scene.add(this._grid.liH);
                this._scene.add(this._grid.liV);
            }

            this._gui.addButton(new GUIUTILS.Button('Toggle', 'Toggle Grid', 'Allows the grid to be toggled on or off', new ToggleGridCommand(this)));

            var axisHelper = new THREE.AxisHelper(20);
            axisHelper.position = new THREE.Vector3(-1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20);
            this._scene.add(axisHelper);

            Helper.jqhelper.appendToScene('#webgl', this._renderer);

            this._phongMaterial = new THREE.MeshPhongMaterial();
            this._phongMaterial.specular = new THREE.Color(0X9FCFF);
            this._phongMaterial.color = new THREE.Color(0x7375C7);
            this._phongMaterial.emissive = new THREE.Color(0X006063);
            this._phongMaterial.shininess = 10;
            this._phongMaterial.side = THREE.DoubleSide;

            $.ajax({
                dataType: "json",
                url: '..//data//perlin//data.json',
                success: function (data) {
                    _this._voxelWorld = new Voxel.VoxelWorld(_this._worldSize, _this._blockSize, _this._scene, data);
                    var slim = _this._voxelWorld.getSlimWorldVoxelArray();
                    NoiseRenderingImplementation.NoiseRender.Worker.postMessage({ command: "calculateVoxelGeometry", data: slim, threshold: parseInt($('#amount').text()) });
                }
            });

            this.ImageItems = ko.observableArray([]);
            ko.applyBindings(this, $('#images')[0]);

            this.draw();
        };

        NoiseRender.prototype.initialiseCamera = function () {
            this._camera = new THREE.PerspectiveCamera(45, this._screenWidth / this._screenHeight, 0.1, 1500);
            this._camera.position = new THREE.Vector3(0, 200, 600);
            this._camera.lookAt(this._scene.position);
            this._cameraControls = new THREE.OrbitControls(this._camera, this._renderingElement);
            this._cameraControls.domElement = this._renderingElement;
            this._scene.add(this._camera);
        };

        NoiseRender.prototype.initialiseSpotLighting = function (distance, pointcolor) {
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

        NoiseRender.prototype.updateGridColor = function (val) {
            this._gridColor = parseInt(("0x" + val), 16);
            this._grid.liH.material.color.setHex(this._gridColor);
            this._grid.liV.material.color.setHex(this._gridColor);
        };

        NoiseRender.prototype.animate = function () {
            window.requestAnimationFrame(this.animate.bind(this));
            this.update();
            this.draw();
            this._stats.update();
            // TODO
            // Stuff that needs updating
        };

        NoiseRender.prototype.update = function () {
            if (NoiseRender.GlobalControlsEnabled) {
                this._cameraControls.enabled = true;
                this._cameraControls.update();
            } else {
                this._cameraControls.enabled = false;
            }

            if (this._voxelWorld) {
                this._voxelWorld.update(this._camera, this._lblVisibility);
                //this.moveCursor();
            }
        };

        NoiseRender.prototype.draw = function () {
            this._renderer.render(this._scene, this._camera);
        };

        NoiseRender.prototype.toggleGrid = function () {
            if (this._grid.liH.visible) {
                this._grid.liH.visible = false;
                this._grid.liV.visible = false;
            } else {
                this._grid.liH.visible = true;
                this._grid.liV.visible = true;
            }
        };

        NoiseRender.prototype.toggleMesh = function () {
            this._controlSphere.toggleVisibility();
            this._controlSphereInner.toggleVisibility();
        };

        NoiseRender.prototype.regenerateWithNewThreshold = function () {
            if (this._voxelWorld) {
                var slim = this._voxelWorld.getSlimWorldVoxelArray();
                NoiseRenderingImplementation.NoiseRender.Worker.postMessage({ command: "calculateVoxelGeometry", data: slim, threshold: parseInt($('#amount').text()) });
            }
        };

        NoiseRender.prototype.loadDataImages = function (images) {
            this.ImageItems.removeAll();
            this.ImageItems.valueHasMutated();

            for (var i = 0; i < 23; i++) {
                this.ImageItems.push(new ImageItem('../data/' + images.toLowerCase() + '/' + i.toString() + '.jpg', i.toString()));
            }
        };

        NoiseRender.prototype.dataTypeSelectionChange = function (selection) {
            var _this = this;
            if (selection === 'Perlin') {
                $.ajax({
                    dataType: "json",
                    url: '..//data//perlin//data.json',
                    success: function (data) {
                        _this._voxelWorld.setNewVoxelWorldDataValues(data);
                        var slim = _this._voxelWorld.getSlimWorldVoxelArray();
                        NoiseRenderingImplementation.NoiseRender.Worker.postMessage({ command: "calculateVoxelGeometry", data: slim, threshold: parseInt($('#amount').text()) });
                    }
                });
            }

            if (selection === 'Orb') {
                $.ajax({
                    dataType: "json",
                    url: '..//data//orb//data.json',
                    success: function (data) {
                        _this._voxelWorld.setNewVoxelWorldDataValues(data);
                        var slim = _this._voxelWorld.getSlimWorldVoxelArray();
                        NoiseRenderingImplementation.NoiseRender.Worker.postMessage({ command: "calculateVoxelGeometry", data: slim, threshold: parseInt($('#amount').text()) });
                    }
                });
            }

            if (selection === 'Spiral') {
                $.ajax({
                    dataType: "json",
                    url: '..//data//spiral//data.json',
                    success: function (data) {
                        _this._voxelWorld.setNewVoxelWorldDataValues(data);
                        var slim = _this._voxelWorld.getSlimWorldVoxelArray();
                        NoiseRenderingImplementation.NoiseRender.Worker.postMessage({ command: "calculateVoxelGeometry", data: slim, threshold: parseInt($('#amount').text()) });
                    }
                });
            }
        };

        NoiseRender.prototype.onMessageReceived = function (e) {
            if (e.data.commandReturn === 'calculatedVoxelGeometry') {
                this.setMesh(e.data.data);
            }
        };

        NoiseRender.prototype.setMesh = function (data) {
            for (var lvl = 0; lvl < data.length; lvl++) {
                for (var vox = 0; vox < data[lvl].length; vox++) {
                    // TODO - needs investigation into why geometry is sometimes null
                    if (data[lvl][vox].geometry) {
                        var geometry = new THREE.Geometry();
                        geometry.vertices = data[lvl][vox].geometry.vertices;
                        geometry.faces = data[lvl][vox].geometry.faces;
                        geometry.faceVertexUvs = data[lvl][vox].geometry.faceVertexUvs;

                        var m = new THREE.Mesh(geometry, this._phongMaterial);
                        this._voxelWorld.getLevel(lvl).getVoxel(vox).setMesh(this._scene, m);
                    }
                }
            }

            $('#loading').hide();
            //this._locked = false;
            //var m = new THREE.Mesh(<THREE.Geometry>data.data, this._phongMaterial);
            //this._voxelWorld.getLevel(data.level).getVoxel(data.cursorTracker).setMesh(this._scene, m);
        };
        return NoiseRender;
    })();
    NoiseRenderingImplementation.NoiseRender = NoiseRender;
})(NoiseRenderingImplementation || (NoiseRenderingImplementation = {}));
/**
* ##Marching cube code inspired from##
* http://stemkoski.github.io/Three.js/Marching-Cubes.html
* &
* http://paulbourke.net/geometry/polygonise/
*/
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../lib/three.d.ts" />
/// <reference path="../lib/jquery.d.ts"/>
/// <reference path="../lib/underscore.d.ts"/>
/// <reference path="./Sculpting2.ts"/>
/// <reference path="./noiseRendering.ts"/>

var GUIUTILS;
(function (GUIUTILS) {
    var Button = (function () {
        function Button(id, name, tooltip, command) {
            this.Id = id;
            this.Name = name;
            this.Tooltip = tooltip;
            this.Command = command;
        }
        return Button;
    })();
    GUIUTILS.Button = Button;
})(GUIUTILS || (GUIUTILS = {}));

var Observer;
(function (Observer) {
    var Logger = (function () {
        function Logger() {
            this.observers = [];
        }
        Logger.prototype.registerObserver = function (ob) {
            this.observers.push(ob);
        };

        Logger.prototype.removeObserver = function (ob) {
            var i = this.observers.indexOf(ob);
            if (i > 0) {
                if (~i)
                    this.observers.splice(i, 1);
            }
        };

        Logger.prototype.notifyObserver = function () {
        };

        Logger.prototype.setMessage = function (ob) {
            this.message = ob;
            this.messageChanged();
        };

        Logger.prototype.messageChanged = function () {
            this.notifyObserver();
        };
        return Logger;
    })();
    Observer.Logger = Logger;
})(Observer || (Observer = {}));

var Geometry;
(function (Geometry) {
    var Line = (function () {
        function Line(start, end) {
            this.start = start;
            this.end = end;
        }
        Line.prototype.getDirection = function () {
            var temp = new THREE.Vector3();
            temp.subVectors(this.end, this.start).normalize;
            return temp;
        };

        Line.prototype.equals = function (other) {
            if (other.start.equals(this.start) && other.end.equals(this.end))
                return true;
            return false;
        };
        return Line;
    })();
    Geometry.Line = Line;

    var GeometryHelper = (function () {
        function GeometryHelper() {
        }
        GeometryHelper.calculateDistanceBetweenTwoVector3 = function (origin, target) {
            var temp = GeometryHelper.vectorBminusVectorA(target, origin);
            return temp.length();
        };

        GeometryHelper.vectorBminusVectorA = function (b, a) {
            var temp = new THREE.Vector3();
            return temp.subVectors(b, a);
        };

        //http://stackoverflow.com/a/328122
        //http://www.mathworks.com/matlabcentral/newsreader/view_thread/170200
        GeometryHelper.isBetween = function (a, b, c) {
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
            if (dot < 0)
                return false;

            var lengthSqrd = Math.pow(b_minus_a.length(), 2);
            if (dot > lengthSqrd)
                return false;

            return true;
        };

        GeometryHelper.shortestDistanceBetweenTwoVector3 = function (point, v1, v2) {
            var distance1 = point.distanceTo(v1);
            var distance2 = point.distanceTo(v2);

            if (distance1 < distance2)
                return distance1;
            else
                return distance2;
        };
        return GeometryHelper;
    })();
    Geometry.GeometryHelper = GeometryHelper;

    var MeshExtended = (function (_super) {
        __extends(MeshExtended, _super);
        function MeshExtended(scene, geo, mat) {
            _super.call(this);
            this.positionRef = [];
            this._scene = scene;
            this.geometry = geo;
            this.material = mat;
            this._normal = new THREE.Vector3();
            this._lineGeo = new THREE.Geometry();
            this._lineGeo.vertices.push(new THREE.Vector3, new THREE.Vector3);

            this._lineGeo.computeLineDistances();
            this._lineGeo.dynamic = true;
            this._lineMaterial = new THREE.LineBasicMaterial({ color: 0xCC0000 });
            this._line = new THREE.Line(this._lineGeo, this._lineMaterial);
            this._scene.add(this._line);

            this.geometry.verticesNeedUpdate = true;
            this.geometry.normalsNeedUpdate = true;
        }
        MeshExtended.prototype.updateVertices = function () {
            this.geometry.vertices = [];
            this.geometry.vertices.push(this.positionRef[0].position, this.positionRef[1].position, this.positionRef[2].position);
            this.geometry.verticesNeedUpdate = true;
            this.geometry.elementsNeedUpdate = true;

            // this.geometry.morphTargetsNeedUpdate = true;
            this.geometry.uvsNeedUpdate = true;
            this.geometry.normalsNeedUpdate = true;
            this.geometry.colorsNeedUpdate = true;
            this.geometry.tangentsNeedUpdate = true;
        };

        MeshExtended.prototype.calculateNormal = function (inverted) {
            this.geometry.computeCentroids();
            this.geometry.computeFaceNormals();
            this.geometry.computeVertexNormals();

            var vector1 = new THREE.Vector3();
            var vector2 = new THREE.Vector3();
            var crossedVector = new THREE.Vector3();

            if (inverted === 1) {
                vector1.subVectors(this.positionRef[2].position, this.positionRef[0].position);
                vector2.subVectors(this.positionRef[1].position, this.positionRef[0].position);
                crossedVector.crossVectors(vector2, vector1).normalize().multiplyScalar(-5);
            } else if (inverted === 0) {
                vector1.subVectors(this.positionRef[2].position, this.positionRef[0].position);
                vector2.subVectors(this.positionRef[1].position, this.positionRef[0].position);
                crossedVector.crossVectors(vector2, vector1).normalize().multiplyScalar(5);
            }

            var headOfNormal = new THREE.Vector3();
            headOfNormal.addVectors(this.geometry.faces[0].centroid, crossedVector);

            this._line.geometry.vertices[0] = this.geometry.faces[0].centroid;
            this._line.geometry.vertices[1] = headOfNormal;

            this._normal.subVectors(this._line.geometry.vertices[0], this._line.geometry.vertices[1]).normalize();

            this._lineGeo.verticesNeedUpdate = true;
        };

        MeshExtended.prototype.getNormal = function () {
            return this._normal;
        };

        MeshExtended.prototype.toggleNormalVisibility = function () {
            this._line.visible = this._line.visible !== true;
        };
        return MeshExtended;
    })(THREE.Mesh);
    Geometry.MeshExtended = MeshExtended;

    var Vector3Extended = (function (_super) {
        __extends(Vector3Extended, _super);
        function Vector3Extended(x, y, z) {
            var _x = (x === undefined) ? 0 : x;
            var _y = (y === undefined) ? 0 : y;
            var _z = (z === undefined) ? 0 : z;

            _super.call(this, _x, _y, _z);
        }
        Vector3Extended.prototype.equalsWithinTolerence = function (other, tolerence) {
            var dist = this.distanceTo(other);
            return dist <= tolerence;
        };
        return Vector3Extended;
    })(THREE.Vector3);
    Geometry.Vector3Extended = Vector3Extended;

    var Node = (function (_super) {
        __extends(Node, _super);
        function Node(geom, mat) {
            _super.call(this);
            this.geometry = geom;
            this.material = mat;
            this._velocity = new THREE.Vector3();
            this._neighbourhoodNodes = new Collection();
        }
        Node.prototype.getId = function () {
            return this.id;
        };

        Node.prototype.getMass = function () {
            return this._mass;
        };

        Node.prototype.setMass = function (mass) {
            this._mass = mass;
        };

        Node.prototype.getVelocity = function () {
            return this._velocity;
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

        Node.prototype.setNodePosition = function (position) {
            this.position = position;
        };

        Node.prototype.update = function (delta, force) {
            this.getVelocity().add(force);
            this.getVelocity().multiplyScalar(delta);
            this.getNodePosition().add(this._velocity);
        };
        return Node;
    })(THREE.Mesh);
    Geometry.Node = Node;

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
            n2.subVectors(this._node2.getNodePosition(), this._node1.getNodePosition()).normalize().multiplyScalar(a2);

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
    Geometry.Spring = Spring;

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
    Geometry.Sphere2 = Sphere2;

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
    Geometry.GridCreator = GridCreator;

    var Collection = (function () {
        function Collection() {
            this._array = [];
        }
        Collection.prototype.add = function (item) {
            this._array.push(item);
        };

        Collection.prototype.addUnique = function (item) {
            if (this._array.length === 0) {
                this._array.push(item);
            } else {
                if (!this.contains(item, function (a, b) {
                    if (a.equals(b))
                        return true;
                    else
                        return false;
                })) {
                    this._array.push(item);
                }
            }
        };

        Collection.prototype.get = function (i) {
            return this._array[i];
        };

        Collection.prototype.length = function () {
            return this._array.length;
        };

        Collection.prototype.makeUnique = function () {
            var uniq = new Collection();

            for (var i = 0; i < this._array.length; i++) {
                if (!uniq.contains(this._array[i], function (a, b) {
                    if (a.equals(b))
                        return true;
                    else
                        return false;
                })) {
                    uniq.add(this._array[i]);
                }
            }

            var iter = uniq.createInterator();
            this._array = [];

            while (iter.hasNext()) {
                this._array.push(iter.next());
            }
        };

        Collection.prototype.createInterator = function () {
            return new ConcreteIterator(this._array);
        };

        Collection.prototype.contains = function (value, equalsFunction) {
            if (this._array.length > 0) {
                for (var i = 0; i < this._array.length; i++) {
                    if (equalsFunction(value, this._array[i]))
                        return true;
                }
            }
            return false;
        };
        return Collection;
    })();
    Geometry.Collection = Collection;

    var ConcreteIterator = (function () {
        function ConcreteIterator(array) {
            this.collection = array;
            this.position = 0;
        }
        ConcreteIterator.prototype.hasNext = function () {
            return this.position < this.collection.length ? true : false;
        };

        ConcreteIterator.prototype.next = function () {
            try  {
                var result = this.collection[this.position];
                this.position++;
                return result;
            } catch (e) {
                throw "Out of range exception";
            }

            return undefined;
        };
        return ConcreteIterator;
    })();
})(Geometry || (Geometry = {}));

var Voxel;
(function (Voxel) {
    var VoxelCornerInfo = (function () {
        function VoxelCornerInfo(id) {
            this._id = id;
            this._inside = false;
            this._position = new THREE.Vector3(0, 0, 0);
            this._value = 0;
            this._connectedTo = [];
            this._containedInRayLine = new Geometry.Collection();
        }
        VoxelCornerInfo.prototype.getId = function () {
            return this._id;
        };

        VoxelCornerInfo.prototype.getIsInside = function () {
            return this._inside;
        };

        VoxelCornerInfo.prototype.setIsInside = function (isInside) {
            this._inside = isInside;
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

        VoxelCornerInfo.prototype.setValue = function (value) {
            this._value = value;
        };

        VoxelCornerInfo.prototype.getConnectedTo = function () {
            return this._connectedTo;
        };

        VoxelCornerInfo.prototype.setConnectedTo = function (points) {
            this._connectedTo = points;
        };

        VoxelCornerInfo.prototype.setVoxelValueAsDistanceToSpecifiedPosition = function (position) {
            this._value = Math.abs(this._position.distanceTo(position));
        };

        VoxelCornerInfo.prototype.isPointContainedInAnyRayLines = function (allTheHorizontalLines, allTheVerticalLines) {
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
        };

        VoxelCornerInfo.prototype.isPointContainedInRayLine = function (rayline) {
            if (!rayline) {
                console.log();
            }

            if (Geometry.GeometryHelper.isBetween(rayline.start, rayline.end, this.getPosition()) === true) {
                return true;
            }

            return false;
        };

        VoxelCornerInfo.prototype.getAllContainingRayLines = function () {
            return this._containedInRayLine;
        };
        return VoxelCornerInfo;
    })();
    Voxel.VoxelCornerInfo = VoxelCornerInfo;

    var Verts = (function () {
        function Verts() {
            this.p0 = new VoxelCornerInfo('p0');
            this.p1 = new VoxelCornerInfo('p1');
            this.p2 = new VoxelCornerInfo('p2');
            this.p3 = new VoxelCornerInfo('p3');
            this.p4 = new VoxelCornerInfo('p4');
            this.p5 = new VoxelCornerInfo('p5');
            this.p6 = new VoxelCornerInfo('p6');
            this.p7 = new VoxelCornerInfo('p7');
        }
        return Verts;
    })();
    Voxel.Verts = Verts;

    var VoxelState2 = (function () {
        function VoxelState2(center, blockSize) {
            //super();
            this._mesh = null;
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

        VoxelState2.prototype.getMesh = function () {
            return this._mesh;
        };

        VoxelState2.prototype.setMesh = function (scene, mesh) {
            // find the mesh in the scene
            if (this._mesh != null) {
                scene.remove(scene.getObjectById(this._mesh.id, true));
                this._mesh = mesh;
                scene.add(this._mesh);
            } else {
                this._mesh = mesh;
                scene.add(this._mesh);
            }
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

        VoxelState2.prototype.calculateVoxelVertexValuesFromJSONPixelDataFile = function (voxpos, voxlvl, data) {
            //this._verts.p0.setValue(0);
            var forTheBtm = data[voxlvl][voxpos];
            var forTheTop = data[voxlvl + 1][voxpos];

            // var dat = forTheBtm.cornerdata[0].px[0];
            this._verts.p0.setValue(forTheBtm.cornerdata[0].px);
            this._verts.p1.setValue(forTheBtm.cornerdata[1].px);
            this._verts.p2.setValue(forTheBtm.cornerdata[3].px);
            this._verts.p3.setValue(forTheBtm.cornerdata[2].px);

            this._verts.p4.setValue(forTheTop.cornerdata[0].px);
            this._verts.p5.setValue(forTheTop.cornerdata[1].px);
            this._verts.p6.setValue(forTheTop.cornerdata[3].px);
            this._verts.p7.setValue(forTheTop.cornerdata[2].px);

            console.log();
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
    })();
    Voxel.VoxelState2 = VoxelState2;

    var Level = (function () {
        function Level() {
            this._level = [];
        }
        Level.prototype.addToLevel = function (vox) {
            this._level.push(vox);
        };

        Level.prototype.getAllVoxelsAtThisLevel = function () {
            return this._level;
        };

        Level.prototype.getVoxel = function (voxel) {
            return this._level[voxel];
        };
        return Level;
    })();
    Voxel.Level = Level;

    var VoxelWorld = (function () {
        function VoxelWorld(worldSize, voxelSize, scene, data) {
            this._sceneRef = scene;
            this._worldSize = worldSize;
            this._voxelSize = voxelSize;

            this._worldVoxelArray = [];
            this._worldSlim = [];
            this._levelSlim = [];
            this._stride = worldSize / voxelSize;
            this._voxelPerLevel = Math.pow(this._stride, 2);
            this._numberlevels = Math.sqrt(this._voxelPerLevel);
            this._labels = [];

            if (data)
                this._data = data;

            this.buildWorldVoxelPositionArray();
        }
        VoxelWorld.prototype.getWorldVoxelArray = function () {
            return this._worldVoxelArray;
        };

        VoxelWorld.prototype.getSlimWorldVoxelArray = function () {
            return this._worldSlim;
        };

        VoxelWorld.prototype.getLevel = function (level) {
            return this._worldVoxelArray[level];
        };

        VoxelWorld.prototype.getStride = function () {
            return this._stride;
        };

        VoxelWorld.prototype.getNumberOfVoxelsPerLevel = function () {
            return this._voxelPerLevel;
        };

        VoxelWorld.prototype.getNumberOfLevelsInVoxelWorld = function () {
            return this._numberlevels;
        };

        //if data
        VoxelWorld.prototype.buildWorldVoxelPositionArray = function () {
            var voxCounter = 0, lvlCounter = 0;
            this._level = new Level;
            this._start = new THREE.Vector3(-this._worldSize / 2, -this._worldSize / 2, -this._worldSize / 2);

            var x = this._start.x, z = this._start.z, y = this._start.y;

            while (y < this._worldSize / 2) {
                voxCounter = 0;

                while (z < this._worldSize / 2) {
                    while (x < this._worldSize / 2) {
                        var voxel = new VoxelState2(new THREE.Vector3(x + this._voxelSize / 2, y + this._voxelSize / 2, z + this._voxelSize / 2), this._voxelSize);
                        voxel.calculateVoxelVertexPositions();
                        if (this._data)
                            voxel.calculateVoxelVertexValuesFromJSONPixelDataFile(voxCounter, lvlCounter, this._data);
                        voxel.setConnectedTos();
                        this._level.addToLevel(voxel);

                        this._levelSlim.push({
                            // this is a voxel
                            p0: { value: voxel.getVerts().p0.getValue(), position: voxel.getVerts().p0.getPosition() },
                            p1: { value: voxel.getVerts().p1.getValue(), position: voxel.getVerts().p1.getPosition() },
                            p2: { value: voxel.getVerts().p2.getValue(), position: voxel.getVerts().p2.getPosition() },
                            p3: { value: voxel.getVerts().p3.getValue(), position: voxel.getVerts().p3.getPosition() },
                            p4: { value: voxel.getVerts().p4.getValue(), position: voxel.getVerts().p4.getPosition() },
                            p5: { value: voxel.getVerts().p5.getValue(), position: voxel.getVerts().p5.getPosition() },
                            p6: { value: voxel.getVerts().p6.getValue(), position: voxel.getVerts().p6.getPosition() },
                            p7: { value: voxel.getVerts().p7.getValue(), position: voxel.getVerts().p7.getPosition() },
                            geometry: null
                        });

                        //this._sceneRef.add(voxel);
                        x += this._voxelSize;
                        voxCounter++;
                    }

                    z += this._voxelSize;
                    x = this._start.x;
                }

                this._worldVoxelArray.push(this._level);
                this._worldSlim.push(this._levelSlim);
                this._levelSlim = [];
                this._level = new Level;

                y += this._voxelSize;
                x = this._start.x;
                z = this._start.z;

                lvlCounter++;
            }
        };

        VoxelWorld.prototype.setNewVoxelWorldDataValues = function (data) {
            this._worldSlim = [];

            for (var level = 0; level < this._worldVoxelArray.length; level++) {
                for (var voxel = 0; voxel < this._worldVoxelArray[level].getAllVoxelsAtThisLevel().length; voxel++) {
                    var vox = this._worldVoxelArray[level].getVoxel(voxel);
                    vox.calculateVoxelVertexValuesFromJSONPixelDataFile(voxel, level, data);

                    this._levelSlim.push({
                        // this is a voxel
                        p0: { value: vox.getVerts().p0.getValue(), position: vox.getVerts().p0.getPosition() },
                        p1: { value: vox.getVerts().p1.getValue(), position: vox.getVerts().p1.getPosition() },
                        p2: { value: vox.getVerts().p2.getValue(), position: vox.getVerts().p2.getPosition() },
                        p3: { value: vox.getVerts().p3.getValue(), position: vox.getVerts().p3.getPosition() },
                        p4: { value: vox.getVerts().p4.getValue(), position: vox.getVerts().p4.getPosition() },
                        p5: { value: vox.getVerts().p5.getValue(), position: vox.getVerts().p5.getPosition() },
                        p6: { value: vox.getVerts().p6.getValue(), position: vox.getVerts().p6.getPosition() },
                        p7: { value: vox.getVerts().p7.getValue(), position: vox.getVerts().p7.getPosition() },
                        geometry: null
                    });
                }

                this._worldSlim.push(this._levelSlim);
                this._levelSlim = [];
            }
        };

        //https://gist.github.com/ekeneijeoma/1186920
        VoxelWorld.prototype.createLabel = function (text, position, size, color, backGroundColor, visibile, backgroundMargin) {
            if (!backgroundMargin)
                backgroundMargin = 5;

            var canvas = document.createElement("canvas");

            var context = canvas.getContext("2d");
            context.font = size + "pt Arial";

            var textWidth = context.measureText(text).width;

            canvas.width = (textWidth + backgroundMargin) * 2;
            canvas.height = (size + backgroundMargin) * 2;
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
        };

        VoxelWorld.prototype.clearLabels = function () {
            for (var i = 0; i < this._labels.length; i++) {
                this._sceneRef.remove(this._sceneRef.getObjectById(this._labels[i].id, true));
            }
            this._labels = [];
        };

        VoxelWorld.prototype.update = function (camera, visible) {
            for (var i = 0; i < this._labels.length; i++) {
                this._labels[i].lookAt(camera.position);
                this._labels[i].visible = visible;
            }
        };

        VoxelWorld.projectIntoVolume = function (projectiondirections, projectionOriginations, controllerSphereReference) {
            var linesToDraw = new Array();

            for (var b = 0; b < projectiondirections.length; b++) {
                var ray = new THREE.Raycaster(projectionOriginations[b], projectiondirections[b].normalize(), 0, Infinity);
                var result = [];
                for (var i = 0; i < controllerSphereReference.length; i++) {
                    result = result.concat(controllerSphereReference[i].getOctreeForFaces().search(ray.ray.origin, ray.far, true, ray.ray.direction));
                }
                var intersections = ray.intersectOctreeObjects(result);
                if (intersections.length > 0) {
                    var sortedArray = intersections.sort(function (p1, p2) {
                        return p1.distance - p2.distance;
                    });

                    // entry exit store line
                    var entry, exit;
                    for (var i = 0; i < sortedArray.length; i++) {
                        var object = sortedArray[i].object;
                        var face = object.getNormal();
                        var facing = projectiondirections[b].dot(face);
                        var inside;

                        if (facing < 0) {
                            inside = true;
                            exit = sortedArray[i].point;
                            if (entry)
                                linesToDraw.push(new Geometry.Line(entry, exit));
                            entry = null, exit = null;
                        } else {
                            inside = false;
                            entry = sortedArray[i].point;
                        }
                    }
                }
            }

            return linesToDraw;
        };
        return VoxelWorld;
    })();
    Voxel.VoxelWorld = VoxelWorld;

    var Color;
    (function (Color) {
        Color[Color["red"] = 0] = "red";
        Color[Color["blue"] = 1] = "blue";
        Color[Color["green"] = 2] = "green";
    })(Color || (Color = {}));

    var MarchingCubeRendering = (function () {
        function MarchingCubeRendering() {
        }
        //Marching cube algorithm that evaluates per voxel
        MarchingCubeRendering.processWorkerRequest = function (data) {
            var exceptionCount = 0;

            for (var i = 0; i < data.data.length; i++) {
                for (var x = 0; x < data.data[i].length; x++) {
                    var vox = new Voxel.VoxelState2(new THREE.Vector3, 0);

                    //console.log(JSON.stringify(data.voxelInfo.getVerts().p0.getValue()));
                    vox.getVerts().p0.setPostion(data.data[i][x].p0.position);
                    vox.getVerts().p1.setPostion(data.data[i][x].p1.position);
                    vox.getVerts().p2.setPostion(data.data[i][x].p2.position);
                    vox.getVerts().p3.setPostion(data.data[i][x].p3.position);

                    vox.getVerts().p4.setPostion(data.data[i][x].p4.position);
                    vox.getVerts().p5.setPostion(data.data[i][x].p5.position);
                    vox.getVerts().p6.setPostion(data.data[i][x].p6.position);
                    vox.getVerts().p7.setPostion(data.data[i][x].p7.position);

                    vox.getVerts().p0.setValue(data.data[i][x].p0.value);
                    vox.getVerts().p1.setValue(data.data[i][x].p1.value);
                    vox.getVerts().p2.setValue(data.data[i][x].p2.value);
                    vox.getVerts().p3.setValue(data.data[i][x].p3.value);

                    vox.getVerts().p4.setValue(data.data[i][x].p4.value);
                    vox.getVerts().p5.setValue(data.data[i][x].p5.value);
                    vox.getVerts().p6.setValue(data.data[i][x].p6.value);
                    vox.getVerts().p7.setValue(data.data[i][x].p7.value);

                    var geo = Voxel.MarchingCubeRendering.MarchingCube(vox, data.threshold);
                    data.data[i][x].geometry = geo;
                }
            }

            //console.log(exceptionCount);
            return data.data;
        };

        MarchingCubeRendering.MarchingCube = function (voxel, isolevel) {
            //console.log(JSON.stringify(voxel));
            var vertexlist = [];

            var cubeIndex = 0;

            //console.log(voxel.getVerts().p0.getValue());
            if (voxel.getVerts().p0.getValue() <= isolevel) {
                cubeIndex |= 1;
                voxel.getVerts().p0.setIsInside(true);
                //console.log("p0");
            }
            if (voxel.getVerts().p1.getValue() <= isolevel) {
                cubeIndex |= 2;
                voxel.getVerts().p1.setIsInside(true);
                //console.log("p1");
            }
            if (voxel.getVerts().p2.getValue() <= isolevel) {
                cubeIndex |= 4;
                voxel.getVerts().p2.setIsInside(true);
                //console.log("p2");
            }
            if (voxel.getVerts().p3.getValue() <= isolevel) {
                cubeIndex |= 8;
                voxel.getVerts().p3.setIsInside(true);
                // console.log("p3");
            }
            if (voxel.getVerts().p4.getValue() <= isolevel) {
                cubeIndex |= 16;
                voxel.getVerts().p4.setIsInside(true);
                //console.log("p4");
            }
            if (voxel.getVerts().p5.getValue() <= isolevel) {
                cubeIndex |= 32;
                voxel.getVerts().p5.setIsInside(true);
                //console.log("p5");
            }
            if (voxel.getVerts().p6.getValue() <= isolevel) {
                cubeIndex |= 64;
                voxel.getVerts().p6.setIsInside(true);
                //console.log("p6");
            }
            if (voxel.getVerts().p7.getValue() <= isolevel) {
                cubeIndex |= 128;
                voxel.getVerts().p7.setIsInside(true);
                // console.log("p7");
            }

            var bits = THREE.edgeTable[cubeIndex];

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

            return this.computeVoxelMesh(vertexlist, cubeIndex);
        };

        MarchingCubeRendering.MarchingCubeCustom = function (voxelRef, horizontalLines, verticalLines, worldSize, blockSize, material) {
            // Top Slice 4, 5, 6, 7
            // Bottom Slice 0, 1, 2, 3
            // Near 0, 1, 4, 5
            // Far 2, 3, 6, 7
            // Complie cube index simalar to previous MC algorithm and check color for each of the vox corners with the relevant image slice and check
            // for the matching color
            var vertexlist = [];

            var cubeIndex = 0;

            if (voxelRef.getVerts().p0.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 1;
                voxelRef.getVerts().p0.setIsInside(true);
            }
            if (voxelRef.getVerts().p1.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 2;
                voxelRef.getVerts().p1.setIsInside(true);
            }
            if (voxelRef.getVerts().p2.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 4;
                voxelRef.getVerts().p2.setIsInside(true);
            }
            if (voxelRef.getVerts().p3.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 8;
                voxelRef.getVerts().p3.setIsInside(true);
            }
            if (voxelRef.getVerts().p4.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 16;
                voxelRef.getVerts().p4.setIsInside(true);
            }
            if (voxelRef.getVerts().p5.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 32;
                voxelRef.getVerts().p5.setIsInside(true);
            }
            if (voxelRef.getVerts().p6.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 64;
                voxelRef.getVerts().p6.setIsInside(true);
            }
            if (voxelRef.getVerts().p7.isPointContainedInAnyRayLines(horizontalLines, verticalLines)) {
                cubeIndex |= 128;
                voxelRef.getVerts().p7.setIsInside(true);
            }

            // then perforom custom vertex interpolation where we walk along a line and determine where the transition from inside to
            // outside takes place and we mark (may need to do some interpolation) where that vertex should go.
            var bits = THREE.edgeTable[cubeIndex];

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

            return new THREE.Mesh(this.computeVoxelMesh(vertexlist, cubeIndex), material);
        };

        MarchingCubeRendering.computeVoxelMesh = function (vertexlist, cubeIndex) {
            var geometry = new THREE.Geometry();
            var vertexIndex = 0;

            // The following is from Lee Stemkoski's example and
            // deals with construction of the polygons and adding to
            // the scene.
            // http://stemkoski.github.io/Three.js/Marching-Cubes.html
            // construct triangles -- get correct vertices from triTable.
            var i = 0;
            cubeIndex <<= 4; // multiply by 16...

            while (THREE.triTable[cubeIndex + i] != -1) {
                var index1 = THREE.triTable[cubeIndex + i];
                var index2 = THREE.triTable[cubeIndex + i + 1];
                var index3 = THREE.triTable[cubeIndex + i + 2];

                geometry.vertices.push(vertexlist[index1]);
                geometry.vertices.push(vertexlist[index2]);
                geometry.vertices.push(vertexlist[index3]);

                var face = new THREE.Face3(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                geometry.faces.push(face);
                geometry.faceVertexUvs[0].push([new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)]);
                vertexIndex += 3;
                i += 3;
            }

            geometry.computeCentroids();
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();

            return geometry;
        };

        MarchingCubeRendering.CalculateAValueForEachVertexPassedIn = function (c1, c2) {
            var array = new Geometry.Collection();

            // Find common matching line which:
            // is parallel
            // and at least one point is contained on that line
            var direction = new THREE.Vector3();
            direction.subVectors(c2.getPosition(), c1.getPosition());
            direction.normalize();

            // x - x -> Horizontal
            if (direction.angleTo(new THREE.Vector3(1, 0, 0)) * (180 / Math.PI) === 0 || direction.angleTo(new THREE.Vector3(1, 0, 0)) * (180 / Math.PI) === 180) {
                if (c1.getIsInside()) {
                    var iter = c1.getAllContainingRayLines().createInterator();
                    while (iter.hasNext()) {
                        var el = iter.next();
                        var angle = el.getDirection().angleTo(direction) * (180 / Math.PI);
                        if (angle === 0 || angle === 180) {
                            array.addUnique(el);
                        }
                    }
                }

                if (c2.getIsInside()) {
                    var iter = c2.getAllContainingRayLines().createInterator();
                    while (iter.hasNext()) {
                        var el = iter.next();
                        var angle = el.getDirection().angleTo(direction) * (180 / Math.PI);
                        if (angle === 0 || angle === 180) {
                            array.addUnique(el);
                        }
                    }
                }
            }

            // z - z -> Horizontal
            if (direction.angleTo(new THREE.Vector3(0, 0, 1)) * (180 / Math.PI) === 0 || direction.angleTo(new THREE.Vector3(0, 0, 1)) * (180 / Math.PI) === 180) {
                if (c1.getIsInside()) {
                    var iter = c1.getAllContainingRayLines().createInterator();
                    while (iter.hasNext()) {
                        var el = iter.next();
                        var angle = el.getDirection().angleTo(direction) * (180 / Math.PI);
                        if (angle === 0 || angle === 180) {
                            array.addUnique(el);
                        }
                    }
                }

                if (c2.getIsInside()) {
                    var iter = c2.getAllContainingRayLines().createInterator();
                    while (iter.hasNext()) {
                        var el = iter.next();
                        var angle = el.getDirection().angleTo(direction) * (180 / Math.PI);
                        if (angle === 0 || angle === 180) {
                            array.addUnique(el);
                        }
                    }
                }
            }

            // or
            // y - y -> Vertical
            if (direction.angleTo(new THREE.Vector3(0, 1, 0)) * (180 / Math.PI) === 0 || direction.angleTo(new THREE.Vector3(0, 1, 0)) * (180 / Math.PI) === 180) {
                if (c1.getIsInside()) {
                    var iter = c1.getAllContainingRayLines().createInterator();
                    while (iter.hasNext()) {
                        var el = iter.next();
                        var angle = el.getDirection().angleTo(direction) * (180 / Math.PI);
                        if (angle === 0 || angle === 180) {
                            array.addUnique(el);
                        }
                    }
                }

                if (c2.getIsInside()) {
                    var iter = c2.getAllContainingRayLines().createInterator();
                    while (iter.hasNext()) {
                        var el = iter.next();
                        var angle = el.getDirection().angleTo(direction) * (180 / Math.PI);
                        if (angle === 0 || angle === 180) {
                            array.addUnique(el);
                        }
                    }
                }
            }

            if (array.length() > 0) {
                c1.setValue(Math.abs(Geometry.GeometryHelper.shortestDistanceBetweenTwoVector3(c1.getPosition(), array.get(0).start, array.get(0).end)));
                if (c1.getIsInside())
                    c1.setValue(c1.getValue() * -1);

                c2.setValue(Math.abs(Geometry.GeometryHelper.shortestDistanceBetweenTwoVector3(c2.getPosition(), array.get(0).start, array.get(0).end)));
                if (c2.getIsInside())
                    c2.setValue(c2.getValue() * -1);
            }

            return MarchingCubeRendering.VertexInterpolate(0, c1.getPosition(), c2.getPosition(), c1.getValue(), c2.getValue());
        };

        MarchingCubeRendering.VertexInterpolate = function (threshold, p1pos, p2pos, v1Value, v2Value) {
            // http://paulbourke.net/geometry/polygonise/
            //console.log("Interpolationg... ");
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
        };
        return MarchingCubeRendering;
    })();
    Voxel.MarchingCubeRendering = MarchingCubeRendering;
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

var Imaging;
(function (Imaging) {
    var CanvasRender = (function () {
        function CanvasRender() {
        }
        CanvasRender.prototype.drawCanvas = function (name, arrayOfLines, translateTo, orientation, drawGrid, worldSize, blockSize) {
            var trans = Geometry.GeometryHelper.vectorBminusVectorA(new THREE.Vector3(0, 0, 0), translateTo);

            var lines2D = [];

            for (var i = 0; i < arrayOfLines.length; i++) {
                var pt3entry = new THREE.Vector3().addVectors(arrayOfLines[i].start, trans);
                var pt3exit = new THREE.Vector3().addVectors(arrayOfLines[i].end, trans);

                if (orientation === 0) {
                    var pt2entry = new THREE.Vector2(Math.abs(pt3entry.x), Math.abs(pt3entry.z));
                    var pt2exit = new THREE.Vector2(Math.abs(pt3exit.x), Math.abs(pt3exit.z));
                } else {
                    var pt2entry = new THREE.Vector2(Math.abs(pt3entry.x), Math.abs(pt3entry.y));
                    var pt2exit = new THREE.Vector2(Math.abs(pt3exit.x), Math.abs(pt3exit.y));
                }

                lines2D.push({ entry: pt2entry, exit: pt2exit });
            }

            var canvas = document.createElement('canvas');
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

                ctx.fillStyle = 'white';
                ctx.font = "bold 12px sans-serif";
                ctx.fillText(name, 10, 20);

                ctx.fill();
                ctx.closePath();

                var ctx = canvas.getContext('2d');

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
        };

        CanvasRender.prototype.drawImage = function (canvasID, imageToSuperImpose) {
            var canvas = document.getElementById(canvasID);
            var f = imageToSuperImpose.height / imageToSuperImpose.width;
            var newHeight = canvas.width * f;
            canvas.getContext('2d').drawImage(imageToSuperImpose, 0, 0, imageToSuperImpose.width, imageToSuperImpose.height, 0, 0, canvas.width, newHeight);
        };

        // Same as above but cant overload like typ OO method as this being compiled to JS and JS doesnt recognise types
        CanvasRender.prototype.drawImage2 = function (canvas, imageToSuperImpose) {
            var f = imageToSuperImpose.height / imageToSuperImpose.width;
            var newHeight = canvas.width * f;
            canvas.getContext('2d').drawImage(imageToSuperImpose, 0, 0, imageToSuperImpose.width, imageToSuperImpose.height, 0, 0, canvas.width, newHeight);
        };

        CanvasRender.prototype.drawAllImages = function (arrayOfHorizontalSlices, arrayOfVerticalSlices, horizontalElemID, verticalElemID) {
            var _this = this;
            var elem = document.getElementById(horizontalElemID);

            _.each(arrayOfHorizontalSlices, function (slice) {
                var i = slice;

                var canvasL = document.createElement('canvas');
                canvasL.width = 400;
                canvasL.height = 400;
                var canvasR = document.createElement('canvas');
                canvasR.width = 400;
                canvasR.height = 400;

                _this.drawImage2(canvasL, i.bottom);
                elem.appendChild(canvasL);

                _this.drawImage2(canvasR, i.top);
                elem.appendChild(canvasR);

                var br = document.createElement('br');
                elem.appendChild(br);
            });

            elem = document.getElementById(verticalElemID);

            _.each(arrayOfVerticalSlices, function (slice) {
                var i = slice;

                var canvasL = document.createElement('canvas');
                canvasL.width = 400;
                canvasL.height = 400;

                var canvasR = document.createElement('canvas');
                canvasR.width = 400;
                canvasR.height = 400;

                _this.drawImage2(canvasL, i.near);
                elem.appendChild(canvasL);

                _this.drawImage2(canvasR, i.far);
                elem.appendChild(canvasR);

                var br = document.createElement('br');
                elem.appendChild(br);
            });
        };
        return CanvasRender;
    })();
    Imaging.CanvasRender = CanvasRender;
})(Imaging || (Imaging = {}));

var Controller;
(function (Controller) {
    var ControlSphere = (function () {
        function ControlSphere(id, segments, radius, scene, size, velocity, mass) {
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
        ControlSphere.prototype.getNodes = function () {
            return this._nodes;
        };

        ControlSphere.prototype.getSphereSkeleton = function () {
            return this._sphereSkeleton;
        };

        ControlSphere.prototype.getOctreeForNodes = function () {
            return this._octreeForNodes;
        };

        ControlSphere.prototype.getOctreeForFaces = function () {
            return this._octreeForFaces;
        };

        ControlSphere.prototype.toggleVisibility = function () {
            for (var i = 0; i < this._faces.length; i++) {
                this._faces[i].visible = this._faces[i].visible !== true;
                this._faces[i].toggleNormalVisibility();
            }

            for (var i = 0; i < this._nodes.length; i++) {
                this._nodes[i].visible = this._nodes[i].visible !== true;
            }
        };

        ControlSphere.prototype.generateSphereVerticesandLineConnectors = function () {
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

            for (var s = 0; s < points.length - this.N; s++) {
                var lineGeo = new THREE.Geometry();
                lineGeo.vertices.push(points[s], points[s + this.N]);

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
                } else {
                    a = points[s];
                    b = points[s + 1];
                    count++;
                }

                var lineGeo = new THREE.Geometry();
                lineGeo.vertices.push(a, b);

                lineGeo.computeLineDistances();

                var lineMaterial = new THREE.LineBasicMaterial({ color: 0xCC0000 });
                var line = new THREE.Line(lineGeo, lineMaterial);

                lines.push(line);
            }

            // trim start and end
            var unique = points.slice(this.N - 1, points.length - this.N + 1);

            this._sphereSkeleton = { points: unique, lines: lines };
        };

        ControlSphere.prototype.generateSphere = function () {
            this.generateSphereVerticesandLineConnectors();

            for (var i = 0; i < this._sphereSkeleton.points.length; i++) {
                var point = this._sphereSkeleton.points[i];
                var geometry = new THREE.SphereGeometry(this._nodeSize, 5, 5);
                var material = new THREE.MeshBasicMaterial({ color: 0x8888ff });
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
        };

        ControlSphere.prototype.calculateFaces = function () {
            var positions = [];

            _.each(this._nodes, function (item) {
                positions.push({ id: item.getId(), position: item.getNodePosition() });
            });

            Implementation.Sculpt2.Worker.postMessage({ id: this.id, command: "calculateMeshFacePositions", particles: JSON.stringify(positions), segments: this.N });
        };

        ControlSphere.calculateMeshFacePositions = function (particles, segments) {
            var particles = JSON.parse(particles);
            var listOfObjects = [];
            var beginningOfOtherPole = particles.length;
            var current = 0;

            while (current < beginningOfOtherPole) {
                if (current < segments) {
                    var theFirstPole = 0;
                    var theOtherPole = particles.length - 1;

                    if (current === segments - 1) {
                        listOfObjects.push({
                            a: { pos: particles[theFirstPole].position, nodeId: particles[theFirstPole].id },
                            b: { pos: particles[current + 1].position, nodeId: particles[current + 1].id },
                            c: { pos: particles[theFirstPole + 1].position, nodeId: particles[theFirstPole + 1].id }
                        });

                        listOfObjects.push({
                            a: { pos: particles[theOtherPole].position, nodeId: particles[theOtherPole].id },
                            b: { pos: particles[(particles.length - 1) - current - 1].position, nodeId: particles[(particles.length - 1) - current - 1].id },
                            c: { pos: particles[particles.length - 2].position, nodeId: particles[particles.length - 2].id }
                        });
                    } else {
                        listOfObjects.push({
                            a: { pos: particles[theFirstPole].position, nodeId: particles[theFirstPole].id },
                            b: { pos: particles[current + 1].position, nodeId: particles[current + 1].id },
                            c: { pos: particles[current + 2].position, nodeId: particles[current + 2].id }
                        });

                        listOfObjects.push({
                            a: { pos: particles[theOtherPole].position, nodeId: particles[theOtherPole].id },
                            b: { pos: particles[(particles.length - 1) - current - 1].position, nodeId: particles[(particles.length - 1) - current - 1].id },
                            c: { pos: particles[(particles.length - 1) - current - 2].position, nodeId: particles[(particles.length - 1) - current - 2].id }
                        });
                    }
                } else if (current >= segments + 1 && current < beginningOfOtherPole - 1) {
                    if (current % segments > 0) {
                        listOfObjects.push({
                            a: { pos: particles[current].position, nodeId: particles[current].id },
                            b: { pos: particles[current + 1].position, nodeId: particles[current + 1].id },
                            c: { pos: particles[current - segments].position, nodeId: particles[current - segments].id }
                        });
                        listOfObjects.push({
                            a: { pos: particles[current + 1].position, nodeId: particles[current + 1].id },
                            b: { pos: particles[current - (segments - 1)].position, nodeId: particles[current - (segments - 1)].id },
                            c: { pos: particles[current - segments].position, nodeId: particles[current - segments].id }
                        });
                    } else {
                        listOfObjects.push({
                            a: { pos: particles[current - segments].position, nodeId: particles[current - segments].id },
                            b: { pos: particles[current].position, nodeId: particles[current].id },
                            c: { pos: particles[current - segments + 1].position, nodeId: particles[current - segments + 1].id }
                        });
                        listOfObjects.push({
                            a: { pos: particles[current - segments].position, nodeId: particles[current - segments].id },
                            b: { pos: particles[current - segments + 1].position, nodeId: particles[current - segments + 1].id },
                            c: { pos: particles[current - (segments * 2) + 1].position, nodeId: particles[current - (segments * 2) + 1].id }
                        });
                    }
                }

                current++;
            }

            return listOfObjects;
        };

        ControlSphere.prototype.addFaces = function (verts) {
            var geom;
            for (var i = 0; i < verts.length; i++) {
                var item = verts[i];

                geom = new THREE.Geometry();
                geom.vertices.push(item.a.pos, item.b.pos, item.c.pos);
                geom.faces.push(new THREE.Face3(0, 1, 2));

                geom.computeCentroids();
                geom.computeFaceNormals();
                geom.computeVertexNormals();

                var mat = new THREE.MeshNormalMaterial({ color: 0xF50000 });
                mat.side = THREE.DoubleSide;

                //mat.visible = false;
                var object = new Geometry.MeshExtended(this._scene, geom, mat);
                object.positionRef.push(this._scene.getObjectById(item.a.nodeId, true), this._scene.getObjectById(item.b.nodeId, true), this._scene.getObjectById(item.c.nodeId, true));

                this._faces.push(object);
                this._scene.add(object);
                this._octreeForFaces.add(object);
            }
        };

        ControlSphere.prototype.update = function (inverted) {
            if (this._faces) {
                _.each(this._faces, function (face) {
                    face.updateVertices();
                    face.calculateNormal(inverted);
                });
            }

            if (this._octreeForFaces && this._octreeForNodes) {
                this._octreeForFaces.update();
                this._octreeForNodes.update();
            }
        };
        return ControlSphere;
    })();
    Controller.ControlSphere = ControlSphere;
})(Controller || (Controller = {}));
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

    var MoveCursor = (function () {
        function MoveCursor(sculpt, wait) {
            this._wait = 1;
            this._sculpt = sculpt;
            if (wait)
                this._wait = wait;
        }
        MoveCursor.prototype.execute = function () {
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
        return MoveCursor;
    })();
    Implementation.MoveCursor = MoveCursor;

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

    var TakeHVslices = (function () {
        function TakeHVslices(sculpt) {
            this._sculpt = sculpt;
        }
        TakeHVslices.prototype.execute = function () {
            this._sculpt.TakeHorizontalImageSlice();
            this._sculpt.takeVerticalImageSlice();
            this._sculpt.drawAllImages();
        };
        return TakeHVslices;
    })();
    Implementation.TakeHVslices = TakeHVslices;

    var MarchingCubeRenderOfSetSphereCommand = (function () {
        function MarchingCubeRenderOfSetSphereCommand(sculpt) {
            this._sculpt = sculpt;
        }
        MarchingCubeRenderOfSetSphereCommand.prototype.execute = function () {
            this._sculpt.renderASphereWithMarchingCubeAlgorithm();
        };
        return MarchingCubeRenderOfSetSphereCommand;
    })();
    Implementation.MarchingCubeRenderOfSetSphereCommand = MarchingCubeRenderOfSetSphereCommand;

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

    var GUI = (function () {
        function GUI() {
            this.buttons = ko.observableArray();
            ko.applyBindings(this, $('#buttons')[0]);
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
            this._worldSize = 500;
            this._blockSize = 50;
            this._gridColor = 0x25F500;
            this._cursorTracker = -1;
            this._cursorLvlTracker = 0;
            this._demoSphereCenter1 = new THREE.Vector3(0, 0, 0);
            this._runDemo = false;
            this._demoSphereRadius = 90;
            this._demoSphereAdd = 40;
            this._lblVisibility = true;
            this._renderGridOnCanvasSlices = true;
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
            this._clock = new THREE.Clock();
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

            var divWH = Helper.jqhelper.getScreenWH('#webgl');
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
            this._controllerSphereSegments = 15;
            this._nodeMass = 2;
            this._nodeVelocity = new THREE.Vector3(0, 0, 0);
            this._nodeSize = 5;
            this._springs = [];

            this._renderer.domElement.addEventListener('mousedown', this.nodeDrag.bind(this), false);
            this._renderer.domElement.addEventListener('mouseup', this.nodeRelease.bind(this), false);
            this._renderer.domElement.addEventListener('mousemove', this.onNodeSelect.bind(this), false);

            this._gui.addButton(new GUIUTILS.Button('toggleMesh', 'Toggle Grid', 'Allows grid to be toggled on or off', new ToggleGridCommand(this)));
            this._gui.addButton(new GUIUTILS.Button('procSphere', 'Controller Object Sphere', 'Generates a procedural sphere that acts as a base object' + 'that can be sampled', new GenerateProcedurallyGeneratedSphereCommand(this)));
            this._gui.addButton(new GUIUTILS.Button('createSprings', 'Create Springs', 'Applies Hookes law to the connectors between nodes ' + 'and allows for a spring like effect when nodes are manipulated', new CreateSpringBetweenNodesCommand(this)));

            /// this._gui.addButton(new GUIUTILS.Button('fillMesh', 'Fill Mesh', new FillSphereWithFacesCommand(this)));
            this._gui.addButton(new GUIUTILS.Button('togVis', 'Hide All', 'Hides the controller sphere', new ToggleControlVisibility(this)));

            //this._gui.addButton(new GUIUTILS.Button('marchingCube', 'Marching Cube', new MarchingCubeCommand(this)));
            this._gui.addButton(new GUIUTILS.Button('Sphere', 'Basic Sphere', 'Simple demo of a mathematical model of a shpere that is moving and rendered every time with' + 'the marching cube algorithm', new MarchingCubeRenderOfSetSphereCommand(this)));

            //this._gui.addButton(new GUIUTILS.Button('HScan', 'HScan', new Take2DSliceDemo(this)));
            //this._gui.addButton(new GUIUTILS.Button('VScan', 'VScan', new TakeVerticalSlice(this)));
            this._gui.addButton(new GUIUTILS.Button('Sampler', 'Sampler', 'Samples the base controller sphere and produces data that can be used by the Marching cube algorithm' + 'to produce an voxelised object copy', new TakeHVslices(this)));
            this._gui.addButton(new GUIUTILS.Button('Move', 'Move cursor', 'Starts the Marching cube rendering process', new MoveCursor(this)));

            var axisHelper = new THREE.AxisHelper(20);
            axisHelper.position = new THREE.Vector3(-1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20, -1 * this._worldSize / 2 - 20);
            this._scene.add(axisHelper);

            Helper.jqhelper.appendToScene('#webgl', this._renderer);

            this._controlSphere = new Controller.ControlSphere(1, this._controllerSphereSegments, this._controllerSphereRadius, this._scene, this._nodeSize, this._nodeVelocity, this._nodeMass);
            this._controlSphereInner = new Controller.ControlSphere(2, this._controllerSphereSegments, 90, this._scene, this._nodeSize, this._nodeVelocity, this._nodeMass);

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

            this.draw();
        };

        Sculpt2.prototype.initCanvasGrid = function (canvas) {
            var ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.lineWidth = 1;
            for (var i = 0; i <= canvas.width; i += this._blockSize) {
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height + 0.5);
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width + 0.5, i);
                ctx.strokeStyle = "white";
                ctx.stroke();
                ctx.fill();
            }
            ctx.closePath();
        };

        Sculpt2.prototype.getCursor = function () {
            return this._cursorTracker;
        };

        Sculpt2.prototype.getCursorLvl = function () {
            return this._cursorLvlTracker;
        };

        Sculpt2.prototype.initialiseCamera = function () {
            this._camera = new THREE.PerspectiveCamera(45, this._screenWidth / this._screenHeight, 0.1, 1500);
            this._camera.position = new THREE.Vector3(0, 200, 600);
            this._camera.lookAt(this._scene.position);
            this._cameraControls = new THREE.OrbitControls(this._camera, this._renderingElement);
            this._cameraControls.domElement = this._renderingElement;
            this._scene.add(this._camera);
        };

        Sculpt2.prototype.initialiseLighting = function () {
            var amb = new THREE.AmbientLight();
            amb.color = new THREE.Color(0X0c0c0c);
            this._scene.add(amb);

            var directionalLight = new THREE.DirectionalLight(0xffffff);
            directionalLight.position.set(1, 1, 1).normalize();
            this._scene.add(directionalLight);
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

        // Node select, drag and release is based on code in a ThreeJS demonstration titled 'interactive draggable cubes'
        // http://threejs.org/examples/webgl_interactive_draggablecubes.html
        Sculpt2.prototype.onNodeSelect = function (e) {
            e.preventDefault();

            var elem = $('#webgl');
            var clientXRel = e.x - elem.offset().left;
            var clientYRel = e.y - elem.offset().top;

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

            //var un = _.uniq(this._horizontalLines, false);
            var mesh = Voxel.MarchingCubeRendering.MarchingCubeCustom(this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker), this._horizontalLines, this._verticalLines, this._worldSize, this._blockSize, this._phongMaterial);

            this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker).setMesh(this._scene, mesh);

            this.info.CursorPos(this._cursorTracker);
            this.info.CursorLvl(this._cursorLvlTracker);
        };

        Sculpt2.prototype.onDocumentKeyDown = function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();

                this.moveCursor();
            }

            if (e.keyCode === 32) {
                this._cursorTracker += this._voxelWorld.getStride();

                if (!this._cursorDebugger) {
                    var cubeGeo = new THREE.CubeGeometry(this._blockSize, this._blockSize, this._blockSize);
                    var cubeMat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
                    this._cursorDebugger = new THREE.Mesh(cubeGeo, cubeMat);
                    this._cursorDebugger.position = this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker).getCenter();

                    this._scene.add(this._cursorDebugger);
                }

                if (this._cursorTracker >= Math.pow(this._voxelWorld.getStride(), 2)) {
                    this._cursorTracker = 0;
                    this._cursorLvlTracker += 1;
                }

                if (this._cursorLvlTracker >= this._voxelWorld.getWorldVoxelArray().length) {
                    this._cursorLvlTracker = 0;
                    this._cursorTracker = 0;
                }

                this._cursorDebugger.position = this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker).getCenter();

                //var voxCorners = calculateVoxelVertexPositions(cursor1.position, blockSize);
                //this.imageSlice(this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker));
                this.createHelperLabels(this._voxelWorld.getLevel(this._cursorLvlTracker).getVoxel(this._cursorTracker));

                //this.info = { Cursor: this._cursorTracker, CursorLevel: this._cursorLvlTracker};
                this.info.CursorPos(this._cursorTracker);
                this.info.CursorLvl(this._cursorLvlTracker);
            }

            e.stopPropagation();
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
            this._controlSphere.toggleVisibility();
            this._controlSphereInner.toggleVisibility();
        };

        Sculpt2.prototype.procedurallyGenerateSphere = function () {
            // TODO
            //console.log(this);
            this._controlSphere.generateSphere();
            this._controlSphereInner.generateSphere();
            //this._sphereSkeleton = controlGenerator.generateNodePoints();
        };

        Sculpt2.prototype.joinNodes = function () {
            // TODO : Move this to controller sphere
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
            // TODO : Move this to controller sphere
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
            // TODO
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

        Sculpt2.prototype.renderASphereWithMarchingCubeAlgorithm = function () {
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
                var voxelRef = this._voxelWorld.getLevel(currentLvl).getVoxel(currentVoxel);

                voxelRef.getVerts().p0.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                voxelRef.getVerts().p1.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                voxelRef.getVerts().p2.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                voxelRef.getVerts().p3.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                voxelRef.getVerts().p4.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                voxelRef.getVerts().p5.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                voxelRef.getVerts().p6.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);
                voxelRef.getVerts().p7.setVoxelValueAsDistanceToSpecifiedPosition(this._demoSphereCenter1);

                var geometry = Voxel.MarchingCubeRendering.MarchingCube(voxelRef, this._demoSphereRadius);

                var m = new THREE.Mesh(geometry, this._phongMaterial);

                voxelRef.setMesh(this._scene, m);

                currentVoxel++;
            }

            if (this._demoSphereCenter1.x > this._worldSize / 2) {
                this._demoSphereAdd *= -1;
            }

            if (this._demoSphereCenter1.x < (this._worldSize / 2) * -1) {
                this._demoSphereAdd *= -1;
            }

            this._demoSphereCenter1.x += this._demoSphereAdd;
        };

        Sculpt2.prototype.TakeHorizontalImageSlice = function () {
            // Z - Z Sampling
            var _this = this;
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

                var b = this._canvasRender.drawCanvas('bottom', linesToDrawBtm, new THREE.Vector3(-1 * this._worldSize / 2, 0, this._worldSize / 2), 0, this._renderGridOnCanvasSlices, this._worldSize, this._blockSize);
                var t = this._canvasRender.drawCanvas('top', linesToDrawTop, new THREE.Vector3(-1 * this._worldSize / 2, 0, this._worldSize / 2), 0, this._renderGridOnCanvasSlices, this._worldSize, this._blockSize);
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
                        var n = this._canvasRender.drawCanvas('near - vertSlice ' + i, linesToDrawNear, new THREE.Vector3(-1 * this._worldSize / 2, -1 * this._worldSize / 2, 0), 1, this._renderGridOnCanvasSlices, this._worldSize, this._blockSize);
                        var f = this._canvasRender.drawCanvas('far - vertSlice ' + i, linesToDrawFar, new THREE.Vector3(-1 * this._worldSize / 2, -1 * this._worldSize / 2, 0), 1, this._renderGridOnCanvasSlices, this._worldSize, this._blockSize);
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

        Sculpt2.prototype.drawAllImages = function () {
            // for debugging purposes will render the lines to scene to see what the issue is
            var iter = this._horizontalLines.createInterator();

            while (iter.hasNext()) {
                var elm = iter.next();

                var lineGeo = new THREE.Geometry();
                lineGeo.vertices.push(elm.start, elm.end);

                lineGeo.computeLineDistances();

                var lineMaterial = new THREE.LineBasicMaterial({ color: 0xCC0000 });
                var line = new THREE.Line(lineGeo, lineMaterial);

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

                this._scene.add(line);
            }

            this._canvasRender.drawAllImages(this._arrayOfHorizontalSlices, this._arrayOfVerticalSlices, 'horizontal', 'vertical');
        };
        return Sculpt2;
    })();
    Implementation.Sculpt2 = Sculpt2;
})(Implementation || (Implementation = {}));
