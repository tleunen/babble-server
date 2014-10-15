"use strict";

var Config = require('./config');

var _messages = [];

module.exports = {
    push: function(type, msg) {
        if(_messages.length == Config.HISTORY_LIMIT) {
            _messages.shift();
        }

        _messages.push({
            type: type,
            msg: msg
        });
    },

    getMessages: function() {
        return _messages;
    }
};