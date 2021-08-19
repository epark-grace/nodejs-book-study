const express = require('express');
const { Sequelize } = require('sequelize');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const {
    sequelize: { models: { like } },
    Post,
    User,
    Hashtag
} = require('../models');

const router = express.Router();

router.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.followerCount = req.user ? req.user.Followers.length : 0;
    res.locals.followingCount = req.user ? req.user.Followings.length : 0;
    res.locals.followingIdList = req.user ? req.user.Followings.map(f => f.id) : [];
    next();
});

router.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile', {
        title: '내 정보 - NodeBird'
    });
});

router.get('/user-form', isLoggedIn, (req, res) => {
    res.render('user-form', {
        title: '회원 정보 변경 - NodeBird'
    });
});
router.get('/join', isNotLoggedIn, (req, res) => {
    res.render('join', {
        title: '회원가입 - NodeBird'
    });
});

router.get('/', async (req, res, next) => {
    try {
        let twits = await Post.findAll({
            attributes: {
                exclude: ['userId'],
                include: [
                    [Sequelize.fn('COUNT', Sequelize.col('reactionUsers.id')), 'likeCount']
                ]
            },
            include: [{
                model: User,
                as: 'User',
                attributes: ['id', 'nick']
            }, {
                model: User,
                as: 'ReactionUsers',
                attributes: [],
                through: { attributes: [] }
            }],
            group: 'Post.id',
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        });

        let likedPosts = [];

        if (req.isAuthenticated()) {
            const likes = await like.findAll(
                { where: { userId: req.user.id } },
                { attributes: ['postId'] });
            likedPosts = likes.map(like => like.postId);
        }

        res.render('main', {
            title: 'NodeBird',
            twits,
            likedPosts
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.get('/hashtag', async (req, res, next) => {
    const query = req.query.hashtag;
    if (!query) {
        return res.redirect('/');
    }

    try {
        const hashtag = await Hashtag.findOne({
            where: { title: query }
        });
        let twits = [];
        if (hashtag) {
            twits = await hashtag.getPosts({
                include: [{
                    model: User,
                    as: 'User',
                    attributes: ['id', 'nick']
                }, {
                    model: User,
                    as: 'ReactionUsers',
                    attributes: [],
                    through: { attributes: [] }
                }],
                group: 'Post.id',
                order: [['createdAt', 'DESC']],
                raw: true,
                nest: true
            });

            let likedPosts = [];

            if (req.isAuthenticated()) {
                const likes = await like.findAll(
                    { where: { userId: req.user.id } },
                    { attributes: ['postId'] });
                likedPosts = likes.map(like => like.postId);
            }
            
            return res.render('main', {
                title: `${query} | NodeBird`,
                twits,
                likedPosts
            });

        }
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;
