var keypress = require('keypress');

var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { 
	sys.puts(stdout)
	sys.puts(J.output)
	J.output = ''
}

// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
//  console.log('got "keypress"', key);
  if (key && key.ctrl && key.name == 'c') {
    process.stdin.pause();
  }
  if (key  && key.name == 'left') {
    J.movePlayer('left')
  }
  if (key  && key.name == 'right') {
    
    J.movePlayer('right')
  } 
  if (key  && key.name == 'r') {
    
    J.reset()
  }
});

process.stdin.setRawMode(true);
process.stdin.resume();


var J = {
	height: 10,
	width: 20,
	Player: {
		x: 10,
		y: 0,
		char: '@',
		title: 'player'
	},
	map: [],
	emptyChar: '.',
	dead: false,
	output: '',
	internalHeight: 0,
	gameSpeed: 200,
	score: 0,
	difficult: 1,
	lastSeed: null,
	init: function (){
		J.prepareMap().drawObstacles().positionPlayer(J.Player).frame()
		setTimeout(J.fall, J.gameSpeed)
		
	},

	reset: function ()  {
		J.internalHeight = 0,
		J.gameSpeed = 200,
		J.score = 0,
		J.difficult = 2,
		J.lastSeed = null,
		J.Player = {
			x: 10,
			y: 0,
			char: '@',
			title: 'player'
		}
		J.dead = false
		
		J.init()
	},

	positionPlayer: function(x,y){
		J.map[J.Player.y][J.Player.x] = J.Player
		return J
	},
	replacePosition: function(x, y, dx, dy, obj){
		
		J.map[dy][dx] = {char: J.emptyChar, title: 'empty'}
		J.map[y][x]   = {char: obj.char}

		return J
	
	},

	prepareMap: function(){
		for(var i = 0; i <= J.height; i++){
			J.map[i] = []
			for(var j = 0; j <= J.width; j++){
				J.map[i][j]	= {char: '.', title: 'empty'}
			}
		};
		return J
	},
	movePlayer: function(dir){
		if (dir === 'left') {
			var x = J.Player.x
			var dx = x
			x--
			var block = J.map[J.Player.y][x]
			if (x < 0 || block.title == 'floor') return;
			J.Player.x--
			J.replacePosition(J.Player.x, J.Player.y, dx, J.Player.y,  J.Player).frame()
			return J


		}
		if (dir === 'right') {
			var x = J.Player.x
			var dx = x
			x++
			var block = J.map[J.Player.y][x]
			if (x >= J.width-1 || block.title == 'floor') return;
			J.Player.x++
			J.replacePosition(J.Player.x, J.Player.y, dx, J.Player.y,  J.Player).frame()
			return J			
		}
	},

	roll: function(min, max)  {	return Math.floor(Math.random()*(max-min+1)+min)},

	fall: function() {

		var dy = J.Player.y;
		
		if (J.detectColision()){
			return true
		} else {
			J.replacePosition(J.Player.x, (++J.Player.y),
			J.Player.x, dy,
			J.Player)

			if (J.Player.y >= 5) {
				setTimeout(J.fallScenario, J.gameSpeed)
			}else{
				setTimeout(J.fall, J.gameSpeed)
			}
			J.gameSpeed--
			J.score++
			J.frame()
			
		}
	},

	drawObstacles: function() {
		var x = J.height,
		y = J.width, 
		i,j;
		for(i = 0; i <= x; i++){
			var startObstacles = J.roll(0,2)
			var freeSpaces = 0;
			for(j = 0; j <= y; j++){
				if (j < startObstacles ) {
					J.map[i][j] = {char: '#', title:'floor'}		
				}else{
					if (freeSpaces >= 11) {
						J.map[i][j] = {char: '#', title:'floor'}		
					}
					freeSpaces++;
				}
			}
		}

		return J
	},

	fallScenario: function() {
		var x = J.height,
		y = J.width, 
		i,j;
		J.Player.y
		if(J.detectColision()) return true
		
		dy = J.Player.y + 1
		
		J.replacePosition(J.Player.x, dy, J.Player.x, J.Player.y,  J.Player)
		J.drawLastRow()
		J.internalHeight++
		J.increaseGameSpeed()
		J.score++
		//J.setScore(J.score);
		J.setDifficult(J.score)
		setTimeout(J.fallScenario, J.gameSpeed)
		
	},

	setDifficult: function () {
		if (J.score == 100 ||
			J.score == 200 ||
			J.score == 350 ||
			J.score == 500
			) 
			J.difficult ++;
	},
	
	detectColision: function() {
		var x = J.Player.x;
		var y = J.Player.y + 1;
		var block = J.map[y][x]

		if (block.title == 'floor') {
			J.dead = true
			J.frame()
			return true;
		}
	},
	increaseGameSpeed: function()  { 
		if (J.gameSpeed > 50) {
			J.gameSpeed = J.gameSpeed - 0.25
			
		}
		return J
	},

	drawLastRow: function (difficult) {

			var configs = J.getDifficultValues(J.difficult)
			var y = J.width; 
			var x = J.height-1
			var startObstacles
			if (J.lastSeed == null) {
				startObstacles = configs.startObstacles;
				
			}else{
				var d100 = J.roll(0,100)
				var jump
				if (d100 < 40) {
					jump = -1
				}
				else if (d100 > 60) {
					jump = 1
				}
				else{
					jump = 0
				}
				if ((J.lastSeed + jump) < 0 || (J.lastSeed + jump) >= (J.width - configs.freeSpaceLimit)) {
					jump = 0
				}
				startObstacles = J.lastSeed + jump
			}
			
			J.lastSeed     = startObstacles;
			var freeSpaces = 0;
			var row = []
			for(j = 0; j < y; j++){
				if (j < startObstacles ) {
					row[j] =  {char: '#', title:'floor'}		
				} else {
					if (freeSpaces >= configs.freeSpaceLimit) {
						row[j] =  {char: '#', title:'floor'}		
					}else{
						row[j] = {char: J.emptyChar, title: 'empty'}
						
					}

					freeSpaces++;
				}
			}
			
			J.map.shift()
			J.map.push(row)
			J.frame()

		},

	getDifficultValues: function(difficult) {
		var configs = {}
		
		if (difficult == 1) {
			configs = {
				startObstacles : J.roll(0,4),
				freeSpaceLimit : 9
			}
		}

		if (difficult == 2) {
			configs = {
				startObstacles : J.roll(0,6),
				freeSpaceLimit : 7
			}
		}


		if (difficult == 3) {
			configs = {
				startObstacles : J.roll(0,8),
				freeSpaceLimit : 5
			}
		}
		if (difficult == 4) {
			configs = {
				startObstacles : J.roll(0,9),
				freeSpaceLimit : 4
			}
		}
		if (difficult == 5) {
			configs = {
				startObstacles : J.roll(0,10),
				freeSpaceLimit : 3
			}
		}

		return configs
	},
	frame: function (){

		J.output += "FREE FALL ADVENTURES\n"
		//J.output += "+------------------+\n"
		J.output += 'SCORE: ' + J.score+"\n"
		J.output += 'DIFFICULT: ' + J.difficult+"\n"
		
		for (var i = 0; i <= J.height; i++){
			J.output += "\n"
			for (var j = 0; j < J.width; j++) {
				J.output += J.map[i][j].char
				
			}
		}
		if (J.dead) {
			J.output += "\n\nYOU DIED!\n"
			J.output += "Press r to Restart!\n"
		}
		exec("clear", puts);
		
		return J
	},
}

J.init()