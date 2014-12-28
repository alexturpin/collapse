var GRID_WIDTH = 15;
var GRID_HEIGHT = 20;
var BLOCK_SIZE = 32;
var INITIAL_ANIM_SPEED = 100;
var MINIMUM_ANIM_SPEED = 25;
var INITIAL_ROWS = 5;
var INITIAL_ROW_SPEED = 4000;
var LEVEL_ROWS = 10;
var LEVEL_ROW_SPEED_DECREMENT = 50;
var MINIMUM_ROW_SPEED = 500;
var LEVEL_GREY = 5;
var GAME_OVER_RESTART_DELAY = 5000;

var game = new Phaser.Game(GRID_WIDTH * BLOCK_SIZE, GRID_HEIGHT * BLOCK_SIZE, Phaser.AUTO, '', { preload: preload, create: create });
var rng = new Phaser.RandomDataGenerator([Date.now()]);
var sounds = {};

var grid, blockColors, markedBlocks, markColor, reorganizing, animSpeed, rowSpeed, rowIndex, graphics, pauseText, totalRows, level, levelText, score, scoreText, gameOver, gameOverText;

function preload() {
	game.load.image('blue', 'assets/img/element_blue_square.png');
	game.load.image('red', 'assets/img/element_red_square.png');
	game.load.image('green', 'assets/img/element_green_square.png');
	game.load.image('grey', 'assets/img/element_grey_square.png');

	game.load.audio('click', 'assets/sound/click.ogg');
	game.load.audio('row', 'assets/sound/row.ogg');
	game.load.audio('levelup', 'assets/sound/levelup.ogg');
	game.load.audio('gameover', 'assets/sound/gameover.ogg');
}

function create() {
	this.input.maxPointers = 1;
	this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	this.scale.pageAlignHorizontally = true;
	this.scale.pageAlignVertically = true;
	this.scale.setScreenSize(true);

	game.onPause.add(onGamePause, this);
	game.onResume.add(onGameResume, this);

	blockColors = ['blue', 'red', 'green'];
	reorganizing = false;
	animSpeed = INITIAL_ANIM_SPEED;
	rowSpeed = INITIAL_ROW_SPEED;
	rowIndex = 0;

	graphics = game.add.graphics(0, 0);
	graphics.lineStyle(2, 0xFFFFFF, 1);
	graphics.moveTo(0, game.height - BLOCK_SIZE);
	graphics.lineTo(game.width, game.height - BLOCK_SIZE);

	pauseText = game.add.text(0, game.height / 3, "GAME PAUSED", { font: "65px Impact", fill: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 5});
	pauseText.x = game.world.centerX - (pauseText.width / 2);
	pauseText.visible = false;

	gameOver = false;
	gameOverText = game.add.text(0, game.height / 3, "GAME OVER", { font: "65px Impact", fill: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 5});
	gameOverText.x = game.world.centerX - (gameOverText.width / 2);
	gameOverText.visible = false;

	totalRows = 0;
	level = 1;
	levelText = game.add.text(0, 5, "Level: 1", { font: "30px Impact", fill: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 5});
	score = 0;
	scoreText = game.add.text(0, 40, "Score: 0", { font: "30px Impact", fill: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 5});

	initGrid();
	buildRow();
}

function onGamePause() {
	if (gameOver) return;

	pauseText.visible = true;
	game.world.bringToTop(pauseText);
}

function onGameResume() {
	pauseText.visible = false;
}

function createBlock(x, y) {
	var color = rng.pick(blockColors);
	var block = game.add.sprite(x * BLOCK_SIZE, game.height - BLOCK_SIZE - (y * BLOCK_SIZE), color);
	grid[x][y] = block;

	block.color = color;
	block.inputEnabled = true;
	block.events.onInputDown.add(blockClicked, this);

	game.world.bringToTop(graphics);
	game.world.bringToTop(levelText);
	game.world.bringToTop(scoreText);

	return block;
}

function initGrid() {
	grid = [];
	for(var x = 0; x < GRID_WIDTH; x++) {
		grid[x] = Array(GRID_WIDTH);
		for(var y = 1; y < GRID_HEIGHT; y++) {
			if (y > INITIAL_ROWS) continue;

			createBlock(x, y);
		}
	}
}

