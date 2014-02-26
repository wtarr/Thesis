/// <reference path="../lib/three.d.ts" />
var Sphere = (function () {
    function Sphere(x, y, z, r) {
        this.radius = r;
        this.center = new THREE.Vector3(x, y, z);
    }
    Sphere.prototype.isColliding = function (position) {
        var distance = this.center.distanceTo(position);
        return distance < this.radius;
    };
    return Sphere;
})();

var Grid = (function () {
    function Grid(wSize, bSize) {
        this._geo = new THREE.Geometry();
        this._size = wSize / 2;
        this._blockSize = bSize;
    }
    Grid.prototype.buildAxisAligned2DGrids = function () {
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
    return Grid;
})();
//# sourceMappingURL=Utils2.js.map
