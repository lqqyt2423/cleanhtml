'use strict';

const request = require('request');
const cleanhtml = require('../');

const link = 'https://mp.weixin.qq.com/s/vK3wQBUU6b5wDtLqRgrhSw';

request(link, (err, res, body) => {
  if (err) throw err;
  const start = Date.now();
  const html = cleanhtml(body);
  console.log(html);
  console.log('\ncostTime:', Date.now() - start, 'ms');
});
