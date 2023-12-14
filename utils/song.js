const fs = require('fs');
const SongModel = require('../model/song');
const SingerModel = require('../model/singer');
const axios = require('axios');

const path = require('path');
const abslutePath = path.resolve(__dirname, '../public/upload');

const updateInfo = {
  total: 0,
  current: 0,
  isUpdating: false,
}

const getFileCount = () => {
  return new Promise((resolve, reject) => {
    let count = 0;
    const singerList = fs.readdirSync(abslutePath);
    // 如果存在.DS_Store文件，需要去除
    if (singerList.includes('.DS_Store')) {
      singerList.splice(singerList.indexOf('.DS_Store'), 1);
    }
    for (const item of singerList) {
      const songList = fs.readdirSync(`${abslutePath}/${item}`);
      count += songList.length;
    }
    resolve(count);
  });
};

const updateAll = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      updateInfo.isUpdating = true;
      const count = await getFileCount();
      updateInfo.total = count;
      // 删除数据库中所有歌曲
      await SongModel.deleteMany();
      await SingerModel.deleteMany();
      const result = []; //所有歌曲信息
      // 读取public/upload目录下的所有文件夹
      const singerList = fs.readdirSync(abslutePath);
      // 如果存在.DS_Store文件，需要去除
      if (singerList.includes('.DS_Store')) {
        singerList.splice(singerList.indexOf('.DS_Store'), 1);
      }
      await SingerModel.insertMany(singerList.map((item) => ({ name: item })));
      for (const item of singerList) {
        // 读取每个文件夹下的所有歌曲
        const songList = fs.readdirSync(`${abslutePath}/${item}`);
        const singerDB = await SingerModel.findOne({ name: item });

        // 将歌曲信息存入result对象中
        // 使用 for...of 循环和 await
        for (const songItem of songList) {
          const [songName, singer] = songItem.split('-');
          const songInfo = await axios.get(`http://175.24.198.84:3000/cloudsearch/?keywords=${songName}&limit=1`);
          console.log(songInfo.data?.result?.songs[0]?.al?.picUrl ?? '');
          result.push({
            name: songName,
            singer: singer.split('.')[0],
            url: `${item}/${songItem}`,
            fileType: singer.split('.')[1],
            singerId: singerDB?._id ?? '',
            picUrl: `${songInfo.data?.result?.songs[0]?.al?.picUrl}?param=88y88` ?? '',
          });
          updateInfo.current++;
          if (updateInfo.current === updateInfo.total) {
            updateInfo.isUpdating = false;
          }
        }
      }
      SongModel.insertMany(result);
      resolve(true);
    } catch (err) {
      console.log(err);
      resolve(false);
    }
  });
};

const getProgress = () => {
  return updateInfo;
};

module.exports = {
  updateAll,
  getProgress,
};
