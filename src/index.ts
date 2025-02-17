import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes';
import connection from './configs/dbConnection';

const app = express();
dotenv.config();

const PORT = process.env.PORT || 8081;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(morgan('tiny'));
app.use(cors({}));

// Database Connection
connection();

// Routes
app.use('/api/v1', router);

// Start the Server
app.listen(PORT, () => console.log(`🚀 Server Started At http://localhost:${PORT}`));
