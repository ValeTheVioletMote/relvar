require("tap-chain").mixin(Object.prototype);
const CLT = require("cli-table3");
const hash = require("object-hash");
const YMLR = require("read-yaml");
const YMLW = require("write-yaml");

// simple type checker: function for every type that simply returns true or false!
// do haskell style implementations of certain functions? comparison, eq, etc.
// should the user be able to write their own JS to define the above? Seems plausible.

/**
 * @template T
 * @typedef {import("./rv_types").RelvarBasic<T>} RelvarBasic<T>
 */
/**
 * @template T
 * @typedef {import("./rv_types").Relvar<T>} Relvar<T>
 */
/**
 * @template T
 * @typedef {import("./rv_types").Tuple<T>} Tuple<T>
 */

/**
 * @typedef {import("./rv_types").DB} DB
 */

var Attributes = {};
var Custom_Attributes = {};

var S = {
    attrs: {
        "S#":  "string",
        "Sname": "string",
        "Status": "number",
        "City": "string"
    }
    , tuples: [
        {"S#": "S1", Sname: "Smith", Status: 20, City: "London"}
        ,{"S#": "S2", Sname: "Jones", Status: 10, City: "Paris"}
        ,{"S#": "S3", Sname: "Blake", Status: 30, City: "Paris"}
        ,{"S#": "S4", Sname: "Clark", Status: 20, City: "London"}
        ,{"S#": "S5", Sname: "Adams", Status: 30, City: "Athens"}
    ]
}.tap(relvar);

var P = {
    attrs: {
        "P#":  "string",
        "Pname": "string",
        "Color": "string",
        "Weight": "number",
        "City": "string" // later, a set?
    }
    , tuples: [
        {"P#": "P1", Pname: "Pmith", Color: "Red", Weight: 12, City: "London"}
        ,{"P#": "P2", Pname: "Jones", Color: "Green", Weight: 17, City: "Paris"}
        ,{"P#": "P3", Pname: "Blake", Color: "Blue", Weight: 17, City: "Rome"}
        ,{"P#": "P4", Pname: "Clark", Color: "Red", Weight: 14, City: "London"}
        ,{"P#": "P5", Pname: "Adams", Color: "Blue", Weight: 12, City: "Paris"}
        ,{"P#": "P5", Pname: "Adams", Color: "Red", Weight: 19, City: "London"}
    ]
}.tap(relvar);

var SP = {
    attrs: {
        "S#":"string",
        "P#":"string",
        "QTY":"number"
    },
    tuples: [
        {"S#": "S1", "P#": "P1", QTY:300},
        {"S#": "S1", "P#": "P2", QTY:200},
        {"S#": "S1", "P#": "P3", QTY:400},
        {"S#": "S1", "P#": "P4", QTY:200},
        {"S#": "S1", "P#": "P5", QTY:100},
        {"S#": "S1", "P#": "P6", QTY:100},
        {"S#": "S2", "P#": "P1", QTY:300},
        {"S#": "S2", "P#": "P2", QTY:400},
        {"S#": "S3", "P#": "P2", QTY:200},
        {"S#": "S4", "P#": "P2", QTY:200},
        {"S#": "S4", "P#": "P4", QTY:300},
        {"S#": "S4", "P#": "P5", QTY:400}
    ]
}.tap(relvar)


// For constraints, perhaps we should allow both D and JS funcs (name the func in an object passed to the DB)

var s_pkey = {type: "primary", relvar:"S", attrs: ["S#"]};
var p_pkey = {type: "primary", relvar:"P", attrs: ["P#"]};

var Keys = [s_pkey, p_pkey]


/**
 * Combines two relvars so long as their attributes match.   
 * No duplicate rows allowed, of course.
 * @template T
 * @param {RelvarBasic<T>} rva -- Relvar A 
 * @param {RelvarBasic<T>} rvb -- Relvar B (OR tuples)?
 * @returns {Relvar<T>}
 */
