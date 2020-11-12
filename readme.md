# relvar.js
An amateur database inspired by CJ Date and Project M36.

Documentation will be sparse as I'm focused more on the development, but here's a demo that should give you the idea of what I'm gunning to do:

```js
var {relvar, union, _sel, _un, selection
    , rvts, logrv, S, P, SP, _j, join, inv_selection, _but
    , where, _where, minus, _minus, rename, _ren, matching, _mat, not_matching, _nmat
    , db, save_db, assign_rv, update, _up, extend, _ext, count, _cnt, sum, _sum, assign_js_constraint} = require("../main.js");

const _arv = (...rvs) => (db) => assign_rv(db, ...rvs).db;

var GameDB = db(require("path").join(__dirname, "test.yaml"), {name: "GameDB"});
var {db: GameDB} = save_db(GameDB);

var C = relvar({
    attrs: {
        "C#": "number",
        "Cname": "string",
        "HP": "number"
    },
    tuples: [
        {"C#": 1, "Cname": "Reese of Wellington", "HP": 4}
        ,{"C#": 2, "Cname": "Sir Nic of the Weils", "HP": 18}
    ]
});

var I = relvar({
    attrs: {
        "I#": "number",
        "Iname": "string",
        "Durability": "number",
        "Damage": "number"
    },
    tuples: [
        {"I#": 1, "Iname": "Bronze Poniard", "Durability": 10, "Damage": 10}
        ,{"I#": 2, "Iname": "Glazed Donut", "Durability": 1, "Damage": 1}
        ,{"I#": 3, "Iname": "Venom-Soaked Blade", "Durability": 5, "Damage": 25}
        ,{"I#": 4, "Iname": "Ancient Spoon", "Durability": 1, "Damage": 80}
        ,{"I#": 5, "Iname": "Holy Hand Grenade of Antioch", "Durability": 1, "Damage": 999}
        ,{"I#": 6, "Iname": "Common Shortsword", "Durability": 30, "Damage": 15}
        ,{"I#": 7, "Iname": "Rot-Hilted Axe", "Durability": 8, "Damage": 15}
    ]
});

var CI = relvar({
    attrs: {
        "C#": "number",
        "I#": "number",
        "Slot": "number"
    },
    tuples: [
        {"C#": 1, "I#": 1, "Slot": 3},
        {"C#": 1, "I#": 3, "Slot": 4},
        {"C#": 2, "I#": 2, "Slot": 4},
        {"C#": 2, "I#": 4, "Slot": 3},
        {"C#": 2, "I#": 1, "Slot": 10},
    ]
});

var {db: GameDB} = GameDB.tap(_arv(["C", C], ["I", I], ["CI", CI])).tap(save_db);

var {run} = require("../db_lang.js");

console.log("C:")
logrv(C);

console.log("C join CI:")
join(C, CI).tap(logrv);

console.log("C{C#, Cname} join CI")
selection(C, "C#", "Cname").tap(_j(CI)).tap(logrv);

console.log("C join CI join I");
join(C, CI).tap(_j(I)).tap(logrv);

console.log("(C join CI join I){ALL BUT C#, HP, I#}");
join(C, CI).tap(_j(I)).tap(_but("C#", "HP", "I#")).tap(logrv);

console.log("Variant to test/display commutative properties of join:")
console.log("(C join I join CI){ALL BUT C#, HP, I#}");
join(C, I, CI).tap(_but("C#", "HP", "I#")).tap(logrv);

console.log("Give me all items that are owned by no character:")
console.log("I NOT MATCHING CI");
not_matching(I, CI).tap(logrv);

console.log("All characters with an item that deals more than 30 damage:")
console.log("C MATCHING (CI JOIN (I WHERE {Damage > 30}))")
matching(C, join(CI, where(I, i=>i.Damage > 30))).tap(logrv)

console.log("Just their names:")
console.log("(C MATCHING (CI JOIN (I WHERE {Damage > 30}))){Cname}")
matching(C, join(CI, where(I, i=>i.Damage > 30))).tap(_sel("Cname")).tap(logrv)

where(I, i=>i.Damage > 30)
.tap(_j(CI))
.tap(cii => matching(C, cii))
.tap(_sel("Cname"))
.tap(logrv);

console.log("Characters and the items they DON'T have: ")
console.log("((C{C#} JOIN I{I#}) MINUS (CI{C#, I#}) JOIN C{C#, Cname} JOIN I{I#, Iname}) {Cname, Iname} RENAME {Cname AS Character, Iname AS Missing Item}")
join(selection(C, "C#"), selection(I, "I#"))
.tap(_minus( selection(CI, "C#", "I#") ))
.tap(_j( selection(C, "C#", "Cname"),  selection(I, "I#", "Iname") ))
.tap(_sel("Cname", "Iname"))
.tap(_ren(["Cname", "Character"], ["Iname", "Missing Item"]))
.tap(logrv);

console.log("Fix overpowered items: ")
console.log("UPDATE I WHERE Damage > 30: {Damage := Damage / 2}")
update(I, i=>i.Damage > 30, ["Damage", i => Math.floor(i.Damage/2)])
.tap(logrv);

console.log("Show Damage Per Durability (DPD): ")
console.log("EXTEND I: {DPD := Damage / Durability}");
extend(I, ["DPD", "number", i=>Math.round(i.Damage/i.Durability)])
.tap(logrv);


console.log("Count of all character-item combos:\n\tCOUNT ( CI ) =", count(CI));
console.log("Count of all distinct slots in character-item combos:\n\tCOUNT ( CI { Slot } ) :", count(CI, "Slot"));
console.log("Sum of all item damage:\n\tSUM (I, Damage) =", sum(I, "Damage"));
console.log("Sum of all distinct item damage values:\n\tSUM (I, { Damage }) =", sum(I, ["Damage"]));
console.log("Sum of tripled item damage:\n\tSUM (I, 3 * Damage) = ", sum(I, "Damage", i=>i.Damage*3) )
console.log("Sum of all distinct tripled item damage:\n\tSUM( EXTEND I : { Damage := Damage * 3 }, {Damage}) = ", sum(extend(I, ["Damage", "number", i=>i.Damage*3]) , ["Damage"]))

console.log("My D implementation is behind on most features, but the plumbing exists: ");
console.log("(C join CI join I){ALL BUT C#, HP, I#}");
run(GameDB, "(C join I join CI){ALL BUT C#, HP, I#}").tap(logrv);

// With D, I hope to be able to allow constraints to be written in it
// as a simple solution rather than needing the prefab or custom JS.


// Add a uniqueness constraint to I.

const uniq_i = (rvs) => count(rvs.I) == count(rvs.I, "I#");
var {db: GameDB} = assign_js_constraint(GameDB, ["UNIQ_I", uniq_i]);

console.log("Attempt to violate the constraint:");
const new_i = union(I, {tuples: [{"I#": 7, "Iname": "Floppy Disk", "Durability": 40, "Damage": 3}] });
const attempt_assign = assign_rv(GameDB, ["I", new_i]);
console.dir(attempt_assign.c == "FAILED" ? attempt_assign.issue : "Oops. This shouldn't happen.");

console.log("Concede, follow the constraint:");
const new_i_2 = union(I, {tuples: [{"I#": 8, "Iname": "Floppy Disk", "Durability": 40, "Damage": 3}] });
const this_should_work = assign_rv(GameDB, ["I", new_i_2]);
logrv(this_should_work.db.data.relvars["I"]);

// Initialize an existing DB with supplied constraints: 

var my_constraints = {
    "UNIQ_I": uniq_i
};

var newGame = db(require("path").join(__dirname, "test2.yaml")
            , {name: "NewGame", supplied: {constraints_js: my_constraints}});

    // I don't recommend you do this normally.
    // This is just to ensure that the fresh file has the constraint and data.
    // Your usual DB will already have the constraint in its data.
    // if you've already built test2.yaml, you could comment these three lines out, and it'll still work.
    newGame.data.relvars = GameDB.data.relvars;
    newGame.data.constraints_js = ["UNIQ_I"];
    save_db(newGame);

console.log("Attempt to violate again on new DB:");
const attempt_assign_2 = assign_rv(newGame, ["I", new_i]);
console.dir(attempt_assign_2.c == "FAILED" ? attempt_assign_2.issue : "Oops. This shouldn't happen.");
```

