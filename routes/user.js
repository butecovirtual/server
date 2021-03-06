const schema = require('../schemas');
const user = require('../handlers/user');

module.exports = function(server) {

    server.post(
        '/user',
        schema.validate,
        user.register
    );

    server.get(
        '/user',
        user.get
    );

    server.get(
        '/user/token/:username',
        user.token
    );

    server.post(
        '/user/authenticate',
        schema.validate,
        user.authenticate
    );
    
    server.put(
        '/user/artist',
        schema.validate,
        user.artist
    );
}