function union(rva, rvb) {
    // Check for pkey(s) on rva. 
    // If there's no key, all rows are considered unique (hash?)
    // todo: scan for a potential set of keys based off unique keys up until this point? 
    // const keys = todo_check_for_keys ?? rva.
    
    // const uniqs = rva.tuples.map(hash.MD5);
    // perhaps the relation function should be used here, and it removes all uniques by default?
    // return {...rva, tuples: rva.tuples.concat(rvb.tuples.filter(x=>uniqs.includes(hash.MD5(x)) == false))};

    // TODO: return Just or Ei

    // TODO: add check that the two are compatible? We otherwise introduce NULLs.

    return relvar({attrs: rva.attrs, tuples: rva.tuples.concat(rvb.tuples)})
}
/**
 * @template T
 * @param {RelvarBasic<T>} rvb
 * @returns {(rva: RelvarBasic<T>) => Relvar<T>} 
 */
const _un = (rvb) => (rva) => union(rva, rvb);


/**
 * Performs a selection on a relvar.
 * No duplicate rows allowed, of course.
 * @template T,U
 * @param {RelvarBasic<T>} rv -- Relvar
 * @param {Array<T>} attr_list -- List of attributes to select
 * @returns {RelvarBasic<U>}
 */
function selection(rv, ...attr_list) {

    const is_empty = (obj) => {for(var _i in obj) return false; return true;}

    const sel_attrs = (ob) =>
        Object.entries(ob).filter(([k,_v]) => attr_list.includes(k)).tap(Object.fromEntries);


    return relvar({
        attrs: sel_attrs(rv.attrs)
        , tuples: rv.tuples.map(sel_attrs).filter(t => is_empty(t) == false)
    });
}

/**
 * "ALL BUT" Selection.
 * @template T,U
 * @param {RelvarBasic<T>} rv -- Relvar
 * @param {Array<T>} but_list -- List of attributes to exclude
 * @returns {RelvarBasic<U>}
 */
function inv_selection(rv, ...but_list) {
    return selection(rv, ...Object.keys(rv.attrs).filter(a=>but_list.includes(a) == false));
}

/**
 * @template T,U
 * @param {Array<T>} attr_list
 * @returns {(rv: RelVar<T>) => Relvar<U>}
 */
const _sel = (...attr_list) => (rv) => selection(rv, ...attr_list);

/**
 * @template T,U
 * @param {Array<T>} attr_list
 * @returns {(rv: RelVar<T>) => Relvar<U>}
 */
const _but = (...attr_list) => (rv) => inv_selection(rv, ...attr_list);

// console.log("Test of selection: ")
// console.log(S)
// console.log("Select S#")
// console.log(S.tap(_sel("S#")))


/**
 * Combines two relvars so long as their attributes match.
 * @template T,U,V
 * @param {RelvarBasic<T>} rva -- Relvar A 
 * @param {RelvarBasic<U>} rvb -- Relvar B (OR tuples)?
 * @param {Record<V,string>} attrs
 * @param {Array<V>} shared
 * @returns {Relvar<V>}
 */
function join_two(rva, rvb, attrs, shared) {

    // could potentially make more performant by making sure the larger relvar is on the left?
    const tuples = rva.tuples.map(at => 
        rvb.tuples.filter(bt => shared.every(s => at[s] == bt[s])) // TODO: custom equality when we get more complex types
        .map(bt => {
            return {...at, ...bt};
        })
    ).flat(1);

    return relvar({attrs, tuples})

}

/**
 * Performs a Cross Join. Used in tandem with join_two to fulfill the various join cases.
 * @template T,U,V
 * @param {RelvarBasic<T>} rva 
 * @param {RelvarBasic<U>} rvb 
 * @param {Record<V,string>} attrs
 * @returns {Relvar<V>}
 */
function join_cross(rva, rvb, attrs) {
    // TODO: potentially save on computation by forcing rvb to be the rel with the smallest cardinality.
    return relvar({attrs, tuples: rva.tuples.map(a => rvb.tuples.map( b=> {return {...a, ...b}})).flat(1)})
}

