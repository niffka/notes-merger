import { App, Modal, Setting, TAbstractFile, TFolder, normalizePath } from "obsidian";

export class SaveModal extends Modal {
  name: string;
  folder: string;
  onSubmit: (filePath: string) => void;
  isDisabled: boolean = true;
  displayToggle: boolean = true

  constructor(app: App, onSubmit: (filePath: string) => void, displayToggle = true) {
    super(app);
    this.onSubmit = onSubmit;
	this.displayToggle = displayToggle;
  }

  getFolders() {
	const folders = this.app.vault.getAllLoadedFiles().filter((file: TAbstractFile) => file instanceof TFolder);
	return folders.reduce((obj: Record<string, string>, item: TAbstractFile) => (obj[item.path] = item.path, obj), {});
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h1", { text: "Save as" });

	const folders = this.getFolders();

    new Setting(contentEl)
      .setName("File name: ")
      .addText((text) =>
        text.onChange((value) => {
          this.name = value
        }));
	if (this.displayToggle) {
		new Setting(contentEl)
		.setName("Select folder: ")
		.addDropdown((dropdown) =>
			dropdown
				.addOptions(folders)
				.onChange((value: string) => {
					this.folder = value;
				})
		);
	}

	new Setting(contentEl)
	.addButton((btn) =>
		btn
		.setButtonText("Generate")
		.setCta()
		.onClick(() => {
			this.close();
			this.folder = this.folder ?? this.app.vault.getRoot().path;
			this.onSubmit(normalizePath(`${this.folder}/${this.name}.md`));
		}));
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
