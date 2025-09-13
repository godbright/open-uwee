import { Sandbox } from "@vercel/sandbox";
import { SandboxProvider, SandboxInfo, CommandResult } from "../types";
// SandboxProviderConfig available through parent class

export class VercelProvider extends SandboxProvider {
  private existingFiles: Set<string> = new Set();

  async createSandbox(): Promise<SandboxInfo> {
    try {
      // Kill existing sandbox if any
      if (this.sandbox) {
        try {
          await this.sandbox.stop();
        } catch (e) {
          console.error("Failed to stop existing sandbox:", e);
        }
        this.sandbox = null;
      }

      // Clear existing files tracking
      this.existingFiles.clear();

      // Create Vercel sandbox

      const sandboxConfig: any = {
        timeout: 300000, // 5 minutes in ms
        runtime: "node22", // Use node22 runtime for Vercel sandboxes
        ports: [5173], // Vite port
      };

      // Add authentication based on environment variables
      if (
        process.env.VERCEL_TOKEN &&
        process.env.VERCEL_TEAM_ID &&
        process.env.VERCEL_PROJECT_ID
      ) {
        sandboxConfig.teamId = process.env.VERCEL_TEAM_ID;
        sandboxConfig.projectId = process.env.VERCEL_PROJECT_ID;
        sandboxConfig.token = process.env.VERCEL_TOKEN;
      } else if (process.env.VERCEL_OIDC_TOKEN) {
        sandboxConfig.oidcToken = process.env.VERCEL_OIDC_TOKEN;
      }

      this.sandbox = await Sandbox.create(sandboxConfig);

      const sandboxId = this.sandbox.sandboxId;
      // Sandbox created successfully

      // Get the sandbox URL using the correct Vercel Sandbox API
      const sandboxUrl = this.sandbox.domain(5173);

      this.sandboxInfo = {
        sandboxId,
        url: sandboxUrl,
        provider: "vercel",
        createdAt: new Date(),
      };

      return this.sandboxInfo;
    } catch (error) {
      console.error("[VercelProvider] Error creating sandbox:", error);
      throw error;
    }
  }

  async runCommand(command: string): Promise<CommandResult> {
    if (!this.sandbox) {
      throw new Error("No active sandbox");
    }

    try {
      // Parse command into cmd and args (matching PR syntax)
      const parts = command.split(" ");
      const cmd = parts[0];
      const args = parts.slice(1);

      // Vercel uses runCommand with cmd and args object (based on PR)
      const result = await this.sandbox.runCommand({
        cmd: cmd,
        args: args,
        cwd: "/vercel/sandbox",
        env: {},
      });

      // Handle stdout and stderr - they might be functions in Vercel SDK
      let stdout = "";
      let stderr = "";

      try {
        if (typeof result.stdout === "function") {
          stdout = await result.stdout();
        } else {
          stdout = result.stdout || "";
        }
      } catch (e) {
        stdout = "";
      }

      try {
        if (typeof result.stderr === "function") {
          stderr = await result.stderr();
        } else {
          stderr = result.stderr || "";
        }
      } catch (e) {
        stderr = "";
      }

      return {
        stdout: stdout,
        stderr: stderr,
        exitCode: result.exitCode || 0,
        success: result.exitCode === 0,
      };
    } catch (error: any) {
      // Check for sandbox stopped error (410 Gone)
      if (
        error.message?.includes("sandbox_stopped") ||
        error.message?.includes("410") ||
        error.message?.includes("Gone") ||
        error.message?.includes("is no longer available")
      ) {
        console.warn(
          "[VercelProvider] Sandbox has stopped, marking as inactive"
        );
        this.sandbox = null;
        this.sandboxInfo = null;
        throw new Error("Sandbox has stopped and needs to be recreated");
      }

      return {
        stdout: "",
        stderr: error.message || "Command failed",
        exitCode: 1,
        success: false,
      };
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.sandbox) {
      throw new Error("No active sandbox");
    }

    // Vercel sandbox default working directory is /vercel/sandbox
    const fullPath = path.startsWith("/") ? path : `/vercel/sandbox/${path}`;

    // Writing file to sandbox

    // Based on Vercel SDK docs, writeFiles expects path and Buffer content
    try {
      const buffer = Buffer.from(content, "utf-8");
      // Writing file with buffer

      await this.sandbox.writeFiles([
        {
          path: fullPath,
          content: buffer,
        },
      ]);

      this.existingFiles.add(path);
    } catch (writeError: any) {
      // Log detailed error information
      console.error(`[VercelProvider] writeFiles failed for ${fullPath}:`, {
        error: writeError,
        message: writeError?.message,
        response: writeError?.response,
        statusCode: writeError?.response?.status,
        responseData: writeError?.response?.data,
      });

      // Fallback to command-based approach if writeFiles fails
      // Falling back to command-based file write

      // Ensure directory exists
      const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
      if (dir) {
        const mkdirResult = await this.sandbox.runCommand({
          cmd: "mkdir",
          args: ["-p", dir],
        });
        // Directory created
      }

      // Write file using echo and redirection
      const escapedContent = content
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\$/g, "\\$")
        .replace(/`/g, "\\`")
        .replace(/\n/g, "\\n");

      const writeResult = await this.sandbox.runCommand({
        cmd: "sh",
        args: ["-c", `echo "${escapedContent}" > "${fullPath}"`],
      });

      // File written

      if (writeResult.exitCode === 0) {
        this.existingFiles.add(path);
      } else {
        throw new Error(
          `Failed to write file via command: ${writeResult.stderr}`
        );
      }
    }
  }