/**
 * 
 * @param  {...RelvarBasic<any>} rvs
 * @returns {Relvar<any>} 
 */
function join(rva, rvb, ...rvs) {
    
    /**
     * TODO:
     *  > Allow for 'optimization': i.e.,
     *  S JOIN P JOIN SP is much more efficient if operated S JOIN SP JOIN P, avoiding the cartesian product.
     */

    if(rvb != undefined) {
        const attrs = Object.entries(rva.attrs).concat(Object.entries(rvb.attrs))
                        .reduce( (acc, [a_name,a_type]) => {
                            if(acc[a_name]) {
                                if(acc[a_name] != a_type) {
                                    // TODO convert to FP style (monadic)
                                    throw `Invalid join. Mismatched types: ${a_name}::${acc[a_name]} & ${a_name}::${a_type}`
                                }
                            }else{
                                acc[a_name] = a_type
                            }
                            return acc;
                        }, /** @type{RelvarBasic['attrs']}*/({}));

        // Honestly not sure what I meant by the below comment, but keeping it here in case I do remember.
        // // perhaps the above is unnecessary if we do the checks here lol, may be more FP-friendly as well
        const ak = Object.keys(rva.attrs), bk = Object.keys(rvb.attrs);
        const shared = ak.filter(a => bk.includes(a));

        const joined = shared.length > 0 ? join_two(rva, rvb, attrs, shared)
                                         : join_cross(rva, rvb, attrs);
        
        return join(joined, ...rvs);

    }else if(rvs.length == 0) {
        return relvar(rva);
    }else{
        console.error("rva", rva);
        console.error("rvb", rvb);
        console.error("rvs", rvs);
        throw `IMPOSSIBLE CIRCUMSTANCES FOR JOIN. SEE ABOVE.`;
    }
}



const _j = (...rvs) => (rva) => join(rva, ...rvs);


/**
 * Return tuples of L that match tuples in P, based on common attributes.
 * @template T
 * @param {RelvarBasic<T>} rvl 
 * @param {RelvarBasic<T>} rvr
 * @returns {Relvar<T>} 
 */
function matching(rvl, rvr) {
    const rk = Object.keys(rvr.attrs), shared = Object.keys(rvl.attrs).filter(a => rk.includes(a));
    const tuples = rvl.tuples.filter(tp => rvr.tuples.findIndex(rp => shared.every(s => tp[s] == rp[s])) != -1);  // TODO: custom equality when we get more complex types
    return relvar({attrs: rvl.attrs, tuples});
}

/**
 * Return tuples of L that do not match tuples in P, based on common attributes.
 * @template T
 * @param {RelvarBasic<T>} rvl 
 * @param {RelvarBasic<T>} rvr
 * @returns {RelvarBasic<T>} 
 */
function not_matching(rvl, rvr) {
    const rk = Object.keys(rvr.attrs), shared = Object.keys(rvl.attrs).filter(a => rk.includes(a));

    if(shared.length == 0) { // Can't use shared.every (efficiently), will always be true on a empty
        return relvar(rvl)
    }else{
        const tuples = rvl.tuples.filter(tp => rvr.tuples.findIndex(rp => shared.every(s => tp[s] == rp[s])) == -1);  // TODO: custom equality when we get more complex types
        return relvar({attrs: rvl.attrs, tuples})
    }
}

/**
 * Return tuples of L that match tuples in P, based on common attributes.
 * @template T
 * @param {RelvarBasic<T>} rvr 
 * @returns {(rvl: RelvarBasic<T>) => RelvarBasic<T>} rvl
 */
const _mat = (rvr) => (rvl) => matching(rvl, rvr);
/**
 * Return tuples of L that do not match tuples in P, based on common attributes.
 * @template T
 * @param {RelvarBasic<T>} rvr 
 * @returns {(rvl: RelvarBasic<T>) => RelvarBasic<T>} rvl
 */
