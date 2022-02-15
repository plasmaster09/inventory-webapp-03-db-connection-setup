# Part 03: Database Layer: Database connection and first table set-up

This tutorial follows after:
[Part 02: Web app server setup and basics](https://github.com/atcs-wang/inventory-webapp-02-app-server-basics)


> This tutorial assumes familiarity with basic SQL concepts and commands.

Technologies: [MySQL](https://www.mysql.com/), [Node's `mysql2` library](https://www.npmjs.com/package/mysql2)

> The NodeJS package [`mysql2`](https://www.npmjs.com/package/mysql2) is a slightly more modern successor to the original [`mysql` library](https://github.com/mysqljs/mysql#readme). The original `mysql` library can be used as well, but it only offers the `query()` method, not the `execute()` method which does true prepared statements. 

The third layer of a web app is the **database**. In this tutorial, we will first use Node's `mysql2` library to set up a connection to your MySQL database via Node. Then, we will create a table for the data of our web app, and write some queries to populate it with sample data. Later, this schema will be improved and expanded.

You will need access to a local or remote MySQL server, with permissions to create tables and make queries with a schema. Make sure you know your database's **hostname** and **port** (mostly likely 3306), and your **username** and **password**.

If you don't have a schema yet created for this application, create one now. We've named it `stuff_manager` for this example. Here's some SQL that will create such a schema:

```sql
CREATE SCHEMA stuff_manager;
```

# Setting up a database connection with NodeJS's mysql2 library

> You may already have a preferred tool like MySQL Workbench to work with your database. You can, of course, use it to run any of the SQL queries in this tutorial, and to generally manage your database. But we also need our NodeJS app to make a connection to the database and send queries. Follow the instructions in this section to use NodeJS's `mysql2` library to make a connection. 

First, we need to install `mysql2` with npm. In the terminal, run this command:
```
> npm install mysql2
```

Then, create a new subdirectory (folder) called `db` in the root directory of your webapp project. Add a new file to that subdirectory called `db_connection.js`. Put in the following code, replacing the `"<...>"` strings with the connection information for your database instance and schema.

```js
const mysql = require('mysql2');

const dbConfig = {
    host: "<hostname>",
    port: 3306,
    user: "<username>",
    password: "<password>",
    database: "<schema>",
    connectTimeout: 10000
}

const connection = mysql.createConnection(dbConfig);

module.exports = connection;

```

> **Plaintext passwords are bad!** Don't push your code to Github yet. We'll fix this security flaw at the end of this tutorial (or you can skip ahead to the bottom if it's really bothering you right now).

This code prepares a database `connection`, configured by the settings in `dbConfig`. But simply creating the `connection` object doesn't actually *connect* to the database yet - that  happens once we actually execute queries.

Since no actual querying happens in this file, it isn't meant to be run on its own (try running `> node db_connection.js` and you'll be disappointed). Rather, this is meant to be used as a **module** that can be imported into other parts of the project. Note the last line:

```js
module.exports = connection;
```

This means that if another file uses `require()` like this:

```js
const db = require('<./relative/path/to/db_connection>');
```

then the variable `db` refers to the `connection` object from. 

> Even if multiple files in the Node project `require` the same module, the code in that module will only be run once per runtime. So, we can have multiple files utilize the same database connection that is set up only once. Neat!

## Testing the connection

Let's test out our connection configuration by actually sending a query to your database to execute.

Make another file in the `db` folder called `db_test.js`, with this code inside:

```js
const db = require("./db_connection");

// Add query request 
db.execute('SELECT 1 + 1 AS solution', 
    (error, results) => {
        if (error)
            throw error;
        console.log(results);
        console.log(`Solution: ${results[0].solution}`);
    }
);
//Optional: close the connection after queue is emptying.
db.end();
```

Try running this code with:
```
> node db/db_test.js
```
If you see an error message, double check in `db_connection.js` that the `dbConfig` object's settings are correct. Otherwise, you should see this output:
```
[ RowDataPacket { solution: 2 } ]
Solution: 2
```

This demonstrates the basic usage of the `execute()` method: the first parameter is an SQL statement to be executed, and its last (optional) parameter is a **callback function** that handles the eventual results (or error). For a SELECT statement, the results always come back as an array of RowDataPacket objects, who have properties matching the names of the selected columns. (The results of other kinds of statements will have different formats and information). 

The concluding `end()` method closes the connection *after* all queued queries have been executed and handled. Without this statement, the connection remains open and the program does not terminate.

> Note that `execute` and `end` (and all other connection methods) are *asynchronous* operations: calling them queues a *future* operation, but they do not block. Try adding `console.log()` statements  after both of the `execute` and `end` method calls to see what order things happen in. 

> The [npm documentation for the original `mysql` library](https://github.com/mysqljs/mysql#readme) has a similar introduction to its usage, plus more in-depth documentation. Even though we're using `mysql2`, the ideas as the same.


# Table initialization with `db_init.js`

Now that we've tested our database connection, let's use the connection to set up a "stuff" table for our web app's data! We'll write a short utility script called `db_init.js` that we can run at any time to (re-)initialize the table, including some sample data. 

> Of course, you can also set up such a table using any tool that can run SQL like MySQL Workbench. But writing a Node-based script will be convenient, and also good practice with the `mysql2` module.

Create a new file in the `db` folder called `db_init.js`, and add this code to start:

```js
// (Re)Sets up the database, including a little bit of sample data
const db = require("./db_connection");
```

This imports the configured connection from `db_connection.js`; since the two files are in the same folder, the relative path for the require statement starts with `./`.

Next, we'll run a series of SQL statements. Each statement used is also in an `.sql` file in the subdirectory path `db/queries/init`.

### Delete the existing table (step 1/4)
First, we want to run some SQL that deletes the table if it already exists. Add this code to `db_init.js`:
```js
/**** Delete existing table, if any ****/

const drop_stuff_table_sql = "DROP TABLE IF EXISTS `stuff`;"

db.execute(drop_stuff_table_sql);
```
*(this query can be also found in `/db/queries/init/drop_stuff_table.sql`)*

### Create the table  (step 2/4)

Based on our prototypes, the app needs to manage records of "stuff" that could be stored in a table with the following columns:
- **item** (short string)
- **quantity** (integer)
- **description** (long string) [optional]

Since it's not out of the question for the web app to store two identically named items, these items also need a unique **id** (say, an integer) as its primary key. 

We can (re)create a suitable table with the SQL *(also in `/db/queries/init/create_stuff_table.sql`)*:
```sql
CREATE TABLE `stuff` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `item` VARCHAR(45) NOT NULL,
  `quantity` INT NOT NULL,
  `description` VARCHAR(150) NULL,
  PRIMARY KEY (`id`));
```

So, similar to the table deletion query, let's add some code to execute the table-creating SQL query:

```js
/**** Create "stuff" table (again)  ****/

const create_stuff_table_sql = `
    CREATE TABLE stuff (
        id INT NOT NULL AUTO_INCREMENT,
        item VARCHAR(45) NOT NULL,
        quantity INT NOT NULL,
        description VARCHAR(150) NULL,
        PRIMARY KEY (id)
    );
`
db.execute(create_stuff_table_sql);
```

### Populate the table (step 3/4)

Once the table is created, we'd like to add some sample data - at least the same two items in the prototypes. We *could* execute INSERT queries like these:

```sql
INSERT INTO inventory
    (`item`, `quantity`, `description`) 
VALUES 
    ('Widgets', '5', 'Widgets are cool! You can do ... so many... different things... with them...');

INSERT INTO inventory
    (`item`, `quantity`, `description`) 
VALUES 
    ('Gizmos', '100', null);
```

However, both have the same overall pattern, and the only differences are the three values being inserted. Instead, we can write a more general query with question mark placeholders (`?`) for values *(also in `/db/queries/init/insert_stuff_table.sql`)*:

```sql
INSERT INTO stuff 
    (item, quantity, description) 
VALUES 
    (?, ?, ?);
```

The `execute()` method then offers a handy way to replace those `?` placeholds with actual values before executing: simply pass an array of values as the optional second parameter, and each value will be used to replace a `?`. This is a technique called "prepared statements".

Add this code to insert some rows using this technique:
```js
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
```

> Using prepared statements helps protect against potential SQL injection attacks. This becomes more relevant when we're inserting user-provided values, but you can read more here if you like: https://stackoverflow.com/questions/8263371/how-can-prepared-statements-protect-from-sql-injection-attacks

### Read the table (step 4/4)

Finally, after populating the table with sample data, it would be nice to check out its contents. This is easily done with this statement *(also in `/db/queries/init/read_stuff_table.sql`)*:
```sql
SELECT * FROM stuff
```

As we did in the `db_test.js`, let's make the query and provide a callback function to print out the results. Lastly, we close the connection:

```js
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
```

Our script is done! You can run it with:
```
> node db/db_init.js
```
If it all runs smoothly, you should see this output:

```js
Table 'stuff' initialized with:
[
  RowDataPacket {
    id: 1,
    item: 'Widgets',
    quantity: 5,
    description: 'Widgets are cool! You can do ... so many... different things... with them...'
  },
  RowDataPacket {
    id: 2,
    item: 'Gizmos',
    quantity: 100,
    description: null
  },
  RowDataPacket {
    id: 3,
    item: 'Thingamajig',
    quantity: 12345,
    description: 'Not to be confused with a Thingamabob'
  },
  RowDataPacket {
    id: 4,
    item: 'Thingamabob',
    quantity: 54321,
    description: 'Not to be confused with a Thingamajig'
  }
]
```

> 
### Optional (step 5): Read SQL files instead of using string literals

You might be a bit turned off by having SQL embedded as plain strings into our Javascript code. We did this for ease of usage and understanding, but you may prefer to keep the two kinds of languages separate and in their respective file types (`.js` and `.sql`). If so, we can change our code to instead read the SQL from the `.sql` files in the `/db/queries/init/` subdirectory. 

To do so, we can use the built-in Node module `fs` (which doesn't need installing). Simply add this code to the top of `db_init.js`, replacing of all the SQL string literals that were defined throughout the file:
```js
const fs = require("fs");

const drop_stuff_table_sql = fs.readFileSync(__dirname + "/db/queries/init/drop_stuff_table.sql", { encoding: "UTF-8" })
const create_stuff_table_sql = fs.readFileSync(__dirname + "/db/queries/init/create_stuff_table.sql", { encoding: "UTF-8" })
const insert_stuff_table_sql = fs.readFileSync(__dirname + "/db/queries/init/insert_stuff_table.sql", { encoding: "UTF-8" })
const read_stuff_table_sql = fs.readFileSync(__dirname + "/db/queries/init/read_stuff_table.sql", { encoding: "UTF-8" })
```
This code snippet can also be found at the bottom of `db_init.js` as a large comment.


# Protecting sensitive strings with environment variables and `dotenv`

Before we can push any of our code to Github, we need to deal with the issue we raised early on: our database password (and other sensitive database information) is sitting in plaintext in `db_connection.js`. This is a clear security flaw, and publishing our code is out of the question until we deal with it.

The standard way to store sensitive configuration data is via **environment variables**. These can be set via your computer's operating system settings, and are accessible to Node via the `process.env` object.

Update our `dbConfig` object in `db_connection.js` to this instead:
```js
const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || "10000")
}
```
A few default options have been provided in case certain environment variables are not specified.

However, dealing with environment variables is a bit of a hassle, especially if you have several Node projects that use them. 

A more convenient option is provided by the `dotenv` package, which sets project-specific values for environment variables from a text file called `.env`. 

Install it with this command:

```
> npm install dotenv
```

Then add these two lines to the top section of `db_connection.js`:

```js
const dotenv = require('dotenv');

dotenv.config();
```

Next, create a file called `.env` in the root directory of your project. The contents should look like this:

```
# MySQL Database configuration
DB_HOST=<hostname>
DB_PORT=3306
DB_USER=<username>
DB_PASSWORD=<password>
DB_DATABASE=<schema>
DB_CONNECT_TIMEOUT=10000
```

As before, replace the `"<...>"` strings with the connection information for your database instance and schema.

Finally, add to your `.gitignore` the line: 
```
.env
```

Now, you can easily set your database configuration settings in the `.env` file without worrying about exposing it via Github. 

However, anyone making a clone or fork of your git repository will need to make their own `.env` file. Therefore, it is common to create a `.sample-env` file that contains the names of the relevant environment variables, but not the values. This can be safely shared with the rest of the project, and provide a starting point for a new `.env` file.

# Conclusion:
We've set up our data layer as a MySQL database, set up a connection from NodeJS, and wrote a initialization script that creates and populates the data table that our webapp will use.

With the basics of all three layers in place, it's finally time to connect them! Next, we'll transform our static prototypes into dynamic web pages, rendered by the app server from live data in the database.
