import express from 'express';
import multer from 'multer';
import { staticRequestPaths } from '../constants/config/staticRequestPaths';
import { authMiddleware } from '../middlewares/authMiddleware';
import { uploadImageToS3 } from '../utils';
import { deleteFromS3 } from '../utils/aws/deleteFromS3';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post(
    staticRequestPaths.upload,
    authMiddleware,
    upload.single('image'),
    async (req, res) => {
        try {
            console.log('req', req);
            console.log('req.file', req?.file);
            if (!req.file) {
                return res.status(400).json({ error: 'No file provided.' });
            }

            const fileNameWithoutExtension = req.file.originalname
                .split('.')
                .slice(0, -1)
                .join('.');
            const webpFileName = `${fileNameWithoutExtension}.webp`;

            const webpFile = {
                ...req.file,
                originalname: webpFileName,
                buffer: req.file.buffer,
            } as Express.Multer.File;

            const url = await uploadImageToS3(webpFile);
            res.json({ message: 'Successfully uploaded image.', url });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }
);

router.delete(staticRequestPaths.delete, authMiddleware, async (req, res) => {
    try {
        const { fileName } = req.params;
        await deleteFromS3(fileName);
        res.json({ message: `Successfully deleted image ${fileName}` });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;
