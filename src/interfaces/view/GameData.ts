export interface GameDataResponse {
    Id: number;
    DataSheetId: number;
    GameId: number;
    Message: Record<string, string>;
    Response: Record<string, string>;
}

export interface GameDataSaveRequest {
    Id?: number;
    DataSheetId?: number;
    GameId?: number;
    Message?: Record<string, string>;
    Response?: Record<string, string>;
}