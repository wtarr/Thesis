/**
 * Created by William on 13/12/13.
 */
function Sphere(x, y, z, r) {
    this.radius = r;
    this.center = new THREE.Vector3(x, y, z);
}

Sphere.prototype.isColliding = function (position) {
    var pos = position;
    var dist = this.center.distanceTo(pos);
    if (dist < this.radius)
        return true;

    return false;
}