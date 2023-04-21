import path from 'node:path';

const rootDir = process.cwd();
const pngquantBin =
  process.platform === 'win32' ? path.join(rootDir, './vendor/win/pngquant.exe') :
  process.arch === 'arm64' ? path.join(rootDir, './vendor/linux-arm/pngquant') :
  path.join(rootDir, './vendor/linux-amd/pngquant');

export default pngquantBin;