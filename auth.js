var mongoose         	= require('mongoose')
/* passport */
,   passport		= require('passport')
,   TwitterStrategy	= require('passport-twitter').Strategy
,   LocalStrategy       = require('passport-local').Strategy
,   FacebookStrategy 	= require('passport-facebook').Strategy
/* express modules required */
,   session          	= require('express-session')
,   bodyParser       	= require('body-parser')
,   cookieParser     	= require('cookie-parser')
,    expressValidator	= require('express-validator')
,   secrets		= require('../secrets.js')
;

require (__dirname + '/models/user');
var User             = mongoose.model('User');

var authenticateLocal = function(email, password, done) {
    User.findOne( { email: email } , function (err, user) {

        if (err) {
            return done(err);
        }

        if (!user) {
            return done(null, false, { message: 'Your email not register' });
        }

        if (!user.authenticate(password)) {
            return done(null, false, { message: 'invalid login or password' });
        }

        return done(null, user);
    });
}

var allowCrossDomain = function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
};

module.exports = function (app) {

    // serialize sessions
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findOne({ _id: id }, function (err, user) {
            done(err, user);
        });
    });

    // use local strategy
    passport.use(new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        authenticateLocal
    ));


    /**
     * Sign in with Twitter.
     */

    passport.use(new TwitterStrategy(secrets.twitter, function(req, accessToken, tokenSecret, profile, done) {
        if (req.user) {
            User.findOne({ $or: [
                {'twitter.id': profile.id }
                , { username: profile.username }
                , { email: profile.username + "@twitter.com" }] }, function(err, existingUser) {
                    if (existingUser) {
                        req.flash('errors', { msg: 'There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
                        done(err);
                    } else {
                        User.findById(req.user.id, function(err, user) {

                            user.email         = profile.username + "@twitter.com";
                            user.provider      = 'twitter';
                            user.twitter       = profile._json;
                            user.photo_profile = profile._json.profile_image_url;
                            user.username      = profile.username;
                            user.tokens.push({ kind: 'twitter', accessToken: accessToken, tokenSecret: tokenSecret });

                            user.save(function(err) {
                                req.flash('info', { msg: 'Twitter account has been linked.' });
                                done(err, user);
                            });
                        });
                    }
                });

        } else {
            User.findOne({ 'twitter.id_str': profile.id }, function(err, existingUser) {
                if (existingUser) return done(null, existingUser);
                var user = new User();
                // Twitter will not provide an email address.  Period.
                // But a person’s twitter username is guaranteed to be unique
                // so we can "fake" a twitter email address as follows:

                user.email         = profile.username + "@twitter.com";
                user.provider      = 'twitter';
                user.twitter       = profile._json;
                user.photo_profile = profile._json.profile_image_url;
                user.username      = profile.username;
                user.tokens.push({ kind: 'twitter', accessToken: accessToken, tokenSecret: tokenSecret });

                user.save(function(err) {
                    done(err, user);
                });
            });
        }
    }));

    /**
     * Sign in with Facebook.
     */

    passport.use(new FacebookStrategy(secrets.facebook, function(req, accessToken, refreshToken, profile, done) {
        if (req.user) {
            User.findOne({ $or: [
                { 'facebook.id' : profile.id }
                , { username : profile.username}
                , { email: profile.email }] }
                         , function(err, existingUser) {
                             if (existingUser) {
                                 req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
                                 done(err);
                             } else {
                                 User.findById(req.user.id, function(err, user) {
                                     user.facebook      = profile;
                                     user.username      = profile.username,
                                     user.provider      = 'facebook',
                                     user.facebook      = profile._json,
                                     user.firstname     = user.firstname || profile.first_name,
                                     user.lastname      = user.lastname || profile.last_name,
                                     user.photo_profile = user.photo_profile || 'https://graph.facebook.com/' + profile.id + '/picture?type=large';

                                     user.tokens.push({ kind: 'facebook', accessToken: accessToken });

                                     user.save(function(err) {
                                         req.flash('info', { msg: 'Facebook account has been linked.' });
                                         done(err, user);
                                     });
                                 });
                             }
                         });
        } else {
            User.findOne({ 'facebook.id' : profile.id }, function(err, existingUser) {

                if (existingUser) return done(null, existingUser);

                User.findOne({ email: profile._json.email }, function(err, existingEmailUser) {
                    if (existingEmailUser) {
                        req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.' });
                        done(err);
                    } else {
                        var user = new User();
                        user.email         = profile._json.email;
                        user.facebook      = profile;
                        user.username      = profile.username,
                        user.provider      = 'facebook',
                        user.facebook      = profile._json,
                        user.firstname     = user.firstname || profile.first_name,
                        user.lastname      = user.lastname || profile.last_name,
                        user.photo_profile = user.photo_profile || 'https://graph.facebook.com/' + profile.id + '/picture?type=large';

                        user.tokens.push({ kind: 'facebook', accessToken: accessToken });

                        user.save(function(err) {
                            done(err, user);
                        });
                    }
                });
            });
        }
    }));

    /* express setup */
    app.use(allowCrossDomain);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(expressValidator());
    app.use(cookieParser('notagoodsecretnoreallydontusethisone'));

    app.use(session({
        resave: true,
        saveUninitialized: true,
        secret: 'this is a super s1kr1t s1krit'
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    app.post('/login',
             passport.authenticate('local', { successRedirect: '/',
                                              failureRedirect: '/login' }));

    // Redirect the user to Twitter for authentication.  When complete, Twitter
    // will redirect the user back to the application at
    //   /auth/twitter/callback
    app.get('/auth/twitter', passport.authenticate('twitter'));

    // Twitter will redirect the user to this URL after approval.  Finish the
    // authentication process by attempting to obtain an access token.  If
    // access was granted, the user will be logged in.  Otherwise,
    // authentication has failed.
    app.get('/auth/twitter/callback', 
            passport.authenticate('twitter', { successRedirect: '/',
                                               failureRedirect: '/login' }));

};

