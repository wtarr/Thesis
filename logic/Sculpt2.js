/**
* Created by wtarrant on 28/02/14.
*/
/// <reference path="../lib/knockout.d.ts" />
/// <reference path="Utils2.ts" />

var Implementation;
(function (Implementation) {
    var Button = (function () {
        function Button(id, name, command) {
            this._id = id;
            this._name = name;
            this._command = command;
        }
        Button.prototype.getId = function () {
            return this._id;
        };

        Button.prototype.getName = function () {
            return this._name;
        };
        return Button;
    })();
    Implementation.Button = Button;

    var GUI = (function () {
        function GUI() {
            this.buttons = ko.observableArray();
        }
        GUI.prototype.onButtonClick = function (e) {
            // TODO
        };

        GUI.prototype.addButton = function (button) {
            // TODO
        };
        return GUI;
    })();
    Implementation.GUI = GUI;

    var Sculpt2 = (function () {
        //private
        function Sculpt2(gui) {
            this._gui = gui;
        }
        Sculpt2.prototype.initialise = function () {
            this._stats = new Stats();
        };

        Sculpt2.prototype.initialiseCamera = function () {
            // TODO
        };

        Sculpt2.prototype.initialiseLighting = function () {
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

        Sculpt2.prototype.toggleGrid = function (e) {
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
        return Sculpt2;
    })();
})(Implementation || (Implementation = {}));
//# sourceMappingURL=Sculpt2.js.map
