/**
 * Create discovery topic for an entity
 */
export function createDiscoveryTopic(entityId: string, discoveryPrefix: string): string {
    const cleanId = entityId.replace(/^sensor\./, '');

    return `${discoveryPrefix}/sensor/${cleanId}/config`;
}
