require("tap-chain").mixin(Object.prototype);
const CLT = require("cli-table3");
const hash = require("object-hash");

// simple type checker: function for every type that simply returns true or false!
// do haskell style implementations of certain functions? comparison, eq, etc.

/**
 * @template T
 * @typedef {import("./rv_types").RelvarBasic<T>} RelvarBasic<T>
 */
/**
 * @template T
 * @typedef {import("./rv_types").Relvar<T>} Relvar<T>
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
function selection(rv, attr_list) {

    const sel_attrs = (ob) =>
        Object.entries(ob).filter(([k,_v]) => attr_list.includes(k)).tap(Object.fromEntries);


    return {
        ...rv
        , attrs: sel_attrs(rv.attrs)
        , tuples: rv.tuples.map(sel_attrs)
    }
}

/**
 * "ALL BUT" Selection.
 * @template T,U
 * @param {RelvarBasic<T>} rv -- Relvar
 * @param {Array<T>} but_list -- List of attributes to exclude
 * @returns {RelvarBasic<U>}
 */
function inv_selection(rv, but_list) {
    return selection(rv, Object.keys(rv.attrs).filter(a=>but_list.includes(a) == false));
}

/**
 * @template T,U
 * @param {Array<T>} attr_list
 * @returns {(rv: RelVar<T>) => Relvar<U>}
 */
const _sel = (attr_list) => (rv) => selection(rv, attr_list);

/**
 * @template T,U
 * @param {Array<T>} attr_list
 * @returns {(rv: RelVar<T>) => Relvar<U>}
 */
const _but = (attr_list) => (rv) => inv_selection(rv, attr_list);

// console.log("Test of selection: ")
// console.log(S)
// console.log("Select S#")
// console.log(S.tap(_sel("S#")))


/**
 * Combines two relvars so long as their attributes match.
 * @param {RelvarBasic<T>} rva -- Relvar A 
 * @param {RelvarBasic<T>} rvb -- Relvar B (OR tuples)?
 */
function join(rva, rvb) {
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
    // const tuples = rva.tuples.map()

    // perhaps the above is unnecessary if we do the checks here lol, may be more FP-friendly as well
    const ak = Object.keys(rva.attrs), bk = Object.keys(rvb.attrs);
    const shared = ak.filter(a => bk.includes(a));

    // could potentially make more performant by making sure the larger relvar is on the left?
    const tuples = rva.tuples.map(at => 
        rvb.tuples.filter(bt => shared.every(s => at[s] == bt[s]))
        .map(bt => {
            return {...at, ...bt};
        })
    ).flat(1);

    return relvar({attrs, tuples})

}
const _j = (rvb) => (rva) => join(rva, rvb);


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
 * @param {(a:T) => boolean} filter 
 * @returns {Relvar<T>}
 */
function where(rv, filter) {
    return relvar({attrs: rv.attrs, tuples: rv.tuples.filter(filter)});
}

/**
 * Perform basic where clause on relvar
 * @template T
 * @param {(a:T) => boolean} filter 
 * @returns {(rv: RelvarBasic<T>) => Relvar<T>}
 */
const _where = (filter) => (relvar) => where(relvar, filter);


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
                    .filter(( i, ind, arr) => ind == arr.findIndex(x => x.h == i.h))
                    .map(({t}) => t),
        toString: function rvts() { return display_relvar(this)}
    }
}

// console.log(relvar(S).tap(rvts));

module.exports = {relvar, union, _sel, _un, selection, rvts, logrv, S, P, SP, _j, join, inv_selection, _but, where, _where};