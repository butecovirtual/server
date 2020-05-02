const _ = require('lodash');
const Live = require('../models/Live');
const User = require('../models/User');

var viewers = [];

module.exports = (io) => {
    io.sockets.on('connection', function (socket) {
        var connectedUserId;

        var _viewersInLive = (id) => {
            return io.sockets.adapter.rooms[id] && io.sockets.adapter.rooms[id].length || 0;
        }
    
        var _addViewerToLive = (userId, liveId) => {
            Live.findById(liveId, (err, live) => {
                if (!live.viewers) live.viewers = [];
                if (!live.viewers.includes(userId)){
                    live.viewers.push(userId);
                    live.save();
                }
            });
    
            viewers.push({
                liveId: liveId,
                userId: userId
            });
            io.sockets.in(liveId).emit('viewers', _viewersInLive(liveId));
        }
    
        var _delUserFromLive = async (userId, liveId) => {
            const user = await User.findById(userId);
            io.sockets.in(liveId).emit('leave', {
                user: {
                    id: user._id,
                    username: user.username
                }
            });
            io.sockets.in(liveId).emit('viewers', _viewersInLive(liveId));
        }

        socket.on('disconnect', () => {
            var i = -1;
            while ((i = viewers.map(v => v.userId).indexOf(connectedUserId)) >= 0)
                _delUserFromLive(connectedUserId, viewers.splice(i, 1)[0].liveId);
        });

        socket.on('join', (data) => {
            const { liveId, userId } = data;

            connectedUserId = userId;

            socket.join(liveId);
            _addViewerToLive(userId, liveId);

            socket.broadcast.to(liveId).emit('join', { userId: userId });
        });

        socket.on('leave', (data) => {
            const { liveId, userId } = data;

            var i = -1;
            if ((i = _.findIndex(viewers, {liveId, userId})) >= 0)
                _delUserFromLive(connectedUserId, viewers.splice(i, 1)[0].liveId);
        });

        socket.on('message', async (data) => {
            const { liveId, userId, message } = data;

            var user = await User.findById(userId);
            if (!user) return;  /* discard the message */

            socket.broadcast.to(liveId).emit('message', {
                user: {
                    id: user._id,
                    username: user.username
                },
                message
            });
        })
    });

}
