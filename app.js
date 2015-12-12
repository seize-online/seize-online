var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('seize-online:server');

var app = express();
app.set('port', process.env.PORT || '3000');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
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

io.on('connection', function(socket){
    socket.on('room create', function(data){
        console.log(data.name);
    });

    socket.on('update fields', function(data){
        socket.broadcast.emit('update fields', data);
    });

    socket.on('update nations', function(data){
        socket.broadcast.emit('update nations', data);
    });
});

server.listen(app.get('port'), function(){
    console.log('Listening on port ' + app.get('port'));
});

server.on('error', function(error){
    if(error.syscall !== 'listen') throw error;

    var bind = (typeof port === 'string') ? ('Pipe ' + port) : ('Port ' + port);
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
