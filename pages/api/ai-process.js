import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { filePath, task } = req.body;
  const scriptPath = path.join(process.cwd(), 'ai', 'processor.py');
  const command = `python3 ${scriptPath} --input "${filePath}" --task ${task}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: 'AI processing failed' });
    }
    try {
      const result = JSON.parse(stdout);
      return res.status(200).json(result);
    } catch (parseError) {
      return res.status(500).json({ error: 'Invalid AI output' });
    }
  });
}