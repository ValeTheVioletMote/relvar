// CREATE TABLE Supplier (
//     SID     int          primary key,
//     SName   varchar(10)  NOT NULL,
//     Status  int          NOT NULL,
//     City    varchar(10)  NOT NULL
//   )
  
//   CREATE TABLE Part (
//     PID     int          primary key,
//     PName   varchar(10)  NOT NULL,
//     Color   int          NOT NULL,
//     Weight  real         NOT NULL,
//     City    varchar(10)  NOT NULL
//   )
  
//   CREATE TABLE Shipment (
//     SID     int          NOT NULL FOREIGN KEY REFERENCES Supplier(SID),
//     PID     int          NOT NULL FOREIGN KEY REFERENCES Part(PID),
//     Qty     int          NOT NULL,
//     PRIMARY KEY (SID, PID)
//   )


/**
 * http://u.arizona.edu/~mccann/classes/460/spj.pdf
 */

// simple type checker: function for every type that simply returns true or false!

var Attributes = {};
var Custom_Attributes = {};

var S = {
    attrs: {
        "S#":  "number",
        "Sname": "string",
        "Status": "number",
        "City": "string"
    }
    , tuples: [
        {"S#": "S1", Sname: "Smith", Status: 20, City: "London"}
    ]};