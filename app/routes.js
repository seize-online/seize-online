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

var path = require('path');
var express = require('express');

function isAuthenticated(req, res, next){
   if(req.isAuthenticated()) return next();
   res.redirect('/');
}

module.exports = (app, passport) => {
    app.use('/',            express.static(path.join(__dirname, '..', 'public')));
    app.use('/mdi',         express.static(path.join(__dirname, '..', 'node_modules', 'mdi')));
    app.use('/jquery',      express.static(path.join(__dirname, '..', 'node_modules', 'jquery', 'dist')));
    app.use('/sketch',      express.static(path.join(__dirname, '..', 'node_modules', 'sketch-js', 'js')));
    app.use('/materialize', express.static(path.join(__dirname, '..', 'node_modules', 'materialize-css', 'dist')));

    app.get('/', function(req, res, next){
      res.render('index', { req });
    });

    app.get('/game', isAuthenticated, function(req, res, next){
        res.render('game');
    });

    app.get('/auth/twitter', passport.authenticate('twitter'));
    app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/' }));
    app.get('/logout', isAuthenticated, function(req, res){
        req.logout();
        res.redirect('/');
    });

    app.get('/rooms', function(req, res){
        res.json(socket.rooms);
    });

    app.use(function(req, res, next){
        var err = new Error('Not Found');
        err.status = 404; next(err);
    });

    app.use(function(err, req, res, next){
        res.status(err.status || 500);
        res.render('error', { message: err.message, error: err });
    });
};
