/**
 * Created by William on 15/11/13.
 */
test("hello test", function()
{
    ok( 1 == "1", "Passed!");
});

test("Test Sphere creation", function()
{
   var s;
   s = new Sphere(0, 0, 0);
   s.radius = 10;

   ok(s != null, "Sphere not null")
   ok(s.constructor.name == "Sphere", "Is a sphere");
   ok(s.radius == 10, "Radius OK")

});

test("Test Sphere collision", function(){

    var s = new Sphere(0, 0, 0, 10);

    var within = s.isColliding(new THREE.Vector3(5, 5, 5));
    ok(within === true, "Is within bounds returns true");

    var outside = s.isColliding(new THREE.Vector3(20, 20, 20));
    ok(outside === false, "Is outside of bounds returns false");


});

test("Spotlight creation via Light Factory with options set", function() {

    var lightFactory = new LightFactory();
    var spotlight = lightFactory.createLight(
        {
            lightType: "spot",
            position: new THREE.Vector3(0, 0, 10),
            shouldCastShadow: true,
            target: new THREE.Vector3(10, 15, 20)
        }
    )

    ok(spotlight instanceof THREE.SpotLight, "Is an instance of spotlight");
    ok((spotlight.position.x === 0 && spotlight.position.y === 0 && spotlight.position.z === 10) , "Position set correctly");
    ok(spotlight.castShadow === true, "cast should is set true");
    ok((spotlight.target.x === 10, spotlight.target.y === 15, spotlight.target.z === 20), "Target set correctly");


});

test("Spotlight creation via Light Factory with defaults", function() {
   var lightFactory = new LightFactory();
    var spotlight = lightFactory.createLight(
        {
            lightType: "spot"
        }
    )

    ok(spotlight instanceof THREE.SpotLight, "Is an instance of spotlight");
    ok((spotlight.position.x === 0 && spotlight.position.y === 0 && spotlight.position.z === 0) , "Default position set correctly");
    ok(spotlight.castShadow === false, "default set of cast shadow should be set to false");
    ok((spotlight.target instanceof THREE.Object3D), "Default target set correctly");

});

test("Directional light creation via Light Factory with presets", function() {
    var lightFactory = new LightFactory();
    var dirLight = lightFactory.createLight(
        {
            lightType: "directional",
            color: '#000000',
            intensity: 10,
            shouldCastShadow: true
        }
    )

    ok(dirLight instanceof THREE.DirectionalLight, "Is an instance of directional light");
    ok(( dirLight.color.r === 0  && dirLight.color.g === 0 && dirLight.color.b === 0), "Color set correctly");
    ok(dirLight.intensity === 10, "Intensity set correctly");
    ok(dirLight.castShadow === true, "Set to cast shadow");


});

test("Test get div width/height function works correctly", function(){
    var $fixture = $('#qunit-fixture');
    $fixture.append("<div id='testwidthheight' style='width:100px; height:200px'> </div>");
    var wh = getScreenWidthHeight('#testwidthheight');
    var w = wh[0];
    var h = wh[1];
    ok(w === 100, "Width detected correctly");
    ok(h === 200, "Height detected correctly");
    });

test("Test Voxel center positions are being correctly calculated for the world specified ", function() {

    var world = buildVoxelPositionArray(300, 150);
    ok(world.length === 2, "World has two levels");
    ok(world[0].length === 4 && world[1].length === 4, "Both levels have correct number of voxels");
    ok(world[0][0].centerPosition.x === -75 &&
        world[0][0].centerPosition.y === -75 &&
        world[0][0].centerPosition.z === -75,
        "Position of first voxel center is correct");

});