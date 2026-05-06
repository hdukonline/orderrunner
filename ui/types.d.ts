// Mark this file as a module so `declare global` is allowed
export { };

declare global {

    type ConfigureValue = {
        by: 'label' | 'value';
        value: string;
    };

    //
    // Global shared types
    //
    interface RunOptions {
        test: string;
        site?: string;
        browser: "chromium" | "firefox" | "webkit";
        runs: number;
        headless: boolean;
        slow?: boolean;
        saveOrder?: boolean;
        submitOrder?: boolean;
        returnIdoc?: boolean;
        username?: string;
        password?: string;
        url?: string;
        environment?: "dev" | "qa" | "prod";
        reference?: string;
        productCategory?: string;
        configureValues?: Record<string, ConfigureValue>;
        screenshots?: {
            configure: boolean;
            basket: boolean;
            confirmation: boolean;
            unsubmittedOrders: boolean;
        };
    }

    //
    // Global window typings
    //
    interface Window {
        api: {
            runTest: (options: RunOptions) => Promise<string>;
            onTestLog: (callback: (message: string) => void) => void;
            saveEnvironments: (envs: any[]) => Promise<boolean>;
            loadEnvironments: () => Promise<any[]>;
            openFile: (path: string) => Promise<void>;
            clearScreenshots: () => Promise<void>;
            getScreenshotCount: () => Promise<number>;
            getAppVersion: () => Promise<string>
        };
    }
}