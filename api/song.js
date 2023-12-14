const express = require('express');
const path = require('path');
const fs = require('fs');
const SongModel = require('../model/song');
const songUtils = require('../utils/song');

const app = express();

// 获取所有歌曲
app.get('/', async (req, res) => {
  // 根据query参数中的limit和offset进行分页查询
  const { limit = 10, offset = 0, singerId = '', keywords } = req.query;
  console.log(limit, offset, singerId, keywords);
  if (isNaN(Number(limit)) || isNaN(Number(offset))) {
    return res.send({
      code: 200,
      msg: '参数错误',
      data: null,
      success: false,
    });
  }
  const query = {};
  if (singerId) {
    query.singerId = singerId;
  }
  if (keywords) {
    query.name = new RegExp(keywords);
  }
  const data = await SongModel.find(query).limit(Number(limit)).skip(Number(offset)).exec();
  const total = await SongModel.find(query).countDocuments();
  const hasMore = total - (Number(limit) + Number(offset)) > 0;
  if (!data) {
    return res.send({
      code: 200,
      msg: '获取歌曲列表失败',
      data: null,
      success: false,
    });
  }
  res.send({
    code: 200,
    msg: '获取歌曲列表成功',
    success: true,
    data: {
      list: data,
      total,
      hasMore,
    },
  });
});

// 获取文件对象
app.get('/file', async (req, res) => {
  const { songId } = req.query;
  if (!songId) {
    return res.send({
      code: 200,
      msg: '参数错误',
      data: null,
      success: false,
    });
  }
  // 根据歌曲id查询歌曲信息
  const song = await SongModel.findById(songId);
  console.log(song);
  const filePath = path.resolve(__dirname, `../public/upload/${song.url}`);
  // 读取文件
  const file = fs.readFileSync(filePath);
  // 返回文件
  res.send(file);
});

// 更新数据库所有歌曲信息
app.get('/update/all', async (req, res) => {
  const status = await songUtils.updateAll();
  if (status) {
    return res.send({
      code: 200,
      msg: '更新歌曲列表成功',
      success: true,
      data: null,
    });
  }
  res.send({
    code: 200,
    msg: '更新歌曲列表失败',
    success: false,
    data: null,
  });
});

// 获取更新进度
app.get('/update/progress', async (req, res) => {
  res.send({
    code: 200,
    msg: '获取更新进度成功',
    success: true,
    data: songUtils.getProgress(),
  });
});

module.exports = app;