/**
* Created by wtarrant on 28/02/14.
*/
/// <reference path="../lib/knockout.d.ts" />
/// <reference path="Utils2.ts" />

var Implementation;
(function (Implementation) {
    var ToggleGridCommand = (function () {
        function ToggleGridCommand(sculpt) {
            this.sculpt = sculpt;
        }
        ToggleGridCommand.prototype.execute = function () {
            this.sculpt.toggleGrid();
        };
        return ToggleGridCommand;
    })();
    Implementation.ToggleGridCommand = ToggleGridCommand;

    var Button = (function () {
        function Button(id, name, command) {
            this.Id = id;
            this.Name = name;
            this.Command = command;
        }
        return Button;
    })();
    Implementation.Button = Button;

    var GUI = (function () {
        function GUI() {
            this.buttons = ko.observableArray();
            ko.applyBindings(this);
        }
        GUI.prototype.onButtonClick = function (e) {
            // TODO
            console.log();
        };

        GUI.prototype.addButton = function (button) {
            this.buttons.push(button);
            console.log();
        };
        return GUI;
    })();
    Implementation.GUI = GUI;

    var Sculpt2 = (function () {
        function Sculpt2(gui) {
            this._worldSize = 400;
            this._blockSize = 100;
            this._gridColor = 0x25F500;
            this._voxelWorld = new Voxel.VoxelWorld(this._worldSize, this._blockSize);
            this._gui = gui;

            this.initialise();
        }
        Sculpt2.prototype.initialise = function () {
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

            var b = new Button('toggleMesh', 'Toggle Grid', new ToggleGridCommand(this));
            this._gui.addButton(b);

            Helper.jqhelper.appendToScene('#webgl', this._renderer);

            this.draw();
        };

        Sculpt2.prototype.initialiseCamera = function () {
            // TODO
        };

        Sculpt2.prototype.initialiseLighting = function () {
            // TODO
        };

        Sculpt2.prototype.initialiseSpotLighting = function (color, distance) {
            // TODO
        };

        Sculpt2.prototype.animate = function () {
            // TODO
        };

        Sculpt2.prototype.update = function () {
            // TODO
        };

        Sculpt2.prototype.draw = function () {
            // TODO
        };

        Sculpt2.prototype.onDocumentMouseMove = function (e) {
            // TODO
        };

        Sculpt2.prototype.onDocumentMouseDown = function (e) {
            // TODO
        };

        Sculpt2.prototype.onDocumentMouseUp = function (e) {
            // TODO
        };

        Sculpt2.prototype.onNodeSelect = function (e) {
            // TODO
        };

        Sculpt2.prototype.nodeDrag = function (e) {
            // TODO
        };

        Sculpt2.prototype.nodeRelease = function (e) {
            // TODO
        };

        Sculpt2.prototype.onDocumentKeyDown = function (e) {
            // TODO
        };

        Sculpt2.prototype.generateShape = function () {
            // TODO
        };

        Sculpt2.prototype.updateColor = function (val) {
            // TODO
        };

        Sculpt2.prototype.toggleGrid = function () {
            // TODO
        };

        Sculpt2.prototype.toggleWireFrame = function () {
            // TODO
        };

        Sculpt2.prototype.toggleMesh = function () {
            // TODO
        };

        Sculpt2.prototype.procedurallyGenerateSphere = function () {
            // TODO
        };

        Sculpt2.prototype.joinNodes = function () {
            // TODO
        };

        Sculpt2.prototype.connectNode = function (node, v1, v2) {
            // TODO
        };

        Sculpt2.prototype.addMesh = function () {
            // TODO
        };

        Sculpt2.prototype.voxelEvalComplex = function (voxRef) {
            // TODO
        };

        Sculpt2.prototype.draw = function () {
            this._renderer.render(this._scene, this._camera);
        };
        Sculpt2.GlobalControlsEnabled = true;
        return Sculpt2;
    })();
    Implementation.Sculpt2 = Sculpt2;
})(Implementation || (Implementation = {}));
//# sourceMappingURL=Sculpting2.js.map
