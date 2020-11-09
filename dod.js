// Do D.js
require("./main.js"); // lazy tap grab
var t1 = "UPDATE I WHERE Damage > 30: {Damage := Damage / 2}";
var t1b = "UPDATE I : {Damage := Damage / 2}";
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

function is_digit(ch) {
    return /[0-9]/i.test(ch);
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
 * @returns {"SPACE" | "DIGIT" | "IDENT" | "OP" | "PUNC" | "STRING" | "EOF" | "UNKNOWN"}
 */
function determine(char="", start=false) {
    return char == ""
            ? "EOF"
        : is_whitespace(char)
            ? "SPACE"
        : is_digit(char)
            ? "DIGIT"
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
        case "DIGIT":
            const next_pos = chars.findIndex((c, ind, arr) => !(determine(c) == "DIGIT" || (c == "." && arr.indexOf(".") == ind))),
                value = Number(chars.slice(0, next_pos).tap(chars_tostr)),
                next = chars.slice(next_pos);
            return [{type: "NUMBER", value}].concat(parse_tokens(next));
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

// Perhaps we should rethink the latter parsing portion in the same as the first, i.e., each 'type' needs
// to be able to identify its own end? We must be overcomplicating this...

// Plausible that we need to handle INDICES FIRST, then collect the data afterward.
// find/identify, then parse.


// Should it be able to fragment itself? If so, how does it know when to, when not to? Siblings vs parents

// the point is perhaps to avoid ending up in a situation where there's an unknown terminus:
// I should be able to predict when variables/numbers are going to be placed,
// as they're used in operations and as the contents of delimiters (as well as expressions)


var PRECEDENCE = {
    ":=": 1,
    "OR": 2,
    "AND": 3,
    "<":7, ">":7, "<=":7, ">=":7, "==":7, "!=":7,
    "+":10, "-":10,
    "*":20, "/":20, "%":20, "JOIN":20
};

/**
 * @param {Branch} left
 * @param {Token[]} tokens
 * @param {number} prec -- Precedence
 * @param {number} add_used -- Accumulated used indices
 * @returns {[[Branch], number]} -- Branch & Indices Used
 */
function doif_binary(left, tokens, prec=0, acc_used=0) {
    console.log("left", left);
    // console.log("prec", prec);
    // console.log("tokens len", tokens.length);
    // console.log("accused", acc_used);
    const peek = (ahead) => tokens[0+ahead] ?? {type: "None", value: ""};
    const t = peek(0);
    console.log("t", t);
    const bin_prec = PRECEDENCE[t.value.toUpperCase()],
          is_bin = (t.type == "KW" || t.type == "OP") && bin_prec != undefined;
    if(is_bin && bin_prec > prec) {
        const [__right, used] = parse(tokens.slice(1))
        console.log("right_used", used);
        const [right, new_acc] = doif_binary(__right, tokens.slice(1+used), bin_prec, 1+used+acc_used);
        console.log('new_used', new_acc);
        const binary = t.value == ":=" ? {type: "assign", left, right}
                    : {type: "binary", operator: t.value, left, right};
        return doif_binary(binary, tokens.slice(new_acc), prec, new_acc);
    }
    console.log("left_acc_used", acc_used);
    return [left,acc_used];
}

/**
 * @param {Token[]} tokens
 * @returns {[Branch, number]} -- Branch & Indices Used
 */
function parse_expr(tokens){
    const [tk_branch, tk_used] = parse(tokens);
    const [branch, used] = doif_binary(tk_branch, tokens.slice(tk_used));
    return [branch, tk_used+used];
}

/**
 * 
 * @param {Token[]} tokens
 * @returns {[Branch, number]} -- Branch & Indices Used
 */
function parse(tokens) {
    const peek = (ahead) => tokens[0+ahead] ?? {type: "None", value: ""};
    const t = peek(0), p = peek(1);
    // console.log("t", t);
    if(t.type == "NUMBER" || t.type == "VAR") {
        return [t, 1];
    }else if(t.type == "PUNC"){
        if(t.value == "(") {
            const [branch, used] = parse(tokens.slice(1));
            return [branch, used+2];
        }

    }else if(t.type == "KW"){
        if(t.value == "UPDATE") {
            const rv = p;
            const p2 = peek(2);
            const [clause, used] = p2.type == "KW" && p2.value == "WHERE"
                ? parse_expr(tokens.slice(3)) : [{type: "NO_CLAUSE"}, -1];
            // console.log("clause", clause);
            // console.log("used", used);
            const aft = 3+used;
            // console.log("aft", aft);
            // console.log("@aft", tokens[aft]);
            const _col = peek(aft); // assert ':'
            const _lbr = peek(aft+1); // assert '{'
            const [set, s_used] = parse_expr(tokens.slice(aft+2)) // TODO delimited
            return [{
                type: "update",
                clause,
                relvar: rv,
                set
            }, aft+2+s_used];
        }
    }
}


module.exports = {parse_tokens, determine, t1, t1b, t2, parse, parse_expr, doif_binary}