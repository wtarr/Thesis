/*
*  Based on http://threejs.org/examples/webgl_octree.html
* */


function OctreeImpl(){

    var camera,
        controls,
        scene,
        renderer,
        octree,
        geometry,
        material,
        mesh,
        meshes = [],
        meshesSearch = [],
        meshCountMax = 16,
        radius = 500,
        radiusMax = radius * 10,
        radiusMaxHalf = radiusMax * 0.5,
        radiusSearch = 400,
        searchMesh,
        worldWidthHeight = 1000;
    baseR = 255, baseG = 0, baseB = 255,
    foundR = 0, foundG = 255, foundB = 0,
    adding = true;
    var canvasWidth, canvasHeight;

    var clock = new THREE.Clock();

    init();
    animate();

    function init() {

        // standard three scene, camera, renderer
        canvasHeight = $('#webgl').height();
        canvasWidth = $('#webgl').width();

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, 10000);
        camera.position.x = 500;
        camera.position.y = 100;
        camera.position.z = 0;
        camera.lookAt(scene.position);
        //scene.add( camera );

        controls = new THREE.OrbitControls(camera);

        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(0xEEEEEE);
        renderer.setSize( $('#webgl').width() , $('#webgl').height() );


        $("#webgl").append(renderer.domElement);

        // create octree

        octree = new THREE.Octree( {
            // when undeferred = true, objects are inserted immediately
            // instead of being deferred until next octree.update() call
            // this may decrease performance as it forces a matrix update
            undeferred: false,
            // set the max depth of tree
            depthMax: Infinity,
            // max number of objects before nodes split or merge
            objectsThreshold: 8,
            // percent between 0 and 1 that nodes will overlap each other
            // helps insert objects that lie over more than one node
            overlapPct: 0.15,
            // pass the scene to visualize the octree
            scene: scene
        } );

        // create object to show search radius and add to scene

//    searchMesh = new THREE.Mesh(
//            new THREE.SphereGeometry( radiusSearch ),
//            new THREE.MeshBasicMaterial( { color: 0x00FF00, transparent: true, opacity: 0.4 } )
//    );
        //scene.add( searchMesh );

        // info
        var cube = new THREE.BoxHelper();
        cube.material.color.setRGB(0, 0, 1);
        cube.scale.set(worldWidthHeight, worldWidthHeight, worldWidthHeight);

        scene.add(cube);

    }

    function animate() {

        // note: three.js includes requestAnimationFrame shim
        requestAnimationFrame( animate );

        // modify octree structure by adding/removing objects

        modifyOctree();

        // search octree at random location

        //searchOctree();

        // render results

        update();

        render();

        // update octree to add deferred objects
        octree.update();



    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function modifyOctree() {

        // if is adding objects to octree

        if ( adding === true ) {

            // create new object

            geometry = new THREE.CubeGeometry( 50, 50, 50 );
            material = new THREE.MeshBasicMaterial();
            material.color.setRGB( baseR, baseG, baseB );

            mesh = new THREE.Mesh( geometry, material );

            // give new object a random position in radius

            mesh.position.set(
                Math.random() * radiusMax - radiusMaxHalf,
                Math.random() * radiusMax - radiusMaxHalf,
                Math.random() * radiusMax - radiusMaxHalf
            );

            // add new object to octree and scene

            octree.add( mesh );
            scene.add( mesh );

            // store object for later

            meshes.push( mesh );

            // if at max, stop adding

            if ( meshes.length === meshCountMax ) {

                adding = false;

            }


        }
        // else remove objects from octree
        // else {

        // 	// get object

        // 	mesh = meshes.shift();

        // 	// remove from scene and octree

        // 	scene.remove( mesh );
        // 	octree.remove( mesh );

        // 	// if no more objects, start adding

        // 	if ( meshes.length === 0 ) {

        // 		adding = true;

        // 	}

        // }

        /*

         // octree details to console

         console.log( ' OCTREE: ', octree );
         console.log( ' ... depth ', octree.depth, ' vs depth end?', octree.depth_end() );
         console.log( ' ... num nodes: ', octree.node_count_end() );
         console.log( ' ... total objects: ', octree.object_count_end(), ' vs tree objects length: ', octree.objects.length );

         // print full octree structure to console

         octree.to_console();

         */

    }

    function searchOctree() {

        var i, il;

        // revert previous search objects to base color

        for ( i = 0, il = meshesSearch.length; i < il; i++ ) {

            meshesSearch[ i ].object.material.color.setRGB( baseR, baseG, baseB );

        }

        // new search position
        searchMesh.position.set(
            Math.random() * radiusMax - radiusMaxHalf,
            Math.random() * radiusMax - radiusMaxHalf,
            Math.random() * radiusMax - radiusMaxHalf
        );

        // record start time

        var timeStart = Date.now();

        // search octree from search mesh position with search radius
        // optional third parameter: boolean, if should sort results by object when using faces in octree
        // optional fourth parameter: vector3, direction of search when using ray (assumes radius is distance/far of ray)

        var rayCaster = new THREE.Raycaster( new THREE.Vector3().copy( searchMesh.position ), new THREE.Vector3( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 ).normalize() );
        meshesSearch = octree.search( rayCaster.ray.origin, radiusSearch, true, rayCaster.ray.direction );
        var intersections = rayCaster.intersectOctreeObjects( meshesSearch );

        // record end time

        var timeEnd = Date.now();

        // set color of all meshes found in search

        for ( i = 0, il = meshesSearch.length; i < il; i++ ) {

            meshesSearch[ i ].object.material.color.setRGB( foundR, foundG, foundB );

        }

        /*

         // results to console

         console.log( 'OCTREE: ', octree );
         console.log( '... searched ', meshes.length, ' and found ', meshesSearch.length, ' with intersections ', intersections.length, ' and took ', ( timeEnd - timeStart ), ' ms ' );

         */

    }

    function render() {

        var timer = - Date.now() / 5000;

        /*camera.position.x = Math.cos( timer ) * 10000;
         camera.position.z = Math.sin( timer ) * 10000;
         camera.lookAt( scene.position );*/

        renderer.render( scene, camera );

    }

    function update() {

        var delta = clock.getDelta();

        controls.update();

    }
}