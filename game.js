var GRID_WIDTH = 15;
var GRID_HEIGHT = 20;
var BLOCK_SIZE = 32;
var ANIM_SPEED = 100;

var game = new Phaser.Game(GRID_WIDTH * BLOCK_SIZE, GRID_HEIGHT * BLOCK_SIZE, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var rng = new Phaser.RandomDataGenerator(/*[Date.now()]*/);

var grid, blockColors, markedBlocks, markColor, reorganizing;

function preload() {
	game.load.image('blue', 'assets/img/element_blue_square.png');
	game.load.image('red', 'assets/img/element_red_square.png');
	game.load.image('green', 'assets/img/element_green_square.png');
}

function create() {
	this.input.maxPointers = 1;
	this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	this.scale.pageAlignHorizontally = true;
	this.scale.pageAlignVertically = true;
	this.scale.setScreenSize(true);

	blockColors = ['blue', 'red', 'green'];
	reorganizing = false;

	initGrid();
}

function update() {

}

function initGrid() {
	grid = [];
	for(var x = 0; x < GRID_WIDTH; x++) {
		grid[x] = Array(GRID_WIDTH);
		for(var y = 0; y < GRID_HEIGHT; y++) {
			if (y > 10) continue;

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
	var fallDelay = 0;
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
			tween.to({y: game.height - BLOCK_SIZE - y * BLOCK_SIZE}, ANIM_SPEED);
			tween.start();
			fallDelay = ANIM_SPEED;

			//Reorganize grid
			grid[x][y] = nearestTop;
			grid[x][nearestTopY] = null;
		}
	}

	setTimeout(centerBlocks, fallDelay);

	//Centering of blocks
	function centerBlocks() {
		var centerDelay = 0;

		//Moving blocks towards the center
		var center = (GRID_WIDTH + 1) / 2;
		for(var x = center - 1; x >= 0; x--) { //Scan center to left
			if (grid[x][0] == null) {
				var column; //Find next column
				for(var column = x; column >= 0; column--) {
					if (grid[column][0]) break;
				}

				shiftColumn(column, x - column);
				centerDelay = ANIM_SPEED;
			}
		}
		for(var x = center; x < GRID_WIDTH; x++) { //Scan center to right
			if (grid[x][0] == null) {
				var column; //Find next column
				for(var column = x; column < GRID_WIDTH; column++) {
					if (grid[column][0]) break;
				}

				shiftColumn(column, x - column);
				centerDelay = ANIM_SPEED;
			}
		}

		setTimeout(function() {
			reorganizing = false;
		}, centerDelay);
	}
}

function shiftColumn(column, shift) {
	if (column < 0 || column >= GRID_WIDTH) return;

	for(var y = 0; y < GRID_HEIGHT; y++) {
		var block = grid[column][y];
		if (block == null) break;

		//Animate shift
		var tween = game.add.tween(block);
		tween.to({x: block.x + (BLOCK_SIZE * shift)}, ANIM_SPEED);
		tween.start();

		//Reorganize grid
		grid[column][y] = null;
		grid[column + shift][y] = block;
	}
}
