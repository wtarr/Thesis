importScripts('../lib/three.js');

function addMesh(particles, segments) {

    var particles = JSON.parse(particles);

    var listOfObjects = [];
    var beginningOfOtherPole = particles.length;

    console.log(beginningOfOtherPole);
    var current = 0;

    while (current < beginningOfOtherPole) {
        var geom = new THREE.Geometry();
        var blockSize = segments;

        if (current < blockSize) // poles block of 10
        {

            var theFirstPole = 0;
            var theOtherPole = particles.length - 1;


            if (current === blockSize - 1) {
                console.log(particles[0].position);
                geom.vertices.push(particles[theFirstPole].position, particles[current + 1].position, particles[theFirstPole + 1].position);
                geom.vertices.push(particles[theOtherPole].position, particles[(particles.length - 1) - current - 1].position, particles[particles.length - 2].position);
                geom.faces.push(new THREE.Face3(0, 1, 2));
                geom.faces.push(new THREE.Face3(3, 4, 5));
                //listOfObjects.push({a: [particles[theFirstPole].position.x, particles[theFirstPole].position.y], b: 0, c: 0, d: 0, e: 0, f: 0 });

            }
            else {
              //  geom.vertices.push(particles[theFirstPole].position, particles[current + 1].position, particles[current + 2].position);
              //  geom.vertices.push(particles[theOtherPole].position, particles[(particles.length - 1) - current - 1].position, particles[(particles.length - 1) - current - 2].position);
              //  geom.faces.push(new THREE.Face3(0, 1, 2));
              //  geom.faces.push(new THREE.Face3(3, 4, 5));
            }

            geom.computeCentroids();
            geom.computeFaceNormals();
            geom.computeVertexNormals();

            var object = new THREE.Mesh(geom, new THREE.MeshNormalMaterial({color: 0xF50000, side: THREE.DoubleSide }));
            listOfObjects.push(object);

        }

        else if (current >= blockSize + 1 && current < beginningOfOtherPole - 1) {

            if (current % blockSize > 0) {
               // geom.vertices.push(particles[current].position, particles[current + 1].position, particles[current - blockSize].position);
              //  geom.vertices.push(particles[current + 1].position, particles[current - (blockSize - 1)].position, particles[current - blockSize].position);
             //   geom.faces.push(new THREE.Face3(0, 1, 2));
             //   geom.faces.push(new THREE.Face3(3, 4, 5));
            }
            else {
              //  geom.vertices.push(particles[current - blockSize].position, particles[current].position, particles[current - blockSize + 1].position);
             //   geom.vertices.push(particles[current - blockSize].position, particles[current - blockSize + 1].position, particles[current - (blockSize * 2) + 1].position);
             //   geom.faces.push(new THREE.Face3(0, 1, 2));
             //   geom.faces.push(new THREE.Face3(3, 4, 5));
            }
            geom.computeCentroids();
            geom.computeFaceNormals();
            geom.computeVertexNormals();

            var object = new THREE.Mesh(geom, new THREE.MeshNormalMaterial({color: 0xF50000, side: THREE.DoubleSide }));
           listOfObjects.push(object);
        }

        current++;
    }

    return listOfObjects;
}

onmessage = function(e){
//    postMessage( { message: "hello" } );
    if (e.data.command === "addMesh")
    {
        //console.log(e.data.particles);
        var dataToReturn = addMesh(e.data.particles, e.data.segments);
        postMessage( {commandReturn: "addMesh", faces : dataToReturn});
    }
    else if (e.command === "hello")
    {
        postMessage({ response: "hey"});
    }
}