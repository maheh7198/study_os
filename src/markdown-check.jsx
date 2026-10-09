import { createRoot } from "react-dom/client";
import MarkdownMessage from "./components/MarkdownMessage.jsx";

export function MarkdownCheckPage() {
  const text = [
    "### Example", "", "- First bullet", "- Second bullet", "", "1. First step", "2. Second step", "",
    "| Name | Value |", "| --- | --- |", "| Count | `2` |", "", "```java", "class Main {", "    public static void main(String[] args) {", "        System.out.println(\"Hello\");", "    }", "}", "```",
  ].join("\n");
  return <div className="ai-conversation"><div className="ai-message assistant"><span className="ai-message-avatar" aria-hidden="true" /><MarkdownMessage text={text} /></div></div>;
}

createRoot(document.getElementById("root")).render(<MarkdownCheckPage />);
