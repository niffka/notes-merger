## Notes Merger
![notes merger preview](https://github.com/niffka/notes-merger/blob/main/src/img/generate_markdown.png)

This plugin enables you to merge multiple Markdown files into a single, unified Markdown file. The merge process is driven by the content specified in your index Markdown file and linked markdown files.

Process is split into two parts:
1. `Generate preview`: Create a hierarchy preview that visually represents the connections between notes and the links.
2. `Generate markdown`: Produce the final merged markdown file by incorporating the outcomes of step 1, along with the user's specified preferences and settings.

// FIXME: remove
- [x] The screenshot in your readme is missing.

- [ ] this.app.workspace.detachLeavesOfType(VIEW_CONTENT_COMPOSE_NOTES);
Do not detach leaves with your custom view here, this is an antipattern, see: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Don't+detach+leaves+in+%60onunload%60
Instead, only create a new leaf, if there is not one already.

- [x] this.app.workspace.detachLeavesOfType(VIEW_CONTENT_COMPOSE_NOTES);
Also don't detach here.

- [x] containerEl.createEl('h2', {text: 'Settings'});
Only use headings under settings if you have more than one section.

- [ ] const loadedFile = loadedFiles.find((file: TFile) => file.basename === name);
Avoid iterating all files to find a file

- [x] const fullPath = (app.vault.adapter as FileSystemAdapter).getFullPath(name);

Prefer the Vault API over the Adapter API

- [x] const note = readFileSync(absolutePath, { encoding: 'utf8' });
Use the Vault API instead, doing so will make your plugin mobile compatible.

- [x] this.app.vault.adapter.write(${fileName}.md, this.markdown).then(() => {
Prefer async/await over Promise](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Prefer+async%2Fawait+over+Promise)

- [x] contentEl.createEl("h1", { text: "Save As" });
Use sentence case in UI


- [ ] BuildLinkTreeType is wrong
- [x] add settings to include main note 
- [x] add settings to add preview content to beginning of note 
- [x] settings to dont add index to content
- [ ] so this shoudlnt be settings, but radio button?


- [ ] link should point to correct note path (Technologie webovych aplikaci)
- [ ] generate presentation
