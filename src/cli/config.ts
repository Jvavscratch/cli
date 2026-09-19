/*******************************************************************
 * Copyright         : 2025 NeuronPulse
 * File Name         : config.ts
 * Description       : Local configuration manager for jvavscratch CLI
 ******************************************************************/

import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const CONFIG_DIR = join(homedir(), '.jvavscratch');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface JvavscratchConfig {
    registry?: string;
    api_token?: string;
    username?: string;
}

export function getConfig(): JvavscratchConfig {
    if (!existsSync(CONFIG_FILE)) {
        return { registry: 'http://localhost:3000' };
    }
    try {
        return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    } catch {
        return { registry: 'http://localhost:3000' };
    }
}

export function setConfig(config: JvavscratchConfig): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const current = getConfig();
    writeFileSync(CONFIG_FILE, JSON.stringify({ ...current, ...config }, null, 2));
}

export function getRegistryUrl(): string {
    return getConfig().registry || 'http://localhost:3000';
}

export function getApiToken(): string | undefined {
    return getConfig().api_token;
}

export function setApiToken(token: string): void {
    setConfig({ api_token: token });
}

export function setRegistryUrl(url: string): void {
    setConfig({ registry: url });
}

export function clearAuth(): void {
    const cfg = getConfig();
    delete cfg.api_token;
    delete cfg.username;
    setConfig(cfg);
}