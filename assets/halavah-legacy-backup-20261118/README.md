# 旧 Hexo 网站归档

此目录保存旧站文章源码、主题、配置、依赖清单、生成页面和原脚本，随当前仓库提交。当前 GitHub Pages 只发布根目录的 `docs/`，不会把此目录部署为网站；但这些归档资料可在公开 Git 仓库中阅读。

- `source/`：文章与页面源码。
- `themes/`：原主题、静态资源及第三方许可。
- `docs/`：旧站生成页面，包含旧首页。
- `scaffolds/`：旧站内容模板。
- `images/`：旧站图片。
- `_config.yml`、`_config.landscape.yml`：旧 Hexo 配置。
- `package.json`、`package-lock.json`、`yarn.lock`：旧依赖清单与锁文件。
- `db.json`：旧生成缓存，数据库密码样式值已是明确占位符。
- `check.bat`、`deploy.bat`、`deploy.sh`：原脚本，仅作历史资料，不用于当前发布。
- `SHA256.json`：除自身之外所有归档文件的 SHA-256 校验值。

迁移前的 Git bundle 继续保存在仓库外同名本地备份目录，不纳入 Git。恢复旧站应复制到独立目录，先审查旧依赖与部署配置，不要在本目录运行原部署脚本，以免操作当前仓库。归档没有进行依赖安装或运行验证，不代表旧依赖安全可用。
