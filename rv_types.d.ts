
// more for the literal relvars?
export type RelvarBasic<T> = {
    attrs: Record<T,string>,
    tuples: Array<Record<T,any>>
}

// relvar may have 'name' which is saved..?
export type Relvar<T> = RelvarBasic<T> & {
    toString: () => string
};