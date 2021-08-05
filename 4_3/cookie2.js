const http = require('http');
const fs = require('fs').promises;

const parseCookies = (cookie = '') =>
    cookie.split(';')
    .map(value => value.split('='))
    .reduce((acc, [key, value]) => {
        acc[key.trim()] = decodeURIComponent(value);
        return acc;
    }, {});

http.createServer(async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);

    // 주소가 /login으로 시작하는 경우
    if (req.url.startsWith('/login')) {
        const {searchParams} = new URL(req.url, `${req.protocol}://${req.headers.host}`);
        const name = searchParams.get('name');
        const expires = new Date();
        //쿠키 유효시간을 현재 시간 + 5분으로 설정
        expires.setMinutes(expires.getMinutes() + 5);
        res.writeHead(302, {
            'Location': '/',
            'Set-Cookie': `name=${encodeURIComponent(name)}; Expires=${expires.toUTCString()}; HttpOnly; Path=/`,
        });
        res.end();
        //name이라는 쿠키가 있는 경우
    } else if (cookies.name) {
        res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
        res.end(`${cookies.name}님 안녕하세요`);
    } else {
        try {
            const data = await fs.readFile('./cookie2.html');
            res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            res.end(data);
        } catch (err) {
            res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
            res.end(err.message);
        }
    }
}).listen(8084, () => console.log('8084번 포트에서 서버 대기 중입니다.'));