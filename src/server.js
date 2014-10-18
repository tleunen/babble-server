var io = require('socket.io')();
var Config = require('./config');
var UserManager = require('./UserManager');
var ChatHistory = require('./ChatHistory');


function buildMessage(username, message) {
    var time = new Date().getTime();

    return {
        time: time,
        user: username,
        msg: message
    };
}
function broadcast(type, message, exceptUser) {
    var save = type == 'message_fs';

    UserManager.getAllAuthenticated().filter(function(user) {
        return user != exceptUser;
    }).forEach(function(user) {
        user.clientSocket.emit(type, message);
    });

    if(save) {
        ChatHistory.push(type, message);
    }
}

var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;"
  };
function escapeHtml(string) {
    return String(string).replace(/[&<>]/g, function (s) {
        return entityMap[s];
    });
}


io.on('connection', function(socket){
    // Add the user inside our manager
    var user = UserManager.add(socket.id, socket);

    // send the welcome message and ask him for his username
    socket.emit('send:message',  buildMessage('Babble', Config.WELCOME_TEXT));

    // the client sends his username
    socket.on('send:username', function(username, callback) {
        username = username.trim();

        // Check the validity of the username
        if(UserManager.isUsernameAvailable(username)) {
            user.authenticated = true;
            user.name = username;

            callback(user.authenticated);

            // send the history
            socket.emit('send:history', ChatHistory.getMessages());
            // send the list of users
            socket.emit('user:list', UserManager.getAllAuthenticatedUsernames());
            // broadcast the join to other users
            broadcast('user:join', buildMessage(username), user);
        }
        else {
            callback(false);
        }
    });

    // The client sends a message
    socket.on('send:message', function(message) {
        if(user.authenticated) {
            broadcast('send:message', buildMessage(user.name, escapeHtml(message)));
        }
    });

    // The client gets disconnected
    socket.on('disconnect', function() {
        if(user.authenticated) {
            broadcast('user:left', buildMessage(user.name), user);
        }

        UserManager.remove(socket.id);
    });

});


// var server = require('http').createServer();
// server.listen(process.env.PORT || Config.SOCKET_PORT, 'localhost');
// io.listen(server);
io.listen(process.env.PORT || Config.SOCKET_PORT);
console.log('Listening on port: ' + Config.SOCKET_PORT);