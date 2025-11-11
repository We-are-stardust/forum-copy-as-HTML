"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
class ForumFullHtml extends obsidian_1.Plugin {
    async onload() {
        console.log("Loaded ForumCopyAsHTML v0.4.5");
        // Command palette command
        this.addCommand({
            id: "forum-copy-as-html",
            name: "Copy as HTML (MROOMS)",
            editorCallback: async (editor) => {
                await this.copyAsHtml(editor);
            },
        });
        // Context menu option
        this.registerEvent(this.app.workspace.on("editor-menu", (menu, editor) => {
            menu.addItem((item) => {
                item
                    .setTitle("Copy as HTML")
                    .setIcon("copy")
                    .onClick(async () => {
                    await this.copyAsHtml(editor);
                });
            });
        }));
    }
    async copyAsHtml(editor) {
        let text = editor.getSelection().trim() || editor.getValue().trim();
        if (!text) {
            new obsidian_1.Notice("No text selected.");
            return;
        }
        // Inline markdown → HTML
        text = text
            .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/(?<!\*)\*(.+?)\*(?!\*)/g, "<em>$1</em>")
            .replace(/~~(.+?)~~/g, "<del>$1</del>")
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/==(.+?)==/g, "<mark>$1</mark>")
            .replace(/\[\^(\d+)\]/g, "<sup>$1</sup>")
            .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        const lines = text.split(/\r?\n/);
        const htmlLines = [];
        const footnotes = [];
        // Table parser
        const parseTable = (block) => {
            if (block.length < 2)
                return "";
            const headerLine = block[0];
            const dataLines = block.slice(2);
            const headers = headerLine
                .split("|").slice(1, -1)
                .map((h) => `<th>${h.trim()}</th>`)
                .join("");
            const rows = dataLines
                .filter((l) => /^\|.*\|$/.test(l))
                .map((l) => {
                const cells = l
                    .split("|")
                    .slice(1, -1)
                    .map((c) => `<td>${c.trim()}</td>`)
                    .join("");
                return `<tr>${cells}</tr>`;
            })
                .join("\n");
            return `<table>\n<thead><tr>${headers}</tr></thead>\n<tbody>\n${rows}\n</tbody>\n</table>`;
        };
        let i = 0;
        while (i < lines.length) {
            const line = lines[i].trim();
            if (!line) {
                i++;
                continue;
            }
            const fn = line.match(/<sup>(\d+)<\/sup>:\s*(.*)/);
            if (fn) {
                footnotes.push(`<li>${fn[2]}</li>`);
                i++;
                continue;
            }
            const h = line.match(/^(#{1,6})\s+(.*)$/);
            if (h) {
                const level = Math.min(h[1].length, 6);
                htmlLines.push(`<h${level}>${h[2]}</h${level}>`);
                i++;
                continue;
            }
            if (/^\|.*\|$/.test(line)) {
                const tableBlock = [];
                while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
                    tableBlock.push(lines[i].trim());
                    i++;
                }
                htmlLines.push(parseTable(tableBlock));
                continue;
            }
            htmlLines.push(`<p>${line}</p>`);
            i++;
        }
        if (footnotes.length)
            htmlLines.push(`<hr/><ol class="footnotes">\n${footnotes.join("\n")}\n</ol>`);
        const html = `<html>\n<head><meta charset="utf-8"></head>\n<body>\n${htmlLines.join("\n")}\n</body>\n</html>`;
        await navigator.clipboard.writeText(html);
        new obsidian_1.Notice("Copied HTML to clipboard.");
    }
}
exports.default = ForumFullHtml;
