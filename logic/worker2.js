/**
 * Created by William on 01/03/14.
 */
/// < reference path = './Utils2.ts'/>
/// < reference path = './Sculpting2.ts'/>
importScripts('../lib/three.js', '../logic/Utils.js', '../logic/Utils2.js');

onmessage = function (e) {
    if (e.data.command === "calculateMeshFacePositions2") {
        var arr = Controller.ControlSphere.calculateMeshFacePositions(e.data.particles, e.data.segments);
        postMessage({ commandReturn: "calculateMeshFacePositions", faces: arr });
    }
};
//# sourceMappingURL=worker2.js.map
