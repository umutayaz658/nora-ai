import { GoalWidget } from "@/types/goal";
import ProgressBar from "./ProgressBar";
import Checklist from "./Checklist";
import Table from "./Table";
import ResourceLink from "./ResourceLink";
import RichText from "./RichText";

export default function WidgetRenderer({ data }: { data: GoalWidget }) {
    switch (data.type) {
        case "progress_bar":
            return <ProgressBar data={data} />;
        case "checklist":
            return <Checklist data={data} />;
        case "table":
            return <Table data={data} />;
        case "resource_link":
            return <ResourceLink data={data} />;
        case "rich_text":
            return <RichText data={data} />;
        default:
            return null;
    }
}
