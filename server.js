"use strict";

require('dotenv').config();

const express = require("express");
const { auth, requiresAuth } = require('express-openid-connect');
const cons = require('consolidate');
const path = require('path');

const app = express();

// Globals
const {
  OKTA_ISSUER_URI,
  OKTA_CLIENT_ID,
  OKTA_CLIENT_SECRET, // (no se usa aquí, pero lo dejé)
  REDIRECT_URI,       // (no se usa aquí, pero lo dejé)
  PORT = "3000",
  SECRET,
  BASE_URL
} = process.env;

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
  // ⚠️ Importante: NO responder aquí. Solo devolver session.
  afterCallback: (req, res, session) => {
    // podés anexar cosas a session si querés
    return session;
  }
};

// Attach OIDC routes
app.use(auth(config));

// MVC View Setup
app.engine('html', cons.swig);
app.set('views', path.join(__dirname, 'views'));
app.set('models', path.join(__dirname, 'models'));
app.set('view engine', 'html');

// Static
app.use("/static", express.static("static"));

// ✅ Ruta de login que ya pide volver a /dashboard al finalizar
app.get('/login', (req, res) => {
  return res.oidc.login({ returnTo: '/dashboard' });
});

app.get("/", (req, res) => {
  if (req.oidc.isAuthenticated()) {
    return res.redirect('/dashboard'); // ✅ usar return después de redirect
  }
  return res.render("index");
});

app.get("/dashboard", requiresAuth(), (req, res) => {
  const userInfo = req.oidc.user;
  return res.render("dashboard", { user: userInfo });
});

// Opcional: aumentar timeout del openid-client
const openIdClient = require('openid-client');
openIdClient.Issuer.defaultHttpOptions.timeout = 20000;

console.log("Server running on port: " + PORT);
app.listen(parseInt(PORT));
