var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
    res.redirect('/');
});

router.get('/:room', function(req, res, next){
    res.render('play', {
        title: 'seize.online',
        room: req.params.room
    });
});

module.exports = router;
