"use strict";

// Cargar variables de entorno
require('dotenv').config();

// Imports
const express = require("express");
const session = require("express-session");
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');
var cons = require('consolidate');
var path = require('path');
let app = express();

// Globals
const OKTA_ISSUER_URI = process.env.OKTA_ISSUER_URI;
const OKTA_CLIENT_ID = process.env.OKTA_CLIENT_ID;
const OKTA_CLIENT_SECRET = process.env.OKTA_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const PORT = process.env.PORT || "3000";
const SECRET = process.env.SECRET;
const BASE_URL = process.env.BASE_URL;

//  Esto se los dará Auth0/Okta.
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: SECRET,
  baseURL: BASE_URL,
  clientID: OKTA_CLIENT_ID,
  issuerBaseURL: OKTA_ISSUER_URI,
  routes: {
    login: '/login',
    logout: '/logout',
    callback: '/callback',
    postLogoutRedirect: '/'
  },
  afterCallback: (req, res, session) => {
    // Redirigir al dashboard después del login exitoso
    return res.redirect('/dashboard');
  }
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// MVC View Setup
app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('models', path.join(__dirname, 'models'));
app.set('view engine', 'html');

// App middleware
app.use("/static", express.static("static"));

app.use(session({
  cookie: { httpOnly: true },
  secret: SECRET
}));

// App routes
app.get("/",  (req, res) => {
  if (req.oidc.isAuthenticated()) {
    // Si ya está autenticado, redirigir al dashboard
    return res.redirect('/dashboard');
  }
  res.render("index");  
});

app.get("/dashboard", requiresAuth() ,(req, res) => {  
  // Obtener información del usuario desde req.oidc.user
  const userInfo = req.oidc.user;
  res.render("dashboard", { user: userInfo });
});

const openIdClient = require('openid-client');
openIdClient.Issuer.defaultHttpOptions.timeout = 20000;

console.log("Server running on port: " + PORT);
app.listen(parseInt(PORT));