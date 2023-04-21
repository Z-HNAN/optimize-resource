import path from 'node:path';
import { EventEmitter } from 'node:events';
const eventEmitter = new EventEmitter();

import { compressImage } from './image.js'
import { appendOptimizeSourceMeta } from '../help.js'


const optimizeImage = {};
async function compressImages(taskId) {
  const tasks = optimizeImage[taskId] || [];
  // 查看是否还有任务
  const taskIndex = tasks.findIndex(t => t.status === 'pending');
  if (taskIndex === -1) {
    // 任务已经完成
    eventEmitter.emit('compress-done', { taskId });
    return;
  }

  // 执行任务
  const [success, err] = await compressImage(tasks[taskIndex].path);
  tasks[taskIndex].status = success ? 'success' : 'failure';
  tasks[taskIndex].err = err;

  // 设置下一循环执行
  setImmediate(() => compressImages(taskId));
}
eventEmitter.on('compress-done', data => {
  const { taskId } = data;
  // 追加meta对象
  const compressImages = optimizeImage[taskId];
  const successCompressImages = compressImages.filter(l => l.status === 'success');
  if (successCompressImages.length === 0) {
    return;
  }

  // 一批图片的位置都是同一个目录下的
  const dir = path.dirname(successCompressImages[0].path);

  const meta = successCompressImages
    .reduce((acc, compressImage) => ({ ...acc, [path.basename(compressImage.path)]: { compress: true } }), {});

  appendOptimizeSourceMeta(dir, meta)
})
export function addCompressImages(images) {
  const taskId = `compress-${Date.now()}`;
  optimizeImage[taskId] = images.map(image => ({ path: image, status: 'pending', err: null }));

  // 启动任务
  compressImages(taskId);
  return taskId
}
export function allLogCompressImages() {
  return optimizeImage;
}