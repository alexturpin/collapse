var GRID_WIDTH = 15;
var GRID_HEIGHT = 20;
var BLOCK_SIZE = 32;

var game = new Phaser.Game(GRID_WIDTH * BLOCK_SIZE, GRID_HEIGHT * BLOCK_SIZE, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var rng = new Phaser.RandomDataGenerator([Date.now()]);

var grid, blockColors;

function preload() {
	game.load.image('blue', 'assets/img/element_blue_square.png');
	game.load.image('red', 'assets/img/element_red_square.png');
	game.load.image('green', 'assets/img/element_green_square.png');
}

function create() {
	blockColors = ['blue', 'red', 'green'];

	initGrid();
}

function update() {

}

function initGrid() {
	grid = [];
	for(var x = 0; x < GRID_WIDTH; x++) {
		grid[x] = Array(GRID_WIDTH);
		for(var y = 0; y < GRID_HEIGHT; y++) {
			//if (y > 10) continue;

			var block = game.add.sprite(x * BLOCK_SIZE, game.height - BLOCK_SIZE - (y * BLOCK_SIZE), rng.pick(blockColors));
			grid[x][y] = block;
		}
	}
}