// Do D.js
require("./main.js"); // lazy tap grab
var t1 = "UPDATE I WHERE Damage > 30: {Damage := Damage / 2}";
var t2 = "(C join I join CI){ALL BUT C#, HP, I#}";

const KEYWORDS = ["JOIN", "MINUS", "UNION", "ALL","BUT", "TRUE", "FALSE"
, "RENAME", "AS", "MATCHING", "NOT MATCHING", "FROM", "TUPLE", "WHERE"
, "SUM", "EXTEND", "COMPOSE", "UPDATE", "KEY", "CALL", "TYPE", "OPERATOR", "WHEN", "THEN", "CASE", "WITH"
, "GROUP", "SUMMARIZE", "BY", "CONSTRAINT", "AND", "OR" ];

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
 * @param {string[]} chars
 * @returns {Array<{value: string, type: "KW" | "VAR" | "OP" | "PUNC" | "STRING"}>}
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


function parse_atom(){
    
}

function parse_expr(){

}

/**
 * Parse the language!
 * @param {ReturnType<parse_tokens>} tokens 
 */
function parse(tokens) {
    const {type, value} = tokens[0];
    switch(type) {
        case "KW": {
            switch(value) {

            }
        }
    }
}

module.exports = {parse_tokens, determine, t1, t2}