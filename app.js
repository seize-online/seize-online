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

var server = require('http').createServer(app);
server.listen(app.get('port'));
