/**
 * Created by William on 15/11/13.
 */
test("hello test", function()
{
    ok( 1 == "1", "Passed!");
});

test("Test Sphere creation", function()
{
   var s;
   s = new Sphere(0, 0, 0);
   s.radius = 10;

   ok(s != null, "Sphere not null")
   ok(s.constructor.name == "Sphere", "Is a sphere");
   ok(s.radius == 10, "Radius OK")

});

test("Test Sphere collision", function(){

    var s = new Sphere(0, 0, 0, 10);

    var within = s.isColliding(new THREE.Vector3(5, 5, 5));
    ok(within === true, "Is within bounds returns true");

    var outside = s.isColliding(new THREE.Vector3(20, 20, 20));
    ok(outside === false, "Is outside of bounds returns false");


});