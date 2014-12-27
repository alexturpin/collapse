var GRID_WIDTH = 15;
var GRID_HEIGHT = 20;
var BLOCK_SIZE = 32;

var game = new Phaser.Game(GRID_WIDTH * BLOCK_SIZE, GRID_HEIGHT * BLOCK_SIZE, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var rng = new Phaser.RandomDataGenerator([Date.now()]);

var grid, blockColors, markedBlocks, markColor;

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

			var color = rng.pick(blockColors);
			var block = game.add.sprite(x * BLOCK_SIZE, game.height - BLOCK_SIZE - (y * BLOCK_SIZE), color);
			grid[x][y] = block;

			block.color = color;
			block.inputEnabled = true;
			block.events.onInputDown.add(blockClicked, this);
		}
	}
}

function getGridPosition(position) {
	return new Phaser.Point(Math.floor(position.x / BLOCK_SIZE), Math.floor((game.height - BLOCK_SIZE - position.y) / BLOCK_SIZE));
}

function blockClicked(sprite, pointer) {
	markedBlocks = [];
	markColor = sprite.color;

	markBlocks(sprite.position, null, 0);

	markedBlocks.forEach(function(block) {
		block.destroy();
	});
}

function markBlocks(worldPosition, check, call) {
	var position = getGridPosition(worldPosition);
	var block = grid[position.x][position.y];

	if (block.color != markColor) return; //Check if is of current mark color
	if (markedBlocks.indexOf(block) != -1) return; //Check if not already marked

	markedBlocks.push(block);

	if (position.x > 0) markBlocks(grid[position.x - 1][position.y]);
	if (position.x < GRID_WIDTH - 1) markBlocks(grid[position.x + 1][position.y]);
	if (position.y > 0) markBlocks(grid[position.x][position.y - 1]);
	if (position.y < GRID_HEIGHT - 1) markBlocks(grid[position.x][position.y + 1]);
}