// 测试依赖是否正常
import { execa } from 'execa';

import jpegRecompressBin from './optimize/plugins/imagemin-jpeg-recompress/bin.js';
import pngquantBin from './optimize/plugins/imagemin-pngquant/bin.js';

try {
  // try chmod
  try {
    await execa('chmod', ['+751', jpegRecompressBin]);
    await execa('chmod', ['+751', jpegRecompressBin]);
  } catch (err) {}

  const jpegRecompressVersion = await execa(jpegRecompressBin, ['--version']);
  console.log(`jpeg-recompress version: ${jpegRecompressVersion.stdout}`);

  const pngquantVersion = await execa(pngquantBin, ['--version']);
  console.log(`pngquant version: ${pngquantVersion.stdout}`);

  console.log('imagemin vendor support current platform :)');

} catch (err) {
  err.message = `imagemin vendor unsupport current platform :( \n${err.message}`;
  throw err;
}