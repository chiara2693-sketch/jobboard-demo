const API_URL = "http://localhost:3001";

export async function fetchJobs() {
  const res = await fetch(`${API_URL}/jobs`);
  return res.json();
}

export async function applyToJob(jobId, candidate) {
  const res = await fetch(`${API_URL}/apply/${jobId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(candidate)
  });
  return res.json();
}