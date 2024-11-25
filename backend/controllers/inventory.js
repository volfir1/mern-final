// controllers/inventoryController.js
import Inventory from "../models/inventory.js";
import Product from "../models/product.js";
import Supplier from "../models/supplier.js";

// Create a new inventory entry
export const createInventory = async (req, res) => {
  try {
    const { product, supplier, quantity, unitPrice, notes } = req.body;

    // Check if the product and supplier exist
    const existingProduct = await Product.findById(product);
    const existingSupplier = await Supplier.findById(supplier);

    if (!existingProduct || !existingSupplier) {
      return res.status(400).json({ error: "Invalid product or supplier" });
    }

    const inventory = new Inventory({
      product,
      supplier,
      quantity,
      unitPrice,
      notes,
    });

    await inventory.save();
    res.status(201).json(inventory);
  } catch (error) {
    res.status(500).json({ error: "Failed to create inventory entry" });
  }
};

// Get all inventory entries
export const getAllInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate("product", "name")
      .populate("supplier", "name");
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve inventory entries" });
  }
};

// Get a specific inventory entry by ID
export const getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate("product", "name")
      .populate("supplier", "name");

    if (!inventory) {
      return res.status(404).json({ error: "Inventory entry not found" });
    }

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve inventory entry" });
  }
};

// Update an inventory entry
export const updateInventory = async (req, res) => {
  try {
    const { quantity, unitPrice, notes } = req.body;

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({ error: "Inventory entry not found" });
    }

    inventory.quantity = quantity || inventory.quantity;
    inventory.unitPrice = unitPrice || inventory.unitPrice;
    inventory.notes = notes || inventory.notes;

    await inventory.save();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: "Failed to update inventory entry" });
  }
};

// Delete an inventory entry
export const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json({ error: "Inventory entry not found" });
    }

    res.json({ message: "Inventory entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete inventory entry" });
  }
};