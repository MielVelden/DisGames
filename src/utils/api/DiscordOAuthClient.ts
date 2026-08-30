class DiscordOAuthClient {
    private readonly baseUrl = 'https://discord.com/api';
    private readonly cache = new Map<string, { userId: string; expiresAt: number }>();
    private readonly CACHE_TTL_MS = 3 * 60 * 1000;

    async getVerifiedUserIdAsync(accessToken: string): Promise<string | null> {
        const cached = this.cache.get(accessToken);
        if (cached && cached.expiresAt > Date.now())
            return cached.userId;

        try {
            const response = await fetch(`${this.baseUrl}/users/@me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                signal: AbortSignal.timeout(5000),
            });
            if (!response.ok) {
                this.cache.delete(accessToken);
                return null;
            }

            const data = await response.json() as { id: string };
            this.cache.set(accessToken, { userId: data.id, expiresAt: Date.now() + this.CACHE_TTL_MS });
            return data.id;
        } catch {
            return null;
        }
    }
}

export default new DiscordOAuthClient();
