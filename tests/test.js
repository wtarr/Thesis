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
