import { NextResponse } from "next/server";
import { sandboxManager } from "@/lib/sandbox/sandbox-manager";

declare global {
  var activeSandboxProvider: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
}

export async function GET() {
  try {
    // Check sandbox manager first, then fall back to global state
    const provider =
      sandboxManager.getActiveProvider() || global.activeSandboxProvider;
    const sandboxExists = !!provider;

    let sandboxHealthy = false;
    let sandboxInfo = null;

    if (sandboxExists && provider) {
      try {
        // Check if sandbox is healthy by performing an actual health check
        const providerInfo = provider.getSandboxInfo();

        // Use health check if available, otherwise fall back to basic check
        if (typeof provider.healthCheck === "function") {
          sandboxHealthy = await provider.healthCheck();
        } else {
          sandboxHealthy = !!providerInfo && provider.isAlive();
        }

        sandboxInfo = {
          sandboxId: providerInfo?.sandboxId || global.sandboxData?.sandboxId,
          url: providerInfo?.url || global.sandboxData?.url,
          filesTracked: global.existingFiles
            ? Array.from(global.existingFiles)
            : [],
          lastHealthCheck: new Date().toISOString(),
        };
      } catch (error) {
        console.error("[sandbox-status] Health check failed:", error);
        sandboxHealthy = false;

        // If health check failed due to sandbox being stopped, clear the provider
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (
          errorMessage?.includes("sandbox_stopped") ||
          errorMessage?.includes("410") ||
          errorMessage?.includes("Gone")
        ) {
          global.activeSandboxProvider = null;
          global.sandboxData = null;
        }
      }
    }

    return NextResponse.json({
      success: true,
      active: sandboxExists && sandboxHealthy,
      healthy: sandboxHealthy,
      sandboxData: sandboxInfo,
      message: sandboxHealthy
        ? "Sandbox is active and healthy"
        : sandboxExists
        ? "Sandbox exists but is not responding - may need recreation"
        : "No active sandbox",
    });
  } catch (error) {
    console.error("[sandbox-status] Error:", error);
    return NextResponse.json(
      {
        success: false,
        active: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
