# HomeLab Manager BE

## Tasks

- [ ] Add more logo images
- [ ] Add error handling and increase timeout for docker commands

## Plans

### Build a queue

```python
from fastapi import FastAPI, BackgroundTasks, HTTPException, status
from pydantic import BaseModel
import asyncio
import uuid
import time

app = FastAPI()

# In-memory store for job status and results
# In a real application, use a database or Redis
job_storage = {}

# Queue for pending jobs
job_queue = asyncio.Queue()

class JobRequest(BaseModel):
    data: str

class JobStatus(BaseModel):
    id: str
    status: str
    result: str | None = None
    error: str | None = None

async def process_job(job_id: str, job_data: str):
    """Simulates a long-running task."""
    try:
        job_storage[job_id]["status"] = "processing"
        print(f"Processing job {job_id} with data: {job_data}")
        # Simulate work
        await asyncio.sleep(5)
        result = f"Processed: {job_data.upper()}"
        job_storage[job_id]["result"] = result
        job_storage[job_id]["status"] = "completed"
        print(f"Job {job_id} completed.")
    except Exception as e:
        job_storage[job_id]["status"] = "failed"
        job_storage[job_id]["error"] = str(e)
        print(f"Job {job_id} failed: {e}")

async def worker():
    """Worker that processes jobs from the queue."""
    while True:
        job_details = await job_queue.get()
        job_id = job_details["id"]
        job_data = job_details["data"]
        await process_job(job_id, job_data)
        job_queue.task_done()

@app.on_event("startup")
async def startup_event():
    # Start the worker task in the background
    asyncio.create_task(worker())

@app.post("/submit-job/", status_code=status.HTTP_202_ACCEPTED, response_model=JobStatus)
async def submit_job(request: JobRequest):
    job_id = str(uuid.uuid4())
    job_storage[job_id] = {
        "id": job_id,
        "status": "pending",
        "data": request.data # Store data for processing
    }
    await job_queue.put({"id": job_id, "data": request.data})
    return JobStatus(id=job_id, status="pending")

@app.get("/job-status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    job = job_storage.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return JobStatus(**job)

# To run this:
# pip install fastapi uvicorn pydantic
# uvicorn your_file_name:app --reload
```
