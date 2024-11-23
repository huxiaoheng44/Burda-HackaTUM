export type AudioType = 'full' | 'description';

export interface AudioFile {
    id: number;
    filename: string;
    text_content: string;
    duration: number;
    article_id: number;
    type: AudioType;
    created_at: string;
}