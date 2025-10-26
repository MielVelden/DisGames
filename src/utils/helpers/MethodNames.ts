export class MethodNameUtils {
    static removeAsyncSuffix(methodName: string): string {
        return methodName.replace(/Async$/i, '');
    }

    static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static transformMethodName(methodName: string): string {
        return this.capitalize(this.removeAsyncSuffix(methodName));
    }

    static toUrlNamespace(controllerName: string): string {
        return controllerName.toLowerCase();
    }

    static toPathFunction(methodName: string): string {
        return methodName.charAt(0).toLowerCase() + methodName.slice(1);
    }
}
