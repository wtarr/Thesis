/**
 * Created by William on 01/03/14.
 */
importScripts('../lib/three.min.js', '../src/Utils2.js');

onmessage = function (e) {
    if (e.data.command === "calculateMeshFacePositions2") {
        var arr = Controller.ControlSphere.calculateMeshFacePositions(e.data.particles, e.data.segments);
        postMessage({ commandReturn: "calculateMeshFacePositions", faces: arr });
    }
};

