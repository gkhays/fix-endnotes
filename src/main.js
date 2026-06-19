const { Notice, Plugin } = require("obsidian");
const { normalizeBracketedReferences } = require("./normalize");

module.exports = class FixEndNotesPlugin extends Plugin {
  onload() {
    console.log("[fix-endnotes] startup", {
      id: this.manifest.id,
      version: this.manifest.version,
    });

    this.addCommand({
      id: "normalize-end-notes-selection",
      name: "Fix end notes",
      editorCallback: (editor) => {
        const selection = editor.getSelection();

        if (selection.length === 0) {
          new Notice("Select some end notes first.");
          return;
        }

        const normalized = normalizeBracketedReferences(selection);

        console.log("[fix-endnotes] normalize-end-notes-selection", {
          before: selection,
          after: normalized,
        });

        editor.replaceSelection(normalized);
      },
    });
  }
};
