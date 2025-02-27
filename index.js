


const PORT = 7777;
let http = require('http');
let static = require('node-static');
let ws = require('ws');

let file = new static.Server('./public');
let http_server = http.createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(PORT);

let player1 = null, player2 = null;
let spectators = [];
let ws_server = new ws.Server({ server: http_server });

ws_server.on('connection', function (conn) {
    console.log("Usuario Conectado");
    
    if (!player1) {
        player1 = conn;
        player1.send(JSON.stringify({ player_num: 1 }));
    } else if (!player2) {
        player2 = conn;
        player2.send(JSON.stringify({ player_num: 2 }));
        
        startCountdown();
    } else {
        spectators.push(conn);
        conn.send(JSON.stringify({ spectator: true, message: "Eres un espectador." }));
    }

    conn.on('close', function () {
        if (player1 === conn) {
            console.log("Jugador 1 desconectado");
            player1 = null;
            notifyOpponent(2);
        } else if (player2 === conn) {
            console.log("Jugador 2 desconectado");
            player2 = null;
            notifyOpponent(1);
        } else {
            spectators = spectators.filter(s => s !== conn);
        }
    });

    conn.on('message', function (msg) {
        let info = JSON.parse(msg);
        if (info.y !== undefined || info.by !== undefined || info.scores1 !== undefined) {
            relayMessage(conn, info);
        }
    });
});

function startCountdown() {
    let countdownValues = ["3", "2", "1", "¡YA!"];
    let delay = 1000;

    countdownValues.forEach((value, index) => {
        setTimeout(() => {
            let countdownMessage = { countdown: value };
            player1.send(JSON.stringify(countdownMessage));
            player2.send(JSON.stringify(countdownMessage));
            notifySpectators(countdownMessage);

            if (value === "¡YA!") {
                setTimeout(() => {
                    let gameStart = { game_start: true };
                    player1.send(JSON.stringify(gameStart));
                    player2.send(JSON.stringify(gameStart));
                    notifySpectators(gameStart);
                }, 1000);
            }
        }, index * delay);
    });
}
function notifyOpponent(playerNumber) {
    let opponent = playerNumber === 1 ? player2 : player1;
    let message = { message: `El jugador ${playerNumber} se ha desconectado.`, color: "red" };

    if (opponent) {
        opponent.send(JSON.stringify(message));
    }
    notifySpectators(message);
}


function relayMessage(sender, info) {
    if (sender === player1 && player2) {
        player2.send(JSON.stringify(info));
    } else if (sender === player2 && player1) {
        player1.send(JSON.stringify(info));
    }
    notifySpectators(info);

    if (info.scores1 >= 3 || info.scores2 >= 3) {
        let winner = info.scores1 >= 3 ? 1 : 2;
        let gameOverMessage = { 
            game_over: true, 
            winner: winner, 
            message: `Ha ganado el jugador ${winner}`, 
            color: "yellow" 
        };
        sendToPlayers(gameOverMessage);
        notifySpectators(gameOverMessage);
    }
}

function notifySpectators(info) {
    if (spectators.length > 0) {
        spectators.forEach(spectator => {
            spectator.send(JSON.stringify(info));
        });
    }
}
function sendToPlayers(message) {
    if (player1) player1.send(JSON.stringify(message));
    if (player2) player2.send(JSON.stringify(message));
}
