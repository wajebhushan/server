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

router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
  .populate('user','name')
  .populate({path:'orderItems',populate:{path:'product',populate:'category'}});

  if (!order) {
    res.status(500).json({ success: false });
  }
  console.log(">>>>>>>",order)
  res.send(order);
});


router.put(`/:id`, async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id,{
    status:req.body.status
  },{new:true})
  
  if (!order) {
    res.status(500).json({ success: false });
  }
  console.log(">>>>>>>",order)  
  res.send(order);
});

router.delete('/:id', (req, res)=>{
  Order.findByIdAndRemove(req.params.id).then(async order =>{
      if(order) {
        await order.orderItems.map(async orderItem =>{
          await orderItem.findByIdAndRemove(orderItem)
        })
          return res.status(200).json({success: true, message: 'the order is deleted!'})
      } else {
          return res.status(404).json({success: false , message: "order not found!"})
      }
  }).catch(err=>{
     return res.status(500).json({success: false, error: err}) 
  })
})


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

// router.post("/", async (req, res) => {
//   const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderitem) =>{
//     let newOrderItem = new OrderItem({
//       quantity: orderitem.quantity,
//       product: orderitem.product,
//     });
//     newOrderItem = await newOrderItem.save();
//     return newOrderItem._id;
//   }))
//     const totalPrice = await Promise.all(orderItemsIds).map(async(orderItemId) =>{
//       const itemId = await OrderItem.findById(orderItemId).populate('product','price')
//       const Price = itemId.product.price * itemId.quantity
//       return Price;
//     })
//     console.log("totalPrice",totalPrice)
//     let order = new Order({
//       orderItems: orderItemsIds,
//       shippingAddress1: req.body.shippingAddress1,
//       shippingAddress2: req.body.shippingAddress2,
//       city: req.body.city,
//       country: req.body.country,
//       phone: req.body.phone, // Add missing phone field
//       zip: req.body.zip, // Add missing zip field
//       status: req.body.status,
//       totalPrice: req.body.totalPrice,
//       user: req.body.user,
//       dateOrder: req.body.dateOrder,
//     });

//     order = await order.save();

//     if (!order) return res.status(400).send("The order could not be created!");
//     res.status(201).send(order);
// });

router.post("/", async (req, res) => {
  try {
    // Create order items and retrieve their IDs
    const orderItemsIds = await Promise.all(req.body.orderItems.map(async (orderitem) => {
      let newOrderItem = new OrderItem({
        quantity: orderitem.quantity,
        product: orderitem.product,
      });
      newOrderItem = await newOrderItem.save();
      return newOrderItem._id;
    }));

    // Calculate total price for each order item
    const totalPricePromises = orderItemsIds.map(async (orderItemId) => {
      const itemId = await OrderItem.findById(orderItemId).populate('product', 'price');
      const price = itemId.product.price * itemId.quantity;
      return price;
    });

    // Wait for all total prices to be calculated
    const totalPriceResults = await Promise.all(totalPricePromises);

    // Sum up total prices
    const totalPrice = totalPriceResults.reduce((acc, cur) => acc + cur, 0);

    // Create the order
    let order = new Order({
      orderItems: orderItemsIds,
      shippingAddress1: req.body.shippingAddress1,
      shippingAddress2: req.body.shippingAddress2,
      city: req.body.city,
      country: req.body.country,
      phone: req.body.phone, // Add missing phone field
      zip: req.body.zip, // Add missing zip field
      status: req.body.status,
      totalPrice: totalPrice, // Use calculated total price
      user: req.body.user,
      dateOrder: req.body.dateOrder,
    });

    // Save the order
    order = await order.save();

    if (!order) return res.status(400).send("The order could not be created!");
    res.status(201).send(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get(`/get/totalsales`, async (req, res) =>{
 const totalSales =await Order.aggregate(([
  {$group:{_id:null,totalsales:{$sum:'$totalPrice'}}}
 ]))
 if(!totalSales){
  res.status(400).send('the order sale count not be generated')
 }
 res.send({totalsales:totalSales.pop().totalsales})
})

router.get(`/get/count`, async (req, res) =>{
  const orderCount = await Order.countDocuments((count) => count)

  if(!orderCount) {
      res.status(500).json({success: false})
  } 
  res.send({
    orderCount: orderCount
  });
})

router.get(`/get/userorders/:userid`, async (req, res) => {
  const userOrderList = await Order.find({user:req.params.userid})
  .populate({path:'orderItems',populate:{path:'product',populate:'category'}}).sort({'dateOrder':-1});


  if (!userOrderList) {
    res.status(500).json({ success: false });
  }
  res.send(userOrderList);
});

module.exports = router;
