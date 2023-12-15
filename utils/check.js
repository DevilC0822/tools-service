const { random, sample } = require('lodash');
const md5 = require('md5');

const randomString = (length) => {
  let randomStr = '';
  for (let i = 0; i < length; i++) {
    randomStr += sample('abcdefghijklmnopqrstuvwxyz0123456789');
  }
  return randomStr;
}
const getMihoyoHeader = (cookie, DEVICE_ID, DEVICE_NAME, type, data) => {
  const randomStr = randomString(6);
  const timestamp = Math.floor(Date.now() / 1000);

  // Android sign
  let sign = md5(`salt=z8DRIUjNDT7IT5IZXvrUAxyupA1peND9&t=${timestamp}&r=${randomStr}`);
  let DS = `${timestamp},${randomStr},${sign}`;
  if (type === 'signIn') {
    const randomInt = Math.floor(Math.random() * (200000 - 100001) + 100001);
    sign = md5(`salt=t0qEgfub6cvueAPgR5m9aQWWVciEer7v&t=${timestamp}&r=${randomInt}&b=${data}&q=`);
    DS = `${timestamp},${randomInt},${sign}`;
  }
  return {
    'Cookie': cookie,
    "Content-Type": "application/json",
    "User-Agent": "okhttp/4.8.0",
    'Referer': "https://app.mihoyo.com",
    'Host': "bbs-api.mihoyo.com",
    "x-rpc-device_id": DEVICE_ID,
    "x-rpc-app_version": '2.34.1',
    "x-rpc-device_name": DEVICE_NAME,
    "x-rpc-client_type": "2", // 1 - iOS, 2 - Android, 4 - Web
    "x-rpc-device_model": "Mi 10",
    "x-rpc-channel": "miyousheluodi",
    "x-rpc-sys_version": "6.0.1",
    DS,
  }
};
// 返回一个数组，数组中有num个不重复的随机数，随机数的范围是[min, max]
const getRandomNum = (min, max, num) => {
  const result = [];
  while (result.length < num) {
    const randomNum = random(min, max);
    if (!result.includes(randomNum)) {
      result.push(randomNum);
    }
  }
  return result;
};

