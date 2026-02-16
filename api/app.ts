import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();

// Basic Middleware
app.use(cors());
// app.use(express.json()); // Moved down

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    next();
});

app.use(express.json());

// Paths
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const OUTPUTS_DIR = path.join(process.cwd(), 'outputs');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR);

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // We attach jobId to req in the middleware before upload
    const jobId = (req as any).jobId;
    console.log(`[Multer] Uploading file ${file.originalname} for job ${jobId}`);
    const jobDir = path.join(UPLOADS_DIR, jobId);
    if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });
    cb(null, jobDir);
  },
  filename: (req, file, cb) => {
    console.log(`[Multer] Saving file ${file.originalname}`);
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Types & State
type JobStatus = 'queued' | 'running' | 'done' | 'error' | 'canceled';

interface Job {
  id: string;
  status: JobStatus;
  images: string[];
  settings: any;
  propertyId: string;
  createdAt: number;
  outputDir: string;
  files?: string[];
  zipFile?: string;
  error?: string;
  process?: any; 
  progress?: Record<string, number>; // Store progress per format
}

const jobs: Record<string, Job> = {};
const queue: string[] = [];
let isProcessing = false;

// Queue Processor
async function processQueue() {
    if (isProcessing || queue.length === 0) return;
    
    const jobId = queue.shift();
    if (!jobId) return;
    
    const job = jobs[jobId];
    if (!job || job.status === 'canceled') {
        processQueue();
        return;
    }

    isProcessing = true;
    job.status = 'running';
    job.progress = {
        '9x16': 0,
        '1x1': 0,
        '4x5': 0,
        '16x9': 0
    };
    
    // Create output dir
    if (!fs.existsSync(job.outputDir)) fs.mkdirSync(job.outputDir, { recursive: true });

    console.log(`Starting job ${jobId}`);

    // Determine python command (python or python3) or exe
    const isWin = process.platform === 'win32';
    
    // Check if bundled exe exists (for packaged app)
    // In dev: api/bin/generator.exe
    // In prod (packaged): resources/bin/generator.exe or similar
    const bundledExe = path.join(process.cwd(), 'api', 'bin', 'generator.exe');
    // process.resourcesPath might be undefined in child process, pass via env
    const resPath = (process as any).resourcesPath || process.env.RESOURCES_PATH || '';
    const bundledExeProd = path.join(resPath, 'bin', 'generator.exe');
    
    // Debug log for paths
    console.log("CWD:", process.cwd());
    console.log("Bundled Exe Dev:", bundledExe);
    console.log("Bundled Exe Prod:", bundledExeProd);
    console.log("Resources Path:", (process as any).resourcesPath);

    let cmd = '';
    let args: string[] = [];
    
    // Script path for dev mode
    const scriptPath = path.join(process.cwd(), 'api', 'generator', 'generator.py');

    if (fs.existsSync(bundledExe)) {
        console.log("Using local bundled generator.exe");
        cmd = bundledExe;
        args = [
            '--images', ...job.images,
            '--id', job.propertyId,
            '--output', job.outputDir,
            '--settings', JSON.stringify(job.settings)
        ];
    } else if (fs.existsSync(bundledExeProd)) {
         console.log("Using prod bundled generator.exe");
         cmd = bundledExeProd;
         args = [
            '--images', ...job.images,
            '--id', job.propertyId,
            '--output', job.outputDir,
            '--settings', JSON.stringify(job.settings)
        ];
    } else {
        // Fallback to python script
        console.log("Using python script");
        
        // Use full Python path on Windows
        const pythonPath = isWin 
            ? 'C:\\Users\\User\\AppData\\Local\\Programs\\Python\\Python311\\python.exe'
            : 'python3';
        
        // If we are here in prod, it means generator.exe is missing!
        console.error("CRITICAL: Generator executable not found!");
        console.log("Job images:", job.images);
        console.log("Job images count:", job.images.length);
        
        // Fix: pass images as comma-separated or ensure proper array spreading
        args = [
            scriptPath,
            '--images', ...job.images,
            '--id', job.propertyId,
            '--output', job.outputDir,
            '--settings', JSON.stringify(job.settings)
        ];
        cmd = pythonPath;
    }

    console.log(`Executing: ${cmd} ${args.length > 5 ? args.slice(0, 5).join(' ') + ' ...' : args.join(' ')}`);

    const child = spawn(cmd, args);
    job.process = child;

    let stdout = '';
    let stderr = '';

    child.on('error', (err) => {
        console.error(`[Job ${jobId}] Failed to spawn python process: ${err}`);
        job.status = 'error';
        job.error = `Failed to spawn python process: ${err.message}`;
        isProcessing = false;
        processQueue();
    });

    child.stdout.on('data', (data) => {
        const str = data.toString();
        stdout += str;
        console.log(`[Job ${jobId}] ${str.trim()}`);
    });

    child.stderr.on('data', (data) => {
        const str = data.toString();
        
        // Parse progress: ::PROGRESS::format::percent
        // Could be multiple lines
        const lines = str.split('\n');
        for (const line of lines) {
            const progressMatch = line.match(/::PROGRESS::(.*?)::(\d+)/);
            if (progressMatch && job.progress) {
                const fmt = progressMatch[1];
                const pct = parseInt(progressMatch[2]);
                if (job.progress[fmt] !== undefined) {
                    job.progress[fmt] = pct;
                }
            } else if (line.trim()) {
                stderr += line + '\n';
                console.error(`[Job ${jobId} ERR] ${line.trim()}`);
            }
        }
    });

    child.on('close', async (code) => {
        job.process = undefined;
        isProcessing = false;

        if (code === 0) {
            try {
                // Parse stdout for last JSON line
                const lines = stdout.trim().split('\n');
                // Find the line that looks like JSON result
                let result = null;
                for (let i = lines.length - 1; i >= 0; i--) {
                    try {
                        const parsed = JSON.parse(lines[i]);
                        if (parsed.status) {
                            result = parsed;
                            break;
                        }
                    } catch (e) {}
                }
                
                if (result && result.status === 'success') {
                    job.files = result.files;
                    
                    // Create ZIP
                    const zipName = `${job.propertyId}_output.zip`;
                    const zipPath = path.join(job.outputDir, zipName);
                    
                    await createZip(job.outputDir, job.files!, zipPath);
                    job.zipFile = zipPath;
                    job.status = 'done';
                } else {
                    job.status = 'error';
                    job.error = result?.message || 'Unknown python error (no JSON result)';
                }
            } catch (e) {
                job.status = 'error';
                job.error = 'Failed to parse generator output: ' + e;
            }
        } else {
            if (job.status !== 'canceled') {
                job.status = 'error';
                job.error = `Generator exited with code ${code}. Stderr: ${stderr}`;
            }
        }
        
        // Trigger next job
        processQueue();
    });
}

function createZip(sourceDir: string, files: string[], outPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));
        
        archive.pipe(output);
        files.forEach(f => {
            archive.file(path.join(sourceDir, f), { name: f });
        });
        archive.finalize();
    });
}

