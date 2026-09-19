/*******************************************************************
 * Copyright         : 2025 NeuronPulse
 * File Name         : registry.ts
 * Description       : Registry API client for jvavscratch packages
 ******************************************************************/

import { getRegistryUrl, getApiToken } from './config';
import { warn, error } from './projectManager';

function getHeaders(auth: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };
    if (auth) {
        const token = getApiToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
}

function getRegistry(): string {
    return getRegistryUrl();
}

export interface CrateInfo {
    id: number;
    name: string;
    description: string;
    downloads: number;
    latest_version: string | null;
    owner: string;
    created_at: string;
    updated_at: string;
}

export interface SearchResult {
    crates: CrateInfo[];
    meta: {
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    };
}

export async function searchCrates(query: string, page: number = 1, perPage: number = 10): Promise<SearchResult> {
    const url = new URL(`${getRegistry()}/api/v1/crates`);
    if (query) url.searchParams.set('q', query);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));

    const res = await fetch(url.toString(), { headers: getHeaders() });
    if (!res.ok) {
        const err: any = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Search failed: ${res.status}`);
    }
    return res.json() as Promise<SearchResult>;
}

export async function getCrate(name: string): Promise<any> {
    const res = await fetch(`${getRegistry()}/api/v1/crates/${encodeURIComponent(name)}`, {
        headers: getHeaders()
    });
    if (!res.ok) {
        if (res.status === 404) return null;
        const err: any = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Failed to get crate: ${res.status}`);
    }
    return res.json();
}

export async function getCrateVersion(name: string, version: string): Promise<any> {
    const res = await fetch(`${getRegistry()}/api/v1/crates/${encodeURIComponent(name)}/${encodeURIComponent(version)}`, {
        headers: getHeaders()
    });
    if (!res.ok) {
        if (res.status === 404) return null;
        const err: any = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Failed to get version: ${res.status}`);
    }
    return res.json();
}

export async function downloadCrate(name: string, version: string): Promise<Buffer> {
    const res = await fetch(`${getRegistry()}/api/v1/crates/${encodeURIComponent(name)}/${encodeURIComponent(version)}/download`, {
        headers: getHeaders()
    });
    if (!res.ok) {
        if (res.status === 404) {
            throw new Error(`Crate '${name}@${version}' not found`);
        }
        throw new Error(`Download failed: ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export async function publishCrate(tarball: Buffer, metadata: {
    name: string;
    vers: string;
    description?: string;
    readme?: string;
    license?: string;
    homepage?: string;
    repository?: string;
    keywords?: string;
}): Promise<any> {
    const form = new FormData();
    form.append('crate', new Blob([new Uint8Array(tarball)]), `${metadata.name}-${metadata.vers}.tar.gz`);
    form.append('name', metadata.name);
    form.append('vers', metadata.vers);
    if (metadata.description) form.append('description', metadata.description);
    if (metadata.readme) form.append('readme', metadata.readme);
    if (metadata.license) form.append('license', metadata.license);
    if (metadata.homepage) form.append('homepage', metadata.homepage);
    if (metadata.repository) form.append('repository', metadata.repository);
    if (metadata.keywords) form.append('keywords', metadata.keywords);

    const token = getApiToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${getRegistry()}/api/v1/crates/new`, {
        method: 'PUT',
        headers,
        body: form as any,
    });

    if (!res.ok) {
        const err: any = await res.json().catch(() => ({ error: `Publish failed: ${res.status}` }));
        throw new Error(err.error || `Publish failed: ${res.status}`);
    }
    return res.json();
}

export async function login(username: string, password: string): Promise<{ token: string; api_token: string }> {
    const res = await fetch(`${getRegistry()}/api/v1/account/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
        const err: any = await res.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(err.error || `Login failed: ${res.status}`);
    }

    const data: any = await res.json();
    return { token: data.token, api_token: data.api_token };
}

export async function register(username: string, email: string, password: string): Promise<{ token: string; api_token: string }> {
    const res = await fetch(`${getRegistry()}/api/v1/account/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    if (!res.ok) {
        const err: any = await res.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(err.error || `Registration failed: ${res.status}`);
    }

    const data: any = await res.json();
    return { token: data.token, api_token: data.api_token };
}

export async function yankVersion(name: string, version: string): Promise<void> {
    const res = await fetch(`${getRegistry()}/api/v1/crates/${encodeURIComponent(name)}/${encodeURIComponent(version)}/yank`, {
        method: 'DELETE',
        headers: getHeaders(true)
    });
    if (!res.ok) {
        const err: any = await res.json().catch(() => ({ error: 'Yank failed' }));
        throw new Error(err.error || `Yank failed: ${res.status}`);
    }
}

export async function unyankVersion(name: string, version: string): Promise<void> {
    const res = await fetch(`${getRegistry()}/api/v1/crates/${encodeURIComponent(name)}/${encodeURIComponent(version)}/unyank`, {
        method: 'PUT',
        headers: getHeaders(true)
    });
    if (!res.ok) {
        const err: any = await res.json().catch(() => ({ error: 'Unyank failed' }));
        throw new Error(err.error || `Unyank failed: ${res.status}`);
    }
}

export async function addOwner(name: string, username: string): Promise<void> {
    const res = await fetch(`${getRegistry()}/api/v1/crates/${encodeURIComponent(name)}/owners`, {
        method: 'PUT',
        headers: { ...getHeaders(true), 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });
    if (!res.ok) {
        const err: any = await res.json().catch(() => ({ error: 'Add owner failed' }));
        throw new Error(err.error || `Add owner failed: ${res.status}`);
    }
}