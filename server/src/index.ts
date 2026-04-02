import express from 'express';
import cors from 'cors';
import path from 'path';
import testsRouter from './routes/tests';
import uploadRouter from './routes/upload';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use('/api/tests', testsRouter);
app.use('/api/upload', uploadRouter);

// serve built frontend in production
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
