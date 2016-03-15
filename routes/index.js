var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
  res.render('index');
});

router.get('/game', function(req, res, next){
  res.render('game');
});

module.exports = router;
