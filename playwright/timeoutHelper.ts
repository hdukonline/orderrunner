export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`Test timed out after ${ms}ms`)),
            ms
        );

        promise.then(
            value => {
                clearTimeout(timer);
                resolve(value);
            },
            error => {
                clearTimeout(timer);
                reject(error);
            }
        );
    });
}