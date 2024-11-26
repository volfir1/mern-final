app.get('/prod-list/:wearables', async (req, res) => {
  const category = req.params.wearables;  // This gets the "wearables" part from the URL
  
  // Query to find products in the specified category (wearables)
  const query = { category: category };
  
  // Find the products based on the query and convert them to an array
  const results = await prodCollection.find(query).toArray();
  
  // Send the filtered products as the response
  res.send(results);
});
