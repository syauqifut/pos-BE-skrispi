import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';

const   router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Mount inventory routes
router.use('/inventory', inventoryRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'POS Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to POS Backend API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        verify: 'GET /api/auth/verify',
        logout: 'POST /api/auth/logout'
      },
      inventory: {
        listProduct: 'GET /api/inventory/listProduct',
        detailProduct: 'GET /api/inventory/detailProduct/:id',
        addProduct: 'POST /api/inventory/addProduct',
        updateProduct: 'PUT /api/inventory/updateProduct/:id',
        deleteProduct: 'DELETE /api/inventory/deleteProduct/:id'
      },
      health: 'GET /api/health'
    }
  });
});

export default router; 