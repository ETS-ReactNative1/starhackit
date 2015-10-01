import passport from 'passport';
var express = require("express");

module.exports = function(app, auth, controllers){
  "use strict";

  var authenticationHttpCtrl = controllers.authentication;

  var router = new express.Router();
  router.post('/login', passport.authenticate('login'), authenticationHttpCtrl.login);
  router.post('/register', passport.authenticate('register'), authenticationHttpCtrl.register);

  router.post('/logout', auth.ensureAuthenticated, authenticationHttpCtrl.logout);
  router.get('/session', auth.ensureAuthenticated, authenticationHttpCtrl.session);

  router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
  router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login', successRedirect : '/#/profile'}),
    authenticationHttpCtrl.loginFacebookCallback);

  return router;
};