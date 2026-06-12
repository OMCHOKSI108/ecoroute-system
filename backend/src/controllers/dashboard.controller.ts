import { Request, Response } from 'express';
import * as dashService from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  sendSuccess(res, await dashService.getDashboardSummary(orgId));
}

export async function getVehicleWorkloads(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  sendSuccess(res, await dashService.getVehicleWorkloads(orgId));
}

export async function getPickupStats(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  sendSuccess(res, await dashService.getPickupStats(orgId));
}

export async function getTrends(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  sendSuccess(res, await dashService.getTrends(orgId));
}

export async function getDriverActivity(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  sendSuccess(res, await dashService.getDriverActivity(orgId));
}
