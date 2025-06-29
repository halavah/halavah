@echo off
setlocal EnableDelayedExpansion

:: Navigate to the directory where the script is located
cd /d "%~dp0"

:: Stage all changes first
echo Staging all changes...
git add .
if !errorlevel! neq 0 (
	echo Failed to stage changes.
	pause
	exit /b 1
)

:: Check if there are changes to commit
git diff --staged --quiet
if !errorlevel! equ 0 (
	echo No changes to commit.

	:: If no changes, just pull and exit
	echo Pulling latest changes from origin/master...
	git pull origin master
	pause
	exit /b 0
)

:: Commit changes with timestamped message
set "timestamp=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "timestamp=!timestamp: =0!"
echo Committing changes with timestamp: !timestamp!...
git commit -m "!timestamp!"
if !errorlevel! neq 0 (
	echo Failed to commit changes.
	pause
	exit /b 1
)

:: Pull latest changes from the remote repository
echo Pulling latest changes from origin/master...
git pull origin master
if !errorlevel! neq 0 (
	echo Failed to pull changes. Resolve conflicts if any, and rerun the script.
	pause
	exit /b 1
)

:: Push changes to the repository
echo Pushing changes to origin/master...
git push origin master
if !errorlevel! neq 0 (
	echo Failed to push changes.
	pause
	exit /b 1
)

echo Changes successfully pulled, committed, and pushed.
pause
exit /b 0