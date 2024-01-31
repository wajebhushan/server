const { Order } = require("../models/order");
const express = require("express");
const { OrderItem } = require("../models/order-items");
const router = express.Router();

router.get(`/`, async (req, res) => {
  const orderList = await Order.find().populate('user','name').sort({'dateOrder':-1});

  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.send(orderList);
});

// router.post('/', async (req,res)=>{
//     const orderItemsIds =await req.body.orderItems.map( orderItem =>{
//         let newOrderItem = new OrderItem({
//             quantity:orderItem.quantity,
//             product:orderItem.product
//         })
//         newOrderItem =  newOrderItem.save()

//         return newOrderItem._id;
//     })
//     let orders = new Order({
//         orderItems: orderItemsIds,
//         shippingAddress1: req.body.shippingAddress1,
//         shippingAddress2: req.body.shippingAddress2,
//         city:req.body.city,
//         country:req.body.country,
//         status:req.body.status,
//         totalPrice:req.body.totalPrice,
//         user:req.body.user,
//         dateOrder:req.body.dateOrder,
//         zip:req.body.zip,
//         phone:req.body.phone
//     })
//     orders = await orders.save();

//     if(!orders)
//     return res.status(400).send('the orders cannot be created!')

//     res.send(orders);
// })

router.post("/", async (req, res) => {
  try {
    const orderItemsIds = await Promise.all(
      req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
          quantity: orderItem.quantity,
          product: orderItem.product,
        });
        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
      })
    );

    let order = new Order({
      orderItems: orderItemsIds,
      shippingAddress1: req.body.shippingAddress1,
      shippingAddress2: req.body.shippingAddress2,
      city: req.body.city,
      country: req.body.country,
      phone: req.body.phone, // Add missing phone field
      zip: req.body.zip, // Add missing zip field
      status: req.body.status,
      totalPrice: req.body.totalPrice,
      user: req.body.user,
      dateOrder: req.body.dateOrder,
    });

    order = await order.save();

    if (!order) return res.status(400).send("The order could not be created!");

    res.status(201).send(order);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
