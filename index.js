




const PORT = 7777;
let http = require('http');
let static = require('node-static');
let ws = require('ws');

//
// Create a node-static server instance to serve the './public' folder
//
let file = new static.Server('./public');
let gameover = false;
let http_server = http.createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    }).resume();
}).listen(PORT);

let player1,player2;
let ws_server = new ws.Server({server:http_server});


ws_server.on('connection', function(conn) {
	console.log("Usuario Conectado");
		if(player1 == null){
			player1 = conn;

			let info ={
				player_num:1
			};

			player1.send(JSON.stringify(info));

			player1.on('close',function (){
			console.log("Jugador1 Desconectado");
			player1 == null;
			});


			player1.on('message', function (msg){
				if(player2 == null)
					return;

				console.log("Jugador1: "+msg);
				let info = JSON.parse(msg);
				if(info.y != null){
					player2.send(JSON.stringify(info));
					
				}
				else if(info.by != null){
				player2.send(JSON.stringify(info));

				}
				else if(info.scores1 != null){
				player2.send(JSON.stringify(info));

					if(info.scores1 >= 3 || info.scores2 >=3){
						let data = {
							game_over:true,
							winner:0
						};
						if(info.scores1 >=3)
						data.winner =1;
						else{
						data.winner =2;}
						player1.send(	JSON.stringify(data)	);
						player2.send(	JSON.stringify(data)	);
						return
					}
				}
				
			});
}
		else if(player2 == null){
				player2 = conn;
				
			
				let info ={
					player_num:2
				};
				setTimeout(function(){
				let game = {
					game_start:true
				};
				player1.send(JSON.stringify(game));
					
				player2.send(JSON.stringify(game));
				},1000);

				player2.send(	JSON.stringify(info)	);
				player2.on('close',function (){
					console.log("Jugador2 Desconectado");
					player2 == null;
				});



					
					
						
				player2.on('message', function (msg){
					if(player1 == null)
						return;
					console.log("Jugador2: "+msg);
					let info = JSON.parse(msg);
					if(info.y != null){
						player1.send(JSON.stringify(info));
					
					}
				});
		}



});
