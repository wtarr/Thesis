/**
 * Created by William on 01/03/14.
 */
importScripts('../lib/three.min.js', '../src/Utils2.js');

onmessage = function (e) {
    if (e.data.command === "calculateMeshFacePositions") {
        var arr = Controller.ControlSphere.calculateMeshFacePositions(e.data.particles, e.data.segments);
        postMessage({ id: e.data.id, commandReturn: "calculateMeshFacePositions", faces: arr });
    }
};

