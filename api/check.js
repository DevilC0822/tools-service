const express = require('express');
const checkUtils = require('../utils/check.js');

const app = express();

// aliCloudPan
app.get('/aliCloudPan', async (req, res) => {
  try {
    const { token = '' } = req.query;
    const result = await checkUtils.aliCloudPanCheck(token);
    res.send({
      code: 200,
      msg: '签到成功',
      success: true,
      data: result,
    });
  } catch (err) {
    res.send({
      code: 200,
      msg: err || '签到失败',
      success: false,
      data: null,
    });
  }
});

app.get('/mihoyo', async (req, res) => {
  try {
    const { cookie = '', sendKey = '' } = req.query;
    console.log(cookie, sendKey);
    const result = await checkUtils.mihoyoCheck(cookie, sendKey);
    res.send({
      code: 200,
      msg: '签到成功',
      success: true,
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.send({
      code: 200,
      msg: err || '签到失败',
      success: false,
      data: null,
    });
  }
});

module.exports = app;