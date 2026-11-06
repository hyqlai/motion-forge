# Secret scanning

提交前用 [gitleaks](https://github.com/gitleaks/gitleaks) 扫描暂存区，阻止 API key、token、私钥、授权码等敏感信息进入 Git 历史。

## 启用（每个克隆执行一次）

```bash
git config core.hooksPath scripts/hooks
chmod +x scripts/hooks/pre-commit
```

`core.hooksPath` 是本地仓库配置，不会随提交分发，所以新克隆需要重新执行一次。`chmod +x` 需要重复执行的情况：在未保留文件权限的环境中克隆或检出（例如部分 Windows 环境）之后。

## 行为

- 只扫描**本次暂存**的内容，不扫描全历史，提交速度不受仓库历史规模影响。
- 命中即退出码非零，提交被阻止，输出中的密钥值已脱敏（`--redact`）。
- **未安装 gitleaks 时默认阻止提交**，避免钩子静默失效。
- 删除文件、无历史提交的初始仓库均不受影响（已验证）。

脚本位于 `scripts/hooks/pre-commit`。使用的是 `gitleaks git --staged`，未使用 `--pre-commit`：后者在本版本（8.30.1）只读取工作区 diff，扫不到暂存区内容。

## 误报与临时绕过

- 单行误报：在该行末尾加 `gitleaks:allow` 注释。
- 单次绕过：`git commit --no-verify`（会跳过全部 pre-commit 钩子）。
- 已有规则可在 `.gitleaks.toml` 中扩展，gitleaks 会自动读取仓库根目录下的该文件。

## 已知限制

- **当前不扫描提交信息**（`git commit -m` 里的密钥不会被拦截）。需要时可改用 `commit-msg` 钩子配合 `gitleaks stdin`。
- 钩子只在本机生效，无法约束 `--no-verify`；服务端或 CI 仍需独立扫描。
