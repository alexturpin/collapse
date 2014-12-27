var GRID_WIDTH = 15;
var GRID_HEIGHT = 20;
var BLOCK_SIZE = 32;

var game = new Phaser.Game(GRID_WIDTH * BLOCK_SIZE, GRID_HEIGHT * BLOCK_SIZE, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var rng = new Phaser.RandomDataGenerator([Date.now()]);

var grid, blockColors, markedBlocks, markColor, reorganizing = false;

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

function blockClicked(block, pointer) {
	if (reorganizing) return;

	markedBlocks = [];
	markColor = block.color;

	markBlocks(block);

	markedBlocks.forEach(function(block) {
		block.destroy();

		var position = getGridPosition(block);
		grid[position.x][position.y] = null;
	});

	reorganizeBlocks();
}

function markBlocks(block) {
	if (block == null) return; //Empty space
	if (block.color != markColor) return; //Check if is of current mark color
	if (markedBlocks.indexOf(block) != -1) return; //Check if not already marked

	markedBlocks.push(block);

	var position = getGridPosition(block);
	if (position.x > 0) markBlocks(grid[position.x - 1][position.y]);
	if (position.x < GRID_WIDTH - 1) markBlocks(grid[position.x + 1][position.y]);
	if (position.y > 0) markBlocks(grid[position.x][position.y - 1]);
	if (position.y < GRID_HEIGHT - 1) markBlocks(grid[position.x][position.y + 1]);
}

function reorganizeBlocks() {
	reorganizing = true;

	//Falling of blocks
	for(var x = 0; x < GRID_WIDTH; x++) {
		for(var y = 0; y < GRID_HEIGHT; y++) {
			if (grid[x][y] != null) continue;

			//Find nearest top block
			var nearestTop = null, nearestTopY;
			for(var nearestTopY = y; nearestTopY < GRID_HEIGHT; nearestTopY++) {
				var block = grid[x][nearestTopY];
				if (block != null) {
					nearestTop = block;
					break;
				}
			}

			if (nearestTop == null) continue;

			//Animate fall
			var tween = game.add.tween(nearestTop);
			tween.to({y: game.height - BLOCK_SIZE - y * BLOCK_SIZE}, 200);
			tween.start();

			//Reorganize grid
			grid[x][y] = nearestTop;
			grid[x][nearestTopY] = null;
		}
	}

	reorganizing = false;
}