  async readFile(path: string): Promise<string> {
    if (!this.sandbox) {
      throw new Error("No active sandbox");
    }

    // Vercel sandbox default working directory is /vercel/sandbox
    const fullPath = path.startsWith("/") ? path : `/vercel/sandbox/${path}`;

    const result = await this.sandbox.runCommand({
      cmd: "cat",
      args: [fullPath],
    });

    // Handle stdout and stderr - they might be functions in Vercel SDK
    let stdout = "";
    let stderr = "";

    try {
      if (typeof result.stdout === "function") {
        stdout = await result.stdout();
      } else {
        stdout = result.stdout || "";
      }
    } catch (e) {
      stdout = "";
    }

    try {
      if (typeof result.stderr === "function") {
        stderr = await result.stderr();
      } else {
        stderr = result.stderr || "";
      }
    } catch (e) {
      stderr = "";
    }

    if (result.exitCode !== 0) {
      throw new Error(`Failed to read file: ${stderr}`);
    }

    return stdout;
  }

  async listFiles(directory: string = "/vercel/sandbox"): Promise<string[]> {
    if (!this.sandbox) {
      throw new Error("No active sandbox");
    }

    const result = await this.sandbox.runCommand({
      cmd: "sh",
      args: [
        "-c",
        `find ${directory} -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" -not -path "*/dist/*" -not -path "*/build/*" | sed "s|^${directory}/||"`,
      ],
      cwd: "/",
    });

    // Handle stdout - it might be a function in Vercel SDK
    let stdout = "";

    try {
      if (typeof result.stdout === "function") {
        stdout = await result.stdout();
      } else {
        stdout = result.stdout || "";
      }
    } catch (e) {
      stdout = "";
    }

    if (result.exitCode !== 0) {
      return [];
    }

    return stdout.split("\n").filter((line: string) => line.trim() !== "");
  }

  async installPackages(packages: string[]): Promise<CommandResult> {
    if (!this.sandbox) {
      throw new Error("No active sandbox");
    }

    const flags = process.env.NPM_FLAGS || "";

    // Installing packages

    // Build args array
    const args = ["install"];
    if (flags) {
      args.push(...flags.split(" "));
    }
    args.push(...packages);

    const result = await this.sandbox.runCommand({
      cmd: "npm",
      args: args,
      cwd: "/vercel/sandbox",
    });

    // Handle stdout and stderr - they might be functions in Vercel SDK
    let stdout = "";
    let stderr = "";

    try {
      if (typeof result.stdout === "function") {
        stdout = await result.stdout();
      } else {
        stdout = result.stdout || "";
      }
    } catch (e) {
      stdout = "";
    }

    try {
      if (typeof result.stderr === "function") {
        stderr = await result.stderr();
      } else {
        stderr = result.stderr || "";
      }
    } catch (e) {
      stderr = "";
    }

    // Restart Vite if configured and successful
    if (result.exitCode === 0 && process.env.AUTO_RESTART_VITE === "true") {
      await this.restartViteServer();
    }

    return {
      stdout: stdout,
      stderr: stderr,
      exitCode: result.exitCode || 0,
      success: result.exitCode === 0,
    };
  }

