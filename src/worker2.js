/**
 * Created by William on 01/03/14.
 */
importScripts('../lib/three.min.js', '../src/Utils2.js', '../lib/MCData.js');

var msgQueue =[];
var busy = false;

onmessage = function (e) {


    if (e.data.command === "calculateMeshFacePositions") {
        var arr = Controller.ControlSphere.calculateMeshFacePositions(e.data.particles, e.data.segments);
        postMessage({ id: e.data.id, commandReturn: "calculateMeshFacePositions", faces: arr });
    }

    if (e.data.command === "calculateVoxelGeometry") {
        Voxel.MarchingCubeRendering.msgQueue.push(e.data);
        if (!Voxel.MarchingCubeRendering.busy) processmsgQueue();
    }

};

processmsgQueue = function() {

    if (Voxel.MarchingCubeRendering.msgQueue.length > 0)
    {
        Voxel.MarchingCubeRendering.busy = true;

        var data = Voxel.MarchingCubeRendering.msgQueue.shift();


        var vox = new Voxel.VoxelState2(new THREE.Vector3, 0);
        //console.log(JSON.stringify(data.voxelInfo.getVerts().p0.getValue()));
        vox.getVerts().p0.setPostion(data.voxelInfo.p0.position);
        vox.getVerts().p1.setPostion(data.voxelInfo.p1.position);
        vox.getVerts().p2.setPostion(data.voxelInfo.p2.position);
        vox.getVerts().p3.setPostion(data.voxelInfo.p3.position);

        vox.getVerts().p4.setPostion(data.voxelInfo.p4.position);
        vox.getVerts().p5.setPostion(data.voxelInfo.p5.position);
        vox.getVerts().p6.setPostion(data.voxelInfo.p6.position);
        vox.getVerts().p7.setPostion(data.voxelInfo.p7.position);

        vox.getVerts().p0.setValue(data.voxelInfo.p0.value);
        vox.getVerts().p1.setValue(data.voxelInfo.p1.value);
        vox.getVerts().p2.setValue(data.voxelInfo.p2.value);
        vox.getVerts().p3.setValue(data.voxelInfo.p3.value);

        vox.getVerts().p4.setValue(data.voxelInfo.p4.value);
        vox.getVerts().p5.setValue(data.voxelInfo.p5.value);
        vox.getVerts().p6.setValue(data.voxelInfo.p6.value);
        vox.getVerts().p7.setValue(data.voxelInfo.p7.value);

        var geo = Voxel.MarchingCubeRendering.MarchingCube(
            vox,
            data.threshold
        );

        //console.log(JSON.stringify(geo));

        if (geo.vertices.length > 0)
            postMessage({commandReturn: "calculatedGeometry", lvl: data.level, cur: data.cursortracker, geometry: geo});


        Voxel.MarchingCubeRendering.busy = false;

    }


};

