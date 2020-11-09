const {parse_lang} = require("./dod.js");
const cons_json = (ob) => console.dir(ob, {depth: null, colors: true});
const {join, relvar, minus, union, rename, selection, inv_selection} = require("./main.js");


/**
 * 
 * @param {import("./dod_dts").Branch} branch 
 */
function resolve_primitive(branch) {
    switch(branch.type) {
        case "NUMBER": return branch.value;
        case "VAR": return branch.value;
    }
    console.error("Not a primitive: ");
    cons_json(ob);
    throw `Not a primitive.`;
}

/**
 * 
 * @param {import("./dod_dts").Branch} branch 
 */
function is_primitive(branch){
    return ["VAR", "NUMBER"].includes(branch.type);
}

/**
 * 
 * @param {import("./dod_dts").Branch} branch 
 */
function is_relvar(branch, relvars){
    return branch.type == "VAR" && relvars[branch.value] != undefined;
}

/**
 * 
 * @param {import("./dod_dts").Branch} branch 
 * @param {import("./rv_types").DB['data']['relvars']} relvars 
 */
function resolve_relvar(branch, relvars) {
    const rv = relvars[branch.value];
    if(rv == undefined) throw `Cannot find relvar: ${branch.value}`;
    return rv;
}

/**
 * 
 * @param {import("./dod_dts").Branch} branch 
 * @param {import("./rv_types").DB['data']['relvars']} relvars 
 */
function parse_branch(branch, relvars){
    const resolve_or_relvar = (br) => is_relvar(br, relvars) ? resolve_relvar(br, relvars) : parse_branch(br, relvars);
    switch(branch.type) {
        case "assign": {return;}
        case "binary": {
            switch(branch.operator) {
                case "JOIN": {
                    return join(resolve_or_relvar(branch.left), resolve_or_relvar(branch.right));
                }
                case "MINUS": {
                    return minus(resolve_or_relvar(branch.left), resolve_or_relvar(branch.right));
                }
                case "UNION": {
                    return union(resolve_or_relvar(branch.left), resolve_or_relvar(branch.right));
                }
                case "RENAME": {
                    return rename(resolve_or_relvar(branch.left), ...branch.right.map( (b) => [b.left.value, b.right.value]))
                }
            }
        }
        case "select": {
            if(branch.right.type == "tree") {
                return selection(resolve_or_relvar(branch.left),  ...branch.right.branches.map(v=>v.value));
            }else if(branch.right.type == "VAR"){
                return selection(resolve_or_relvar(branch.left),  branch.right.value);
            }else if(branch.right.type == "all_but") {
                const rv = resolve_or_relvar(branch.left);
                const butt = branch.right.attrs.map(v=>v.value);
                return inv_selection(rv, ...butt)
            }
        }
    }
}

/**
 * @param {ReturnType<parse_lang>} tree
 * @param {import("./rv_types").DB['data']['relvars']} relvars
 */
function parse_tree(tree, relvars){
    return parse_branch(tree[0], relvars);
}



/**
 * Runs a command on a given DB.
 * @param {import("./rv_types").DB} DB 
 * @param {string} CMD 
 */
function db_run_cmd(DB, CMD) {
    const tree = parse_lang(CMD);
    return parse_tree(tree, DB.data.relvars)
}


module.exports = {run: db_run_cmd}