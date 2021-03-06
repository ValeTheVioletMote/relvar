export type Keyword = "JOIN"| "MINUS"| "UNION"| "ALL"|"BUT"| "TRUE"| "FALSE"
| "RENAME"| "AS"| "MATCHING"| "NOT"| "FROM"| "TUPLE"| "WHERE"
| "SUM"| "EXTEND"| "COMPOSE"| "UPDATE"| "KEY"| "CALL"| "TYPE"| "OPERATOR"| "WHEN"| "THEN"| "CASE"| "WITH"
| "GROUP"| "SUMMARIZE"| "BY"| "CONSTRAINT"| "AND"| "OR" 

export type BinaryOperator = 
    | "JOIN" | "MINUS" | "UNION" | "MATCHING" | "NOT MATCHING" 
    | "+" | "-" | "/" | "*"
    | "AND" | "OR" | "AS"

export type UnaryOperator =
    | "ALL BUT" | "FROM TUPLE"

export type Token = 
    | {value: Keyword, type: "KW"}
    | {value: number, type: "NUMBER"}
    | {value: string, type: "VAR" | "OP" | "PUNC" | "STRING"}

export type Var = 
    {value: string, type: "VAR"}

export type BPrimitive = 
    Var | {value: number, type: "NUMBER"};

export type Branch = 
    | BPrimitive
    | {type: "assign", left: Var, right: Branch}
    | {type: "binary", operator: BinaryOperator, left: Var | Branch, right: Var | Branch}
    | {type: "update", relvar: Var, clause: Branch | {type: "NO_CLAUSE"}, set: Branch}
    | {type: "delete", relvar: Var, clause: Branch}
    | {type: "tree", branches: Branch[]}
    | {type: "all_but", attrs: Var[]}
    | {type: "select", left: Branch, right: Branch}
    // | {type: ""}