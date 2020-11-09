// Do D.js
require("./main.js"); // lazy tap grab
var t1 = "UPDATE I WHERE Damage > 30: {Damage := Damage / 2}";
var t1b = "UPDATE I : {Damage := Damage / 2}";
var t2 = "(C join I join CI){ALL BUT C#, HP, I#}";
var t3 = "((C{C#} JOIN I{I#}) MINUS (CI{C#, I#}) JOIN C{C#, Cname} JOIN I{I#, Iname}) {Cname, Iname} RENAME {Cname AS Character, Iname AS 'Missing Item'}";

const KEYWORDS = ["JOIN", "MINUS", "UNION", "ALL","BUT", "TRUE", "FALSE"
, "RENAME", "AS", "MATCHING", "NOT", "FROM", "TUPLE", "WHERE"
, "SUM", "EXTEND", "COMPOSE", "UPDATE", "KEY", "CALL", "TYPE", "OPERATOR", "WHEN", "THEN", "CASE", "WITH"
, "GROUP", "SUMMARIZE", "BY", "CONSTRAINT", "AND", "OR" ];

// const RELVAR_BINARY_KWS = ["JOIN", "MINUS", "UNION", "MATCHING", "NOT MATCHING", ];
// const RELVAR_UNARY_KWS = ["FROM TUPLE"];

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

const PRECEDENCE = {
    ":=": 1,
    "OR": 2,
    "AND": 3,
    "<":7, ">":7, "<=":7, ">=":7, "==":7, "!=":7,
    "+":10, "-":10,
    "*":20, "/":20, "%":20
    , "AS": 30, "RENAME": 10
    , "JOIN":10, "MINUS": 10, "MATCHING": 10, "NOT MATCHING": 10, "{": 20
};


/**
 * @param {Branch} left
 * @param {Token[]} tokens
 * @param {number} prec -- Precedence
 * @param {number} acc_ind -- Accumulated used indices
 * @returns {[Branch, number]} -- Branch & Indices Used
 */
function doif_binary(left, tokens, prec=0, acc_ind=0){

    const m_op = tokens[0] ?? {type: "None", value: ""}
    , op_name = String(m_op.value).toUpperCase()
    , bin_prec = PRECEDENCE[op_name]
    , is_bin = bin_prec != undefined && !["VAR", "STRING"].includes(m_op.type)
    
    if(is_bin && bin_prec > prec) {
        const use_op = 1;
        const delims = DELIMITED_BINS[op_name];
        const [parse_right, psr_used] = 
            delims == undefined 
                ? op_name == "RENAME" 
                        // We skip over 'RENAME' to delimit on '{', then replenish the lost 'used'
                    ? delimited(tokens.slice(2), ",", "}", parse_expr).tap(([b, used]) => [b, used+1]) 
                    : parse(tokens.slice(1))
                : delimited(tokens.slice(1), ...delims)
                    .tap(([branches, used]) => branches.length == 1 ? [branches[0], used] 
                                                : [{type: "tree", branches}, used]);
        const [right, r_used] = doif_binary(parse_right, tokens.slice(use_op+psr_used), bin_prec)
        
        const binary = op_name == ":=" ? {type: "assign", left, right}
                        : op_name == "{" ? {type: "select", left, right}
                        : {type: "binary", operator: op_name, left, right};
        
        // console.log("Began with: ", tokens.map(v=>v.value).join(" |> "))
        // console.log("Returning with: ", tokens.slice(use_op+psr_used+r_used).map(v=>v.value).join(" |> "))
        return doif_binary(binary, tokens.slice(use_op+psr_used+r_used), prec, acc_ind+use_op+psr_used+r_used);
        
    }
    return [left, acc_ind]; // Moves no tokens
}

const DELIMITED_BINS = {
    "{": [",", "}", parse]
};

/**
 * 
 * @param {Token[]} tokens 
 * @param {string} separator 
 * @param {string} end 
 * @param {(ts: Token[]) => [Branch, number]} parser 
 * @returns {[Branch[], number]}
 */
function delimited(tokens, separator, end, parser) {
    const peek = tokens[0] ?? {type: "NONE"};

    if(peek.value == end) return [{type: "END"}, 1];
    if(peek.value == separator) return [{type: "SKIP"}, 1];
    
    // console.log("About to parse toks: ", tokens.map(v=>v.value).join("|"))
    const [parsed, used] = parser(tokens)
        , [next, n_used] = delimited(tokens.slice(used), separator, end, parser);
    // console.log("next", next);
    
    if(next.type == "SKIP") {
        const [after, more_used] = delimited(tokens.slice(used+n_used), separator, end, parser);
        return [[parsed].concat(after), used+n_used+more_used];
    }else{
        return [[parsed], used+n_used];
    }
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
    if(t.type == "NUMBER" || t.type == "VAR" || t.type == "STRING") {
        return [t, 1];
    }else if(t.type == "PUNC"){
        if(t.value == "(") {
            const [branch, used] = parse_expr(tokens.slice(1));
            return [branch, used+2];
        }
    }else if(t.type == "KW"){
        if(t.value == "UPDATE") {
            const relvar = p;
            const p2 = peek(2);
            const [clause, used] = p2.type == "KW" && p2.value == "WHERE"
                ? parse_expr(tokens.slice(3)) : [{type: "NO_CLAUSE"}, -1]; // -1 handles the lack of 'WHERE'.
            const aft = 3+used;
            const _col = peek(aft); // assert ':'
            const _lbr = peek(aft+1); // assert '{'
            const set_ind = aft+2;
            const [set, s_used] = delimited(tokens.slice(set_ind), ",", "}", parse_expr)
            return [{
                type: "update",
                clause,
                relvar,
                set
            }, set_ind+s_used];
        }
        if(t.value == "ALL") {
            if(p.value == "BUT") {
                const [attrs, used] = delimited(tokens.slice(2), ",", "}", parse);
                // Subtracting 1 from used so that the parent delimiter can complete itself by reusing the '}'.
                return [{type: "all_but", attrs}, 1+used];
            }
        }
    }
    console.error("Unexpected: ", t);
    return [t, 1];
}

function parse_lang(str) {
    const tokens = parse_tokens(Array.from(str).concat([""])); // Needs an EOF or risks infinite
    const run_parse = (tokens, prog=[]) => {
        const [branch, used] = parse_expr(tokens);
        const new_tokens = tokens.slice(used);
        if(new_tokens.length > 0) return run_parse(new_tokens, prog.concat(branch));
        else return prog.concat(branch);
    }
    return run_parse(tokens);
}


module.exports = {parse_tokens, determine, t1, t1b, t2, t3, parse, parse_expr, doif_binary, delimited, parse_lang}