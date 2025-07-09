const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const { getSettings, setSettings } = require('./settings.js');
const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CALLBACK_URL = 'https://acute-super-particle.glitch.me/callback';

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: ['identify', 'guilds' ]
  },
  (accessToken, refreshToken, profile, done) => done(null, profile)
));

app.use(session({
  secret: 'discordapp',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Discord OAuth2
app.get('/login', passport.authenticate('discord'));
app.get('/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
res.send(`<script>
  document.cookie = "discordUser=${req.user.username}#${req.user.discriminator}; path=/;";
  window.location.href = '/index.html';
</script>`);
  }
);

// API
app.get('/api/status', (req, res) => {
  res.json(getSettings());
});

app.post('/api/toggle-feature', (req, res) => {
  const { enabled } = req.body;
  const settings = getSettings();
  settings.featureEnabled = enabled;
  setSettings(settings);
  res.json({ message: '更新しました', featureEnabled: enabled });
});

app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    // admin権限(0x8 or 0x20)を持つギルドだけ
    const adminGuilds = req.user.guilds.filter(guild => (guild.permissions & 0x20) === 0x20);
    res.json({
      user: req.user,
      guilds: adminGuilds
    });
  } else {
    res.json({ user: null });
  }
});

app.listen(3000, () => console.log('Server running'));