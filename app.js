var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('seize-online:server');

var app = express();
app.set('port', process.env.PORT || '80');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger(':date[iso] :remote-addr :remote-user :method :status :url - :response-time ms'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/room', require('./routes/room'));
app.use('/play', require('./routes/play'));
app.use('/help', require('./routes/help'));

app.use(function(req, res, next){
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if(app.get('env') === 'development'){
    app.use(function(err, req, res, next){
        res.status(err.status || 500);
        res.render('error', { message: err.message, error: err });
    });
}

app.use(function(err, req, res, next){
    res.status(err.status || 500);
    res.render('error', { message: err.message, error: {} });
});

var server = http.createServer(app);
var io = require('socket.io')(server);

var rooms = {};
var pattern = /^[A-Za-z0-9-]{4,32}$/;

io.on('connection', function(socket){
    socket.on('room create', function(data){
        if(!data.room || !pattern.test(data.room)) return socket.emit('room create', {
            success: false,
            reason: "invalid-name"
        });

        data.room = data.room.toLowerCase();
        if(rooms[data.room]) return socket.emit('room create', {
            success: false,
            reason: "already-exists"
        });

        if(socket.rooms.length > 0) return socket.emit('room create', {
            success: false,
            reason: "already-joined"
        });

        socket.join(data.room);
        rooms[data.room] = {
            host: socket.id, clients: []
        };

        socket.emit('room create', {
            success: true, room: data.room
        });
    });

    socket.on('room join', function(data){
        if(!data.room || !pattern.test(data.room)) return socket.emit('room join', {
            success: false,
            reason: "invalid-name"
        });

        data.room = data.room.toLowerCase();
        if(!rooms[data.room]) return socket.emit('room join', {
            success: false,
            reason: "not-exists"
        });

        if(socket.rooms.length > 0) return socket.emit('room join', {
            success: false,
            reason: "already-joined"
        });

        socket.join(data.room);
        rooms[data.room].clients.push(socket.id);

        socket.emit('room join', {
            success: true, room: data.room
        });
    });

    socket.on('room leave', function(){
        socket.rooms.forEach(function(room){
            if(rooms[room] && rooms[room].host === socket.id){
                if(rooms[room].clients.length === 0) delete rooms[room];
                else{
                    rooms[room].host = rooms[room].clients.splice(Math.floor(Math.random() * rooms[room].clients.length), 1)[0];
                    io.to(rooms[room].host).emit("you are now host");
                }
            }
            socket.leave(room);
        });

        socket.emit('room leave', {
            success: true, rooms: socket.rooms
        });
    });

    socket.on('update fields', function(data){
        if(socket.rooms.length === 0) return;
        if(rooms[socket.rooms[0]].host !== socket.id) return;

        socket.broadcast.to(socket.rooms[0]).emit('update fields', data);
    });

    socket.on('update nations', function(data){
        if(socket.rooms.length === 0) return;
        if(rooms[socket.rooms[0]].host !== socket.id) return;

        socket.broadcast.to(socket.rooms[0]).emit('update nations', data);
    });
});

server.listen(app.get('port'), function(){
    console.log('Listening on port ' + app.get('port'));
});

server.on('error', function(error){
    if(error.syscall !== 'listen') throw error;

    var bind = (typeof app.get('port') === 'string') ? ('Pipe ' + app.get('port')) : ('Port ' + app.get('port'));
    switch(error.code){
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;

        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});
