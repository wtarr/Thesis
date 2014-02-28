/**
 * Created by William on 26/02/14.
 */
/// <reference path="../lib/qunit.d.ts" />
/// <reference path="../logic/Utils2.ts" />

// Regular JS

// Declare to hide (some) of the compile errors of legacy code
// I know what I'm doing
declare var $;
declare var Sphere;
declare var LightFactory;
declare var getScreenWidthHeight;
declare var buildVoxelPositionArray;
declare var radiusAtHeightOfSphere;
declare var removeVector3 : any;
declare var calculateVoxelVertexPositions;
declare var calculateShortestDistanceFromPointToLine;
declare var calculateDistanceBetweenTwoVector3;
declare var shortestDistanceToPlane;
declare var vectorBminusVectorA;


QUnit.module("Dummy test");
QUnit.test("hello test", function () {
    ok(1 === 1, "Passed!");
});


QUnit.module("Legacy \"utils.js\" tests");
test("Test Sphere creation", function () {
    var s;
    s = new Sphere(0, 0, 0);
    s.radius = 10;

    ok(s != null, "Sphere not null")
    ok(s.constructor.name == "Sphere", "Is a sphere");
    ok(s.radius == 10, "Radius OK")

});

QUnit.test("Test Sphere collision", function () {

    var s = new Sphere(0, 0, 0, 10);

    var within = s.isColliding(new THREE.Vector3(5, 5, 5));
    ok(within === true, "Is within bounds returns true");

    var outside = s.isColliding(new THREE.Vector3(20, 20, 20));
    ok(outside === false, "Is outside of bounds returns false");


});

