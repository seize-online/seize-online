var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
    res.render('room', {
        title: 'seize.online'
    });
});

module.exports = router;
