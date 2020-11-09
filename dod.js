// Do D.js
require("./main.js"); // lazy tap grab
var t1 = "UPDATE I WHERE Damage > 30: {Damage := Damage / 2}";
var t2 = "(C join I join CI){ALL BUT C#, HP, I#}";

const KEYWORDS = ["JOIN", "MINUS", "UNION", "ALL","BUT", "TRUE", "FALSE"
, "RENAME", "AS", "MATCHING", "NOT", "FROM", "TUPLE", "WHERE"
, "SUM", "EXTEND", "COMPOSE", "UPDATE", "KEY", "CALL", "TYPE", "OPERATOR", "WHEN", "THEN", "CASE", "WITH"
, "GROUP", "SUMMARIZE", "BY", "CONSTRAINT", "AND", "OR" ];

const RELVAR_BINARY_KWS = ["JOIN", "MINUS", "UNION", "MATCHING", "NOT MATCHING", ];
const RELVAR_UNARY_KWS = ["FROM TUPLE"];

function is_keyword(x) {
    return KEYWORDS.indexOf(x.toUpperCase()) >= 0;
}

function is_whitespace(ch) {
    return " \t\n".indexOf(ch) >= 0;
}

function is_id_start(ch) {
    return /[a-zA-Z_]/i.test(ch);
}

function is_op_char(ch) {
    return ":+-*/%=&|<>!".indexOf(ch) >= 0;
}

function is_punc(ch) {
    return ",;(){}[]".indexOf(ch) >= 0;
}

function is_id(ch) {
    return is_id_start(ch) || "#-_0123456789".indexOf(ch) >= 0;
}

/**
 * 
 * @param {string} a 
 * @param {string | undefined} b 
 * @param {Array<string>} xs 
 */
function parse_chars(a, b, xs) {

}

/**
 * 
 * @param {string} char
 * @returns {"SPACE" | "IDENT" | "OP" | "PUNC" | "STRING" | "EOF" | "UNKNOWN"}
 */
function determine(char="", start=false) {
    return char == ""
            ? "EOF"
        : is_whitespace(char)
            ? "SPACE"
        : (start && is_id_start(char)) || is_id(char)
            ? "IDENT"
        : is_op_char(char)
            ? "OP"
        : is_punc(char)
            ? "PUNC"
        : char == '"' || char == "'"
            ? "STRING"
        : "UNKNOWN";
}

/**
 * 
 * @param {string[]} chars 
 * @param {number} take 
 */
function chars_take(chars, take=1) {
    if(take < 1) throw `Invalid take amount: ${take}`;
    return chars.reduce((acc, curr, ind) => {if(ind < take) return acc+curr; else return acc;})
}

/**
 * 
 * @param {string[]} chars 
 */
function chars_tostr(chars) {
    return chars.reduce((acc, curr) => acc+curr, "");
}

// var temp = 0;

/**
 * 
 * @typedef {import("./dod_dts").Token} Token 
 * @typedef {import("./dod_dts").Branch} Branch 
 */

/**
 * 
 * @param {string[]} chars
 * @returns {Token[]}
 */
function parse_tokens(chars) {
    const f = determine(chars[0]);
    // console.log(temp++, "--", f, ":", chars[0]);
    // if(temp == 50) return [];
    const read_ahead = () => {
        const next_pos = chars.findIndex(c => determine(c) != f), value = chars.slice(0,next_pos).tap(chars_tostr), next = chars.slice(next_pos);
        return {value, next};
    }

    switch(f) {
        case "UNKNOWN": throw `Unknown character: "${chars[0]}" NEAR "${chars_take(chars, 15)}"`;
        case "SPACE":
            return parse_tokens(chars.slice(chars.findIndex(c => determine(c) != "SPACE")));
        case "IDENT":{
            const {next, value} = read_ahead();
            return [{type: is_keyword(value) ? "KW" : "VAR", value}].concat(parse_tokens(next));}
        case "OP":{
            const {next, value} = read_ahead();
            return [{type: "OP", value}].concat(parse_tokens(next));}
        case "PUNC":
            return [{type: "PUNC", value: chars[0]}].concat(parse_tokens(chars.slice(1)))
        case "STRING":{
            const next_pos = chars.findIndex((c, ind, arr) => ind != 0 && c == arr[0] && (arr[ind-1] ?? "") != "\\"),
                  value = chars.slice(1,next_pos+1).tap(chars_tostr);
            return [{type: "STRING", value}].concat(parse_tokens(chars.slice(next_pos+1)));}
        case "EOF":
            return [];
    }
}


/**
 * 
 * @param {Token[]} tokens 
 * @param {string} stop 
 * @param {string} separator 
 * @param {(t: Token[]) => ReturnType<parse_atom>} parser
 * @returns {ReturnType<parse_atom>}
 */
