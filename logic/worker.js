importScripts('../lib/three.js', '../logic/Utils.js');

onmessage = function (e) {
    if (e.data.command === "calculateMeshFacePositions") {
        postMessage({commandReturn: "calculateMeshFacePositions", faces: calculateMeshFacePositions(e.data.particles, e.data.segments)});
    }
}