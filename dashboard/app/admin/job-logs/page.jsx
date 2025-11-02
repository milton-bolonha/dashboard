"use client";
import { useState } from "react";
import JobLogs from "@/components/admin/JobLogs";

export default function JobLogsPage() {
  const [jobId, setJobId] = useState("");
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Job Logs</h1>
      <div className="mb-4 flex gap-2">
        <input
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          placeholder="job_..."
          className="border px-2 py-1"
        />
      </div>
      {jobId ? (
        <JobLogs jobId={jobId} />
      ) : (
        <div>Informe um jobId para visualizar os logs.</div>
      )}
    </div>
  );
}
