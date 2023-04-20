# 基础镜像
FROM node:16-buster-slim
# FROM node:16-alpine

# 安装 pnmp 等工具
RUN npm install

# 创建一个工作目录
WORKDIR /photo

VOLUME /photo

CMD ["npm run start"]


