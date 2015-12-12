var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
    res.render('play', {
        title: 'seize.online'
    });
});

module.exports = router;
