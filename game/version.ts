// Version management for Neon Raiden
const MAJOR_VERSION = 1;
const MINOR_VERSION = 0;

// Generate patch version based on build timestamp
function getPatchVersion(): number {
    // Use a base timestamp (project start) and calculate days since
    const baseTimestamp = new Date('2025-01-01').getTime();
    const now = Date.now();
    const daysSinceBase = Math.floor((now - baseTimestamp) / (1000 * 60 * 60 * 24));
    return daysSinceBase;
}

export function getVersion(): string {
    return `v${MAJOR_VERSION}.${MINOR_VERSION}.${getPatchVersion()}`;
}

export function getVersionInfo() {
    return {
        major: MAJOR_VERSION,
        minor: MINOR_VERSION,
        patch: getPatchVersion(),
        full: getVersion()
    };
}
