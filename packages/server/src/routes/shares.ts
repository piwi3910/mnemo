import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { NoteShare } from "../entities/NoteShare";
import { AccessRequest } from "../entities/AccessRequest";
import { User } from "../entities/User";
import { getSharedNotesForUser } from "../services/shareService";

/**
 * @swagger
 * /shares:
 *   post:
 *     summary: Create a share
 *     description: Share a note or folder with another user.
 *     tags: [Sharing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *               - isFolder
 *               - sharedWithUserId
 *               - permission
 *             properties:
 *               path:
 *                 type: string
 *               isFolder:
 *                 type: boolean
 *               sharedWithUserId:
 *                 type: string
 *               permission:
 *                 type: string
 *                 enum: [read, readwrite]
 *     responses:
 *       201:
 *         description: Share created
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Share already exists
 *       500:
 *         description: Server error
 *   get:
 *     summary: List my shares (as owner)
 *     description: Returns all shares where the current user is the owner.
 *     tags: [Sharing]
 *     responses:
 *       200:
 *         description: List of shares
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /shares/with-me:
 *   get:
 *     summary: List shares with me
 *     description: Returns all notes and folders shared with the current user.
 *     tags: [Sharing]
 *     responses:
 *       200:
 *         description: List of shares with enriched owner info
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /shares/{id}:
 *   put:
 *     summary: Update share permission
 *     description: Update the permission on a share you own.
 *     tags: [Sharing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission
 *             properties:
 *               permission:
 *                 type: string
 *                 enum: [read, readwrite]
 *     responses:
 *       200:
 *         description: Share updated
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Share not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Revoke a share
 *     description: Delete a share you own.
 *     tags: [Sharing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Share revoked
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Share not found
 *       500:
 *         description: Server error
 */
export function createSharesRouter(): Router {
  const router = Router();

  // POST /api/shares — Create a share
  router.post("/", async (req: Request, res: Response) => {
    try {
      const { path, isFolder, sharedWithUserId, permission } = req.body as {
        path?: string;
        isFolder?: boolean;
        sharedWithUserId?: string;
        permission?: string;
      };

      if (!path || isFolder === undefined || !sharedWithUserId || !permission) {
        res.status(400).json({ error: "path, isFolder, sharedWithUserId, and permission are required" });
        return;
      }

      if (sharedWithUserId === req.user!.id) {
        res.status(400).json({ error: "Cannot share with yourself" });
        return;
      }

      const repo = AppDataSource.getRepository(NoteShare);
      const share = repo.create({
        ownerUserId: req.user!.id,
        path,
        isFolder,
        sharedWithUserId,
        permission,
      });

      const saved = await repo.save(share);
      res.status(201).json(saved);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message.includes("UNIQUE") || err.message.includes("duplicate"))
      ) {
        res.status(409).json({ error: "Share already exists" });
        return;
      }
      console.error("Error creating share:", err);
      res.status(500).json({ error: "Failed to create share" });
    }
  });

  // GET /api/shares — List my shares (as owner)
  router.get("/", async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(NoteShare);
      const shares = await repo.find({
        where: { ownerUserId: req.user!.id },
      });
      res.json(shares);
    } catch (err) {
      console.error("Error listing shares:", err);
      res.status(500).json({ error: "Failed to list shares" });
    }
  });

  // GET /api/shares/with-me — List shares with me
  router.get("/with-me", async (req: Request, res: Response) => {
    try {
      const shares = await getSharedNotesForUser(req.user!.id);
      res.json(shares);
    } catch (err) {
      console.error("Error listing shared notes:", err);
      res.status(500).json({ error: "Failed to list shared notes" });
    }
  });

  // PUT /api/shares/:id — Update permission
  router.put("/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { permission } = req.body as { permission?: string };

      if (!permission) {
        res.status(400).json({ error: "permission is required" });
        return;
      }

      const repo = AppDataSource.getRepository(NoteShare);
      const share = await repo.findOne({ where: { id } });

      if (!share) {
        res.status(404).json({ error: "Share not found" });
        return;
      }

      if (share.ownerUserId !== req.user!.id) {
        res.status(403).json({ error: "Not the owner of this share" });
        return;
      }

      share.permission = permission;
      const updated = await repo.save(share);
      res.json(updated);
    } catch (err) {
      console.error("Error updating share:", err);
      res.status(500).json({ error: "Failed to update share" });
    }
  });

  // DELETE /api/shares/:id — Revoke share
  router.delete("/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const repo = AppDataSource.getRepository(NoteShare);
      const share = await repo.findOne({ where: { id } });

      if (!share) {
        res.status(404).json({ error: "Share not found" });
        return;
      }

      if (share.ownerUserId !== req.user!.id) {
        res.status(403).json({ error: "Not the owner of this share" });
        return;
      }

      await repo.remove(share);
      res.json({ message: "Share revoked" });
    } catch (err) {
      console.error("Error revoking share:", err);
      res.status(500).json({ error: "Failed to revoke share" });
    }
  });

  return router;
}

