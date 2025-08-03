import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { uploadProductImage, handleUploadError } from '../../middlewares/upload.middleware';

const router = Router();
const inventoryController = new InventoryController();

/**
 * @route   GET /inventory/listProduct
 * @desc    Get all products with search, filter, sort, and pagination
 * @query   search, category_id, sort_by, sort_order, page, limit
 * @access  Public
 */
router.get('/listProduct', authenticateToken, inventoryController.findAll);

/**
 * @route   GET /inventory/detailProduct/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/detailProduct/:id', authenticateToken, inventoryController.findById);

/**
 * @route   POST /inventory/addProduct
 * @desc    Create new product
 * @access  Private (requires authentication)
 */
router.post('/addProduct', authenticateToken, inventoryController.create);

/**
 * @route   PUT /inventory/updateProduct/:id
 * @desc    Update product
 * @access  Private (requires authentication)
 */
router.put('/updateProduct/:id', authenticateToken, inventoryController.update);

/**
 * @route   DELETE /inventory/deleteProduct/:id
 * @desc    Soft delete product
 * @access  Private (requires authentication)
 */
router.delete('/deleteProduct/:id', authenticateToken, inventoryController.delete);

/**
 * @route   DELETE /inventory/deleteProductMultiple
 * @desc    Soft delete multiple products
 * @access  Private (requires authentication)
 */
router.delete('/deleteProduct', authenticateToken, inventoryController.deleteMultiple);

/**
 * @route   POST /inventory/purchaseTransaction
 * @desc    Purchase transaction
 * @access  Private (requires authentication)
 */
router.post('/purchaseTransaction', authenticateToken, inventoryController.purchaseTransaction);

/**
 * @route   POST /inventory/adjustmentTransaction
 * @desc    Adjustment transaction
 * @access  Private (requires authentication)
 */
router.post('/adjustmentTransaction', authenticateToken, inventoryController.adjustmentTransaction);

/**
 * @route   POST /inventory/uploadProductImage
 * @desc    Upload product image
 * @access  Private (requires authentication)
 */
router.post(
  '/uploadProductImage', 
  authenticateToken, 
  uploadProductImage.single('image'),
  handleUploadError,
  inventoryController.uploadProductImage
);

// inventory

/**
 * @route   GET /inventory/transactionList
 * @desc    Get all transactions
 * @access  Private (requires authentication)
 */
router.get('/transactionList', authenticateToken, inventoryController.findTransactionList);

/**
 * @route   GET /inventory/transactionDetail/:id
 * @desc    Get transaction detail
 * @access  Private (requires authentication)
 */
router.get('/transactionDetail/:id', authenticateToken, inventoryController.findTransactionDetail);

export default router; 