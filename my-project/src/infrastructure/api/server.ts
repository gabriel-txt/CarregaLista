import dotenv from 'dotenv';
import '../jobs/background-worker';
import app from './app.js';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
