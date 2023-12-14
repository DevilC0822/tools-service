const express = require('express');
const SingerModel = require('../model/singer');

const app = express();

// 获取所有歌手
app.get('/', async (req, res) => {
  // 根据query参数中的limit和offset进行分页查询
  const { limit = 10, offset = 0 } = req.query;
  if (isNaN(Number(limit)) || isNaN(Number(offset))) {
    return res.send({
      code: 200,
      msg: '参数错误',
      data: null,
      success: false,
    });
  }
  const data = await SingerModel.find().limit(Number(limit)).skip(Number(offset)).exec();
  const total = await SingerModel.countDocuments();
  const hasMore = total - (Number(limit) + Number(offset)) > 0;
  if (!data) {
    return res.send({
      code: 200,
      msg: '获取歌手列表失败',
      data: null,
      success: false,
    });
  }
  res.send({
    code: 200,
    msg: '获取歌手列表成功',
    success: true,
    data: {
      list: data,
      total,
      hasMore,
    },
  });
});

module.exports = app;