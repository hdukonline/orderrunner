import { Page } from "playwright-core";
import { RunOptions } from "./runner";


export interface RunResult {
    success: boolean;
    error?: string;
    screenshot?: string;
}


/**
 * Standard interface all tests must implement
 */
export interface TestDefinition {
    name: string;
    site?: string;
    slow?: boolean;
    //run: (page: Page, options: RunOptions) => Promise<void>;
    run: (page: Page, options: RunOptions, onLog?: (msg: string) => void) => Promise<RunResult>;
}