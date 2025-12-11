import express from 'express';
import multer from 'multer';
import { staticRequestPaths } from '../constants/config/staticRequestPaths';
import { authMiddleware } from '../middlewares/authMiddleware';
import { uploadFileToS3 } from '../utils/aws/uploadFileToS3';
import { deleteFromS3 } from '../utils/aws/deleteFromS3';
import { fromAwsUrl } from '../utils/aws/fromAwsUrl';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post(
    staticRequestPaths.upload,
    authMiddleware,
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file provided.' });
            }

            const webpFile = {
                ...req.file,
                originalname: req.file.originalname,
                buffer: req.file.buffer,
            } as Express.Multer.File;

            const url = await uploadFileToS3(webpFile);
            res.json({ message: 'Successfully uploaded file.', url });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }
);

router.delete(staticRequestPaths.delete, authMiddleware, async (req, res) => {
    try {
        const { fileUrl } = req.body;

        if (!fileUrl) {
            return res.status(400).json({ error: 'No file URL provided.' });
        }

        const key = fromAwsUrl(fileUrl);
        if (!key) {
            return res
                .status(400)
                .json({ error: 'Provided file URL is not valid.' });
        }

        await deleteFromS3(key);
        res.json({ message: `Successfully deleted file ${key}` });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;