// Routes

// 1. Create Job
app.post('/api/generate', (req, res, next) => {
    const jobId = uuidv4();
    (req as any).jobId = jobId;
    next();
}, upload.fields([{ name: 'images', maxCount: 20 }, { name: 'music', maxCount: 1 }]), (req, res) => {
    try {
        const jobId = (req as any).jobId;
        const propertyId = req.body.propertyId || 'prop';
        const settings = JSON.parse(req.body.settings || '{}');
        const textOverlay = JSON.parse(req.body.textOverlay || '{}');
        
        const files = (req.files as any)['images'] ? (req.files as any)['images'].map((f: any) => f.path) : [];
        const musicFile = (req.files as any)['music'] ? (req.files as any)['music'][0].path : undefined;
        
        console.log("Uploaded files:", req.files);
        console.log("Image files:", files);
        console.log("Image count:", files.length);

        const job: Job = {
            id: jobId,
            status: 'queued',
            images: files,
            settings: { ...settings, musicFile, textOverlay },
            propertyId,
            createdAt: Date.now(),
            outputDir: path.join(OUTPUTS_DIR, jobId)
        };

        jobs[jobId] = job;
        queue.push(jobId);
        
        processQueue(); 

        res.json({ jobId });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

// 2. Get Job Status
app.get('/api/jobs/:id', (req, res) => {
    const job = jobs[req.params.id];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    res.json({
        jobId: job.id,
        status: job.status,
        files: job.files,
        zipFile: job.zipFile ? path.basename(job.zipFile) : undefined,
        error: job.error,
        progress: job.progress
    });
});

// 3. Download Artifacts
app.get('/api/jobs/:id/download/:filename', (req, res) => {
    const job = jobs[req.params.id];
    if (!job) return res.status(404).send('Job not found');
    
    const filename = req.params.filename;
    // Security check
    const isValid = (job.files && job.files.includes(filename)) || 
                    (job.zipFile && filename === path.basename(job.zipFile));
    
    if (!isValid) return res.status(403).send('Access denied');
    
    const filePath = path.join(job.outputDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
    
    res.download(filePath);
});

// 4. Cancel Job
app.post('/api/jobs/:id/cancel', (req, res) => {
    const job = jobs[req.params.id];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    if (job.status === 'running' && job.process) {
        job.process.kill();
        job.status = 'canceled';
        isProcessing = false;
        setTimeout(processQueue, 100); 
    } else if (job.status === 'queued') {
        job.status = 'canceled';
        const idx = queue.indexOf(job.id);
        if (idx > -1) queue.splice(idx, 1);
    }
    
    res.json({ status: 'canceled' });
});

// 5. List Jobs (Outputs Page)
app.get('/api/jobs', (req, res) => {
    // Return list of jobs sorted by date desc
    const list = Object.values(jobs)
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(j => ({
            jobId: j.id,
            propertyId: j.propertyId,
            status: j.status,
            createdAt: j.createdAt,
            filesCount: j.files ? j.files.length : 0,
            hasZip: !!j.zipFile
        }));
    res.json(list);
});

// Root
app.get('/api', (req, res) => {
  res.send('Lumina Vids API Running');
});

export default app;
