// Refreshes up the database, including a little bit of sample data
const db = require("./db_connection");

/**** This version of the file assumes the table already exists ****/

/**** Delete *CONTENTS OF* existing table (but not table itself) ****/

const delete_stuff_table_sql = "DELETE FROM stuff;"

db.execute(delete_stuff_table_sql);

/**** Create some sample items ****/

const insert_stuff_table_sql = `
    INSERT INTO stuff 
        (item, quantity, description) 
    VALUES 
        (?, ?, ?);
`

db.execute(insert_stuff_table_sql, ['Widgets', '5', 'Widgets are cool! You can do ... so many... different things... with them...']);

db.execute(insert_stuff_table_sql, ['Gizmos', '100', null]);

db.execute(insert_stuff_table_sql, ['Thingamajig', '12345', 'Not to be confused with a Thingamabob']);

db.execute(insert_stuff_table_sql, ['Thingamabob', '54321', 'Not to be confused with a Thingamajig']);

/**** Read the sample items inserted ****/

const read_stuff_table_sql = "SELECT * FROM stuff";

db.execute(read_stuff_table_sql, 
    (error, results) => {
        if (error) 
            throw error;

        console.log("Table 'stuff' initialized with:")
        console.log(results);
    }
);

db.end();

/*

// Alternatively, instead of putting SQL in string literals, read the SQL from files using the "fs" package.
// Put this code at the top, and remove all the SQL string literals defined through the file.
const fs = require("fs");

const delete_stuff_table_sql = fs.readFileSync(__dirname + "/db/queries/init/delete_stuff_table.sql", { encoding: "UTF-8" });
const create_stuff_table_sql = fs.readFileSync(__dirname + "/db/queries/init/create_stuff_table.sql", { encoding: "UTF-8" });
const insert_stuff_table_sql = fs.readFileSync(__dirname + "/db/queries/init/insert_stuff_table.sql", { encoding: "UTF-8" });
const read_stuff_table_sql = fs.readFileSync(__dirname + "/db/queries/init/read_stuff_table.sql", { encoding: "UTF-8" });

*/