Output:

```
C:
┌────────────┬──────────────────────┬────────────┐
│ C#::number │ Cname::string        │ HP::number │
├────────────┼──────────────────────┼────────────┤
│ 1          │ Reese of Wellington  │ 4          │
├────────────┼──────────────────────┼────────────┤
│ 2          │ Sir Nic of the Weils │ 18         │
└────────────┴──────────────────────┴────────────┘
C join CI:
┌────────────┬──────────────────────┬────────────┬────────────┬──────────────┐
│ C#::number │ Cname::string        │ HP::number │ I#::number │ Slot::number │
├────────────┼──────────────────────┼────────────┼────────────┼──────────────┤
│ 1          │ Reese of Wellington  │ 4          │ 1          │ 3            │
├────────────┼──────────────────────┼────────────┼────────────┼──────────────┤
│ 1          │ Reese of Wellington  │ 4          │ 3          │ 4            │
├────────────┼──────────────────────┼────────────┼────────────┼──────────────┤
│ 2          │ Sir Nic of the Weils │ 18         │ 2          │ 4            │
├────────────┼──────────────────────┼────────────┼────────────┼──────────────┤
│ 2          │ Sir Nic of the Weils │ 18         │ 4          │ 3            │
├────────────┼──────────────────────┼────────────┼────────────┼──────────────┤
│ 2          │ Sir Nic of the Weils │ 18         │ 1          │ 10           │
└────────────┴──────────────────────┴────────────┴────────────┴──────────────┘
C{C#, Cname} join CI
┌────────────┬──────────────────────┬────────────┬──────────────┐
│ C#::number │ Cname::string        │ I#::number │ Slot::number │
├────────────┼──────────────────────┼────────────┼──────────────┤
│ 1          │ Reese of Wellington  │ 1          │ 3            │
├────────────┼──────────────────────┼────────────┼──────────────┤
│ 1          │ Reese of Wellington  │ 3          │ 4            │
├────────────┼──────────────────────┼────────────┼──────────────┤
│ 2          │ Sir Nic of the Weils │ 2          │ 4            │
├────────────┼──────────────────────┼────────────┼──────────────┤
│ 2          │ Sir Nic of the Weils │ 4          │ 3            │
├────────────┼──────────────────────┼────────────┼──────────────┤
│ 2          │ Sir Nic of the Weils │ 1          │ 10           │
└────────────┴──────────────────────┴────────────┴──────────────┘
C join CI join I
┌────────────┬──────────────────────┬────────────┬────────────┬──────────────┬────────────────────┬────────────────────┬────────────────┐
│ C#::number │ Cname::string        │ HP::number │ I#::number │ Slot::number │ Iname::string      │ Durability::number │ Damage::number │
├────────────┼──────────────────────┼────────────┼────────────┼──────────────┼────────────────────┼────────────────────┼────────────────┤
│ 1          │ Reese of Wellington  │ 4          │ 1          │ 3            │ Bronze Poniard     │ 10                 │ 10             │
├────────────┼──────────────────────┼────────────┼────────────┼──────────────┼────────────────────┼────────────────────┼────────────────┤
│ 1          │ Reese of Wellington  │ 4          │ 3          │ 4            │ Venom-Soaked Blade │ 5                  │ 25             │
├────────────┼──────────────────────┼────────────┼────────────┼──────────────┼────────────────────┼────────────────────┼────────────────┤
│ 2          │ Sir Nic of the Weils │ 18         │ 2          │ 4            │ Glazed Donut       │ 1                  │ 1              │
├────────────┼──────────────────────┼────────────┼────────────┼──────────────┼────────────────────┼────────────────────┼────────────────┤
│ 2          │ Sir Nic of the Weils │ 18         │ 4          │ 3            │ Ancient Spoon      │ 1                  │ 80             │
├────────────┼──────────────────────┼────────────┼────────────┼──────────────┼────────────────────┼────────────────────┼────────────────┤
│ 2          │ Sir Nic of the Weils │ 18         │ 1          │ 10           │ Bronze Poniard     │ 10                 │ 10             │
└────────────┴──────────────────────┴────────────┴────────────┴──────────────┴────────────────────┴────────────────────┴────────────────┘
(C join CI join I){ALL BUT C#, HP, I#}
┌──────────────────────┬──────────────┬────────────────────┬────────────────────┬────────────────┐
│ Cname::string        │ Slot::number │ Iname::string      │ Durability::number │ Damage::number │
├──────────────────────┼──────────────┼────────────────────┼────────────────────┼────────────────┤
│ Reese of Wellington  │ 3            │ Bronze Poniard     │ 10                 │ 10             │
├──────────────────────┼──────────────┼────────────────────┼────────────────────┼────────────────┤
│ Reese of Wellington  │ 4            │ Venom-Soaked Blade │ 5                  │ 25             │
├──────────────────────┼──────────────┼────────────────────┼────────────────────┼────────────────┤
│ Sir Nic of the Weils │ 4            │ Glazed Donut       │ 1                  │ 1              │
├──────────────────────┼──────────────┼────────────────────┼────────────────────┼────────────────┤
│ Sir Nic of the Weils │ 3            │ Ancient Spoon      │ 1                  │ 80             │
├──────────────────────┼──────────────┼────────────────────┼────────────────────┼────────────────┤
│ Sir Nic of the Weils │ 10           │ Bronze Poniard     │ 10                 │ 10             │
└──────────────────────┴──────────────┴────────────────────┴────────────────────┴────────────────┘
Variant to test/display commutative properties of join:
(C join I join CI){ALL BUT C#, HP, I#}
┌──────────────────────┬────────────────────┬────────────────────┬────────────────┬──────────────┐
│ Cname::string        │ Iname::string      │ Durability::number │ Damage::number │ Slot::number │
├──────────────────────┼────────────────────┼────────────────────┼────────────────┼──────────────┤
│ Reese of Wellington  │ Bronze Poniard     │ 10                 │ 10             │ 3            │
├──────────────────────┼────────────────────┼────────────────────┼────────────────┼──────────────┤
│ Reese of Wellington  │ Venom-Soaked Blade │ 5                  │ 25             │ 4            │
├──────────────────────┼────────────────────┼────────────────────┼────────────────┼──────────────┤
│ Sir Nic of the Weils │ Bronze Poniard     │ 10                 │ 10             │ 10           │
├──────────────────────┼────────────────────┼────────────────────┼────────────────┼──────────────┤
│ Sir Nic of the Weils │ Glazed Donut       │ 1                  │ 1              │ 4            │
├──────────────────────┼────────────────────┼────────────────────┼────────────────┼──────────────┤
│ Sir Nic of the Weils │ Ancient Spoon      │ 1                  │ 80             │ 3            │
└──────────────────────┴────────────────────┴────────────────────┴────────────────┴──────────────┘
Give me all items that are owned by no character:
I NOT MATCHING CI
┌────────────┬──────────────────────────────┬────────────────────┬────────────────┐
│ I#::number │ Iname::string                │ Durability::number │ Damage::number │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 5          │ Holy Hand Grenade of Antioch │ 1                  │ 999            │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 6          │ Common Shortsword            │ 30                 │ 15             │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 7          │ Rot-Hilted Axe               │ 8                  │ 15             │
└────────────┴──────────────────────────────┴────────────────────┴────────────────┘
All characters with an item that deals more than 30 damage:
C MATCHING (CI JOIN (I WHERE {Damage > 30}))
┌────────────┬──────────────────────┬────────────┐
│ C#::number │ Cname::string        │ HP::number │
├────────────┼──────────────────────┼────────────┤
│ 2          │ Sir Nic of the Weils │ 18         │
└────────────┴──────────────────────┴────────────┘
Just their names:
(C MATCHING (CI JOIN (I WHERE {Damage > 30}))){Cname}
┌──────────────────────┐
│ Cname::string        │
├──────────────────────┤
│ Sir Nic of the Weils │
└──────────────────────┘
┌──────────────────────┐
│ Cname::string        │
├──────────────────────┤
│ Sir Nic of the Weils │
└──────────────────────┘
Characters and the items they DON'T have:
((C{C#} JOIN I{I#}) MINUS (CI{C#, I#}) JOIN C{C#, Cname} JOIN I{I#, Iname}) {Cname, Iname} RENAME {Cname AS Character, Iname AS Missing Item}
┌──────────────────────┬──────────────────────────────┐
│ Character::string    │ Missing Item::string         │
├──────────────────────┼──────────────────────────────┤
│ Reese of Wellington  │ Glazed Donut                 │
├──────────────────────┼──────────────────────────────┤
│ Reese of Wellington  │ Ancient Spoon                │
├──────────────────────┼──────────────────────────────┤
│ Reese of Wellington  │ Holy Hand Grenade of Antioch │
├──────────────────────┼──────────────────────────────┤
│ Reese of Wellington  │ Common Shortsword            │
├──────────────────────┼──────────────────────────────┤
│ Reese of Wellington  │ Rot-Hilted Axe               │
├──────────────────────┼──────────────────────────────┤
│ Sir Nic of the Weils │ Venom-Soaked Blade           │
├──────────────────────┼──────────────────────────────┤
│ Sir Nic of the Weils │ Holy Hand Grenade of Antioch │
├──────────────────────┼──────────────────────────────┤
│ Sir Nic of the Weils │ Common Shortsword            │
├──────────────────────┼──────────────────────────────┤
│ Sir Nic of the Weils │ Rot-Hilted Axe               │
└──────────────────────┴──────────────────────────────┘
Fix overpowered items:
UPDATE I WHERE Damage > 30: {Damage := Damage / 2}
┌────────────┬──────────────────────────────┬────────────────────┬────────────────┐
│ I#::number │ Iname::string                │ Durability::number │ Damage::number │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 1          │ Bronze Poniard               │ 10                 │ 10             │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 2          │ Glazed Donut                 │ 1                  │ 1              │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 3          │ Venom-Soaked Blade           │ 5                  │ 25             │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 4          │ Ancient Spoon                │ 1                  │ 40             │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 5          │ Holy Hand Grenade of Antioch │ 1                  │ 499            │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 6          │ Common Shortsword            │ 30                 │ 15             │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 7          │ Rot-Hilted Axe               │ 8                  │ 15             │
└────────────┴──────────────────────────────┴────────────────────┴────────────────┘
Show Damage Per Durability (DPD): 
EXTEND I: {DPD := Damage / Durability}
┌────────────┬──────────────────────────────┬────────────────────┬────────────────┬─────────────┐
│ I#::number │ Iname::string                │ Durability::number │ Damage::number │ DPD::number │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┼─────────────┤
│ 1          │ Bronze Poniard               │ 10                 │ 10             │ 1           │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┼─────────────┤
│ 2          │ Glazed Donut                 │ 1                  │ 1              │ 1           │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┼─────────────┤
│ 3          │ Venom-Soaked Blade           │ 5                  │ 25             │ 5           │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┼─────────────┤
│ 4          │ Ancient Spoon                │ 1                  │ 80             │ 80          │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┼─────────────┤
│ 5          │ Holy Hand Grenade of Antioch │ 1                  │ 999            │ 999         │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┼─────────────┤
│ 6          │ Common Shortsword            │ 30                 │ 15             │ 1           │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┼─────────────┤
│ 7          │ Rot-Hilted Axe               │ 8                  │ 15             │ 2           │
└────────────┴──────────────────────────────┴────────────────────┴────────────────┴─────────────┘
Count of all character-item combos:
        COUNT ( CI ) = 5
Count of all distinct slots in character-item combos:
        COUNT ( CI { Slot } ) : 3
Sum of all item damage:
        SUM (I, Damage) = 1145
Sum of all distinct item damage values:
        SUM (I, { Damage }) = 1130
Sum of tripled item damage:
        SUM (I, 3 * Damage) =  3435
Sum of all distinct tripled item damage:
        SUM( EXTEND I : { Damage := Damage * 3 }, {Damage}) =  3390
My D implementation is behind on most features, but the plumbing exists:
(C join CI join I){ALL BUT C#, HP, I#}
┌──────────────────────┬────────────────────┬────────────────────┬────────────────┬──────────────┐
│ Cname::string        │ Iname::string      │ Durability::number │ Damage::number │ Slot::number │
├──────────────────────┼────────────────────┼────────────────────┼────────────────┼──────────────┤
│ Reese of Wellington  │ Bronze Poniard     │ 10                 │ 10             │ 3            │
├──────────────────────┼────────────────────┼────────────────────┼────────────────┼──────────────┤
│ Reese of Wellington  │ Venom-Soaked Blade │ 5                  │ 25             │ 4            │
├──────────────────────┼────────────────────┼────────────────────┼────────────────┼──────────────┤
│ Sir Nic of the Weils │ Bronze Poniard     │ 10                 │ 10             │ 10           │
├──────────────────────┼────────────────────┼────────────────────┼────────────────┼──────────────┤
│ Sir Nic of the Weils │ Glazed Donut       │ 1                  │ 1              │ 4            │
├──────────────────────┼────────────────────┼────────────────────┼────────────────┼──────────────┤
│ Sir Nic of the Weils │ Ancient Spoon      │ 1                  │ 80             │ 3            │
└──────────────────────┴────────────────────┴────────────────────┴────────────────┴──────────────┘
Attempt to violate the constraint:
{ c: 'CONSTRAINTS_FAILED', constraint_names: [ 'UNIQ_I' ] }
Concede, follow the constraint:
┌────────────┬──────────────────────────────┬────────────────────┬────────────────┐
│ I#::number │ Iname::string                │ Durability::number │ Damage::number │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 1          │ Bronze Poniard               │ 10                 │ 10             │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 2          │ Glazed Donut                 │ 1                  │ 1              │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 3          │ Venom-Soaked Blade           │ 5                  │ 25             │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 4          │ Ancient Spoon                │ 1                  │ 80             │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 5          │ Holy Hand Grenade of Antioch │ 1                  │ 999            │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 6          │ Common Shortsword            │ 30                 │ 15             │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 7          │ Rot-Hilted Axe               │ 8                  │ 15             │
├────────────┼──────────────────────────────┼────────────────────┼────────────────┤
│ 8          │ Floppy Disk                  │ 40                 │ 3              │
└────────────┴──────────────────────────────┴────────────────────┴────────────────┘
Attempt to violate again on new DB:
{ c: 'CONSTRAINTS_FAILED', constraint_names: [ 'UNIQ_I' ] }
```