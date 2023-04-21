import path from 'node:path'
import fse from 'fs-extra'
import sharp from 'sharp'
import lodash from 'lodash'


const THUMBNAIL_WIDTH = 250;

const RESOURCE_REGEXP = /\.(jpg|jpeg|png|gif)$/i;
const THUMBNAIL_TEMPDIR = path.resolve(process.cwd(), './public/thumb'); // 指定临时缩略图目录

const OPTIMIZE_SOURCE_META_FILE = '.optimize-resource-meta.json'; // 描述meta

/** 安全解析JSON */
function safeJSONParse(jsonStr) {
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    return {}
  }
}

/** 选择合适的单位返回文件大小 */
function getFileSize(fileSizeInBytes) {
  if (fileSizeInBytes < 1024 * 1024) {
    // 文件大小小于1MB，使用KB单位
    const fileSizeInKB = fileSizeInBytes / 1024;
    return fileSizeInKB.toFixed(2) + ' KB';
  } else {
    // 文件大小大于等于1MB，使用MB单位
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
    return fileSizeInMB.toFixed(2) + ' MB';
  }
}

// 生成缩略图并将其保存到临时目录中
export function generateThumbnail(srcPath, destPath) {
  const filename = path.basename(srcPath);
  const thumbnailPath = path.join(THUMBNAIL_TEMPDIR, filename);

  if (fse.existsSync(destPath)) {
    return Promise.resolve(destPath)
  }

  const destParentPath = path.dirname(destPath);
  if (!fse.existsSync(destParentPath)) {
    fse.mkdirpSync(destParentPath)
  }

  return sharp(srcPath)
    .resize(THUMBNAIL_WIDTH)
    .toFile(destPath)
    .then(() => {
      console.log(`Thumbnail generated successfully for ${filename}`);
      return destPath;
    })
    .catch(err => {
      console.error(`Failed to generate thumbnail for ${filename}: ${err}`);
    });
}

// 获取目录下的图片和目录
export function getImageAndDirectory(dirPath) {
  // 读取目录下的所有文件和子目录
  const files = fse.readdirSync(dirPath);

  const images = [];
  const directories = [];

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const fileStat = fse.statSync(filePath);

    // 判断是否为文件夹
    if (fileStat.isDirectory()) {
      // 如果是文件夹，则将其添加到目录数组中
      directories.push(file);
    } else {
      // 如果是图片文件，则将其添加到图片数组中
      if (RESOURCE_REGEXP.test(file)) {
        images.push({ path: file, size: getFileSize(fileStat.size)});
      }
    }
  });

  return { images, directories };
}

// 获取目录下meta
export function getOptimizeSourceMeta(dirPath) {
  // 读取固定文件 
  const file = path.resolve(dirPath, OPTIMIZE_SOURCE_META_FILE);
  if (fse.existsSync(file)) {
    const jsonStr = fse.readFileSync(file, { encoding: 'utf-8' });
    return safeJSONParse(jsonStr);
  }

  return {};
}
// 写入meta
export function appendOptimizeSourceMeta(dirPath, meta) {
  const file = path.resolve(dirPath, OPTIMIZE_SOURCE_META_FILE);

  let rawMeta = {};
  if (fse.existsSync(file)) {
    rawMeta = safeJSONParse(fse.readFileSync(file, { encoding: 'utf-8' }));
  }

  const newMeta = lodash.merge({}, rawMeta, meta);
  fse.writeFileSync(file, JSON.stringify(newMeta))
}