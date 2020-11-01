declare global {
    interface Object {
        tap<O,T>(this: O, fn: (val: O, ...args: any[]) => T, ...args: any[]): T
    }

    // interface Array {
    //     filterMap<T,U>(this: Array<T>, fn:(item: T, index: number, array: this) => U?): Array<U>
    // }

    // interface Array {
    //     filterSplit<T>(this: Array<T>, fn:(item: T, index: number, array: this) => boolean): [Array<T>, Array<T>]
    // }
}

export type IgnoreThis = string;