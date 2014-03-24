/**
 * Created by William on 01/03/14.
 */
importScripts('../lib/three.min.js', '../src/Utils2.js', '../lib/MCData.js');

onmessage = function (e) {


    if (e.data.command === "calculateMeshFacePositions") {
        var arr = Controller.ControlSphere.calculateMeshFacePositions(e.data.particles, e.data.segments);
        postMessage({ id: e.data.id, commandReturn: "calculateMeshFacePositions", faces: arr });
    }

    if (e.data.command === "calculateVoxelGeometry") {
        //console.log("Msg recv");
        var data = Voxel.MarchingCubeRendering.processWorkerRequest(e.data);

        postMessage({commandReturn : "calculatedVoxelGeometry", data : data});
    }

};



