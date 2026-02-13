import { exec } from 'child_process';
import { promisify } from 'util';
import logger from './logger';

const execAsync = promisify(exec);

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export async function execCommand(
  command: string,
  options?: { cwd?: string; timeout?: number }
): Promise<ExecResult> {
  logger.debug(`Executing: ${command}`, { cwd: options?.cwd });

  try {
    const result = await execAsync(command, {
      cwd: options?.cwd,
      timeout: options?.timeout ?? 300000,
      maxBuffer: 10 * 1024 * 1024
    });
    return result as ExecResult;
  } catch (error: unknown) {
    const err = error as { message?: string; stdout?: string; stderr?: string };
    logger.error('Command failed', {
      command,
      error: err.message,
      stderr: err.stderr?.slice(0, 500)
    });
    throw error;
  }
}