const aliCloudPanCheck = async (token = '', sendKey = '') => {
  if (!token) {
    return Promise.reject('未获取到阿里云盘 token');
  }
  let isNeedSendMsg = false;
  if (sendKey) {
    isNeedSendMsg = true;
  }
  fetch = (await import('node-fetch')).default;
  const updateAccesssTokenURL = 'https://auth.aliyundrive.com/v2/account/token';
  const signinURL = 'https://member.aliyundrive.com/v1/activity/sign_in_list?_rx-s=mobile';
  const rewardURL = 'https://member.aliyundrive.com/v1/activity/sign_in_reward?_rx-s=mobile';
  return new Promise(async (resolve, reject) => {
    const queryBody = {
      'grant_type': 'refresh_token',
      'refresh_token': token
    };
    //使用 refresh_token 更新 access_token
    try {
      const refreshRes = await fetch(updateAccesssTokenURL, {
        method: 'POST',
        body: JSON.stringify(queryBody),
        headers: { 'Content-Type': 'application/json' }
      }).then(res => res.json());
      if (!refreshRes.access_token) {
        if (isNeedSendMsg) {
          await fetch(`https://sc.ftqq.com/${sendKey}.send?text=阿里云盘签到失败&desp=刷新 token 失败, 请检查 token 是否正确，或者重新获取 token`);
        }
        return reject('刷新 token 失败, 请检查 token 是否正确，或者重新获取 token');
      }
      const access_token = refreshRes.access_token;
      // 签到
      const checkRes = await fetch(signinURL, {
        method: 'POST',
        body: JSON.stringify(queryBody),
        headers: { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' }
      }).then((res) => res.json());
      if (!checkRes.success) {
        if (isNeedSendMsg) {
          await fetch(`https://sc.ftqq.com/${sendKey}.send?text=阿里云盘签到失败&desp=${checkRes?.message}`);
        }
        return reject(`签到失败${checkRes?.message}}`);
      }
      const { signInLogs } = checkRes.result;
      const rewards = signInLogs.filter(
        v => v.status === 'normal' && !v.isReward
      )
      if (rewards.length === 0) {
        if (isNeedSendMsg) {
          await fetch(`https://sc.ftqq.com/${sendKey}.send?text=阿里云盘签到失败&desp=今日已签到`);
        }
        return reject('今日已签到')
      }
      const reward = rewards[0]
      // 领取奖励
      const rewardRes = await fetch(rewardURL, {
        method: 'POST',
        body: JSON.stringify({ signInDay: reward?.day }),
        headers: { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' }
      }).then((res) => res.json());
      resolve({
        goods: rewardRes?.result?.name,
        desc: rewardRes?.result?.description,
        notice: rewardRes?.result?.notice,
      });
    } catch (err) {
      console.log(err);
      if (isNeedSendMsg) {
        await fetch(`https://sc.ftqq.com/${sendKey}.send?text=阿里云盘签到失败&desp=${err?.message}`);
      }
      return reject(`签到失败, ${err?.message}`);
    }
  });
};

const mihoyoCheck = async (cookie = '', sendKey = '') => {
  if (!cookie) {
    return Promise.reject('为获取到米游社 cookie');
  }
  let isNeedSendMsg = false;
  if (sendKey) {
    isNeedSendMsg = true;
  }
  fetch = (await import('node-fetch')).default;
  return new Promise(async (resolve, reject) => {
    const DEVICE_ID = randomString(32).toUpperCase();
    const DEVICE_NAME = randomString(random(1, 10));
    // 论坛签到
    const forumSignUrl = "https://api-takumi.mihoyo.com/apihub/app/api/signIn";
    const signPostData = { gids: '1' };
    try {
      const signRes = await fetch(forumSignUrl, {
        method: 'POST',
        body: JSON.stringify(signPostData),
        headers: getMihoyoHeader(cookie, DEVICE_ID, DEVICE_NAME, 'signIn', JSON.stringify(signPostData)),
      }).then(res => res.json());
      const forumListUrl = "https://api-takumi.mihoyo.com/post/api/getForumPostList?forum_id=26&is_good=false&is_hot=false&page_size=20&sort_type=1";
      const forumListRes = await fetch(forumListUrl, {
        method: 'GET',
        headers: getMihoyoHeader(cookie, DEVICE_ID, DEVICE_NAME),
      }).then(res => res.json());
      // 随机获取三个帖子
      const postList = forumListRes.data.list;
      const randomPostList3 = getRandomNum(0, postList.length - 1, 3).map((index) => postList[index]);
      // 浏览帖子
      const viewPostRes = await Promise.all(randomPostList3.map((post) => {
        return fetch(`https://api-takumi.mihoyo.com/post/api/getPostFull?post_id=${post.post.post_id}`, {
          method: 'get',
          headers: getMihoyoHeader(cookie, DEVICE_ID, DEVICE_NAME),
        }).then(res => res.json());
      }));
      // 点赞帖子
      const likePostUrl = "https://api-takumi.mihoyo.com/apihub/sapi/upvotePost";
      const randomPostList5 = getRandomNum(0, postList.length - 1, 5).map((index) => postList[index]);
      const likePostRes = await Promise.all(randomPostList5.map((post) => {
        const upvotePostData = {
          "post_id": post.post.post_id,
          "is_cancel": false
        }
        return fetch(likePostUrl, {
          method: 'post',
          body: JSON.stringify(upvotePostData),
          headers: getMihoyoHeader(cookie, DEVICE_ID, DEVICE_NAME),
        }).then(res => res.json());
      }));
      // 分享帖子
      const sharePostRes = await fetch(`https://api-takumi.mihoyo.com/apihub/api/getShareConf?entity_id=${randomPostList3[0].post.id}&entity_type=1`, {
        method: 'GET',
        headers: getMihoyoHeader(cookie, DEVICE_ID, DEVICE_NAME),
      }).then(res => res.json());
      // 发送消息post形式
      await fetch(`https://sc.ftqq.com/${sendKey}.send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '米游社签到成功', desp: JSON.stringify({
          signRes,
          viewPostRes,
          likePostRes,
          sharePostRes,
        }, null, 2) }),
      }).then(res => res.json());
      resolve({
        signRes,
        viewPostRes,
        likePostRes,
        sharePostRes,
      });
    } catch(err) {
      console.log(err);
      if (isNeedSendMsg) {
        await fetch(`https://sc.ftqq.com/${sendKey}.send?text=米游社签到失败&desp=论坛签到失败`);
      }
      return reject('论坛签到失败');
    }
  });
}

module.exports = {
  aliCloudPanCheck,
  mihoyoCheck,
};