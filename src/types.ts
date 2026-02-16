export interface RedirectRule {
    id: string;
    sourceUrl: string;
    destinationUrl: string;
    matchType: 'contains' | 'regex';
    enabled: boolean;
}

export interface StorageData {
    rules: RedirectRule[];
    globalEnabled: boolean;
}

export interface CycleWarning {
    ruleId: string;
    type: 'cycle' | 'substring-overlap';
    message: string;
}
