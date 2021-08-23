const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

const { Post, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

try {
    fs.readdirSync('uploads');
} catch (err) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}

AWS.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2'
});

const upload = multer({
    storage: multerS3({
        s3: new AWS.S3(),
        bucket: 'nodebird-bucket',
        key(req, file, cb) {
            cb(null, `original/${Date.now()}${path.basename(file.originalname)}`);
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
    console.log(req.file);
    res.json({
        url: `${req.file.location}`
    });
});

const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
    try {
        const post = await Post.create({
            content: req.body.content,
            img: req.body.url,
            userId: req.user.id
        });

        const hashtags = req.body.content.match(/#[^\s#]+/g);
        if (hashtags) {
            const result = await Promise.all(
                hashtags.map(tag => {
                    return Hashtag.findOrCreate({
                        where: { title: tag.slice(1).toLowerCase() }
                    });
                })
            );
            await post.addHashtags(result.map(r => r[0]));
        }

        res.redirect('/');
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.delete('/:postId', async (req, res, next) => {
    try {
        const post = await Post.findByPk(req.params.postId);

        if (post && req.user.id === post.get('userId')) {
            await post.destroy();
            res.status(200).send('success');
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;