function parse_delimited(tokens, stop, separator, parser) {

    function delimited(tokens, stop, separator, parser) {
        const t = tokens[0];
        if(t.type == "PUNC"){
            if(t.value == stop) return [];
            if(t.value == separator) return delimited(tokens.slice(1), stop, separator, parser);
        }
        const p = parser(tokens);
        return [p].concat(tokens.slice(p.next_ind));
    }
    const res = delimited(tokens, stop, separator, parser);
    if(res.length > 0) {
        return {branches: res.map(r=>r.branches), next_ind: res.reduce((acc, r) => acc.next_ind+r.next_ind)}
    }else{
        return {branches: [], next_ind: 1};
    }
}

/**
 * 
 * @param {Token[]} tokens
 * @returns {ReturnType<parse_atom>}
 */
function parse_expression(tokens) {
    const atom = parse_atom(tokens);
    const pb = parse_poss_binary(tokens.slice(atom.next_ind), atom.branches, 0)
    return {next_ind: atom.next_ind + pb.next_ind, branches: pb.branches};
}

var PRECEDENCE = {
    ":=": 1,
    "OR": 2,
    "AND": 3,
    "<":7, ">":7, "<=":7, ">=":7, "==":7, "!=":7,
    "+":10, "-":10,
    "*":20, "/":20, "%":20, "JOIN":20
};

/**
 * 
 * @param {Token[]} tokens 
 * @param {Branch[]} left
 * @param {number} prec 
 */
function parse_poss_binary(tokens, left, prec) {

    function _parsepbin(tokens, left, prec) {
        const t = tokens[0];
        const bin_prec = PRECEDENCE[t.value.toUpperCase()],
            is_bin = (t.type == "KW" || t.type == "OP") && bin_prec != undefined;
        if(is_bin && bin_prec > prec) {
            const n_toks = tokens.slice(1)
                , n_atom = parse_atom(n_toks);
            const {branches: right, next_ind} = _parsepbin(n_toks, n_atom, bin_prec);
    
            const branch = t.value == ":="
                ? {type: "assign", left, right}
                : {type: "binary", operator: t.value, left, right};
            
            const toks = n_toks.slice(next_ind);
    
            return _parsepbin()
        }
    }

}

/**
 * 
 * @param {Token[]} tokens
 * @return {{next_ind: number, branches: Branch[]}} 
 */
function parse_atom(tokens){
    const t = tokens[0];    
    const peek = (ahead=1) => tokens[0+ahead] ?? {type: "None", value: ""};
    switch(t.type) {
        case "PUNC": {
            if(t.value == "(") {
                const {branches, next_ind} = parse_expression(tokens.slice(1));
                // todo: affirm next token is a )
                return {branches, next_ind: next_ind+1};
            }else if(t.value == "{") {
                return {};
            }else{
                return {};
            }
        }
        case "KW": {
            switch(t.value) {
                case "UPDATE": {
                    const rv = peek(1), where_or_colon = peek(2);
                    if(rv.type != "VAR") throw `Invalid after UPDATE: ${rv.value}`;

                    const t_clause = where_or_colon.type == "KW" && where_or_colon.value == "WHERE"
                                ? parse_expression(tokens.slice(3))
                                : {next_ind: 3, branches: [{type: "NO_CLAUSE"}]};
                    const colon = peek(t_clause.next_ind);
                    // TODO - have tokens identify their pos as a property?
                    if(colon.type != "OP" || colon.value != ":") throw `Expected colon @ ${tokens.slice(0,t_clause.next_ind).map(t=>t.value).join(" ")}`;
                    const l_brace = peek(t_clause.next_ind+1);
                    if(l_brace.type != "PUNC" || l_brace.value != "{") throw `Expected left brace @ ${tokens.slice(0,t_clause.next_ind+1).map(t=>t.value).join(" ")}`;
                    const sets = parse_delimited(tokens.slice(t_clause.next_ind+2), "}", ",", parse_expression);
                }
            }
        }
    }
}



/**
 * Parse the language!
 * @param {ReturnType<parse_tokens>} tokens 
 * @returns {Array<{} >}
 */
function parse(tokens) {
    const t = tokens[0];
    const peek = (ahead=1) => tokens[0+ahead] ?? {type: "None", value: ""};

    const peek = tokens[1] ?? {type: "None"};
    switch(t.type) {

        case "PUNC":{
            if(t.value == "(") {
                const {branches, next_ind} = parse_expression(tokens);
                return [branches].concat(tokens.slice(next_ind));
            }
            return [];
        }
        case "KW": {
            switch(t.value) {
                case "UPDATE": {
                    const rv = peek(1), where_or_colon = peek(2);
                    if(rv.type != "VAR") throw `Invalid after UPDATE: ${rv.value}`;

                    const clause = where_or_colon.type == "KW" && where_or_colon.value == "WHERE"
                                ? parse(tokens.slice(3))
                                : {type: "NO_CLAUSE"}


                    if(rv) {

                    }else if(where_or_colon.type == "OP" && where_or_colon.value == ":") {

                    }
                }
                default: {
                    return [];
                }
            }
        }
    }
}

module.exports = {parse_tokens, determine, t1, t2}