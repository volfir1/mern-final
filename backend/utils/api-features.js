import mongoose from 'mongoose';

class APIFeatures {
  constructor(query, queryStr) {
    this.query = query; // The mongoose query
    this.queryStr = queryStr; // The query string parameters
  }

  // Search for products by keyword
  search() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i", // Case-insensitive search
          },
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  // Filter products based on various parameters
  filter() {
    const queryCopy = { ...this.queryStr };

    // Removing fields that are not for filtering
    const removeFields = ["keyword", "limit", "page"];
    removeFields.forEach((el) => delete queryCopy[el]);

    // Advanced filtering for price, ratings, etc.
    let queryStr = JSON.stringify(queryCopy);

    // Replacing operators for MongoDB
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  // Fetch only product names for validation purposes
  fetchProductNames() {
    // Return only the 'name' field from the documents
    this.query = this.query.find({}, { name: 1, _id: 0 });
    return this;
  }

  // Paginate results
  pagination(resPerPage) {
    const currentPage = Number(this.queryStr.page) || 1; // Current page number
    const skip = resPerPage * (currentPage - 1); // Skip for pagination

    this.query = this.query.limit(resPerPage).skip(skip); // Limit and skip
    return this;
  }

  // Validate query parameters
  validate() {
    const errors = [];

    // Validate page number
    if (this.queryStr.page && isNaN(this.queryStr.page)) {
      errors.push('Page must be a number');
    }

    // Validate limit
    if (this.queryStr.limit && isNaN(this.queryStr.limit)) {
      errors.push('Limit must be a number');
    }

    // Validate price range
    if (this.queryStr.price) {
      const price = this.queryStr.price;
      if (price.gt && isNaN(price.gt)) errors.push('Price gt must be a number');
      if (price.gte && isNaN(price.gte)) errors.push('Price gte must be a number');
      if (price.lt && isNaN(price.lt)) errors.push('Price lt must be a number');
      if (price.lte && isNaN(price.lte)) errors.push('Price lte must be a number');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return this;
  }
}

export default APIFeatures; // Use ES6 export
