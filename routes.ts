import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateAIResponse, generateSharingMessage, analyzeReferralData, suggestFollowUp } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // API routes
  
  // User routes
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const users = [req.user]; // In a real app, admin would see all users
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  // Customer routes
  app.get("/api/customers", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const customers = await storage.getCustomers(req.user!.id);
      res.json(customers);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/customers/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const customer = await storage.getCustomer(parseInt(req.params.id));
      if (!customer || customer.userId !== req.user!.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/customers", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const customer = await storage.createCustomer({
        ...req.body,
        userId: req.user!.id,
      });
      
      // Create activity for new customer
      await storage.createActivity({
        userId: req.user!.id,
        type: "customer_added",
        description: `Added new customer ${customer.name}`,
      });
      
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/customers/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const customerId = parseInt(req.params.id);
      const existingCustomer = await storage.getCustomer(customerId);
      
      if (!existingCustomer || existingCustomer.userId !== req.user!.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const updatedCustomer = await storage.updateCustomer(customerId, req.body);
      
      // Create activity for customer update
      await storage.createActivity({
        userId: req.user!.id,
        type: "customer_updated",
        description: `Updated customer ${updatedCustomer!.name}`,
      });
      
      res.json(updatedCustomer);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/customers/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const customerId = parseInt(req.params.id);
      const existingCustomer = await storage.getCustomer(customerId);
      
      if (!existingCustomer || existingCustomer.userId !== req.user!.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const customerName = existingCustomer.name;
      const success = await storage.deleteCustomer(customerId);
      
      if (success) {
        // Create activity for customer deletion
        await storage.createActivity({
          userId: req.user!.id,
          type: "customer_deleted",
          description: `Deleted customer ${customerName}`,
        });
        
        res.sendStatus(204);
      } else {
        res.status(500).json({ message: "Failed to delete customer" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/customers/import", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const customersToImport = req.body.customers.map((customer: any) => ({
        ...customer,
        userId: req.user!.id,
      }));
      
      const importedCustomers = await storage.bulkImportCustomers(customersToImport);
      
      // Create activity for bulk import
      await storage.createActivity({
        userId: req.user!.id,
        type: "customers_imported",
        description: `Imported ${importedCustomers.length} customers`,
      });
      
      res.status(201).json(importedCustomers);
    } catch (error) {
      next(error);
    }
  });

  // Campaign routes
  app.get("/api/campaigns", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const campaigns = await storage.getCampaigns(req.user!.id);
      res.json(campaigns);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/campaigns/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign || campaign.userId !== req.user!.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/campaigns", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const campaign = await storage.createCampaign({
        ...req.body,
        userId: req.user!.id,
      });
      
      // Create activity for new campaign
      await storage.createActivity({
        userId: req.user!.id,
        type: "campaign_created",
        description: `Created new campaign "${campaign.name}"`,
      });
      
      res.status(201).json(campaign);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/campaigns/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const campaignId = parseInt(req.params.id);
      const existingCampaign = await storage.getCampaign(campaignId);
      
      if (!existingCampaign || existingCampaign.userId !== req.user!.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      const updatedCampaign = await storage.updateCampaign(campaignId, req.body);
      
      // Create activity for campaign update
      await storage.createActivity({
        userId: req.user!.id,
        type: "campaign_updated",
        description: `Updated campaign "${updatedCampaign!.name}"`,
      });
      
      res.json(updatedCampaign);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/campaigns/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const campaignId = parseInt(req.params.id);
      const existingCampaign = await storage.getCampaign(campaignId);
      
      if (!existingCampaign || existingCampaign.userId !== req.user!.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      const campaignName = existingCampaign.name;
      const success = await storage.deleteCampaign(campaignId);
      
      if (success) {
        // Create activity for campaign deletion
        await storage.createActivity({
          userId: req.user!.id,
          type: "campaign_deleted",
          description: `Deleted campaign "${campaignName}"`,
        });
        
        res.sendStatus(204);
      } else {
        res.status(500).json({ message: "Failed to delete campaign" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Referral routes
  app.get("/api/referrals", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const referrals = await storage.getReferrals(req.user!.id);
      res.json(referrals);
    } catch (error) {
      next(error);
    }
  });

  // AI Assistant routes
  app.post("/api/ai/assistant", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const { message } = req.body;
      
      // Generate response based on message and user
      const response = await generateAIResponse(message, req.user!.id);
      
      // Create activity for AI interaction
      await storage.createActivity({
        userId: req.user!.id,
        type: "ai_interaction",
        description: `Used AI assistant: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`,
      });
      
      res.json({ response });
    } catch (error) {
      next(error);
    }
  });

  // Analytics routes
  app.get("/api/analytics/referrals", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const stats = await storage.getReferralStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/campaigns/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign || campaign.userId !== req.user!.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      const stats = await storage.getCampaignStats(campaignId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // Activity routes
  app.get("/api/activities", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getActivities(req.user!.id, limit);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  // Reward routes
  app.get("/api/rewards", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const rewards = await storage.getRewards(req.user!.id);
      res.json(rewards);
    } catch (error) {
      next(error);
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
