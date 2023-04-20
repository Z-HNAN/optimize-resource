# 基础镜像
FROM node:16-buster-slim
# FROM node:16-alpine

# 创建一个工作目录
WORKDIR /app

# photo目录
VOLUME /photo

# 复制项目文件到工作目录
COPY . .

# 安装 pnmp 等工具
RUN npm install

# 暴露端口
EXPOSE 3000

CMD ["npm", "start"]


