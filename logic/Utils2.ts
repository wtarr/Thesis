/// <reference path="../lib/three.d.ts" />

class Sphere
{
    private radius : number;
    private center : THREE.Vector3;

    constructor(x: number, y: number, z: number, r: number)
    {
        this.radius = r;
        this.center = new THREE.Vector3(x, y, z);
    }

    public isColliding(position : THREE.Vector3) : boolean
    {
        var distance = this.center.distanceTo(position);
        return distance < this.radius;
    }
}

class Grid
{
    private _geo : THREE.Geometry = new THREE.Geometry();
    private _gridMaterial :THREE.LineBasicMaterial;
    private _size : number;
    private _blockSize : number;

    constructor(wSize : number, bSize : number)
    {
        this._size = wSize / 2;
        this._blockSize = bSize;
    }

    public buildAxisAligned2DGrids() : THREE.Geometry
    {
        for (var i = -this._size; i <= this._size; i+= this._blockSize)
        {
            for ( var level = -this._size; level <= this._size; level += this._blockSize)
            {
                this._geo.vertices.push(new THREE.Vector3(-this._size, level, i));
                this._geo.vertices.push(new THREE.Vector3(this._size, level, i));
                this._geo.vertices.push(new THREE.Vector3(i, level, -this._size));
                this._geo.vertices.push(new THREE.Vector3(i, level, this._size));
            }
        }
        return this._geo;
    }





}