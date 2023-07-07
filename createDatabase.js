const Sequelize = require('sequelize');

const createDatabase = () => {
  return new Promise((resolve, reject) => {
    // Create a Sequelize instance without connecting to a database
    const sequelize = new Sequelize('', 'root', null, {
      host: 'localhost',
      dialect: 'mysql',
      operatorsAliases: false
    });

    // Check if the database exists
    sequelize
      .query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'pick_me_laundry';", { raw: true })
      .then(([results]) => {
        if (results.length === 0) {
          // Create the database if it doesn't exist
          return sequelize.query('CREATE DATABASE IF NOT EXISTS pick_me_laundry;');
        } else {
          console.log('Database "pick_me_laundry" exists');
          // Proceed with connecting to the existing database
          return Promise.resolve();
        }
      })
      .then(() => {
        // Connect to the database
        sequelize.options.database = 'pick_me_laundry';
        return sequelize.authenticate();
      })
      .then(() => {
        console.log('Connected to the database');
        resolve(sequelize); // Resolve the promise with the Sequelize instance when the database is created and connected
      })
      .catch((error) => {
        console.error('Error during database setup:', error);
        reject(error); // Reject the promise if there's an error during database setup
      });
  });
};

module.exports = createDatabase;
