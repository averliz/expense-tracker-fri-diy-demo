import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { ensureBucket, uploadFile, getPresignedUrl, deleteFile } from '../lib/minio';

export const attachmentRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Upload attachment to a transaction
attachmentRouter.post(
  '/transactions/:transactionId/attachments',
  upload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

    const transactionId = req.params.transactionId as string;
    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) { res.status(404).json({ error: 'Transaction not found' }); return; }

    await ensureBucket();

    const fileKey = `${transactionId}/${uuidv4()}-${req.file.originalname}`;
    await uploadFile(fileKey, req.file.buffer, req.file.mimetype);

    const attachment = await prisma.attachment.create({
      data: {
        transactionId: transactionId,
        fileName: req.file.originalname,
        fileKey,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });

    res.status(201).json(attachment);
  }
);

// Get attachment metadata
attachmentRouter.get('/attachments/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) { res.status(404).json({ error: 'Attachment not found' }); return; }
  res.json(attachment);
});

// Get presigned download URL
attachmentRouter.get('/attachments/:id/download', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) { res.status(404).json({ error: 'Attachment not found' }); return; }
  const url = await getPresignedUrl(attachment.fileKey);
  res.json({ url });
});

// Delete attachment
attachmentRouter.delete('/attachments/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) { res.status(404).json({ error: 'Attachment not found' }); return; }
  await deleteFile(attachment.fileKey);
  await prisma.attachment.delete({ where: { id } });
  res.status(204).send();
});
