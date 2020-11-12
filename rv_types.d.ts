
// more for the literal relvars?
export type RelvarBasic<T> = {
    attrs: Record<T,string>,
    tuples: Array<Tuple<T>>
}

export type Tuple<T> = Record<T,any>;

// relvar may have 'name' which is saved..?
export type Relvar<T> = RelvarBasic<T> & {
    toString: () => string
};

export type DB = {
    meta: {
        location: string,
        name: string,
        last_hash: string
    },
    data: {
        relvars: Record<string, RelvarBasic<*>>,
        constraints_js: Array<string> // List of function names to seek.
    },
    supplied: {
        constraints_js: Record<string, (rvs: DB['data']['relvars']) => boolean>
    }
}

export type Constraint = 
    | {t: "UNIQUE", relvar: string, attrs: string[]}
    | {t: "FOREIGN", }