  async setupViteApp(): Promise<void> {
    if (!this.sandbox) {
      throw new Error("No active sandbox");
    }

    // Setting up Vite app for sandbox

    // Create directory structure
    const mkdirResult = await this.sandbox.runCommand({
      cmd: "mkdir",
      args: ["-p", "/vercel/sandbox/src"],
    });
    // Directory structure created

    // Create package.json
    const packageJson = {
      name: "sandbox-app",
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite --host",
        build: "vite build",
        preview: "vite preview",
      },
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
      },
      devDependencies: {
        "@vitejs/plugin-react": "^4.0.0",
        vite: "^4.3.9",
        tailwindcss: "^3.3.0",
        postcss: "^8.4.31",
        autoprefixer: "^10.4.16",
      },
    };

    await this.writeFile("package.json", JSON.stringify(packageJson, null, 2));

    // Create vite.config.js
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: [
      '.vercel.run',  // Allow all Vercel sandbox domains
      '.e2b.dev',     // Allow all E2B sandbox domains
      'localhost'
    ],
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    }
  }
})`;

    await this.writeFile("vite.config.js", viteConfig);

    // Create tailwind.config.js
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

    await this.writeFile("tailwind.config.js", tailwindConfig);

    // Create postcss.config.js
    const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

    await this.writeFile("postcss.config.js", postcssConfig);

    // Create index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sandbox App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

    await this.writeFile("index.html", indexHtml);

    // Create src/main.jsx
    const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

    await this.writeFile("src/main.jsx", mainJsx);

    // Create src/App.jsx
    const appJsx = `function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <p className="text-lg text-gray-400">
          Vercel Sandbox Ready<br/>
          Start building your React app with Vite and Tailwind CSS!
        </p>
      </div>
    </div>
  )
}

