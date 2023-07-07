const sequelize = require('sequelize');
const {User} = require('./models')(sequelize); // Import the models object

// Function to retrieve users from the database
const getUsers = async () => {
  try {
    // Retrieve all users using the User model
    const users = await User.findAll();

    // Return the retrieved users
    return users;
  } catch (error) {
    console.error('Error retrieving users:', error);
    throw error;
  }
};

// Export the getUsers function
module.exports = getUsers;
