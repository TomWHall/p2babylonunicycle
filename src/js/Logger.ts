const Logger = {
    log(...args: any[]): void {
        if (console) {
            console.log(...args);
        }
    }
};

export default Logger;