const _nmat = (rvr) => (rvl) => not_matching(rvl, rvr);



/**
 * @param {RelvarBasic<*>} rv 
 * @returns {string}
 */
function display_relvar(rv) {
    const hks = Object.keys(rv.attrs);
    const t = new CLT({head: hks.map((k) => k+"::"+rv.attrs[k])});
    t.push(...rv.tuples.map( tup => hks.map(k => tup[k]) ));
    return t.toString();
}

const rvts = display_relvar;
const logrv = (rv) => console.log(display_relvar(rv));

/**
 * Perform basic where clause on relvar
 * @template T
 * @param {RelvarBasic<T>} rv 
 * @param {(a:Tuple<T>) => boolean} filter 
 * @returns {Relvar<T>}
 */
function where(rv, filter) {
    return relvar({attrs: rv.attrs, tuples: rv.tuples.filter(filter)});
}

/**
 * Perform basic where clause on relvar
 * @template T
 * @param {(a:Tuple<T>) => boolean} filter 
 * @returns {(rv: RelvarBasic<T>) => Relvar<T>}
 */
const _where = (filter) => (relvar) => where(relvar, filter);

/**
 * @template T
 * @param {RelvarBasic<T>} rvl 
 * @param {RelvarBasic<T>} rvr
 * @returns {RelvarBasic<T>} 
 */
function minus(rvl, rvr) {
    const hashes = rvr.tuples.map(t => hash.MD5(t));
    return relvar(
        {attrs: rvl.attrs
        , tuples: rvl.tuples.filter(t => hashes.includes(hash.MD5(t)) == false)
    });
}

/**
 * @template T
 * @param {RelvarBasic<T>} rvr 
 * @returns {(rvl: RelvarBasic<T>) => RelvarBasic<T>}
 */
const _minus = (rvr) => (rvl) => minus(rvl, rvr);

/**
 * Rename a relvar's attributes.
 * @template T
 * @param {RelvarBasic<T>} rv 
 * @param {Array<[string,string]>} rnt -- Rename Tuples 
 * @returns {Relvar<T>}
 */
function rename(rv, ...rnt)
{
    const map = Object.fromEntries(rnt);
    const convert = (conv) => Object.entries(conv).map(([k,v]) => [map[k] ?? k, v]).tap(Object.fromEntries);
    return relvar({attrs: convert(rv.attrs), tuples: rv.tuples.map(convert)});
}

/**
 * Rename a relvar's attributes.
 * @template T
 * @param {Array<[string,string]>} rnt -- Rename Tuples 
 * @returns {(rv: RelvarBasic<T>) => Relvar<T>}
 */
const _ren = (...rnt) => (rv) => rename(rv, ...rnt);


// Effectively validates, adds prototypes
/**
 * @template T
 * @param {RelvarBasic<T>} raw -- relvar minus the secret information
 * @returns {Relvar<T>}
 */
function relvar(raw) {
    return  {
        attrs: raw.attrs,
        tuples: raw.tuples
                    .map(t=> {return {t, h: hash.MD5(t)}})
                    .filter(( i, ind, arr) => ind == arr.findIndex(x => x.h == i.h))  // TODO: custom equality when we get more complex types
                    .map(({t}) => t),
        toString: function rvts() { return display_relvar(this)}
    }
}


// // Not entirely sure what to do here. Don't want to use null, but are default values the answer, or is it an empty tuple..?
// // Should the 'first' value be chosen if there's more. Isn't that inconsistent?
// // This may need to be handled in the future custom logic for comparisons, etc.
// /**
//  * In the event of a relation containing a single tuple with a single attribute, get the 'value'.
//  * @template T,U
//  * @param {RelvarBasic<{T}>} rv
//  * @returns {RelvarBasic<T> | U}
//  */
// function rvalue(rv) {
//     if(rv.tuples.length == 1) {
//         const keys = Object.keys(rv.tuples[0]);
//         if(keys.length == 1) {
//             return rv.tuples[0][keys[0]];
//         } 
//     }
//     return rv;
// }

