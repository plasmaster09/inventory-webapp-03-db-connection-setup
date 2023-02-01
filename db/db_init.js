const fs = require("fs");

// (Re)Sets up the database, including a little bit of sample data
const db = require("./db_connection");

/**** Delete existing table, if any ****/

const drop_stuff_table_sql = fs.readFileSync(__dirname + "/queries/init/drop_stuff_table.sql", { encoding: "UTF-8" });

db.execute(drop_stuff_table_sql);

/**** Create "stuff" table (again)  ****/

const create_stuff_table_sql = fs.readFileSync(__dirname + "/queries/init/create_stuff_table.sql", { encoding: "UTF-8" });

db.execute(create_stuff_table_sql);

/**** Create some sample items ****/

const insert_stuff_table_sql = fs.readFileSync(__dirname + "/queries/init/insert_stuff_table.sql", { encoding: "UTF-8" });

db.execute(insert_stuff_table_sql, ['Widgets', '5', 'Widgets are cool! You can do ... so many... different things... with them...']);

db.execute(insert_stuff_table_sql, ['Gizmos', '100', null]);

db.execute(insert_stuff_table_sql, ['Thingamajig', '12345', 'Not to be confused with a Thingamabob']);

db.execute(insert_stuff_table_sql, ['BEANS.', '9999999', 'KIRBY. THAT IS ALL YOU NEED TO KNOW.']);

/**** Read the sample items inserted ****/

const read_stuff_table_sql = fs.readFileSync(__dirname + "/queries/init/read_stuff_table.sql", { encoding: "UTF-8" });

db.execute(read_stuff_table_sql, 
    (error, results) => {
        if (error) 
            throw error;

        console.log("Table 'stuff' initialized with:")
        console.log(results);
    }
);

db.end();