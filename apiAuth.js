const getUsers = require('./initialData'); // import initial data

const MAX=1

const genAPIKey = () => {
    return [...Array(30)]
      .map((e) => ((Math.random() * 36) | 0).toString(36))
      .join('');
  };


  const authenticateKey = async (req, res, next) => {
    try {
      const users = await getUsers();
  
      let api_key = req.header("x-api-key"); // Add API key to headers
      let account = users.find((user) => user.x_api_key == api_key);
      console.log("account: ", account);
      console.log("api_key: ", api_key);
  
      if (account) {
        console.log("API Key matches");
        console.log("users: ", users);
  
        next();
      } else {
        // Reject request if API key doesn't match
        res.status(403).send({ error: { code: 403, message: "You are not allowed." } });
      }
    } catch (error) {
      // Handle any errors
      console.error('Error retrieving users:', error);
      res.status(500).send({ error: { code: 500, message: "Internal Server Error." } });
    }
  };

  module.exports = { authenticateKey, genAPIKey };