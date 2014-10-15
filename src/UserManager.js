"use strict";

function User(clientSocket) {
    this.authenticated = false;
    this.name = '';
    this.clientSocket = clientSocket;
}

var _users = {};

var UserManager = {
    add: function(clientId, clientSocket) {
        _users[clientId] = new User(clientSocket);
        return _users[clientId];
    },

    remove: function(clientId) {
        if(_users.hasOwnProperty(clientId)) {
            delete _users[clientId];
        }
    },

    get: function(clientId) {
        if(_users.hasOwnProperty(clientId)) {
            return _users[clientId];
        }
        return null;
    },

    getByUsername: function(username) {
        for(var u in _users) {
            if(_users.hasOwnProperty(u) && _users[u].name == username) {
                return _users[u];
            }
        }
        return null;
    },

    getAllAuthenticated: function() {
        var arr = [];
        for(var u in _users) {
            if(_users.hasOwnProperty(u)) {
                if(_users[u].authenticated) {
                    arr.push(_users[u]);
                }
            }
        }
        return arr;
    },

    getAllAuthenticatedUsernames: function() {
        return UserManager.getAllAuthenticated().map(function(user) {
            return user.name;
        });
    },

    isUsernameAvailable: function(username) {
        for(var u in _users) {
            if(_users.hasOwnProperty(u)) {
                if(_users[u].name == username) {
                    return false;
                }
            }
        }
        return true;
    }
};

module.exports = UserManager;