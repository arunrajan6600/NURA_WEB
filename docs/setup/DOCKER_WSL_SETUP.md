# Docker Desktop WSL 2 Setup Guide

This guide helps you set up Docker Desktop with WSL 2 integration for the NuraWeb Posts feature.

## Quick Fix for "docker-compose not found" Error

### Step 1: Install Docker Desktop on Windows
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop on your Windows machine
3. Start Docker Desktop

### Step 2: Enable WSL 2 Integration
1. Open Docker Desktop
2. Go to **Settings** (gear icon)
3. Navigate to **Resources** → **WSL Integration**
4. Enable "Use the WSL 2 based engine"
5. Turn on integration for your specific WSL distro (Ubuntu, etc.)
6. Click **Apply & Restart**

### Step 3: Restart WSL
After enabling integration, restart your WSL environment:

```bash
# On Windows PowerShell/CMD (run as administrator)
wsl --shutdown

# Then restart your WSL terminal
```

### Step 4: Verify Installation
Open your WSL terminal and check:

```bash
# Check Docker
docker --version

# Check Docker Compose
docker compose version
# OR
docker-compose --version

# Test Docker daemon
docker info
```

## Alternative: Use Docker Compose v2 Syntax

If you have Docker Desktop but `docker-compose` command isn't found, you can use the newer syntax:

```bash
# Instead of: docker-compose up -d
docker compose up -d

# Instead of: docker-compose down
docker compose down
```

The updated setup script now handles both syntaxes automatically.

## Troubleshooting Common Issues

### Issue 1: "Cannot connect to the Docker daemon"
**Solution:**
- Make sure Docker Desktop is running on Windows
- Check WSL integration is enabled
- Restart Docker Desktop and WSL

### Issue 2: "docker: command not found"
**Solution:**
- Install Docker Desktop for Windows
- Enable WSL 2 backend
- Enable integration with your WSL distro

### Issue 3: Permission denied errors
**Solution:**
```bash
# Add your user to docker group (may require WSL restart)
sudo usermod -aG docker $USER

# Then restart WSL:
# wsl --shutdown (in Windows PowerShell)
```

### Issue 4: Slow performance
**Solution:**
- Make sure your project is in the WSL filesystem (/home/username/...)
- Avoid working in /mnt/c/ (Windows filesystem)
- Use WSL 2 (not WSL 1)

## Verification Steps

After setup, verify everything works:

```bash
# Navigate to your project
cd ~/dev/nuraweb

# Test Docker with a simple command
docker run hello-world

# Initialize DynamoDB (if using Posts feature)
cd database
node dynamodb-init.js
```

## Performance Tips for WSL 2 + Docker

1. **Use WSL filesystem**: Keep your project in `/home/username/` not `/mnt/c/`
2. **Allocate enough resources**: In Docker Desktop settings, increase memory/CPU if needed
3. **Use .dockerignore**: Exclude unnecessary files to speed up builds
4. **Enable BuildKit**: Set `DOCKER_BUILDKIT=1` for faster builds

## Still Having Issues?

1. **Check Docker Desktop logs**: Settings → Troubleshoot → View logs
2. **WSL integration logs**: Check WSL tab in Docker Desktop
3. **Restart everything**:
   ```bash
   # Windows PowerShell (as admin)
   wsl --shutdown
   
   # Restart Docker Desktop
   # Then restart your WSL terminal
   ```

4. **Complete reinstall**: Uninstall Docker Desktop, restart Windows, reinstall

## Alternative Setup (Linux-native Docker)

If Docker Desktop continues to cause issues, you can install Docker directly in WSL:

```bash
# Remove any existing Docker
sudo apt remove docker docker-engine docker.io containerd runc

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Start Docker service
sudo service docker start
```

Then you can use Docker entirely within WSL without Docker Desktop.

## Next Steps

Once Docker is working:

1. Initialize DynamoDB for Posts feature: `cd database && node dynamodb-init.js`
2. Follow the Posts System documentation in `docs/features/POSTS_SYSTEM.md`
3. Start developing with the Posts feature!

---

For more detailed information, visit:
- [Docker Desktop WSL 2 backend](https://docs.docker.com/desktop/wsl/)
- [WSL 2 Installation Guide](https://docs.microsoft.com/en-us/windows/wsl/install)
