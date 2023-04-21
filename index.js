import express from 'express'
import path from 'path'
import fs from 'fs'
import fse from 'fs-extra'

import {
  getImageAndDirectory,
  getOptimizeSourceMeta,
  generateThumbnail,
} from './help.js';

import {
  addCompressImages,
  allLogCompressImages,
} from './optimize/index.js'

const app = express();
const port = 3000;

const DIRECTORY_PATH = path.resolve('/photo'); // 指定目录路径
// const DIRECTORY_PATH = path.resolve('C:/Users/Maibenben/Desktop/image-demo'); // 指定目录路径

const THUMBNAIL_TEMPDIR = path.resolve(process.cwd(), './public/thumb'); // 指定临时缩略图目录

app.use(express.json())

// 返回指定的图片
app.get('/apis/resource/:dir?', async (req, res) => {
  // 获取请求参数中的目录名
  const dir = decodeURIComponent(req.params.dir || '.');

  // 获取目录路径
  const dirPath = path.join(DIRECTORY_PATH, dir);

  // 检查目录是否存在
  if (!fs.existsSync(dirPath)) {
    return res.status(404).send('Directory not found');
  }

  // 获取目录下的所有文件和子目录
  const { images, directories } = getImageAndDirectory(dirPath);
  const metaMap = getOptimizeSourceMeta(dirPath);

  const thumbs = await Promise.all(images.map(image => generateThumbnail(path.join(dirPath, image.path), path.join(THUMBNAIL_TEMPDIR, dir, image.path ))));

  res.json({
    dir, directories,
    images: images.map((image, idx) => ({
      name: image.path,
      path: path.join(dirPath, image.path),
      size: image.size,
      meta: metaMap[image.path] || {},
      thumb: `/thumb/${path.relative(THUMBNAIL_TEMPDIR, thumbs[idx]).split(path.sep).join('/')}`,
    }))
  })
});

// 删除thumb
app.get('/apis/thumb/delete', (req, res) => {
  fse.remove(THUMBNAIL_TEMPDIR, (err) => {
    if (err) {
      console.error(err);
    } else {
      res.json({ status: 'success' })
    }
  });
});

// 操作区域
// 压缩图片
app.post('/apis/op/compress', async (req, res) => {
  // 获取压缩任务
  const compressImages = Object.keys(req.body).filter(imagePath => req.body[imagePath].compress);

  const taskId = addCompressImages(compressImages);
  res.json({ taskId })
})
app.get('/apis/op/compress', async (req, res) => {
  const taskId = req.query.taskId;
  const logMap = allLogCompressImages();
  res.json({ log: taskId ? { [taskId]: logMap[taskId] } : logMap  })
})


// 开放静态目录
app.use(express.static(path.join(process.cwd(), 'public')));

// 启动应用程序
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
