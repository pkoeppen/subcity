function f () {
	return new Promise(resolve => {
		setTimeout(() => { resolve({ new_plan_id: 123 }); }, 1000);
	})
}

async function a () {
	const [
		{ new_plan_id }
	] = await Promise.all([
		f(),
		Promise.resolve("bar")
	])

	console.log(new_plan_id)
}

a();
