// 1. Subscriber subscribes to channel directly

subscription_direct = {
	subscriber_id: "subscriber_123",
	channel_id: "channel_123",
	syndicate_id: null,
	rate: 499,
	plan_id: "plan_abc"
};

// 2. Channel (subscribed) joins syndicate

// 3. Subscriber subscribes to syndicate with channel (subscribed)
//    - Create Stripe subscription syndicate
//    - Create DynamoDB subscription syndicate
//    - Delete Stripe subscription channel
//    - Delete DynamoDB subscription channel

new_subscription = {
	subscriber_id: "subscriber_123",
	channel_id: null,
	syndicate_id: "syndicate_123",
	rate: 1999,
	plan_id: "plan_xyz"
};

// 4. Syndicate (subscribed) merges into master
//    - Convert subscription

converted_subscription = {
	subscriber_id: "subscriber_123",
	channel_id: null,
	syndicate_id: "syndicate_456", // changes
	rate: 1999,                    // remains the same
	plan_id: "plan_xyz"            // remains the same
};

// 5. Channel (subscribed) joins master (subscribed)
//    - Delete Stripe subscription channel
//    - Delete DynamoDB subscription channel

// 6. Channel deletes self or leaves syndicate (subscribed)
//    - (nothing)

// 7. Subscriber unsubscribes from channel (subscribed)
//    - Delete Stripe subscription channel
//    - Delete DynamoDB subscription channel

// 8. Subscriber unsubscribes from syndicate (subscribed)
//    - Delete Stripe subscription syndicate
//    - Delete DynamoDB subscription syndicate