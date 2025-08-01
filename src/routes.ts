import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import cashierRoutes from './modules/cashier/cashier.routes';
import reportRoutes from './modules/report/report.routes';

const   router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Mount inventory routes
router.use('/inventory', inventoryRoutes);

// Mount cashier routes
router.use('/cashier', cashierRoutes);

// Mount report routes
router.use('/report', reportRoutes);

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
        deleteProduct: 'DELETE /api/inventory/deleteProduct/:id',
        transactionList: 'GET /api/inventory/transactionList',
        transactionDetail: 'GET /api/inventory/transactionDetail/:id',
        uploadProductImage: 'POST /api/inventory/uploadProductImage'
      },
      cashier: {
        showQris: 'GET /api/cashier/showQris',
        reviewOrder: 'POST /api/cashier/reviewOrder',
        checkout: 'POST /api/cashier/checkout'
      },
      report: {
        dashboard: 'GET /api/report/dashboard?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD',
        sales: 'GET /api/report/sales?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD',
        profit: 'GET /api/report/profit?date=YYYY-MM-DD',
        products: 'GET /api/report/products?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD',
        restock: 'GET /api/report/restock?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD',
      },
      health: 'GET /api/health'
    }
  });
});

export default router; 