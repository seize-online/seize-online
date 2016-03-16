var path = require('path');
var express = require('express');

var app = express();
app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));
app.set('port', process.env.PORT || '3000');

app.use(require('morgan')('dev'));
app.use(require('cookie-parser')());
app.use(express.static(path.join(__dirname, 'public')));

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var routes = require('./routes/index');
app.use('/', routes);

app.use('/js/jquery', express.static(path.join(__dirname, '/node_modules/jquery/dist/')));
app.use('/js/sketch', express.static(path.join(__dirname, '/node_modules/sketch-js/js/')));

app.use(function(req, res, next){
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next){
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});

var http = require('http');
var server = http.createServer(app);

var io = require('socket.io')(server);
io.on('connection', function(socket){

});

server.listen(app.get('port'));

setInterval(function(){
    var color = '#' + ('000000' + Math.floor(Math.random() * 0x1000000).toString(16)).slice(-6);

    console.log(new Date() + ' ' + color);
    io.emit('hello', color);
}, 200);
