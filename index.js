const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 5000;
const API = require('./apiAuth');
app.use(cors());
const createDatabase = require('./createDatabase');

const startServer = async () => {
    try {
        // Execute the createDatabase function first
        const sequelize = await createDatabase();

        // Import the models after the database is created and connected
        const { User, Customer, ProvidersList, ServiceProviders, OrderReq, StatusDesc, OrderStatuses, OrderReceipt } = require('./models')(sequelize);

        // parse application/x-www-form-urlencoded
        app.use(bodyParser.urlencoded({ extended: false }));

        // parse application/json
        app.use(bodyParser.json());

        // HOME
        app.get('/', (req, res) => {
            res.send('hello world');
        });

        // Register
        app.post('/register', async (req, res) => {
            try {
                // Create a new user with the provided data
                const api_key = API.genAPIKey();

                const newUser = await User.create({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password,
                    x_api_key: api_key,
                    role: req.body.role,
                    phone_number: req.body.phone_number
                });


                if (req.body.role == "customer") {
                    Customer.create({
                        user_id: newUser.user_id,
                        cust_address: req.body.address
                    })
                }

                if (req.body.role == "admin") {
                    ServiceProviders.create({
                        user_id: newUser.user_id,
                        prov_id: req.body.prov_id
                    })
                }

                res.send({ code: 200, msg: 'Registered', data: newUser });
            } catch (error) {
                console.error('Error during registration:', error);
                res.status(500).send('Internal Server Error');
            }
        });


        // Create Provider
        app.post('/provider/add', async (req, res) => {
            try {

                const newProvider = await ProvidersList.create({
                    prov_id: req.body.prov_id,
                    prov_name: req.body.prov_name,
                    prov_loc: req.body.prov_loc,
                    prov_number: req.body.prov_number
                });


                res.send({ code: 200, msg: 'Provider added', data: newProvider });
            } catch (error) {
                console.error('Error during creating provider:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Create Order Status
        app.post('/order-status/add', async (req, res) => {
            try {

                const newStatDesc = await StatusDesc.create({
                    stat_id: req.body.stat_id,
                    stat_name: req.body.stat_name,
                    stat_desc: req.body.stat_desc
                });
                res.send({ code: 200, msg: 'Provider added', data: newStatDesc });
            } catch (error) {
                console.error('Error during creating order status:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Login
        app.post('/login', async (req, res) => {
            try {
                // Create a new user with the provided data
                const api_key = API.genAPIKey();

                const loginUser = await User.findOne({
                    where: { email: req.body.email }
                });
                // Retrieve the newly created user from the database
                if (loginUser.password == req.body.password) {
                    // Update the x_api_key property
                    await loginUser.update({ x_api_key: api_key });

                    res.send({ code: 200, msg: 'Login Success', data: loginUser });
                } else {
                    res.send({ code: 401, msg: 'Invalid credentials' });
                }
            } catch (error) {
                console.error('Error during login:', error);
                res.status(500).send('Internal Server Error');
            }
        });


        // Logout
        app.post('/logout', async (req, res) => {
            try {
                // Create a new user with the provided data
                const api_key = API.genAPIKey();

                const loginUser = await User.findOne({
                    where: { email: req.body.email }
                });
                // Update the x_api_key property
                await loginUser.update({ x_api_key: api_key });

                res.send({ code: 200, msg: 'Logout Success' });

            } catch (error) {
                console.error('Error during logout:', error);
                res.status(500).send('Internal Server Error');
            }
        });
        // ... Rest of your code ...

        // Get All Users
        app.get('/users', async (req, res) => {
            try {
                const users = await User.findAll();
                res.send({ code: 200, msg: 'All Users', data: users });
            } catch (error) {
                console.error('Error during get users:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Add Order
        app.post('/order', async (req, res) => {
            try {

                const newOrder = await OrderReq.create({
                    cust_id: req.body.cust_id,
                    ord_selected_sp: req.body.sp_id,
                    ord_is_pickup: req.body.is_pickup,
                    ord_cust_loc: req.body.ord_cust_loc,
                    ord_pick_up_time: req.body.ord_pick_up_time,
                    ord_is_deliv: req.body.ord_is_deliv,
                    ord_service_type: req.body.ord_service_type,
                    ord_completion_type: req.body.ord_service_type,
                    ord_est_req_weight: req.body.ord_est_req_weight,
                    ord_req_status: "ordered",
                    ord_conf_price: req.body.ord_conf_price,
                });


                res.send({ code: 200, msg: 'Order Success, Waiting for Provider to confirm', data: newOrder });
            } catch (error) {
                console.error('Error during Order:', error);
                res.status(500).send('Internal Server Error');
            }
        });


        // Add Pickup Order
        app.post('/order/pickup', API.authenticateKey, async (req, res) => {
            let api_key = req.header("x-api-key")
            console.log("API Key :", api_key);
            const getUser = await User.findOne({
                where: { x_api_key: api_key }
            })
            const getCustomer = await Customer.findOne({
                where: { user_id: getUser.user_id }
            })
            try {

                const newOrder = await OrderReq.create({
                    cust_id: getCustomer.cust_id,
                    ord_selected_prov: req.body.ord_selected_prov,
                    ord_is_pickup: true,
                    ord_cust_loc: getCustomer.cust_address,
                    ord_pick_up_time: req.body.ord_pick_up_time,
                    ord_is_deliv: true,
                    ord_service_type: req.body.ord_service_type,
                    ord_completion_type: req.body.ord_completion_type,
                    ord_est_req_weight: req.body.ord_est_req_weight,
                    ord_req_status: "Waiting to confirm"
                });

                const newOrdStat = await OrderStatuses.create({
                    ord_id: newOrder.ord_id,
                    stat_id: 1,
                    ord_est_time: newOrder.ord_pick_up_time,
                    ord_conf_status: "waiting"
                })

                res.send({ code: 200, msg: 'Order Success, Waiting for Provider to confirm', data: newOrder });
            } catch (error) {
                console.error('Error during Order:', error);
                res.status(500).send('Internal Server Error');
            }
        });


        // Update Order
        app.post('/order/pickup/update/:id', API.authenticateKey, async (req, res) => {
            let api_key = req.header("x-api-key")
            console.log("API Key :", api_key);
            const getUser = await User.findOne({
                where: { x_api_key: api_key }
            })
            const getCustomer = await Customer.findOne({
                where: { user_id: getUser.user_id }
            })
            try {

                const updatedOrder = await OrderReq.update(
                    {
                        ord_req_status: req.body.ord_req_status,
                        ord_conf_weight: req.body.ord_conf_weight,
                        ord_conf_price: req.body.ord_conf_price
                    },
                    { where: { ord_id: req.params.id } }
                )
                const getOrder = await OrderReq.findOne({
                    where: { ord_id: req.params.id }
                })
                var conf_status = "wating";
                if (req.body.stat_id == 8) {
                    conf_status = "done";
                    const newOrdRec = await OrderReceipt.create({
                        ord_id: req.params.id,
                        ord_payment_date: getOrder.createdAt,
                        ord_price: getOrder.ord_conf_price
                    })
                } else {
                    conf_status = "waiting"
                }
                const newOrdStat = await OrderStatuses.create({
                    ord_id: req.params.id,
                    stat_id: req.body.stat_id,
                    ord_conf_status: conf_status,
                })

                res.send({ code: 200, msg: 'Order Update Success', data: updatedOrder });
            } catch (error) {
                console.error('Error during Order:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Get Order by Admins
        app.get('/order/list', API.authenticateKey, async (req, res) => {
            let api_key = req.header("x-api-key")
            console.log("API Key :", api_key);
            const getUser = await User.findOne({
                where: { x_api_key: api_key }
            })
            const getSerProv = await ServiceProviders.findOne({
                where: { user_id: getUser.user_id }
            })
            const getProv = await ProvidersList.findOne({
                where: { prov_id: getSerProv.prov_id }
            })
            try {

                const getOrder = await OrderReq.findAll({
                    where: { ord_selected_prov: getProv.prov_id },
                    include: [
                        {
                            model: Customer,
                            include: [
                                {
                                    model: User,
                                    attributes: ['name'] // Specify the attributes you want to include from User model
                                }
                            ]
                        }
                    ],
                    raw: true,
                    nest: true // Nesting option set to true
                });


                // Flatten the getOrder array and remove nested objects
                const result = getOrder.map(order => ({
                    ...order,
                    cust_name: order.Customer.User.name,
                    // Remove nested objects
                    Customer: undefined,
                    'Customer.User': undefined
                }));



                res.send({ code: 200, msg: 'Success get all orders', data: result });
            } catch (error) {
                console.error('Error during registration:', error);
                res.status(500).send('Internal Server Error');
            }
        });


        // Get Order by Customer
        app.get('/my-orders', API.authenticateKey, async (req, res) => {
            let api_key = req.header("x-api-key")
            console.log("API Key :", api_key);
            const getUser = await User.findOne({
                where: { x_api_key: api_key }
            })
            const getCustomer = await Customer.findOne({
                where: { user_id: getUser.user_id }
            })

            try {

                const getOrder = await OrderReq.findAll({
                    where: { cust_id: getCustomer.cust_id },
                    include: [
                        {
                            model: ProvidersList,
                            attributes: ['prov_name', 'prov_loc', 'prov_number']
                        }
                    ],
                    raw: true,
                    nest: true // Nesting option set to true
                });


                // Flatten the getOrder array and remove nested objects
                const result = getOrder.map(order => ({
                    ...order,
                    prov_name: order.Providers_List.prov_name,
                    prov_loc: order.Providers_List.prov_loc,
                    prov_number: order.Providers_List.prov_number,

                    // Remove nested objects
                    Providers_List: undefined
                }));
                res.send({ code: 200, msg: 'Success get all orders', data: result });
            } catch (error) {
                console.error('Error during registration:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Get Order by ID
        app.get('/order/:id', API.authenticateKey, async (req, res) => {
            try {
                const getOrder = await OrderReq.findOne({
                    where: { ord_id: req.params.id },
                    include: [
                        {
                            model: Customer,
                            include: [
                                {
                                    model: User,
                                    attributes: ['name'] // Specify the attributes you want to include from User model
                                }
                            ]
                        },
                        {
                            model: ProvidersList,
                            attributes: ['prov_name', 'prov_loc', 'prov_number']
                        }
                    ],
                    raw: true,
                    nest: true // Nesting option set to true
                });

                const getOrdStat = await OrderStatuses.findAll({
                    where: { ord_id: req.params.id }
                });

                const result = {
                    ...getOrder,
                    prov_name: getOrder['Providers_List.prov_name'],
                    prov_loc: getOrder['Providers_List.prov_loc'],
                    prov_number: getOrder['Providers_List.prov_number'],
                    cust_name: getOrder['Customer.User.name'],
                    order_status: getOrdStat,
                    Customer: undefined,
                    'Customer.User': undefined,
                    Providers_List: undefined
                };

                res.send({ code: 200, msg: 'Success get order details', data: result });
            } catch (error) {
                console.error('Error during get order:', error);
                res.status(500).send('Internal Server Error');
            }
        });



        // Get Receipt by Admins
        app.get('/order/receipt/list', API.authenticateKey, async (req, res) => {
            let api_key = req.header("x-api-key")
            console.log("API Key :", api_key);
            const getUser = await User.findOne({
                where: { x_api_key: api_key }
            })
            const getSerProv = await ServiceProviders.findOne({
                where: { user_id: getUser.user_id }
            })
            const getProv = await ProvidersList.findOne({
                where: { prov_id: getSerProv.prov_id }
            })
            try {

                const getOrder = await OrderReq.findAll({
                    where: { ord_selected_prov: getProv.prov_id,ord_req_status:"done" },
                    include: [
                        {
                            model: Customer,
                            include: [
                                {
                                    model: User,
                                    attributes: ['name'] // Specify the attributes you want to include from User model
                                }
                            ]
                        }
                    ],
                    raw: true,
                    nest: true // Nesting option set to true
                });


                // Flatten the getOrder array and remove nested objects
                const result = getOrder.map(order => ({
                    ...order,
                    cust_name: order.Customer.User.name,
                    // Remove nested objects
                    Customer: undefined,
                    'Customer.User': undefined
                }));



                res.send({ code: 200, msg: 'Success get all orders', data: result });
            } catch (error) {
                console.error('Error during registration:', error);
                res.status(500).send('Internal Server Error');
            }
        });


        // Get Receipt by Customer
        app.get('/transaction-history', API.authenticateKey, async (req, res) => {
            let api_key = req.header("x-api-key")
            console.log("API Key :", api_key);
            const getUser = await User.findOne({
                where: { x_api_key: api_key }
            })
            const getCustomer = await Customer.findOne({
                where: { user_id: getUser.user_id }
            })


            try {

                const getOrder = await OrderReq.findAll({
                    where: { cust_id: getCustomer.cust_id, ord_req_status: "done" },
                    include: [
                        {
                            model: ProvidersList,
                            attributes: ['prov_name', 'prov_loc', 'prov_number']
                        },
                    ],
                    raw: true,
                    nest: true // Nesting option set to true
                });


                // Flatten the getOrder array and remove nested objects
                const result = getOrder.map(order => ({
                    ...order,
                    prov_name: order.Providers_List.prov_name,
                    prov_loc: order.Providers_List.prov_loc,
                    prov_number: order.Providers_List.prov_number,

                    // Remove nested objects
                    Providers_List: undefined
                }));
                res.send({ code: 200, msg: 'Success get all orders', data: result });
            } catch (error) {
                console.error('Error during registration:', error);
                res.status(500).send('Internal Server Error');
            }
        });


        // get user data by API key 
        app.get('/user', API.authenticateKey, async (req, res) => {
            let api_key = req.header("x-api-key")
            const getUser = await User.findOne({
                where: { x_api_key: api_key }
            })
            if (getUser.role == "customer") {

                const getCustomer = await Customer.findOne({
                    where: { user_id: getUser.user_id }
                })

                const updatedUser = {
                    user_id: getUser.user_id,
                    name: getUser.name,
                    email: getUser.email,
                    phone_number: getUser.phone_number,
                    password: getUser.password,
                    cust_address: getCustomer.cust_address
                }

                res.send({ "code": 200, "msg": "OK", "data": updatedUser });
            } else if (getUser.role == "admin") {
                const getServiceProvider = await ServiceProviders.findOne({
                    where: { user_id: getUser.user_id }
                })
                const getProvider = await ProvidersList.findOne({
                    where: { prov_id: getServiceProvider.prov_id }
                })

                const updatedUser = {
                    user_id: getUser.user_id,
                    name: getUser.name,
                    email: getUser.email,
                    phone_number: getUser.phone_number,
                    password: getUser.password,
                    prov_id: getServiceProvider.prov_id,
                    prov_name: getProvider.prov_name,
                    prov_loc: getProvider.prov_loc
                }

                res.send({ "code": 200, "msg": "OK", "data": updatedUser });

            } else {
                res.send("you are not customer or admin")
            }


        })


        // Test
        app.post('/test', async (req, res) => {
            try {
                // Create a new user with the provided data
                const api_key = API.genAPIKey();

                const newUser = await User.create({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password,
                    x_api_key: api_key,
                    role: req.body.role,
                    phone_number: req.body.phone_number
                });

                // Retrieve the newly created user from the database
                const createdUser = await User.findOne({
                    where: { email: req.body.email }
                });

                if (req.body.role == "customer") {
                    Customer.create({
                        user_id: createdUser.user_id,
                        cust_address: req.body.address
                    })
                }

                if (req.body.role == "admin") {
                    ServiceProviders.create({
                        user_id: createdUser.user_id,
                        prov_id: req.body.prov_id
                    })
                }

                res.send({ code: 200, msg: 'Registered', data: newUser });
            } catch (error) {
                console.error('Error during registration:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Start the server
        app.listen(port, () => {
            console.log(`Example app listening at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Error creating database:', error);
    }
};

startServer();