QUnit.test("Spotlight creation via Light Factory with options set", function () {

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

QUnit.test("Spotlight creation via Light Factory with defaults", function () {
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

QUnit.test("Directional light creation via Light Factory with presets", function () {
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

QUnit.test("Test get div width/height function works correctly", function () {
    var $fixture = $('#qunit-fixture');
    $fixture.append("<div id='testwidthheight' style='width:100px; height:200px'> </div>");
    var wh = getScreenWidthHeight('#testwidthheight');
    var w = wh[0];
    var h = wh[1];
    ok(w === 100, "Width detected correctly");
    ok(h === 200, "Height detected correctly");
});

QUnit.test("Test Voxel center positions are being correctly calculated for the world specified ", function () {

    var world = buildVoxelPositionArray(300, 150);
    ok(world.length === 2, "World has two levels");
    ok(world[0].length === 4 && world[1].length === 4, "Both levels have correct number of voxels");
    ok(world[0][0].centerPosition.x === -75 &&
        world[0][0].centerPosition.y === -75 &&
        world[0][0].centerPosition.z === -75,
        "Position of first voxel center is correct");

});

QUnit.test("Test that segment radius is being calculated correctly for given sphere", function () {
    var r1 = radiusAtHeightOfSphere(90, 90);
    var r2 = radiusAtHeightOfSphere(45, 90);
    var r3 = radiusAtHeightOfSphere(0, 90);
    ok(r1 === 90, "Height equals radius returns same radius");
    ok((r2 - 77.94) < 0.01, "Radius at 45 from top is 45");
    ok(r3 === 0, "Radius at top is zero");
});

//QUnit.test("Intersection", function() {
//    //var x = calculateIntersection(-100, 0, 100, 0, 50);
//});

// Moving to 3d point
//QUnit.test("Closest distance from point to line", function () {
//    var s = new THREE.Vector2(-20, 20);
//    var f = new THREE.Vector2(20, 20);
//    var c = calculateShortestDistanceFromPointToLine(new THREE.Vector2(0, 0), s, f);
//    ok(c.poc.x === 0 && c.poc.y === 20, "yeah");
//});

QUnit.test("Test Vector3 prototype is equal with tolerance", function () {
    var a = new THREE.Vector3(0, 0.2, 0.3);

    var result = a.equalsWithinTolerence(new THREE.Vector3(0, 0, 0), 1);

    ok(result, "The Vector two vectors are classed as the same");
});

QUnit.test("Test array prototype clear function", function () {
    var array = [];
    array.push(1, 2, 3, 4, 5, 6);
    ok(array.length === 6, "Array populated with 6 items");
    array.clear();
    ok(array.length === 0, "Array has been cleared successfully");
});

QUnit.test("Remove first instance THREE.Vector3 match from array", function () {
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

QUnit.test("Test coordinates are calculated correctly for a voxel", function () {
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

QUnit.test("Vector subtraction utilitie method returns correct vector", function () {
    var v1 = new THREE.Vector3(2, 3, 4);
    var v2 = new THREE.Vector3(6, 7, 8);

    var test = vectorBminusVectorA(v1, v2);
    var exp = new THREE.Vector3(4, 4, 4);
    ok(test.equals(exp), "Correct resultant vector calculated");

});

QUnit.test("Distance from point to line", function() {
    var start = new THREE.Vector3(-1, 0, 0);
    var finish = new THREE.Vector3(1, 0, 0);
    var point = new THREE.Vector3(0, 0, 2);

    var dist = calculateShortestDistanceFromPointToLine(point, start, finish);
    ok(dist === 2, "Distance calculated correctly");

});

QUnit.test("Distance between two points", function() {
    var p1 = new THREE.Vector3(-1, 0, 0);
    var p2 = new THREE.Vector3(1, 0, 0);
    ok(calculateDistanceBetweenTwoVector3(p1, p2) === 2, "Distance calculated correctly");
});


QUnit.test("Distance from point to plane", function () {
    var p = new THREE.Vector3(0, 0, 5);
    var normal = new THREE.Vector3(0, 0, 1);
    var pointOnPlane = new THREE.Vector3(0, 0, 0);

    var minDist = shortestDistanceToPlane(p, pointOnPlane, normal);

    ok(minDist === 5, "Correct distance calculated");
});

/// ==========================================================
/// ==================== TypeScript ==========================
/// ==========================================================

QUnit.module("TypeScript - \"utils2.js\" tests");
QUnit.test("Build Axis aligned 2d grid returns correct number of references", function()
{
    var grid = new Voxel.GridCreator(200, 100);
    var geo = grid.buildAxisAligned2DGrids();
    ok(geo.vertices.length === 36, "Correct number of vertices expected");

});

QUnit.test("Test a simple TypeScript module that uses composite classes", function()
{
    var a = new testModule.test2('william');
    ok(a.getName() === ('william'), "Name is returned correctly from compostite class");
});



QUnit.test("Test that calculateVoxelVertexPosition of new VoxelModule is functioning correctly", function()
{
    var voxStateModule = new Voxel.VoxelState2(new THREE.Vector3(0, 0, 0), 2);

    voxStateModule.calculateVoxelVertexPositions();

    ok(voxStateModule.getVerts().p0.getPosition().equals(new THREE.Vector3(-1, -1, -1)), "P0 correct");
    ok(voxStateModule.getVerts().p1.getPosition().equals(new THREE.Vector3( 1, -1, -1)), "P1 correct");
    ok(voxStateModule.getVerts().p2.getPosition().equals(new THREE.Vector3( 1, -1,  1)), "P2 correct");
    ok(voxStateModule.getVerts().p3.getPosition().equals(new THREE.Vector3(-1, -1,  1)), "P3 correct");

    ok(voxStateModule.getVerts().p4.getPosition().equals(new THREE.Vector3(-1,  1, -1)), "P4 correct");
    ok(voxStateModule.getVerts().p5.getPosition().equals(new THREE.Vector3( 1,  1, -1)), "P5 correct");
    ok(voxStateModule.getVerts().p6.getPosition().equals(new THREE.Vector3( 1,  1,  1)), "P6 correct");
    ok(voxStateModule.getVerts().p7.getPosition().equals(new THREE.Vector3(-1,  1,  1)), "P7 correct");

});

QUnit.test("Test new TS voxel level", function() {
    var lvl = new Voxel.Level;
    lvl.addToLevel(new Voxel.VoxelState2(new THREE.Vector3(1, 2, 3), 20));
    lvl.addToLevel(new Voxel.VoxelState2(new THREE.Vector3(4, 5, 6), 20));
    ok(lvl.getLevel().length == 2, "Correct length returned");

});

QUnit.test("Test that buildWorldVoxelArray", function() {

    //ok(true, "not yet implemented");
    var world = new Voxel.VoxelWorld(300, 150);
    var theWorld = world.getWorldVoxelArray();
    ok(theWorld.length === 2, "Correct number of levels returned");
    ok(theWorld[0].getLevel().length === 4, "Correct number of voxels on level 0");
    ok(theWorld[1].getLevel().length === 4, "Correct number of voxels on level 1");
    ok(theWorld[0].getLevel()[0].getCenter().equals(new THREE.Vector3(-75, -75, -75)), "Correct position set for vox[0][0]");

});

QUnit.test("Test voxel world getters are functioning correctly", function()
{
    var worldVoxelArray = new Voxel.VoxelWorld(300, 150);
    ok(worldVoxelArray.getNumberOfVoxelsPerLevel() === 4, "Correct number of voxel accounted for");
    ok(worldVoxelArray.getNumberOfLevelsInVoxelWorld() === 2, "Correct number of levels accounted for");
});

QUnit.test("Test Node class getters and setters" , function(){
    var node = new Voxel.Node(new THREE.Geometry(), new THREE.Material());
    node.setMass(5);
    var node1 = new Voxel.Node(new THREE.Geometry(), new THREE.Material());
    var node2 = new Voxel.Node(new THREE.Geometry(), new THREE.Material());
    node.addToNeigbourhoodNodes(node1);
    node.addToNeigbourhoodNodes(node2);
    ok(node.getNeigbourhoodNodes().length() === 2, "Correct number of nodes added to the array");
    ok(node.getNodePosition().equals(new THREE.Vector3(0, 0, 0)));
    ok(node.getMass()=== 5, "Mass was set and retrieved correctly");

});

