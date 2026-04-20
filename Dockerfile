FROM node:14

# 安装必要的依赖
RUN apt-get update && apt-get install -y \
    libgtk2.0-0 \
    libgconf-2-4 \
    libnss3 \
    libasound2 \
    libxtst6 \
    libxss1 \
    libx11-xcb1 \
    libxrandr2 \
    libgbm1 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 安装依赖
RUN npm install

# 运行应用程序
CMD ["npm", "start"]