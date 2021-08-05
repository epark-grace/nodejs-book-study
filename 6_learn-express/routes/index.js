const express = require('express');

const router = express.Router();

// GET / 라우터
router.get('/', (req, res, next) => {
    //res.send('Hello, Express!');
    next();
});

module.exports = router;