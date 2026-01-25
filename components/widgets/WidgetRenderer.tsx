import { GoalWidget } from "@/types/goal";
import ProgressBar from "./ProgressBar";
import Checklist from "./Checklist";
import Table from "./Table";
import ResourceLink from "./ResourceLink";
import RichText from "./RichText";

interface WidgetRendererProps {
    data: GoalWidget;
    onUpdate?: (data: GoalWidget) => void;
    onDelete?: () => void;
    allWidgets?: GoalWidget[];
}

export default function WidgetRenderer({ data, onUpdate, onDelete, allWidgets }: WidgetRendererProps) {
    // Helper to safely call update
    const handleUpdate = (newData: GoalWidget) => {
        if (onUpdate) onUpdate(newData);
    }

    switch (data.type) {
        // @ts-ignore
        case "progress_bar":
            // @ts-ignore
            return <ProgressBar data={data} onUpdate={handleUpdate} allWidgets={allWidgets} />;
        // @ts-ignore
        case "checklist":
            // @ts-ignore
            return <Checklist data={data} onUpdate={handleUpdate} onDelete={onDelete} />;
        // @ts-ignore
        case "table":
            // @ts-ignore
            return <Table data={data} onUpdate={handleUpdate} onDelete={onDelete} />;
        // @ts-ignore
        case "resource_link":
            // @ts-ignore
            return <ResourceLink data={data} onUpdate={handleUpdate} onDelete={onDelete} />;
        // @ts-ignore
        case "rich_text":
            // @ts-ignore
            return <RichText data={data} onUpdate={handleUpdate} />;
        default:
            return null;
    }
}