export default App`;

    await this.writeFile("src/App.jsx", appJsx);

    // Create src/index.css
    const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: rgb(17 24 39);
}`;

    await this.writeFile("src/index.css", indexCss);

    // Installing npm dependencies

    // Install dependencies
    try {
      const installResult = await this.sandbox.runCommand({
        cmd: "npm",
        args: ["install"],
        cwd: "/vercel/sandbox",
      });

      // npm install completed

      if (installResult.exitCode === 0) {
        // Dependencies installed successfully
      } else {
        console.warn(
          "[VercelProvider] npm install had issues:",
          installResult.stderr
        );
      }
    } catch (error: any) {
      console.error("[VercelProvider] npm install error:", {
        message: error?.message,
        response: error?.response?.status,
        responseText: error?.text,
      });
      // Try alternative approach - run as shell command
      try {
        const altResult = await this.sandbox.runCommand({
          cmd: "sh",
          args: ["-c", "cd /vercel/sandbox && npm install"],
          cwd: "/vercel/sandbox",
        });
        if (altResult.exitCode === 0) {
          // Alternative npm install succeeded
        } else {
          console.warn(
            "[VercelProvider] Alternative npm install also had issues:",
            altResult.stderr
          );
        }
      } catch (altError) {
        console.error(
          "[VercelProvider] Alternative npm install also failed:",
          altError
        );
        console.warn(
          "[VercelProvider] Continuing without npm install - packages may need to be installed manually"
        );
      }
    }

    // Start Vite dev server
    console.log("[VercelProvider] Starting Vite dev server...");

    // Kill any existing Vite processes
    await this.sandbox.runCommand({
      cmd: "sh",
      args: ["-c", "pkill -f vite || true"],
      cwd: "/",
    });

    // Clear any existing logs
    await this.sandbox.runCommand({
      cmd: "sh",
      args: ["-c", "rm -f /tmp/vite.log"],
      cwd: "/vercel/sandbox",
    });

    // Start Vite in background with better logging
    console.log("[VercelProvider] Executing: npm run dev");
    await this.sandbox.runCommand({
      cmd: "sh",
      args: [
        "-c",
        "nohup npm run dev > /tmp/vite.log 2>&1 & echo $! > /tmp/vite.pid",
      ],
      cwd: "/vercel/sandbox",
    });

    console.log(
      "[VercelProvider] Vite server started in background, waiting for startup..."
    );

    // Wait for Vite to be ready with health checks
    const maxWaitTime = 15000; // 15 seconds max wait
    const checkInterval = 1000; // Check every 1 second
    let waitTime = 0;
    let viteReady = false;

    while (waitTime < maxWaitTime && !viteReady) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;

      try {
        // Check if Vite is listening on port 5173
        const portCheck = await this.sandbox.runCommand({
          cmd: "sh",
          args: [
            "-c",
            "netstat -tln | grep :5173 || ss -tln | grep :5173 || lsof -i:5173",
          ],
          cwd: "/vercel/sandbox",
        });

        let stdout = "";
        if (typeof portCheck.stdout === "function") {
          stdout = await portCheck.stdout();
        } else {
          stdout = portCheck.stdout || "";
        }

        if (stdout.trim()) {
          console.log("[VercelProvider] Vite server is listening on port 5173");
          viteReady = true;
          break;
        }

        // Also check Vite logs for startup messages
        const logCheck = await this.sandbox.runCommand({
          cmd: "sh",
          args: [
            "-c",
            "tail -10 /tmp/vite.log 2>/dev/null || echo 'No logs yet'",
          ],
          cwd: "/vercel/sandbox",
        });

        let logOutput = "";
        if (typeof logCheck.stdout === "function") {
          logOutput = await logCheck.stdout();
        } else {
          logOutput = logCheck.stdout || "";
        }

        console.log(
          `[VercelProvider] Vite logs (${waitTime}ms): ${logOutput.trim()}`
        );

        // Check for successful startup messages
        if (
          logOutput.includes("Local:") ||
          logOutput.includes("localhost:5173") ||
          logOutput.includes("ready in")
        ) {
          console.log("[VercelProvider] Vite startup detected in logs");
          viteReady = true;
          break;
        }

        // Check for error messages
        if (
          logOutput.includes("Error:") ||
          logOutput.includes("EADDRINUSE") ||
          logOutput.includes("failed")
        ) {
          console.error(
            "[VercelProvider] Vite startup error detected:",
            logOutput
          );
          break;
        }
      } catch (error) {
        console.warn(
          `[VercelProvider] Health check failed at ${waitTime}ms:`,
          error
        );
      }
    }

    if (!viteReady) {
      console.error(
        "[VercelProvider] Vite server did not start properly within timeout"
      );
      // Get final logs for debugging
      try {
        const finalLogs = await this.sandbox.runCommand({
          cmd: "cat",
          args: ["/tmp/vite.log"],
          cwd: "/vercel/sandbox",
        });

        let logOutput = "";
        if (typeof finalLogs.stdout === "function") {
          logOutput = await finalLogs.stdout();
        } else {
          logOutput = finalLogs.stdout || "";
        }

        console.error("[VercelProvider] Final Vite logs:", logOutput);
      } catch (logError) {
        console.error("[VercelProvider] Could not read Vite logs:", logError);
      }
    } else {
      console.log("[VercelProvider] Vite server is ready!");
    }

    // Final verification using our new method
    const finalCheck = await this.checkVitePort();
    if (!finalCheck) {
      console.warn(
        "[VercelProvider] Final port check failed - Vite may not be fully ready"
      );
    }

    // Track initial files
    this.existingFiles.add("src/App.jsx");
    this.existingFiles.add("src/main.jsx");
    this.existingFiles.add("src/index.css");
    this.existingFiles.add("index.html");
    this.existingFiles.add("package.json");
    this.existingFiles.add("vite.config.js");
    this.existingFiles.add("tailwind.config.js");
    this.existingFiles.add("postcss.config.js");
  }

  async restartViteServer(): Promise<void> {
    if (!this.sandbox) {
      throw new Error("No active sandbox");
    }

    console.log("[VercelProvider] Restarting Vite server...");

    // Kill existing Vite process
    await this.sandbox.runCommand({
      cmd: "sh",
      args: ["-c", "pkill -f vite || true"],
      cwd: "/",
    });

    // Wait a moment for process cleanup
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Start Vite in background with better logging
    await this.sandbox.runCommand({
      cmd: "sh",
      args: [
        "-c",
        "nohup npm run dev > /tmp/vite.log 2>&1 & echo $! > /tmp/vite.pid",
      ],
      cwd: "/vercel/sandbox",
    });

    console.log(
      "[VercelProvider] Vite server restarted, waiting for readiness..."
    );

    // Wait for Vite to be ready with verification
    await this.waitForViteReady();
  }

  /**
   * Wait for Vite server to be ready and listening on port 5173
   */
  private async waitForViteReady(): Promise<boolean> {
    const maxWaitTime = 15000; // 15 seconds max
    const checkInterval = 1000; // Check every 1 second
    let waitTime = 0;

    while (waitTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;

      const isReady = await this.checkVitePort();
      if (isReady) {
        console.log(`[VercelProvider] Vite ready after ${waitTime}ms`);
        return true;
      }

      console.log(`[VercelProvider] Waiting for Vite... ${waitTime}ms`);
    }

    console.error("[VercelProvider] Vite did not become ready within timeout");
    return false;
  }

  /**
   * Check if Vite is listening on port 5173
   */
  async checkVitePort(): Promise<boolean> {
    if (!this.sandbox) {
      return false;
    }

    try {
      // Check if port 5173 is listening
      const portCheck = await this.sandbox.runCommand({
        cmd: "sh",
        args: [
          "-c",
          "netstat -tln 2>/dev/null | grep :5173 || ss -tln 2>/dev/null | grep :5173 || lsof -i:5173 2>/dev/null",
        ],
        cwd: "/vercel/sandbox",
      });

      let stdout = "";
      if (typeof portCheck.stdout === "function") {
        stdout = await portCheck.stdout();
      } else {
        stdout = portCheck.stdout || "";
      }

      const isListening = stdout.trim().length > 0;

      if (isListening) {
        console.log("[VercelProvider] Port 5173 is active:", stdout.trim());
        return true;
      }

      // Also check process list for vite
      const processCheck = await this.sandbox.runCommand({
        cmd: "sh",
        args: ["-c", "ps aux | grep '[v]ite' || ps aux | grep '[n]pm.*dev'"],
        cwd: "/vercel/sandbox",
      });

      let processOutput = "";
      if (typeof processCheck.stdout === "function") {
        processOutput = await processCheck.stdout();
      } else {
        processOutput = processCheck.stdout || "";
      }

      if (processOutput.trim()) {
        console.log(
          "[VercelProvider] Vite process running:",
          processOutput.trim()
        );
        // Process is running, maybe port check failed - give it more time
        return false;
      }

      return false;
    } catch (error) {
      console.warn("[VercelProvider] Port check failed:", error);
      return false;
    }
  }

  getSandboxUrl(): string | null {
    return this.sandboxInfo?.url || null;
  }

  getSandboxInfo(): SandboxInfo | null {
    return this.sandboxInfo;
  }

  async terminate(): Promise<void> {
    if (this.sandbox) {
      try {
        await this.sandbox.stop();
      } catch (e) {
        console.error("Failed to terminate sandbox:", e);
      }
      this.sandbox = null;
      this.sandboxInfo = null;
    }
  }

  isAlive(): boolean {
    return !!this.sandbox && !!this.sandboxInfo;
  }

  /**
   * Check if sandbox is actively responding to commands
   */
  async healthCheck(): Promise<boolean> {
    if (!this.sandbox || !this.sandboxInfo) {
      return false;
    }

    try {
      // Simple health check command
      const result = await this.sandbox.runCommand({
        cmd: "echo",
        args: ["health_check"],
        cwd: "/vercel/sandbox",
      });

      // If we get any response, sandbox is alive
      return result.exitCode === 0;
    } catch (error: any) {
      // Check for sandbox stopped error
      if (
        error.message?.includes("sandbox_stopped") ||
        error.message?.includes("410") ||
        error.message?.includes("Gone") ||
        error.message?.includes("is no longer available")
      ) {
        console.warn(
          "[VercelProvider] Health check failed - sandbox has stopped"
        );
        this.sandbox = null;
        this.sandboxInfo = null;
        return false;
      }

      console.warn("[VercelProvider] Health check failed:", error.message);
      return false;
    }
  }
}