function getGridPosition(position) {
	return new Phaser.Point(Math.floor(position.x / BLOCK_SIZE), Math.floor((game.height - BLOCK_SIZE - position.y) / BLOCK_SIZE));
}

function blockClicked(block, pointer) {
	if (gameOver) return;
	if (reorganizing) return;

	markedBlocks = [];
	markColor = block.color;

	markBlocks(block);

	if (markedBlocks.length < 3) return; //Minimum 3 block match

	game.sound.play('click');

	//Score formula
	var x = markedBlocks.length;
	var y = x + Math.pow(x, 3) * level;
	score += y;
	scoreText.text = "Score: " + score;

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

	var position = getGridPosition(block);
	if (position.y == 0) return; //Building row

	markedBlocks.push(block);

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
		for(var y = 1; y < GRID_HEIGHT; y++) {
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
			tween.to({y: game.height - BLOCK_SIZE - y * BLOCK_SIZE}, animSpeed);
			tween.start();
			fallDelay = animSpeed;

			//Reorganize grid
			grid[x][y] = nearestTop;
			grid[x][nearestTopY] = null;
		}
	}

	game.time.events.add(fallDelay, centerBlocks);

	//Centering of blocks
	function centerBlocks() {
		var centerDelay = 0;

		//Moving blocks towards the center
		var center = (GRID_WIDTH + 1) / 2;
		for(var x = center - 1; x >= 0; x--) { //Scan center to left
			if (grid[x][1] == null) {
				var column; //Find next column
				for(var column = x; column >= 0; column--) {
					if (grid[column][1]) break;
				}

				shiftColumn(column, x - column);
				centerDelay = animSpeed;
			}
		}
		for(var x = center; x < GRID_WIDTH; x++) { //Scan center to right
			if (grid[x][1] == null) {
				var column; //Find next column
				for(var column = x; column < GRID_WIDTH; column++) {
					if (grid[column][1]) break;
				}

				shiftColumn(column, x - column);
				centerDelay = animSpeed;
			}
		}

		game.time.events.add(centerDelay, function() {
			reorganizing = false;
		});
	}
}

function shiftColumn(column, shift) {
	if (column < 0 || column >= GRID_WIDTH) return;

	for(var y = 1; y < GRID_HEIGHT; y++) {
		var block = grid[column][y];
		if (block == null) break;

		//Animate shift
		var tween = game.add.tween(block);
		tween.to({x: block.x + (BLOCK_SIZE * shift)}, animSpeed);
		tween.start();

		//Reorganize grid
		grid[column][y] = null;
		grid[column + shift][y] = block;
	}
}

function buildRow() {
	if (gameOver) return;

	if (rowIndex + 1 <= GRID_WIDTH) {
		createBlock(rowIndex++, 0);
	}
	else if (!reorganizing) {
		shiftRow();
		rowIndex = 0;
	}

	game.time.events.add(rowSpeed / GRID_WIDTH, buildRow);
}

function shiftRow() {
	reorganizing = true;
	var shiftDelay = 0;

	for(var y = GRID_HEIGHT - 1; y >= 0; y--) {
		for(var x = 0; x < GRID_WIDTH; x++) {
			var block = grid[x][y];
			if (block == null) continue;

			if (y == GRID_HEIGHT - 1) { //Game over
				gameOver = true;

				game.sound.play('gameover');

				gameOverText.visible = true;
				game.world.bringToTop(gameOverText);

				game.time.events.add(GAME_OVER_RESTART_DELAY, function() {
					game.state.restart();
				});

				return;
			}

			var tween = game.add.tween(block);
			tween.to({y: block.y - BLOCK_SIZE}, animSpeed);
			tween.start();
			shiftDelay = animSpeed;

			grid[x][y] = null;
			grid[x][y + 1] = block;
		}
	}

	game.sound.play('row');

	totalRows++;
	if (totalRows % LEVEL_ROWS == 0) { //Level up
		game.sound.play('levelup');

		levelText.text = "Level: " + (++level);
		rowSpeed = Math.max(rowSpeed - (25 * level), MINIMUM_ROW_SPEED); //Speed it up
		animSpeed = Math.max(animSpeed - 5, MINIMUM_ANIM_SPEED); //Also speed up the animations

		if (level % LEVEL_GREY == 0) blockColors.push('grey');
	}

	game.time.events.add(shiftDelay, function() {
		reorganizing = false;
	});
}
