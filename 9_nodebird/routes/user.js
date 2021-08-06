const express = require('express');
const bcrypt = require('bcrypt');

const { isLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

router.patch('/:userId', isLoggedIn, async (req, res, next) => {
    const { nick, password } = req.body;

    try {
        const result = await User.update(
            { nick, password: await bcrypt.hash(password, 12) },
            { where: { id: req.user.id } }
        );
        if (result[0] === 1) {
            res.send('success');
        } else {
            res.status(404).send('no such user');
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.delete('/:userId/followings/:followingId/', isLoggedIn, async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: {
                id: req.user.id
            }
        });

        if (user) {
            await user.removeFollowing(parseInt(req.params.followingId, 10));
            res.send('success');
        } else {
            res.status(404).send('no user');
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.post('/:userId/followings/:followingId/', isLoggedIn, async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: {
                id: req.user.id
            }
        });

        if (user) {
            await user.addFollowing(parseInt(req.params.followingId, 10));
            res.send('success');
        } else {
            res.status(404).send('no user');
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;