import path from 'node:path';


const rootDir = process.cwd();
const jpegRecompressBin =
  process.platform === 'win32' ? path.join(rootDir, './vendor/win/jpeg-recompress.exe') :
  process.arch === 'arm64' ? path.join(rootDir, './vendor/linux-arm/jpeg-recompress') :
  path.join(rootDir, './vendor/linux-amd/jpeg-recompress');

export default jpegRecompressBin;