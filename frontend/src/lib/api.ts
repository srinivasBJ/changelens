import {
  BlastRadiusGraph,
  Change,
  DashboardStats,
  EvidenceArtifact,
  EvidencePack,
  InvestigationCase,
  NarrativeResult,
  OperationalMemory,
  TimelineEvent,
} from './types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : typeof window !== 'undefined'
    ? ''
    : 'http://127.0.0.1:8000';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error(`API fetch failed for ${endpoint}:`, error);
    throw error;
  }
}

export async function getStats(): Promise<DashboardStats> {
  return fetchJson<DashboardStats>('/api/stats');
}

export async function getChanges(): Promise<Change[]> {
  return fetchJson<Change[]>('/api/changes');
}

export async function getChange(id: string): Promise<Change> {
  return fetchJson<Change>(`/api/changes/${id}`);
}

export async function getInvestigations(): Promise<InvestigationCase[]> {
  return fetchJson<InvestigationCase[]>('/api/investigations');
}

export async function getInvestigation(id: string): Promise<InvestigationCase> {
  return fetchJson<InvestigationCase>(`/api/investigations/${id}`);
}

export async function getTimeline(id: string): Promise<TimelineEvent[]> {
  return fetchJson<TimelineEvent[]>(`/api/investigations/${id}/timeline`);
}

export async function getGraph(id: string): Promise<BlastRadiusGraph> {
  return fetchJson<BlastRadiusGraph>(`/api/investigations/${id}/graph`);
}

export async function getEvidence(id: string): Promise<EvidenceArtifact[]> {
  return fetchJson<EvidenceArtifact[]>(`/api/investigations/${id}/evidence`);
}

export async function getMemory(id: string): Promise<OperationalMemory[]> {
  return fetchJson<OperationalMemory[]>(`/api/investigations/${id}/memory`);
}

export async function getNarrative(id: string, refresh = false): Promise<NarrativeResult> {
  const query = refresh ? '?refresh=true' : '';
  return fetchJson<NarrativeResult>(`/api/investigations/${id}/narrative${query}`);
}

export async function createEvidencePack(id: string): Promise<EvidencePack> {
  try {
    return await fetchJson<EvidencePack>(`/api/investigations/${id}/evidence-pack`, {
      method: 'POST',
    });
  } catch {
    // Read-only public fallback
    return fetchJson<EvidencePack>(`/api/investigations/${id}/evidence-pack`);
  }
}

export async function injectDemoChange(): Promise<InvestigationCase> {
  return fetchJson<InvestigationCase>('/api/demo/inject-change', {
    method: 'POST',
  });
}