// Oops, we actually do TUPLE from and attr FROM *instead* of the above ^

// But these seem way too easy/dumb:

/**
 * @template T,U
 * @param {RelvarBasic<T>} rv
 * @returns {Tuple<U>}
 */
function tuple_from(rv){
    return rv.tuples[0];
}

function attr_from(tup, attr) {
    return tup[attr];
}


function degree(rv) {
    return Object.keys(rv.attrs).length
}
function cardinality(rv) {
    return rv.tuples.length;
}

/**
 * 
 * @param {string} location 
 * @param {{supplied?: DB['supplied'], name?: string }} options
 * @returns {DB} 
 */
function db(location, {supplied={constraints_js: {}}, name=""}) {

    // Check if DB exists at location. If not, build it (and save it?).

    try {
        var d = YMLR.sync(location);
        d.supplied = supplied;
        return d;
    }catch(err){
        return {
            meta: {
                location,
                name,
                last_hash: ""
            },
            data: {
                relvars: {}
            },
            supplied: {
                constraints_js: {}
            }
        }
    }
}

/**
 * @param {DB} db 
 * @returns {{c: "NOT_SAVED", db: DB} | {c: "SAVED", db: DB} | {c: "ERROR", error: Error, db: DB}}
 */
function save_db(db) {
    const new_hash = hash.MD5(db.data);
    try{
        if(new_hash != db.meta.last_hash) {
            var ndb = {
                meta: db.meta,
                data: db.data
            };
            ndb.meta.last_hash = new_hash;
            YMLW.sync(ndb.meta.location, ndb)
            return {c: "SAVED", db:{...ndb, supplied: db.supplied}};
        }
    }catch(err){
        return {c: "ERROR", err, db};
    }
    return {c: "NOT_SAVED", db};
}

/**
 * Assign a relvar to a DB.
 * @param {DB} db 
 * @param {string} name 
 * @param {[string, RelvarBasic<*>][]} rvs -- VarName and Relvar
 * @returns {{c: "ASSIGNED", db: DB} | {c: "FAILED", db: DB, issue: {c: "CONSTRAINTS_FAILED" | "MISSING_CONSTRAINTS" , constraint_names: string[]}}}
 */
function assign_rv(db, ...rvs) {
    const new_relvars = {...db.data.relvars, ...Object.fromEntries(rvs.map(([k,v]) => [k,{attrs: v.attrs, tuples: v.tuples}]))};
    // console.log("========New RVS========");
    // console.dir(new_relvars, {depth: null});

    // Check Constraints
    const check = check_constraints(new_relvars, db.data.constraints_js ?? [], db?.supplied?.constraints_js ?? {});
    if(check.c == "FAILED") {
        return {c: "FAILED", db, issue: check.issue}
    }
    return {
        c: "ASSIGNED",
        db: {
            meta: db.meta,
            data: {
                relvars: new_relvars,
                constraints_js: db.data.constraints_js ?? []
            },
            supplied: db.supplied
        }
    };
}

/**
 * @template T
 * @param {RelvarBasic<T>[]} relvars 
 * @param {string[]} data_constraints 
 * @param {Record<string, (rvs: Record<string,RelvarBasic<any>>) => boolean>} supplied_constraints 
 * @returns {{c: "SUCCESS"} | {c: "FAILED", issue: {c: "MISSING_CONSTRAINTS" | "CONSTRAINTS_FAILED", constraint_names: string[]}}}
 */
