importScripts('../lib/three.js', '../src/Utils.js');

onmessage = function (e) {
    if (e.data.command === "calculateMeshFacePositions") {
        postMessage({commandReturn: "calculateMeshFacePositions", faces: calculateMeshFacePositions(e.data.particles, e.data.segments)});
    }

}