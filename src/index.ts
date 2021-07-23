const fs = require('fs')
const path = require('path')
const ytdl = require('ytdl-core')
const COS = require('cos-nodejs-sdk-v5')

exports.main_handler = (event, context, callback) => {
  ytdl('https://www.youtube.com/watch?v=aqz-KE-bpKQ', {
    range: {
      start: 0,
      end: 5355705,
    },
  })
    .pipe(fs.createWriteStream(path.join('/tmp', 'video.mp4')))
    .on('finish', () => {
      // 这里有个坑，临时密钥一定要填这个SESSION TOKEN 不然怎么都上传不了
      const environment = JSON.parse(context.environment)
      const cos = new COS({
        SecretId: environment.TENCENTCLOUD_SECRETID,
        SecretKey: environment.TENCENTCLOUD_SECRETKEY,
        SecurityToken: environment.TENCENTCLOUD_SESSIONTOKEN,
      })

      cos.putObject(
        {
          Bucket: 'youtube-1253555942' /* 我们创建的COS Bucket */,
          Region: 'ap-hongkong' /* 地域 */,
          Key: `video-${Date.now()}.mp4` /* 文件名 */,
          StorageClass: 'STANDARD' /* 默认就好了 */,
          Body: fs.createReadStream(path.join('/tmp', 'video.mp4')), // 上传文件对象
          onProgress: function (progressData) {
            console.log(JSON.stringify(progressData))
          },
        },
        function (err, data) {
          console.log(err || data)
          callback(null, 'ok')
        },
      )
    })
    .on('error', (e) => {
      console.log(e)
    })
}
