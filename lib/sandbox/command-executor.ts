/**
 * Utility for executing commands in sandbox with automatic recreation handling
 */

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
  needsRecreation?: boolean;
}

export class SandboxCommandExecutor {
  /**
   * Execute a command in the sandbox with automatic error handling
   */
  static async executeCommand(command: string): Promise<CommandResult> {
    try {
      const response = await fetch("/api/run-command-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();

      // Handle sandbox stopped error (410 Gone)
      if (response.status === 410 && data.needsRecreation) {
        return {
          success: false,
          error: data.error,
          needsRecreation: true,
        };
      }

      return {
        success: data.success,
        output: data.output,
        error: data.error,
        exitCode: data.exitCode,
        needsRecreation: false,
      };
    } catch (error) {
      console.error("[SandboxCommandExecutor] Error executing command:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        needsRecreation: false,
      };
    }
  }

  /**
   * Execute a command with automatic sandbox recreation
   * This will automatically recreate the sandbox if it has stopped
   */
  static async executeWithAutoRecreation(
    command: string
  ): Promise<CommandResult> {
    return this.executeWithRecreation(command);
  }

  /**
   * Execute a command with automatic recreation if sandbox has stopped
   */
  static async executeWithRecreation(
    command: string,
    onRecreationNeeded?: () => Promise<boolean>
  ): Promise<CommandResult> {
    const result = await this.executeCommand(command);

    if (result.needsRecreation) {
      console.log("[SandboxCommandExecutor] Sandbox needs recreation");

      if (onRecreationNeeded) {
        console.log("[SandboxCommandExecutor] Attempting custom recreation...");
        const recreated = await onRecreationNeeded();

        if (recreated) {
          console.log(
            "[SandboxCommandExecutor] Sandbox recreated, retrying command..."
          );
          // Retry the command after recreation
          return await this.executeCommand(command);
        } else {
          console.error("[SandboxCommandExecutor] Custom recreation failed");
        }
      } else {
        // Automatic recreation using default endpoint
        console.log(
          "[SandboxCommandExecutor] Attempting automatic recreation..."
        );
        const recreated = await this.autoRecreate();

        if (recreated) {
          console.log(
            "[SandboxCommandExecutor] Sandbox auto-recreated, retrying command..."
          );
          // Retry the command after recreation
          return await this.executeCommand(command);
        } else {
          console.error("[SandboxCommandExecutor] Automatic recreation failed");
        }
      }

      return {
        success: false,
        error: "Failed to recreate sandbox after it stopped",
        needsRecreation: true,
      };
    }

    return result;
  }

  /**
   * Automatically recreate sandbox using the default API
   */
  private static async autoRecreate(): Promise<boolean> {
    try {
      const response = await fetch("/api/create-ai-sandbox-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("[SandboxCommandExecutor] Auto-recreation failed:", error);
      return false;
    }
  }
}
