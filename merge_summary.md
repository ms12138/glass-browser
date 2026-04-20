此次合并主要添加了构建和部署相关的配置文件，包括 GitHub Actions 工作流和 Dockerfile，同时更新了项目依赖结构。这些变更为 Glass Browser 项目提供了自动化构建和容器化部署能力。
| 文件 | 变更 |
|------|---------|
| .github/workflows/build.yml | - 新增 GitHub Actions 工作流配置，用于在 Windows 环境下构建 Glass Browser<br>- 定义了推送和 PR 到 main 分支时的自动构建流程<br>- 包含安装依赖、使用 electron-packager 构建 Windows 版本、上传构建产物等步骤 |
| Dockerfile | - 新增 Dockerfile 配置，基于 Node.js 14 镜像<br>- 安装必要的系统依赖（如 libgtk2.0-0、libgconf-2-4 等）<br>- 设置工作目录为 /app，复制项目文件并安装依赖<br>- 配置运行应用程序的命令为 npm start |
| package-lock.json | - 锁文件版本从 1 升级到 3<br>- 依赖结构变更为新的 packages 格式<br>- 新增 npm-check-updates 作为依赖<br>- 开发依赖包括 electron ~1.7.11 和 electron-rebuild ^1.7.3<br>- 其他依赖项的版本和结构也有相应调整 |