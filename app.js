const express = require('express');
const dayjs = require('dayjs');
const path = require('path');
const songApi = require('./api/song');
const singerApi = require('./api/singer');
const checkApi = require('./api/check');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // 解析 application/json 格式的请求体
app.use(express.urlencoded({ extended: false })); // 解析 application/x-www-form-urlencoded 格式的请求体

app.use('/api/song', songApi);
app.use('/api/singer', singerApi);
app.use('/api/check', checkApi);

app.get('/api/test', (req, res) => {
  res.send({
    code: 200,
    msg: 'test',
    data: [
      {
        x: encodeNumberRule1(123),
        y: encodeNumberRule1(-123.2),
        rule: 1,
      },
      {
        x: encodeNumberRule2(123),
        y: encodeNumberRule2(-123.2),
        rule: 2,
      }
    ],
    success: true,
  });
});

// 数字加密 先根据映射将数字打乱，再根据方程 y = kx + b 其中，k 为当前的月份，b 为当月的号数，线性方程的系数和常数项是根据当前的日期计算得到的。比如当前的日期为“2018-07-24”，那么线性变换的 k 为 7，b 为 24。
// 1. 一个随机映射表，比如 0 -> 3, 1 -> 7, 2 -> 4, 3 -> 5, 4 -> 1, 5 -> 0, 6 -> 6, 7 -> 9, 8 -> 2, 9 -> 8
// 2. 根据当前的日期计算出线性变换的 k 和 b
// 3. 根据公式 y = kx + b 将数字进行线性变换
// 4. 将数字转换为字符串，使用3.1415926拼接，比如 数字123 变为1 + '3.1415926' + 2 + '3.1415926' + 3，最终结果为'13.141592623.141592623.1415926'

const encodeNumberRule1 = (number) => {
  const numMap = {
    0: 3,
    1: 7,
    2: 4,
    3: 5,
    4: 1,
    5: 0,
    6: 6,
    7: 9,
    8: 2,
    9: 8,
  };
  const date = dayjs().format('YYYY-MM-DD');
  const k = Number(date.split('-')[1]);
  const b = Number(date.split('-')[2]);
  const result = String(number).split('').map((item) => {
    if (isNaN(item)) {
      return item;
    }
    return numMap[item] * k + b;
  }).join('3.1415926');
  return result;
};

function encodeNumberRule2(number) {
  // numMap 为随机16进制映射表
  const numMap = {
    0: 0xe6a7,
    1: 0xf257,
    2: 0xa87e,
    3: 0xb2c1,
    4: 0xc7b2,
    5: 0xa9f2,
    6: 0xe2c7,
    7: 0xf82b,
    8: 0xc1b2,
    9: 0xc8f6,
  };

  const date = dayjs().format('YYYY-MM-DD');
  const k = Number(date.split('-')[1]);
  const b = Number(date.split('-')[2]);
  const result = String(number).split('').map((item) => {
    if (isNaN(item)) {
      return item;
    }
    return (numMap[item] * k + b).toString(16);
  }).join('3.1415926');
  console.log('result', result);
  return result.toString();
}


module.exports = app;