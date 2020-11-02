# relvar.js
An amateur database inspired by CJ Date and Project M36.

Documentation will be sparse as I'm focused more on the development, but here's a demo that should give you the idea of what I'm gunning to do:

```js
var {relvar, union, _sel, _un, selection
    , rvts, logrv, S, P, SP, _j, join, inv_selection, _but
    , where, _where, minus, _minus, rename, _ren, matching, _mat, not_matching, _nmat
    , db, save_db, assign_rv} = require("../main.js");

const _arv = (name, rv) => (db) => assign_rv(db, name, rv);

var GameDB = db(require("path").join(__dirname, "test.yaml"), "GameDB");
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

var {db: GameDB} = GameDB.tap(_arv("C", C)).tap(_arv("I", I)).tap(_arv("CI", CI)).tap(save_db);

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
```