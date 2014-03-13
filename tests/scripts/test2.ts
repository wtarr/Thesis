/**
 * Created by William on 26/02/14.
 */
/// <reference path="../../lib/qunit.d.ts" />
/// <reference path="../../src/Utils2.ts" />
/// <reference path="../../src/Sculpting2.ts" />
/// <reference path="../../lib/three.d.ts"/>
/// <reference path="../../Lib/jquery.d.ts"/>


/// ==========================================================
/// ==================== TypeScript ==========================
/// ==========================================================

QUnit.module("TypeScript - \"utils2.js\" tests");
QUnit.test("Build Axis aligned 2d grid returns correct number of references", () =>
{
    var grid = new Geometry.GridCreator(200, 100);
    var geo = grid.buildAxisAligned2DGrids();
    ok(geo.vertices.length === 36, "Correct number of vertices expected");

});

//
//QUnit.test("Test a simple TypeScript module that uses composite classes", function()
//{
//    var a = new testModule.test2('william');
//    ok(a.getName() === ('william'), "Name is returned correctly from compostite class");
//});



QUnit.test("Test that calculateVoxelVertexPosition of new VoxelModule is functioning correctly", () =>
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

QUnit.test("Test new TS voxel level", () =>
{
    var lvl = new Voxel.Level;
    lvl.addToLevel(new Voxel.VoxelState2(new THREE.Vector3(1, 2, 3), 20));
    lvl.addToLevel(new Voxel.VoxelState2(new THREE.Vector3(4, 5, 6), 20));
    ok(lvl.getAllVoxelsAtThisLevel().length == 2, "Correct length returned");

});

QUnit.test("Test that buildWorldVoxelArray", () => {

    //ok(true, "not yet implemented");
    var testScene = new THREE.Scene();
    var world = new Voxel.VoxelWorld(300, 150, testScene);
    //var theWorld = world.getWorldVoxelArray();
    ok(world.getWorldVoxelArray().length === 2, "Correct number of levels returned");
    ok(world.getLevel(0).getAllVoxelsAtThisLevel().length === 4, "Correct number of voxels on level 0");
    ok(world.getLevel(0).getVoxel(0).getCenter().equals(new THREE.Vector3(-75, -75, -75)), "Correct position set for vox[0][0]");

});

QUnit.test("Test voxel world getters are functioning correctly", () =>
{
    var testScene = new THREE.Scene();
    var worldVoxelArray = new Voxel.VoxelWorld(300, 150, testScene);
    ok(worldVoxelArray.getNumberOfVoxelsPerLevel() === 4, "Correct number of voxel accounted for");
    ok(worldVoxelArray.getNumberOfLevelsInVoxelWorld() === 2, "Correct number of levels accounted for");
});

QUnit.test("Test Node class getters and setters" , () =>
{
    var node = new Geometry.Node(new THREE.Geometry(), new THREE.Material());
    node.setMass(5);
    var node1 = new Geometry.Node(new THREE.Geometry(), new THREE.Material());
    var node2 = new Geometry.Node(new THREE.Geometry(), new THREE.Material());
    node.addToNeigbourhoodNodes(node1);
    node.addToNeigbourhoodNodes(node2);
    ok(node.getNeigbourhoodNodes().length() === 2, "Correct number of nodes added to the array");
    ok(node.getNodePosition().equals(new THREE.Vector3(0, 0, 0)));
    ok(node.getMass()=== 5, "Mass was set and retrieved correctly");

});

QUnit.test("Test Vector3 prototype is equal with tolerance",  () =>
{
    var a = new Geometry.Vector3Extended(0, 0.2, 0.3);

    var result = a.equalsWithinTolerence(new THREE.Vector3(0, 0, 0), 1);

    ok(result, "The Vector two vectors are classed as the same");
});

//QUnit.test("Test Controller Sphere Generator", function () {
//    ok(false, "not implemented");
//});


// Sculpt needs to bind to a div, I dont know
// how to do this yet for a test
//QUnit.test("Test Sculpt", function() {
//    var gui = new Implementation.GUI();
//    var sculpt = new Implementation.Sculpt2(gui);
//
//    ok(gui instanceof Implementation.GUI, "Correct type GUI");
//    ok(sculpt instanceof Implementation.Sculpt2, "Correct type Sculpt");
//});

//QUnit.test("Test width height", function() {
//    var fixture = $("#qunit-fixture");
//    fixture.append("<div id='testwidthheight' style='width:100px; height:200px'> </div>");
//    //var wh = Helper.jqhelper.getScreenWH("t");
//    //ok(wh[0] === 100, "Width correctly detected");
//    //ok(wh[1] === 200, "Height correctly detected");
//
//});

// Test springs
// Test collection
// Test voxel set values / set inside


QUnit.test("Is point between on line between start and end", () =>
{
    var p1 = new THREE.Vector3(-1, 0, 0);
    var p2 = new THREE.Vector3(1, 0, 0);
    var pbetween = new THREE.Vector3(0, 0, 0);
    var pOutside = new THREE.Vector3(-4, 0, 3);
    var pOutsideMarginally = new THREE.Vector3(-1.00001, 0, 0);
    var pInsideMarginally = new THREE.Vector3(-0.99999, 0, 0);
    var offLineCompletely = new THREE.Vector3(0, 2, 0);

    var p1t2 = new THREE.Vector3(-50, -150, 85.11);
    var p2t2 = new THREE.Vector3(-50, -150, -85.11);
    var pointBetween = new THREE.Vector3(-50, -150, 50);
    var pointOff = new THREE.Vector3(-50, -170, 50);

    var testBetween = Geometry.GeometryHelper.isBetween(p1, p2, pbetween);
    var testOutside = Geometry.GeometryHelper.isBetween(p1, p2, pOutside);
    var testOutsideMarginally = Geometry.GeometryHelper.isBetween(p1, p2, pOutsideMarginally);
    var testInsideMarginally = Geometry.GeometryHelper.isBetween(p1, p2, pInsideMarginally);
    var testOffLineCompletely = Geometry.GeometryHelper.isBetween(p1, p2, offLineCompletely);
    var testRealisticPoint = Geometry.GeometryHelper.isBetween(p1t2, p2t2, pointBetween);
    var testReaslisticPointOffLineSegment = Geometry.GeometryHelper.isBetween(p1t2, p2t2, pointOff);


    ok(testBetween, "On line test successful");
    ok(testOutside == false, "Not on line test successful");
    ok(testInsideMarginally, "Test for marginally inside successful");
    ok(testOutsideMarginally == false, "Test for marginally outside successful");
    ok(testOffLineCompletely === false, "Not collinear detected correctly");
    ok(testRealisticPoint === true, "Realistic test passed - in on line segement");
    ok(testReaslisticPointOffLineSegment === false, "Realistic test passed - point is not on line segement");

});

QUnit.test("Test Collection(T) functionality", ()=>
{
    var collectionOfVectors = new Geometry.Collection<THREE.Vector3>();
    collectionOfVectors.add(new THREE.Vector3(0, 2, 4));
    collectionOfVectors.add(new THREE.Vector3(3, 4, 5));
    collectionOfVectors.add(new THREE.Vector3(4, 3, 2));

    var doesContain = collectionOfVectors.contains(new THREE.Vector3(3, 4, 5));

    ok(doesContain, "The vector specified has been correctly identified as being contained in the collection");

    doesContain = collectionOfVectors.contains(new THREE.Vector3(3, 100, 5));

    ok(doesContain === false, "The vector specified has been correctly identified as NOT being contained in the collection");

    var collectionOfLines = new Geometry.Collection<Geometry.Line>();
    var line = new Geometry.Line(new Geometry.Vector3Extended(0, 1, 2), new Geometry.Vector3Extended(2, 1, 2));
    var line2 = new Geometry.Line(new Geometry.Vector3Extended(3, 1, 2), new Geometry.Vector3Extended(5, 1, 2));
    var line3 = new Geometry.Line(new Geometry.Vector3Extended(2, 4, 2), new Geometry.Vector3Extended(2, 7, 3));

    collectionOfLines.add(line);
    collectionOfLines.add(line2);
    collectionOfLines.add(line3);

    doesContain = collectionOfLines.contains(line2);

    ok(doesContain, "The line specified has been correctly indenified as being in the collection");

    var linenotincollection =  new Geometry.Line(new Geometry.Vector3Extended(2, 40, 2), new Geometry.Vector3Extended(10, 7, 3));

    doesContain = collectionOfLines.contains(linenotincollection);

    ok(doesContain == false, "The line specified has been correctly identifies as NOT being in the collection");



    // Test collection uniqueness

    var line4 = new Geometry.Line(new Geometry.Vector3Extended(2, 4, 2), new Geometry.Vector3Extended(2, 7, 3));
    var line5 = new Geometry.Line(new Geometry.Vector3Extended(2, 4, 2), new Geometry.Vector3Extended(2, 7, 3));
    var line6 = new Geometry.Line(new Geometry.Vector3Extended(2, 4, 2), new Geometry.Vector3Extended(2, 7, 3));

    collectionOfLines.add(line4);
    collectionOfLines.add(line5);
    collectionOfLines.add(line6);

    var len = collectionOfLines.length();

    ok(len === 6, "Correct number of lines in collection pre unique function");

    collectionOfLines.makeUnique();

    len = collectionOfLines.length();

    ok(len === 3, "Correct number of lines in collection post unique function");


});

QUnit.test("Test Line functionality", () =>
{
    var line = new Geometry.Line(new Geometry.Vector3Extended(0, 1, 2), new Geometry.Vector3Extended(2, 1, 2));

    var line2 = new Geometry.Line(new Geometry.Vector3Extended(0, 1, 2), new Geometry.Vector3Extended(2, 1, 2));

    var line3 = new Geometry.Line(new Geometry.Vector3Extended(0, 1, 2), new Geometry.Vector3Extended(2, 1, 3));

    ok(line.equals(line2), "Same line comparision functions correctly");
    ok(line.equals(line3) == false, "Different line comparsion functions correctly");

});