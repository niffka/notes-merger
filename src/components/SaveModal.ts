import { App, Modal, Setting } from "obsidian";

export class SaveModal extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h1", { text: "Save as" });

    new Setting(contentEl)
      .setName("File name: ")
      .addText((text) =>
        text.onChange((value) => {
          this.result = value
        }));

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Generate markdown note")
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(this.result);
          }));
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
