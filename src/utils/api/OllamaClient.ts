import { getConfigValue } from '../application/Config';
import { EnvConfigEnum } from '../../interfaces/enums/application/EnvConfigEnum';
import Logger from '../application/Logger';

interface OllamaGenerateResponse {
    response: string;
    done: boolean;
}

class OllamaClient {
    private get baseUrl(): string {
        return getConfigValue(EnvConfigEnum.OLLAMA_BASE_URL) as string;
    }

    private get model(): string {
        return getConfigValue(EnvConfigEnum.OLLAMA_MODEL) as string;
    }

    async generateAsync(prompt: string): Promise<string> {
        Logger.logInfo(`[OllamaClient] Sending prompt to ${this.baseUrl} using model ${this.model}`);

        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: this.model, prompt, stream: false }),
        });

        if (!response.ok)
            throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);

        const data = await response.json() as OllamaGenerateResponse;
        return data.response;
    }
}

export default new OllamaClient();
