import { NextRequest, NextResponse } from "next/server";
import { SandboxProvider } from "@/lib/sandbox/types";
import { sandboxManager } from "@/lib/sandbox/sandbox-manager";

// Get active sandbox provider from global state
declare global {
  var activeSandboxProvider: any;
}

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    if (!command) {
      return NextResponse.json(
        {
          success: false,
          error: "Command is required",
        },
        { status: 400 }
      );
    }

    // Get provider from sandbox manager or global state
    let provider =
      sandboxManager.getActiveProvider() || global.activeSandboxProvider;

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: "No active sandbox. Please create a new sandbox first.",
        },
        { status: 400 }
      );
    }

    console.log(`[run-command-v2] Executing: ${command}`);

    try {
      const result = await provider.runCommand(command);

      return NextResponse.json({
        success: result.success,
        output: result.stdout,
        error: result.stderr,
        exitCode: result.exitCode,
        message: result.success
          ? "Command executed successfully"
          : "Command failed",
      });
    } catch (error: any) {
      // Check if sandbox has stopped and needs recreation
      if (
        error.message?.includes("Sandbox has stopped and needs to be recreated")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Sandbox has stopped. Please create a new sandbox.",
            needsRecreation: true,
            message:
              "The sandbox session has expired or stopped. You need to create a new sandbox to continue.",
          },
          { status: 410 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("[run-command-v2] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
