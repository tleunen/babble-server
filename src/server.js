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
function broadcast(type, message, except) {
    var save = type == 'message_fs';
    var list = UserManager.getAllAuthenticated();

    for(var i=0, n=list.length; i<n; ++i) {
        if(list[i] != except) {
            list[i].clientSocket.emit(type, message);
        }
    }

    if(save) {
        ChatHistory.push(type, message);
    }
}


io.on('connection', function(socket){
    // Add the user inside our manager
    var user = UserManager.add(socket.id, socket);

    // send the welcome message and ask him for his username
    socket.emit('send:message',  buildMessage('Babble', Config.WELCOME_TEXT));
    socket.emit('username_fs', buildMessage('Babble', 'Please, enter your username'));

    // the client sends his username
    socket.on('send:username', function(username, callback) {
        username = username.trim();
        var callbackObj = {
            username: username,
            auth: false
        };

        // Check the validity of the username
        if(UserManager.isUsernameAvailable(username)) {
            user.authenticated = true;
            user.name = username;

            callbackObj.auth = true;
            callback(callbackObj);

            // send the history
            socket.emit('send:history', ChatHistory.getMessages());
            // send the list of users
            socket.emit('user:list', UserManager.getAllAuthenticatedUsernames());
            // broadcast the join to other users
            broadcast('user:join', buildMessage(username), user);
        }
        else {
            callback(callbackObj);
        }
    });

    // The client sends a message
    socket.on('send:message', function(message) {
        if(user.authenticated) {
            broadcast('send:message', buildMessage(user.name, message));
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
io.listen(Config.SOCKET_PORT);
console.log('Listening on port: ' + Config.SOCKET_PORT);