function check_constraints(relvars, data_constraints, supplied_constraints) {
    
    
    // console.log("DBDATA Constraints", data_constraints);
    // console.log("Supplied Constraints", supplied_constraints);
    
    const missing_constraints = data_constraints.filter(t=>supplied_constraints[t] == undefined);

    if(missing_constraints.length > 0) {
        console.error("::CK:: Missing Constraints:", missing_constraints);
        return {c: "FAILED", 
        issue: {c: "MISSING_CONSTRAINTS", constraint_names: missing_constraints}}
    }
    const failed_constraints = 
        data_constraints.filter(c => supplied_constraints[c](relvars) == false)

    if(failed_constraints.length > 0) {
        console.error("::CK:: Failed Constraints:", failed_constraints);
        return {c: "FAILED", 
        issue: {c: "CONSTRAINTS_FAILED", constraint_names: failed_constraints}};
    }
    // console.log("::CK:: Constraint Check Success.");
    return {c: "SUCCESS"};
}

/**
 * 
 * @param {DB} db 
 * @param {[string, (rvs: DB['data']['relvars']) => boolean][]} constraints
 * @returns {{c: "ASSIGNED", db: DB} | {c: "FAILED", db: DB, issue: {c: "CONSTRAINTS_FAILED", constraint_names: string[]}}}
 */
function assign_js_constraint(db, ...constraints) {
    const new_constraints = {...(db?.supplied?.constraints_js ?? {}), ...Object.fromEntries(constraints)};    
    const new_constraint_names = (db.data.constraints_js ?? []).concat(constraints.map(([k,_v]) => k));
    const check = check_constraints(db.data.relvars, new_constraint_names, new_constraints);
    if(check.c == "FAILED") {
        return {c: "FAILED", db, issue: check.issue}
    }

    return {
        c: "ASSIGNED",
        db: {
            meta: db.meta
            ,data: {
                relvars: db.data.relvars,
                constraints_js: new_constraint_names
            }
            ,supplied: {
                constraints_js: new_constraints
            }
        }
    };
}

/**
 * @template T
 * @returns {RelvarBasic<T>}
 */
function rv_true() {
    return {attrs: {}, tuples:[{}]}
}

/**
 * @template T
 * @returns {RelvarBasic<T>}
 */
function rv_false() {
    return {attrs: {}, tuples:[]}
}

/**
 * @template T
 * @param {RelvarBasic<T>} rv 
 */
function is_rv_true(rv) {
    return Object.keys(rv.attrs).length == 0 && rv.tuples.length == 1;
}

/**
 * @template T
 * @param {RelvarBasic<T>} rv 
 */
function is_rv_false(rv) {
    return Object.keys(rv.attrs).length == 0 && rv.tuples.length == 0;
}

/**
 * Returns a relvar by name, or null if nothing.
 * @template T
 * @param {DB} db 
 * @param {string} name 
 * @returns {Relvar<T>}
 */
function get_rv(db, name) {
    return db.data.relvars[name] ?? rv_true();
}

/**
 * Creates a new attribute (or overrides an existing one) off a single relvar.
 * @template T,U
 * @param {RelvarBasic<T>} rv 
 * @param {Array<[string, string, (t: Tuple<T>) => any]>} data_tuples 
 * @param {} expr 
 * @returns {Relvar<U>}
 */
function extend(rv, ...data_tuples){
    const attrs = 
        Object.entries(rv.attrs).concat(data_tuples.map(([k,v,_f]) => [k,v])).tap(Object.fromEntries);
    const tuples = 
        rv.tuples.map(t => Object.entries(t).concat(data_tuples.map(([k,_v,f]) => [k,f(t)])).tap(Object.fromEntries))
    return relvar({attrs, tuples});
}

/**
 * Creates a new attribute (or overrides an existing one) off a single relvar.
 * @template T,U
 * @param {Array<[string, string, (t: Tuple<T>) => any]>} data_tuples 
 * @param {(t: Tuple<T>) => any} expr
 * @returns {(rv: RelvarBasic<T>) => Relvar<U>} 
 */
const _ext = (...data_tuples) => (rv) => extend(rv, ...data_tuples);


function compose(){

}

/**
 * Apply changes to a subset of tuples dependent upon a where filter.
 * @template T
 * @param {RelvarBasic<T>} rv 
 * @param {(t: Tuple<T>) => false} where 
 * @param {Array<[string, ((t: Tuple<T>) => any) | string]>} setters
 * @returns {Relvar<T>}
 */
