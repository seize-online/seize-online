var express = require('express');
var router = express.Router();

router.get('/js/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
router.get('/js/sketch', express.static(__dirname + '/node_modules/sketch-js/js/'));

router.get('/', function(req, res, next){
  res.render('index');
});

router.get('/game', function(req, res, next){
  res.render('game');
});

module.exports = router;