/**
 * @swagger
 * /access-requests:
 *   post:
 *     summary: Request access to a note
 *     description: Create an access request for a note owned by another user.
 *     tags: [Access Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ownerUserId
 *               - notePath
 *             properties:
 *               ownerUserId:
 *                 type: string
 *               notePath:
 *                 type: string
 *     responses:
 *       201:
 *         description: Access request created
 *       200:
 *         description: Existing request returned or re-opened
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 *   get:
 *     summary: List pending access requests (as owner)
 *     description: Returns pending access requests where the current user is the note owner.
 *     tags: [Access Requests]
 *     responses:
 *       200:
 *         description: List of pending access requests
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /access-requests/mine:
 *   get:
 *     summary: List my outgoing access requests
 *     description: Returns all access requests made by the current user.
 *     tags: [Access Requests]
 *     responses:
 *       200:
 *         description: List of outgoing access requests
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /access-requests/{id}:
 *   put:
 *     summary: Approve or deny an access request
 *     description: Approve or deny a pending access request for a note you own.
 *     tags: [Access Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, deny]
 *               permission:
 *                 type: string
 *                 enum: [read, readwrite]
 *                 description: Required when action is approve
 *     responses:
 *       200:
 *         description: Access request updated
 *       400:
 *         description: Invalid action
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Access request not found
 *       500:
 *         description: Server error
 */
export function createAccessRequestsRouter(): Router {
  const router = Router();

  // POST /api/access-requests — Request access
  router.post("/", async (req: Request, res: Response) => {
    try {
      const { ownerUserId, notePath } = req.body as {
        ownerUserId?: string;
        notePath?: string;
      };

      if (!ownerUserId || !notePath) {
        res.status(400).json({ error: "ownerUserId and notePath are required" });
        return;
      }

      const repo = AppDataSource.getRepository(AccessRequest);
      const existing = await repo.findOne({
        where: {
          requesterUserId: req.user!.id,
          ownerUserId,
          notePath,
        },
      });

      if (existing) {
        if (existing.status === "denied") {
          existing.status = "pending";
          const updated = await repo.save(existing);
          res.json(updated);
          return;
        }
        // pending or approved — return as-is
        res.json(existing);
        return;
      }

      const request = repo.create({
        requesterUserId: req.user!.id,
        ownerUserId,
        notePath,
        status: "pending",
      });

      const saved = await repo.save(request);
      res.status(201).json(saved);
    } catch (err) {
      console.error("Error creating access request:", err);
      res.status(500).json({ error: "Failed to create access request" });
    }
  });

  // GET /api/access-requests — List pending requests I need to act on (as owner)
  router.get("/", async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AccessRequest);
      const requests = await repo
        .createQueryBuilder("ar")
        .leftJoinAndSelect("ar.requester", "requester")
        .where("ar.ownerUserId = :userId", { userId: req.user!.id })
        .andWhere("ar.status = :status", { status: "pending" })
        .getMany();

      // Strip sensitive fields from requester
      const result = requests.map((r) => ({
        ...r,
        requester: r.requester
          ? { id: r.requester.id, name: r.requester.name, email: r.requester.email }
          : null,
      }));

      res.json(result);
    } catch (err) {
      console.error("Error listing access requests:", err);
      res.status(500).json({ error: "Failed to list access requests" });
    }
  });

  // GET /api/access-requests/mine — List my outgoing requests
  router.get("/mine", async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AccessRequest);
      const requests = await repo.find({
        where: { requesterUserId: req.user!.id },
      });
      res.json(requests);
    } catch (err) {
      console.error("Error listing my access requests:", err);
      res.status(500).json({ error: "Failed to list access requests" });
    }
  });

  // PUT /api/access-requests/:id — Approve or deny
  router.put("/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { action, permission } = req.body as {
        action?: "approve" | "deny";
        permission?: "read" | "readwrite";
      };

      if (!action || (action !== "approve" && action !== "deny")) {
        res.status(400).json({ error: "action must be 'approve' or 'deny'" });
        return;
      }

      const repo = AppDataSource.getRepository(AccessRequest);
      const request = await repo.findOne({ where: { id } });

      if (!request) {
        res.status(404).json({ error: "Access request not found" });
        return;
      }

      if (request.ownerUserId !== req.user!.id) {
        res.status(403).json({ error: "Not the owner of the requested note" });
        return;
      }

      if (action === "approve") {
        if (!permission) {
          res.status(400).json({ error: "permission is required when approving" });
          return;
        }

        // Create NoteShare
        const shareRepo = AppDataSource.getRepository(NoteShare);
        const share = shareRepo.create({
          ownerUserId: request.ownerUserId,
          path: request.notePath,
          isFolder: false,
          sharedWithUserId: request.requesterUserId,
          permission,
        });
        await shareRepo.save(share);

        request.status = "approved";
      } else {
        request.status = "denied";
      }

      const updated = await repo.save(request);
      res.json(updated);
    } catch (err) {
      console.error("Error updating access request:", err);
      res.status(500).json({ error: "Failed to update access request" });
    }
  });

  return router;
}
