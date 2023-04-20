import path from 'path';
import { exec } from 'child_process';
import fse from 'fs-extra';
import sharp from 'sharp';
import imagemin from 'imagemin';
import imageminPngquant from 'imagemin-pngquant';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminJpegRecompress from 'imagemin-jpeg-recompress';
import { exiftool } from 'exiftool-vendored';

const COMPRESS_TEMP = path.join(process.cwd(), 'temp');
if (!fse.existsSync(COMPRESS_TEMP)) {
  fse.mkdirpSync(COMPRESS_TEMP)
}

export async function compressImage(image) {
  const { dir, base } = path.parse(image);
  const tempFile = path.join(COMPRESS_TEMP, base);

  try {
    // compress bak
    const files = await imagemin([image], {
      glob: false,
      destination: path.dirname(tempFile),
      plugins: [
        // imageminMozjpeg(),
        imageminJpegRecompress({ strip: false }),
        imageminPngquant(),
      ]
    });

    if (files[0]) {
      // remove comment
      await exiftool.write(tempFile, { Comment: null }, ['-overwrite_original'])
    }

    fse.moveSync(tempFile, image, { overwrite: true })
    return [true, null];
  } catch (err) {
    // 逃逸名片未更新
    if (err.message.includes('No success message: 0 image files updated')) {
      return [true, err]
    }
    // revert bak
    fse.removeSync(tempFile);
    return [false, err];
  }
}

