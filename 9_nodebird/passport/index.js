const passport = require('passport');
const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const User = require('../models/user');

module.exports = () => {
    const cache = {};

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        if (cache[id] && cache[id].expiresAt > Date.now()) {
            done(null, cache[id].info);
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
                cache[user.id] = {
                    expiresAt: Date.now() + (1000 * 60),
                    info: user
                };
                done(null, user);
            }).catch(err => done(err));
        }
    });

    local();
    kakao();
};