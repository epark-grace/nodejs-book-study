const passport = require('passport');
const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const User = require('../models/user');

module.exports = () => {
    const cache = {};

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        if (cache.id) {
            done(null, cache.id);
        } else {
            User.findOne({
                where: { id },
                attributes: ['id', 'nick'],
                include: [{
                    model: User,
                    attributes: ['id', 'nick'],
                    as: 'Followers'
                }, {
                    model: User,
                    attributes: ['id', 'nick'],
                    as: 'Followings'
                }]
            }).then(user => {
                cache.id = user;
                done(null, user);
            }).catch(err => done(err));
        }
    });

    local();
    kakao();
};