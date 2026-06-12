import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  createWasteCategory,
  listWasteCategories,
  getWasteCategoryById,
  updateWasteCategory,
} from '../controllers/waste-categories.controller';

export const wasteCategoriesRouter = Router();

wasteCategoriesRouter.use(authenticate);

wasteCategoriesRouter.get('/', requireRole('admin', 'dispatcher', 'driver', 'business_user'), listWasteCategories);
wasteCategoriesRouter.post('/', requireRole('admin', 'dispatcher'), createWasteCategory);
wasteCategoriesRouter.get('/:id', requireRole('admin', 'dispatcher', 'driver', 'business_user'), getWasteCategoryById);
wasteCategoriesRouter.patch('/:id', requireRole('admin', 'dispatcher'), updateWasteCategory);
