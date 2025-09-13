import { NextResponse } from "next/server";
import { sandboxManager } from "@/lib/sandbox/sandbox-manager";

declare global {
  var activeSandboxProvider: any;
}

export async function GET() {
  try {
    const provider =
      sandboxManager.getActiveProvider() || global.activeSandboxProvider;

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: "No active sandbox provider",
        },
        { status: 400 }
      );
    }

    // Check if provider has the checkVitePort method (Vercel provider)
    if (typeof provider.checkVitePort === "function") {
      const viteStatus = await provider.checkVitePort();

      // Get Vite logs if available
      let viteLogs = "";
      try {
        const result = await provider.runCommand("cat /tmp/vite.log");
        viteLogs = result.stdout || "No logs available";
      } catch (error) {
        viteLogs = `Error reading logs: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }

      // Get process status
      let processStatus = "";
      try {
        const result = await provider.runCommand(
          'ps aux | grep -E "(vite|npm.*dev)" | grep -v grep'
        );
        processStatus = result.stdout || "No Vite processes found";
      } catch (error) {
        processStatus = `Error checking processes: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }

      // Get port status
      let portStatus = "";
      try {
        const result = await provider.runCommand(
          'netstat -tln | grep :5173 || ss -tln | grep :5173 || echo "Port 5173 not listening"'
        );
        portStatus = result.stdout || "Port check failed";
      } catch (error) {
        portStatus = `Error checking port: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }

      return NextResponse.json({
        success: true,
        viteReady: viteStatus,
        viteLogs: viteLogs.split("\n").slice(-20).join("\n"), // Last 20 lines
        processStatus,
        portStatus,
        sandboxInfo: provider.getSandboxInfo(),
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Provider does not support Vite status checking",
      });
    }
  } catch (error) {
    console.error("[check-vite-status] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
