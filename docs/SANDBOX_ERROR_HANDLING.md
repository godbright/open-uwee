# Sandbox Error Handling Guide

## Sandbox Stopped Error (HTTP 410 Gone)

### Problem

When you see an error like:

```
response: Response {
  status: 410,
  statusText: 'Gone',
  ...
}
json: {"error":{"code":"sandbox_stopped","message":"Sandbox has stopped execution and is no longer available"}}
```

This means the Vercel sandbox has stopped execution due to:

- **Timeout**: Vercel sandboxes have a maximum lifetime (default: 5 minutes)
- **Resource limits**: Exceeded memory or CPU limits
- **Network issues**: Connection lost to the sandbox
- **Manual termination**: Sandbox was explicitly stopped

### Solutions

#### 1. **Automatic Recreation (Recommended)**

Use the `SandboxCommandExecutor` utility for automatic handling:

```typescript
import { SandboxCommandExecutor } from "@/lib/sandbox/command-executor";

// Automatic recreation if sandbox stops
const result = await SandboxCommandExecutor.executeWithRecreation(
  "npm run dev",
  async () => {
    // Your sandbox recreation logic
    const newSandbox = await createSandbox();
    return !!newSandbox;
  }
);

if (result.success) {
  console.log("Command executed:", result.output);
} else if (result.needsRecreation) {
  console.log("Sandbox needs manual recreation");
} else {
  console.error("Command failed:", result.error);
}
```

#### 2. **Manual Error Handling**

Handle the error in your API calls:

```typescript
try {
  const response = await fetch("/api/run-command-v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command: "your-command" }),
  });

  if (response.status === 410) {
    const data = await response.json();
    if (data.needsRecreation) {
      // Sandbox has stopped, create a new one
      await createNewSandbox();
      // Retry the command
      return retryCommand();
    }
  }

  const data = await response.json();
  // Handle normal response
} catch (error) {
  console.error("Command execution failed:", error);
}
```

#### 3. **Frontend Integration**

In React components, handle sandbox recreation:

```typescript
const [sandboxStatus, setSandboxStatus] = useState("active");

const handleSandboxRecreation = async () => {
  try {
    setSandboxStatus("recreating");
    const newSandbox = await fetch("/api/create-ai-sandbox-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (newSandbox.ok) {
      setSandboxStatus("active");
      return true;
    }

    setSandboxStatus("failed");
    return false;
  } catch (error) {
    setSandboxStatus("failed");
    return false;
  }
};

// Use in your command execution
const executeCommand = async (command: string) => {
  const result = await SandboxCommandExecutor.executeWithRecreation(
    command,
    handleSandboxRecreation
  );

  // Handle result
};
```

### Prevention

#### 1. **Increase Timeout**

Configure longer sandbox timeout in `config/app.config.ts`:

```typescript
export const appConfig = {
  vercelSandbox: {
    timeoutMs: 600000, // 10 minutes instead of 5
    timeoutMinutes: 10,
    // ...
  },
};
```

#### 2. **Health Checks**

Implement periodic health checks:

```typescript
// Check sandbox health every 2 minutes
setInterval(async () => {
  const response = await fetch("/api/sandbox-status");
  const data = await response.json();

  if (!data.active || !data.healthy) {
    console.warn("Sandbox health check failed, may need recreation");
    // Optionally trigger recreation
  }
}, 120000);
```

#### 3. **Graceful Degradation**

Handle sandbox unavailability gracefully:

```typescript
const safeExecuteCommand = async (command: string) => {
  try {
    return await SandboxCommandExecutor.executeCommand(command);
  } catch (error) {
    // Fallback behavior when sandbox is unavailable
    return {
      success: false,
      error: "Sandbox unavailable, please recreate",
      needsRecreation: true,
    };
  }
};
```

### Monitoring

Check sandbox status with:

```bash
curl http://localhost:3000/api/sandbox-status
```

Expected healthy response:

```json
{
  "success": true,
  "active": true,
  "healthy": true,
  "sandboxData": {
    "sandboxId": "sbx_...",
    "url": "https://....vercel.run",
    "lastHealthCheck": "2025-01-11T10:30:00.000Z"
  },
  "message": "Sandbox is active and healthy"
}
```

### Best Practices

1. **Always handle sandbox recreation** in production applications
2. **Implement retry logic** for transient failures
3. **Monitor sandbox health** proactively
4. **Use appropriate timeouts** based on your use case
5. **Gracefully degrade** when sandbox is unavailable
6. **Cache sandbox state** to avoid unnecessary recreation

### Related Files

- `/lib/sandbox/providers/vercel-provider.ts` - Vercel sandbox implementation
- `/lib/sandbox/command-executor.ts` - Command execution utility
- `/app/api/sandbox-status/route.ts` - Sandbox health checking
- `/app/api/run-command-v2/route.ts` - Command execution API
- `/config/app.config.ts` - Sandbox configuration
