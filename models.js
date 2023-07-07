const Sequelize = require('sequelize');

module.exports = (sequelize) => {

  // Create a new Sequelize instance for the database connection
  sequelize = new Sequelize('pick_me_laundry', 'root', null, {
    host: 'localhost',
    dialect: 'mysql',
    operatorsAliases: false
  });

  // Define your models here
             // Define the User model
             const User = sequelize.define('Users', {
                user_id: {
                    type: Sequelize.INTEGER(50),
                    primaryKey: true,
                    autoIncrement: true
                },
                name: {
                    type: Sequelize.STRING(50),
                    allowNull: false
                },
                email: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                    unique: true
                },
                password: {
                    type: Sequelize.STRING(50),
                    allowNull: false
                },
                x_api_key: Sequelize.STRING(255),
                role: {
                    type: Sequelize.STRING(50),
                    allowNull: false
                },
                phone_number: {
                    type: Sequelize.STRING(50),
                    allowNull: false
                }
            });
    
            // Define the Customer model
            const Customer = sequelize.define('Customers', {
                cust_id: {
                    type: Sequelize.INTEGER(50),
                    primaryKey: true,
                    autoIncrement: true
                },
                user_id: {
                    type: Sequelize.INTEGER(50),
                    allowNull: false
                },
                cust_address: {
                    type: Sequelize.STRING(255),
                    allowNull: true
                }
            });
    
            // Define the ProvidersList model
            const ProvidersList = sequelize.define('Providers_List', {
                prov_id: {
                    type: Sequelize.INTEGER(50),
                    primaryKey: true,
                    autoIncrement: true
                },
                prov_name: {
                    type: Sequelize.STRING(50),
                    allowNull: false
                },
                prov_loc: {
                    type: Sequelize.STRING(255),
                    allowNull: false
                },
                prov_number: {
                    type: Sequelize.STRING(50),
                    allowNull: false
                }
            });
    
            // Define the ServiceProviders model
            const ServiceProviders = sequelize.define('Service_Providers', {
                sp_id: {
                    type: Sequelize.INTEGER(50),
                    primaryKey: true,
                    autoIncrement: true
                },
                user_id: {
                    type: Sequelize.INTEGER(50),
                    allowNull: false
                },
                prov_id: {
                    type: Sequelize.INTEGER(50),
                    allowNull: false
                }
            });
    
            // Define the OrderReq model
            const OrderReq = sequelize.define('Order_Req', {
                ord_id: {
                    type: Sequelize.INTEGER(50),
                    primaryKey: true,
                    autoIncrement: true
                },
                cust_id: {
                    type: Sequelize.INTEGER(50),
                    allowNull: false
                },
                ord_selected_prov: {
                    type: Sequelize.INTEGER(50),
                    allowNull: false
                },
                ord_is_pickup: {
                    type: Sequelize.INTEGER(50),
                    allowNull: false
                },
                ord_cust_loc: Sequelize.STRING(50),
                ord_pick_up_time: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                ord_is_deliv: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false
                },
                ord_service_type: {
                    type: Sequelize.STRING(50),
                    allowNull: false
                },
                ord_completion_type: {
                    type: Sequelize.STRING(50),
                    allowNull: false
                },
                ord_est_req_weight: Sequelize.INTEGER(50),
                ord_conf_weight: Sequelize.INTEGER(50),
                ord_req_status: {
                    type: Sequelize.STRING(50),
                    allowNull: false
                },
                ord_conf_price: Sequelize.INTEGER(50)
            });
    
            // Define the StatusDesc model
            const StatusDesc = sequelize.define('Status_Desc', {
                stat_id: {
                    type: Sequelize.INTEGER(50),
                    primaryKey: true,
                    autoIncrement: true
                },
                stat_name: {
                    type: Sequelize.STRING(50),
                    allowNull: false
                },
                stat_desc: {
                    type: Sequelize.STRING(255),
                    allowNull: false
                }
            });
    
            // Define the OrderStatuses model
            const OrderStatuses = sequelize.define('Order_Statuses', {
                ord_stat_id: {
                    type: Sequelize.INTEGER(50),
                    primaryKey: true,
                    autoIncrement: true
                },
                ord_id: {
                    type: Sequelize.INTEGER(50),
                    allowNull: false
                },
                stat_id: {
                    type: Sequelize.INTEGER(50),
                    allowNull: false
                },
                ord_est_time: Sequelize.DATE,
                ord_conf_status: {
                    type: Sequelize.STRING(50),
                    allowNull: false
                }
            });
    
            // Define the OrderReceipt model
            const OrderReceipt = sequelize.define('Order_Receipt', {
                rec_id: {
                    type: Sequelize.INTEGER(50),
                    primaryKey: true,
                    autoIncrement: true
                },
                ord_id: {
                    type: Sequelize.INTEGER(50),
                    allowNull: false
                },
                ord_payment_date: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                ord_price: {
                    type: Sequelize.INTEGER(50),
                    allowNull: false
                }
            });

    // Define the table relationships
    User.hasOne(Customer, { foreignKey: 'user_id' });
    User.hasOne(ServiceProviders, { foreignKey: 'user_id' });
    Customer.belongsTo(User, { foreignKey: 'user_id' });
    ServiceProviders.belongsTo(User, { foreignKey: 'user_id' });
    ServiceProviders.belongsTo(ProvidersList, { foreignKey: 'prov_id' });
    OrderReq.belongsTo(Customer, { foreignKey: 'cust_id' });
    OrderReq.belongsTo(ProvidersList, { foreignKey: 'ord_selected_prov' });
    OrderStatuses.belongsTo(OrderReq, { foreignKey: 'ord_id' });
    OrderStatuses.belongsTo(StatusDesc, { foreignKey: 'stat_id' });
    OrderReceipt.belongsTo(OrderReq, { foreignKey: 'ord_id' });

  // Sync the models to create the tables
  sequelize
    .sync({ force: false })
    .then(() => {
      console.log('Tables created');
    })
    .catch((error) => {
      console.error('Error creating tables:', error);
    });

  // Return the models
  return {
          User,
          Customer,
          ProvidersList,
          ServiceProviders,
          OrderReq,
          StatusDesc,
          OrderStatuses,
          OrderReceipt
  };
};