function update(rv, where, ...setters){
    const _setters = Object.fromEntries(setters);
    return relvar({attrs: rv.attrs,
        tuples: rv.tuples.map(t =>where(t) 
        ? Object.entries(t)
                .map(([k,v]) => [k, typeof _setters[k] == 'function' ? _setters[k](t) : typeof setters[k] != 'undefined' ? setters[k] : v] )
                .tap(Object.fromEntries)
        : t)
    });
}

/**
 * Apply changes to a subset of tuples dependent upon a where filter.
 * @template T
 * @param {(t: Tuple<T>) => false} where 
 * @param {Array<[string, (t: Tuple<T>) => any]>} setters 
 * @returns {(rv: RelvarBasic<T>) => Relvar<T>}
 */
const _up = (where, ...setters) => (rv) => update(rv,where,...setters);

function __includes(rva, rvb, proper=false) {
    // todo: could be optimized
    return count(minus(rvb, rva)) == 0 && (proper == false || count(minus(rva, rvb)) > 0);
}

function includes(rva, rvb) {
    return __includes(rva, rvb, false);
}

function proper_includes(rva, rvb) {
    return __includes(rva, rvb, true);

}

function included_in(rva, rvb){
    return __includes(rvb, rva, false);
}

function proper_included_in(rva,rvb) {
    return __includes(rvb, rva, true);
}

/**
 * @template T
 * @param {RelvarBasic<T>} rv 
 * @param {T | [T]} attr 
 * @param {(i: Tuple<T>[T]) => any | undefined} opt_ext 
 */
function sum(rv, attr, opt_ext) {
    const x = 
        typeof opt_ext == 'function' ? extend(rv, [attr, rv.attrs[attr], opt_ext]) 
            : Array.isArray(attr) && attr.length == 1 // If it's a tuple, we're doing a select to get distincts
                ? selection(rv, attr[0])
                : rv;
    const agat = Array.isArray(attr) ? attr[0] : attr;
    // TODO: add custom 'add' operator and identity property so other types may define one.
    const {add, identity} = {add: (x,y) => x+y, identity: 0};
    return x.tuples.reduce((acc, curr) => add(acc, curr[agat]), identity);
}

/**
 * @template T
 * @param {T | [T]} attr 
 * @param {(i: Tuple<T>[T]) => any | undefined} opt_ext 
 * @returns {(rv: RelvarBasic<T>) => any}
 */
const _sum = (attr, opt_ext) => (rv) => sum(rv, attr, opt_ext);

// file:///A:/Downloads/SQL%20and%20Relational%20Theory%20How%20to%20Write%20Accurate%20SQL%20Code(True%20pdf)by%20C.J.Date(pradyutvam2)[o'reily].pdf

function count(rv, ...opt_sel) {
    return cardinality(opt_sel.length == 0 ? rv : selection(rv, ...opt_sel))
}

const _cnt = (...opt_sel) => (rv) => count(rv, opt_sel);

function image_relation() {

}

// console.log(relvar(S).tap(rvts));

module.exports = {relvar, union, _sel, _un, selection
    , rvts, logrv, S, P, SP, _j, join, inv_selection, _but
    , where, _where, minus, _minus, rename, _ren, matching, _mat, not_matching, _nmat
    , db, save_db, assign_rv, update, _up, extend, _ext, sum, _sum, count, _cnt, assign_js_constraint
    , get_rv, includes, proper_includes, included_in, proper_included_in, rv_true, rv_false, is_rv_true, is_rv_false};

/*

var {relvar, union, _sel, _un, selection
    , rvts, logrv, S, P, SP, _j, join, inv_selection, _but
    , where, _where, minus, _minus, rename, _ren, matching, _mat, not_matching, _nmat
    , db, save_db, assign_rv, update, _up, extend, _ext, sum, _sum, count, _cnt, assign_js_constraint} = require("./main.js");


*/