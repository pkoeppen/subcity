// const madge = require("madge");

// madge("./schema/index.js")
// .then(res => {
// 	console.log(res.warnings())
// })


const stripe = require("stripe")("sk_test_BI5TlPZAqxkpHNvAdGgHkEKy");

(async () => {

  await stripe.plans.create({
	  amount: 1,
	  currency: "usd",
	  id: "plan_extra",
	  interval: "month",
	  product: {
	    id:   "prod_extra",
	    name: "prod_extra"
	  }
	});

	// Create free Stripe coupon.

	await stripe.coupons.create({
	  percent_off: 100,
	  duration: "forever",
	  id: "deactivated"
	});

})();