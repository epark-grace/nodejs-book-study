const express = require('express');
const axios = require('axios');

const router = express.Router();

const url = 'http://localhost:8002/v2';
axios.defaults.headers.origin = 'http://localhost:4000';

const request = async (req, api) => {
    try {
        if (!req.session.jwt) {
            const tokenResult = await axios.post(`${url}/token`, {
                clientSecret: process.env.CLIENT_SECRET
            });
            req.session.jwt = tokenResult.data.token;
        }
        return await axios.get(`${url}${api}`, {
            headers: { authorization: req.session.jwt }
        });
    } catch (e) {
        if (e.response.status === 419) {
            delete req.session.jwt;
            return request(req, api);
        }
        return e.response;
    }
};

router.get('/', (req, res) => {
    res.render('main', { secret: process.env.CLIENT_SECRET });
});

router.get('/mypost', async (req, res, next) => {
    try {
        const result = await request(req, '/posts/my');
        res.json(result.data);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/search/:hashtag', async (req, res, next) => {
    try {
        const result = await request(req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`);
        res.json(result.data);
    } catch (error) {
        if (error.code) {
            console.error(error);
            next(error);
        }
    }
});

module.exports = router;