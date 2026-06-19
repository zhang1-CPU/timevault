@echo off
chcp 65001 >nul
echo ==========================================
echo   TimeVault - 启动本地服务器
echo ==========================================
echo.

:: 检查 npm 是否可用
where npm >nul 2>nul
if %errorlevel% == 0 (
    echo [1/2] 使用 npm 启动...
    npx serve dist -l 8080
    goto :end
)

:: 检查 Python3
where python >nul 2>nul
if %errorlevel% == 0 (
    echo [1/2] 使用 Python 启动...
    cd dist
    python -m http.server 8080
    goto :end
)

:: 检查 Python (py)
where py >nul 2>nul
if %errorlevel% == 0 (
    echo [1/2] 使用 Python 启动...
    cd dist
    py -m http.server 8080
    goto :end
)

echo [错误] 未找到 npm 或 Python。
echo 请安装 Node.js (https://nodejs.org) 或 Python (https://python.org)
echo.
pause

:end
echo.
echo 服务器已关闭。
pause
