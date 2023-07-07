var mysql = require('mysql2');


const namaDatabase = "pick_me_laundry";

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: null,
    database: namaDatabase,
  });

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var sql = `DROP DATABASE ${namaDatabase}` ;
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Database deleted");
  });
});