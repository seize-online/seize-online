/*
 * Copyright (C) 2015-2016  ChalkPE
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var http = require('http');
var express = require('express');
var session = require('express-session');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);

var path = require('path');
var minify = require('express-minify');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var passport = require('passport');
var passportSocketIo = require('passport.socketio');

var chalk = require('chalk');
var morgan = require('morgan');
var moment = require('moment');

morgan.token('the-date', () => moment().format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ'));
morgan.token('the-status', (req, res) => {
    var status = res._header ? res.statusCode : undefined;
    var color = status >= 500 ? 'red' : status >= 400 ? 'yellow' : status >= 300 ? 'cyan' : status >= 200 ? 'green' : 'reset';

    return chalk[color](status);
});

var app = express();
app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));
app.set('port', process.env.PORT || '3000');

//app.use(minify());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan(':the-date :method HTTP/:http-version :the-status :remote-addr :remote-user :url - :response-time ms'));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect('mongodb://localhost/seize', { server: { auto_reconnect: true } });
var db = mongoose.connection;

db.on('error', console.error.bind(console, "connection error:"));
db.once('open', () => console.log("Connected database", db.name));

var exit = () => mongoose.connection.close(() => process.exit(0));
process.on('SIGINT', exit).on('SIGTERM', exit);

var mongoStore = new MongoStore({ mongooseConnection: db });
app.use(session({ secret: 'seize', key: 'seize.sid', store: mongoStore, resave: true, saveUninitialized: true }));

// app.use(passport.initialize());
// app.use(passport.session());

var server = http.createServer(app);
var io = require('socket.io')(server);

// io.use(passportSocketIo.authorize({ cookieParser: cookieParser, secret: 'seize', key: 'seize.sid', store: mongoStore }));

require('./app/socket')(io);
require('./app/routes')(app);

server.listen(app.get('port'), () => {
    console.log('Listening on port ' + app.get('port'));
    //setInterval(() => io.emit('hello', '#' + ('000000' + Math.floor(Math.random() * 0x1000000).toString(16)).slice(-6)), 1000);
});

server.on('error', error => {
    if(error.syscall !== 'listen') throw error;
    var bind = ((typeof app.get('port') === 'string') ? 'Pipe ' : 'Port ') + app.get('port');

    switch(error.code){
        case 'EACCES':
            console.error(bind, 'requires elevated privileges');
            process.exit(1); break;

        case 'EADDRINUSE':
            console.error(bind,'is already in use');
            process.exit(1); break;

        default: throw error;
    }
});
