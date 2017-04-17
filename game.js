/*
* Example by Loonride - https://loonride.com/learn/phaser/p2-truck
*/

//set width and height variables for game
var width = 800;
var height = 500;
//create game object and initialize the canvas
var game = new Phaser.Game(width, height, Phaser.AUTO, null, {preload: preload, create: create, update: update});

//initialize some variables
var truck;
var wheels;
//set showBodies to true to see physics body polygons
var showBodies = false;
var wheelMaterial;
var allowTruckBounce = true;

function preload() {
	//set background color of canvas
	game.stage.backgroundColor = '#eee';

	//load assets
	game.load.image('truck', 'asset/truck.png');
	game.load.image('wheel', 'asset/wheel.png');
	game.load.image('hill', 'asset/hill.png');

	//load physics body polygon data from a local JSON file
	game.load.physics("physics", "asset/physics.json");

}
function create() {

	//set world boundaries with a large world width
	game.world.setBounds(0,0,width*2,height);

	//start p2 physics engine
	game.physics.startSystem(Phaser.Physics.P2JS);

	//set gravity
	game.physics.p2.gravity.y = 300;

	//initialize truck
	truck = game.add.sprite(width*0.25, height*0.8, "truck");
	game.physics.p2.enable(truck, showBodies);
	//add physics body polygon
	truck.body.clearShapes();
	truck.body.loadPolygon("physics", "truck");
	//set this to true if you need to adjust wheel positions
	truck.body.kinematic = false;

	//make the camera follow the truck
	game.camera.follow(truck);

	//initialize wheel group
	wheels = game.add.group();

	//create materials for the wheels and the world
	wheelMaterial = game.physics.p2.createMaterial("wheelMaterial");
	var worldMaterial = game.physics.p2.createMaterial("worldMaterial");

	/*
	* initialize wheels using initWheel function (see below)
	* we are passing array with an x, y coordinate of where the center of
	* the wheel should be positioned, relative to the center of the truck
	* these coordinates were obtained through some trial and error
	*/
	var distBelowTruck = 24;
	initWheel([55,distBelowTruck]);
	initWheel([-52, distBelowTruck]);

	/*
	* set the world material for all 4 sides of the world boundary
	* setMaterial(material, left, right, top, bottom)
	*/
	game.physics.p2.setWorldMaterial(worldMaterial, true, true, true, true);

	/*
	* create a contact material between the wheels and the world
	* this allows us to increase friction and reduce restitution (bounciness)
	* the default friction is low, allowing the wheels to slide
	*/
	var contactMaterial = game.physics.p2.createContactMaterial(wheelMaterial,worldMaterial);
	contactMaterial.friction = 1e3;
	contactMaterial.restitution = .3;

	//initialize keyboard arrows for the game controls
	cursors = game.input.keyboard.createCursorKeys();

	//initialize space key
	var spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	//apply upward force to truck when pressed
	spaceKey.onDown.add(function() {
		//allow this force only when wheel comes in contact with ground
		if (allowTruckBounce) {
			truck.body.moveUp(500);
			allowTruckBounce = false;
		}
	}, game);

	//initialize the hill and place it in the center of the bottom boundary
	var hill = game.add.sprite(width, height, "hill");
	hill.position.y -= hill.height * 0.5;
	game.physics.p2.enable(hill, showBodies);
	hill.body.clearShapes();
	hill.body.loadPolygon("physics", "hill");
	//make kinematic so that it does not respond to collisions
	hill.body.kinematic = true;
	/*
	* give it the same material as world boundaries so that it has
	* high friction with the wheels
	*/
	hill.body.setMaterial(worldMaterial);
}
function update() {

	var rotationSpeed = 300;
	/*
	* rotate truck wheels right and left based on keyboard arrows
	* by iterating through the wheel group
	*/
	if (cursors.left.isDown) {
		wheels.children.forEach(function(wheel,index) {
			wheel.body.rotateLeft(rotationSpeed);
		});
	}
	else if (cursors.right.isDown) {
		wheels.children.forEach(function(wheel,index) {
			wheel.body.rotateRight(rotationSpeed);
		});
	}
	else {
		wheels.children.forEach(function(wheel,index) {
			//remove rotation when no arrows are down
			wheel.body.setZeroRotation();
		});
	}
}
//initWheel takes a coordinate array in the form [x, y]
function initWheel(offsetFromTruck) {
	var truckX = truck.position.x;
	var truckY = truck.position.y;
	//position wheel relative to the truck
	var wheel = game.add.sprite(truckX + offsetFromTruck[0],
								truckY + offsetFromTruck[1], "wheel");

	game.physics.p2.enable(wheel, showBodies);
	wheel.body.clearShapes();
	//add a circle shape to the wheel body with radius 15.5
	wheel.body.addCircle(15.5);

	/*
	* Constrain the wheel to the truck so that it can rotate freely on its pivot
	* createRevoluteConstraint(bodyA, pivotA, bodyB, pivotB, maxForce)
	* change maxForce to see how it affects chassis bounciness
	*/
	var maxForce = 100;
	var rev = game.physics.p2.createRevoluteConstraint(truck.body, offsetFromTruck,
		wheel.body, [0,0], maxForce);

	//add wheel to wheels group
	wheels.add(wheel);

	//call onWheelContact when the wheel begins contact with something
	wheel.body.onBeginContact.add(onWheelContact, game);

	/*
	* set the material to be the wheel material so that it can have
	* high friction with the ground
	*/
	wheel.body.setMaterial(wheelMaterial);

	return wheel;
}
//called when wheel begins contact with something
function onWheelContact(phaserBody, p2Body) {
	/*
	* allow another truck bounce if the wheel has touched the bottom boundary
	* (which has no phaser body and has id 4 in P2) or the hill
	*/
	if ((phaserBody === null && p2Body.id == 4)
	|| (phaserBody && phaserBody.sprite.key == "hill")) {
		allowTruckBounce = true;
	}
}
