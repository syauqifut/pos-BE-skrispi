import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { uploadProductImage, handleUploadError } from '../../middlewares/upload.middleware';

const router = Router();
const inventoryController = new InventoryController();

/**
 * @route   GET /inventory/listProduct
 * @desc    Get all products with search, filter, sort, and pagination
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
 * @route   GET /inventory/transactionList
 * @desc    Get all transactions
 * @access  Private (requires authentication)
 */
router.get('/transactionList', authenticateToken, inventoryController.findTransactionList);

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
 * @route   POST /inventory/uploadProductImage/:id
 * @desc    Upload product image
 * @access  Private (requires authentication)
 */
router.post(
  '/uploadProductImage/:id', 
  authenticateToken, 
  uploadProductImage.single('image'),
  handleUploadError,
  inventoryController.uploadProductImage
);

export default router; 