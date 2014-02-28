/**
 * Created by William on 15/11/13.
 */

// Regular JS

module("Dummy test");
test("hello test", function () {
    ok(1 == "1", "Passed!");
});


module("Legacy \"utils.js\" tests");
test("Test Sphere creation", function () {
    var s;
    s = new Sphere(0, 0, 0);
    s.radius = 10;

    ok(s != null, "Sphere not null")
    ok(s.constructor.name == "Sphere", "Is a sphere");
    ok(s.radius == 10, "Radius OK")

});

test("Test Sphere collision", function () {

    var s = new Sphere(0, 0, 0, 10);

    var within = s.isColliding(new THREE.Vector3(5, 5, 5));
    ok(within === true, "Is within bounds returns true");

    var outside = s.isColliding(new THREE.Vector3(20, 20, 20));
    ok(outside === false, "Is outside of bounds returns false");


});

test("Spotlight creation via Light Factory with options set", function () {

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
    ok((spotlight.position.x === 0 && spotlight.position.y === 0 && spotlight.position.z === 10), "Position set correctly");
    ok(spotlight.castShadow === true, "cast should is set true");
    ok((spotlight.target.x === 10, spotlight.target.y === 15, spotlight.target.z === 20), "Target set correctly");


});

test("Spotlight creation via Light Factory with defaults", function () {
    var lightFactory = new LightFactory();
    var spotlight = lightFactory.createLight(
        {
            lightType: "spot"
        }
    )

    ok(spotlight instanceof THREE.SpotLight, "Is an instance of spotlight");
    ok((spotlight.position.x === 0 && spotlight.position.y === 0 && spotlight.position.z === 0), "Default position set correctly");
    ok(spotlight.castShadow === false, "default set of cast shadow should be set to false");
    ok((spotlight.target instanceof THREE.Object3D), "Default target set correctly");

});

test("Directional light creation via Light Factory with presets", function () {
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
    ok(( dirLight.color.r === 0 && dirLight.color.g === 0 && dirLight.color.b === 0), "Color set correctly");
    ok(dirLight.intensity === 10, "Intensity set correctly");
    ok(dirLight.castShadow === true, "Set to cast shadow");


});

//test("Test get div width/height function works correctly", function () {
//    var $fixture = $('#qunit-fixture');
//    $fixture.append("<div id='testwidthheight' style='width:100px; height:200px'> </div>");
//    var wh = getScreenWidthHeight('#testwidthheight');
//    var w = wh[0];
//    var h = wh[1];
//    ok(w === 100, "Width detected correctly");
//    ok(h === 200, "Height detected correctly");
//});

test("Test Voxel center positions are being correctly calculated for the world specified ", function () {

    var world = buildVoxelPositionArray(300, 150);
    ok(world.length === 2, "World has two levels");
    ok(world[0].length === 4 && world[1].length === 4, "Both levels have correct number of voxels");
    ok(world[0][0].centerPosition.x === -75 &&
        world[0][0].centerPosition.y === -75 &&
        world[0][0].centerPosition.z === -75,
        "Position of first voxel center is correct");

});

test("Test that segment radius is being calculated correctly for given sphere", function () {
    var r1 = radiusAtHeightOfSphere(90, 90);
    var r2 = radiusAtHeightOfSphere(45, 90);
    var r3 = radiusAtHeightOfSphere(0, 90);
    ok(r1 === 90, "Height equals radius returns same radius");
    ok((r2 - 77.94) < 0.01, "Radius at 45 from top is 45");
    ok(r3 === 0, "Radius at top is zero");
});

//test("Intersection", function() {
//    //var x = calculateIntersection(-100, 0, 100, 0, 50);
//});

// Moving to 3d point
//test("Closest distance from point to line", function () {
//    var s = new THREE.Vector2(-20, 20);
//    var f = new THREE.Vector2(20, 20);
//    var c = calculateShortestDistanceFromPointToLine(new THREE.Vector2(0, 0), s, f);
//    ok(c.poc.x === 0 && c.poc.y === 20, "yeah");
//});

test("Test Vector3 prototype is equal with tolerance", function () {
    var a = new THREE.Vector3(0, 0.2, 0.3);

    var result = a.equalsWithinTolerence(new THREE.Vector3(0, 0, 0), 1);

    ok(result, "The Vector two vectors are classed as the same");
});

test("Test array prototype clear function", function () {
    var array = [];
    array.push(1, 2, 3, 4, 5, 6);
    ok(array.length === 6, "Array populated with 6 items");
    array.clear();
    ok(array.length === 0, "Array has been cleared successfully");
});

test("Remove first instance THREE.Vector3 match from array", function () {
    var array = new Array();
    array.push(new THREE.Vector3(1, 2, 3));
    array.push(new THREE.Vector3(1, 3, 4));
    array.push(new THREE.Vector3(1, 2, 3));
    array.push(new THREE.Vector3(1, 3, 4));
    ok(array.length === 4, "Array correctly populated with some duplicates");
    array.removeVector3(new THREE.Vector3(1, 3, 4));
    ok(array.length === 3, "Array has had one vector3 removed that had a match");
    ok(array[0].equals(new THREE.Vector3(1, 2, 3)) &&
        array[1].equals(new THREE.Vector3(1, 2, 3)) &&
        array[2].equals(new THREE.Vector3(1, 3, 4)), "All present and accounted for");


});

test("Test coordinates are calculated correctly for a voxel", function () {
    var corners = calculateVoxelVertexPositions(new THREE.Vector3, 2);

    ok(corners.p0.equals(new THREE.Vector3(-1, -1, -1)), "P0 correct");
    ok(corners.p1.equals(new THREE.Vector3(1, -1, -1)), "P1 correct");
    ok(corners.p2.equals(new THREE.Vector3(1, -1, 1)), "P2 correct");
    ok(corners.p3.equals(new THREE.Vector3(-1, -1, 1)), "P3 correct");

    ok(corners.p4.equals(new THREE.Vector3(-1, 1, -1)), "P4 correct");
    ok(corners.p5.equals(new THREE.Vector3(1, 1, -1)), "P5 correct");
    ok(corners.p6.equals(new THREE.Vector3(1, 1, 1)), "P6 correct");
    ok(corners.p7.equals(new THREE.Vector3(-1, 1, 1)), "P7 correct");

});

test("Vector subtraction utilitie method returns correct vector", function () {
    var v1 = new THREE.Vector3(2, 3, 4);
    var v2 = new THREE.Vector3(6, 7, 8);

    var test = vectorBminusVectorA(v1, v2);
    var exp = new THREE.Vector3(4, 4, 4);
    ok(test.equals(exp), "Correct resultant vector calculated");

});

test("Distance from point to line", function() {
   var start = new THREE.Vector3(-1, 0, 0);
   var finish = new THREE.Vector3(1, 0, 0);
   var point = new THREE.Vector3(0, 0, 2);

    var dist = calculateShortestDistanceFromPointToLine(point, start, finish);
    ok(dist === 2, "Distance calculated correctly");

});

test("Distance between two points", function() {
    var p1 = new THREE.Vector3(-1, 0, 0);
    var p2 = new THREE.Vector3(1, 0, 0);
    ok(calculateDistanceBetweenTwoVector3(p1, p2) === 2, "Distance calculated correctly");
});


test("Distance from point to plane", function () {
    var p = new THREE.Vector3(0, 0, 5);
    var normal = new THREE.Vector3(0, 0, 1);
    var pointOnPlane = new THREE.Vector3(0, 0, 0);

    var minDist = shortestDistanceToPlane(p, pointOnPlane, normal);

    ok(minDist === 5, "Correct distance calculated");
});


