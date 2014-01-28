/**
 * Created by William on 25/01/14.
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

function SpotLight( options )
{
    this.color = (typeof options.color === 'undefined') ? "#ffffff" : options.color;
    this.position = (typeof options.position === 'undefined') ? new THREE.Vector3(0, 0, 0) : options.position;
    this.shouldCastShadow = (typeof options.shouldCastShadow === 'undefined') ? false : options.shouldCastShadow;
    this.target = (typeof options.target === 'undefined') ? new THREE.Object3D() : options.target;

    this.spotLight = new THREE.SpotLight(this.color);
    this.spotLight.position.set(this.position.x, this.position.y, this.position.z);
    this.spotLight.castShadow = this.shouldCastShadow;
    this.spotLight.target = this.target;

    return this.spotLight;
}

function AmbientLight( options )
{
    this.color = (typeof  options.color === 'undefined') ? '#0c0c0c': options.color;

    this.ambientLight = new THREE.AmbientLight(this.color);

    return this.ambientLight;
}

function DirectionalLight( options )
{
    this.color = (typeof options.color === 'undefined') ? '#ffffff' : options.color;
    this.intensity = (typeof options.intensity === 'undefined') ? 5 : options.intensity;
    this.shouldCastShadow = (typeof options.shouldCastShadow === 'undefined') ? false : options.shouldCastShadow;

    this.directionalLight = new THREE.DirectionalLight(this.color);
    this.directionalLight.intensity = this.intensity;
    this.directionalLight.castShadow = this.shouldCastShadow;

    return this.directionalLight;
};

function LightFactory() {}

LightFactory.prototype.lightClass = SpotLight;

LightFactory.prototype.createLight = function ( options )
{
    if (options.lightType === "spot" )
    {
        this.lightClass = SpotLight;
    }
    else if (options.lightType === 'directional')
    {
        this.lightClass = DirectionalLight;
    }
    else if (options.lightType === 'ambient')
    {
        this.lightClass = AmbientLight;
    }
    else
    {
        throw "Light factory does not contain this type";
    }

    return new this.lightClass( options );
};

function getScreenWidthHeight(id)
{
    var width = $(id).width();
    var height = $(id).height();
    return [width, height];
};

function appendToScene(id, render)
{
    $(id).append(render.domElement);
};