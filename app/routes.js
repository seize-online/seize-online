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

module.exports = (app, passport) => {
    app.use('/',            express.static(path.join(__dirname, '..', 'public')));
    app.use('/jquery',      express.static(path.join(__dirname, '..', 'node_modules', 'jquery', 'dist')));
    app.use('/sketch',      express.static(path.join(__dirname, '..', 'node_modules', 'sketch-js', 'js')));
    app.use('/materialize', express.static(path.join(__dirname, '..', 'node_modules', 'materialize-css', 'dist')));

    app.get('/', function(req, res, next){
      res.render('index');
    });

    app.get('/game', function(req, res, next){
      res.render('game');
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
