export interface TimelineChange {
    from: any;
    to: any;
}

export interface TimelineChanges {
    [fieldName: string]: TimelineChange;
}