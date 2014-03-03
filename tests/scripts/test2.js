/**
* Created by William on 26/02/14.
*/
/// <reference path="../../lib/qunit.d.ts" />
/// <reference path="../../logic/Utils2.ts" />
/// <reference path="../../logic/Sculpting2.ts" />
/// <reference path="../../Lib/jquery.d.ts"/>
/// ==========================================================
/// ==================== TypeScript ==========================
/// ==========================================================
QUnit.module("TypeScript - \"utils2.js\" tests");
QUnit.test("Build Axis aligned 2d grid returns correct number of references", function () {
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
QUnit.test("Test that calculateVoxelVertexPosition of new VoxelModule is functioning correctly", function () {
    var voxStateModule = new Voxel.VoxelState2(new THREE.Vector3(0, 0, 0), 2);

    voxStateModule.calculateVoxelVertexPositions();

    ok(voxStateModule.getVerts().p0.getPosition().equals(new THREE.Vector3(-1, -1, -1)), "P0 correct");
    ok(voxStateModule.getVerts().p1.getPosition().equals(new THREE.Vector3(1, -1, -1)), "P1 correct");
    ok(voxStateModule.getVerts().p2.getPosition().equals(new THREE.Vector3(1, -1, 1)), "P2 correct");
    ok(voxStateModule.getVerts().p3.getPosition().equals(new THREE.Vector3(-1, -1, 1)), "P3 correct");

    ok(voxStateModule.getVerts().p4.getPosition().equals(new THREE.Vector3(-1, 1, -1)), "P4 correct");
    ok(voxStateModule.getVerts().p5.getPosition().equals(new THREE.Vector3(1, 1, -1)), "P5 correct");
    ok(voxStateModule.getVerts().p6.getPosition().equals(new THREE.Vector3(1, 1, 1)), "P6 correct");
    ok(voxStateModule.getVerts().p7.getPosition().equals(new THREE.Vector3(-1, 1, 1)), "P7 correct");
});

QUnit.test("Test new TS voxel level", function () {
    var lvl = new Voxel.Level;
    lvl.addToLevel(new Voxel.VoxelState2(new THREE.Vector3(1, 2, 3), 20));
    lvl.addToLevel(new Voxel.VoxelState2(new THREE.Vector3(4, 5, 6), 20));
    ok(lvl.getAllVoxelsAtThisLevel().length == 2, "Correct length returned");
});

QUnit.test("Test that buildWorldVoxelArray", function () {
    //ok(true, "not yet implemented");
    var testScene = new THREE.Scene();
    var world = new Voxel.VoxelWorld(300, 150, testScene);

    //var theWorld = world.getWorldVoxelArray();
    ok(world.getWorldVoxelArray().length === 2, "Correct number of levels returned");
    ok(world.getLevel(0).getAllVoxelsAtThisLevel().length === 4, "Correct number of voxels on level 0");
    ok(world.getLevel(0).getVoxel(0).getCenter().equals(new THREE.Vector3(-75, -75, -75)), "Correct position set for vox[0][0]");
});

QUnit.test("Test voxel world getters are functioning correctly", function () {
    var testScene = new THREE.Scene();
    var worldVoxelArray = new Voxel.VoxelWorld(300, 150, testScene);
    ok(worldVoxelArray.getNumberOfVoxelsPerLevel() === 4, "Correct number of voxel accounted for");
    ok(worldVoxelArray.getNumberOfLevelsInVoxelWorld() === 2, "Correct number of levels accounted for");
});

QUnit.test("Test Node class getters and setters", function () {
    var node = new Geometry.Node(new THREE.Geometry(), new THREE.Material());
    node.setMass(5);
    var node1 = new Geometry.Node(new THREE.Geometry(), new THREE.Material());
    var node2 = new Geometry.Node(new THREE.Geometry(), new THREE.Material());
    node.addToNeigbourhoodNodes(node1);
    node.addToNeigbourhoodNodes(node2);
    ok(node.getNeigbourhoodNodes().length() === 2, "Correct number of nodes added to the array");
    ok(node.getNodePosition().equals(new THREE.Vector3(0, 0, 0)));
    ok(node.getMass() === 5, "Mass was set and retrieved correctly");
});

QUnit.test("Test Vector3 prototype is equal with tolerance", function () {
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
//# sourceMappingURL=test2.js.map
