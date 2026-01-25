export type WidgetType = 'rich_text' | 'checklist' | 'progress_bar' | 'table' | 'resource_link';

// 1. Düz Yazı / Zengin Metin (Açıklamalar için)
export interface RichTextWidget {
    type: 'rich_text';
    id: string;
    title?: string;
    content: string; // Markdown destekli metin
}

// 2. Kontrol Listesi (Tik atılacak görevler)
export interface ChecklistItem {
    id: string;
    text: string;
    isCompleted: boolean;
}

export interface ChecklistWidget {
    type: 'checklist';
    id: string;
    title: string; // Örn: "Gerekli Malzemeler"
    items: ChecklistItem[];
}

// 3. İlerleme Çubuğu (Sayısal hedefler)
export interface ProgressBarWidget {
    type: 'progress_bar';
    id: string;
    title: string; // Örn: "Biriken Para"
    currentValue: number;
    targetValue: number;
    unit: string; // Örn: "TL", "kg", "Sayfa"
    linkedWidgetId?: string;
}

// 4. Tablo (Ders programı, bütçe vb.)
export interface TableWidget {
    type: 'table';
    id: string;
    title: string; // Örn: "Haftalık Antrenman Programı"
    columns: string[]; // ["Gün", "Bölge", "Hareket"]
    rows: string[][]; // [ ["Pzt", "Göğüs", "Bench Press"], [...] ]
}

// 5. Kaynak Linki (YouTube, Makale vb.)
export interface ResourceLinkWidget {
    type: 'resource_link';
    id: string;
    title: string;
    url: string;
    description?: string;
}

// Tüm widgetların ortak tipi (Union Type)
export type GoalWidget =
    | RichTextWidget
    | ChecklistWidget
    | ProgressBarWidget
    | TableWidget
    | ResourceLinkWidget;

// --- ANA DÜĞÜM (NODE) TİPİ ---

export interface GoalNodeData {
    id: string;
    title: string;
    description: string; // Kısa özet (haritada görünen)

    // Detay penceresinde görünecek zengin içerikler
    widgets: GoalWidget[];

    // Durum bilgisi
    status: 'pending' | 'in_progress' | 'completed';
    progress: number; // 0 ile 100 arası genel ilerleme

    // Graph visualization properties (inheriting/extending what likely existed or needed)
    // Note: React-force-graph usually adds x, y, vx, vy, etc. 
    // We keep this data structure pure business logic, but it may be extended by the graph component.
    val?: number; // Visual size weight
    x?: number;
    y?: number;
}

export interface GoalLinkData {
    source: string;
    target: string;
}

export interface GoalGraphData {
    title?: string;
    nodes: GoalNodeData[];
    links: GoalLinkData[];
}
