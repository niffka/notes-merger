import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { NotesMerger, VIEW_CONTENT_COMPOSE_NOTES } from 'src/views/notes-merger';
export interface NotesMergerPluginSettingsType {
	listOfLinksKeyword: string;
	literatureNote: string;
	insertPreviewContent: boolean;
	insertIndexNote: boolean;
	removeStatusTag: boolean;
	metadataNote: string;
	latexImagesDirectoryName: string;
	attachmentsDir: string;
}

const DEFAULT_SETTINGS: NotesMergerPluginSettingsType = {
	listOfLinksKeyword: 'Kam dál',
	literatureNote: 'Literature',
	insertPreviewContent: true,
	insertIndexNote: false,
	removeStatusTag: true,
	metadataNote: 'Metadata',
	latexImagesDirectoryName: 'obrazky',
	attachmentsDir: 'prilohy'
}

export default class NotesMergerPlugin extends Plugin {
	settings: NotesMergerPluginSettingsType;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new NotesMergerPluginSettingTab(this.app, this));	

		this.registerView(
			VIEW_CONTENT_COMPOSE_NOTES,
			(leaf) => new NotesMerger(leaf, this.settings)
		);
		
		this.addRibbonIcon("scroll", "NotesMerger", () => {
			this.activateNotesMergerView();
		});

		// this.addCommand({
		// 	id: "generate latex",
		// 	name: "generate latex from markdown",
		// 	callback: () => {
		// 		new GenerateLatex(this.app, this.settings);
		// 	},
		// });
	}

	async activateNotesMergerView() {
		if (!this.app.workspace.getLeavesOfType(VIEW_CONTENT_COMPOSE_NOTES).length) {
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: VIEW_CONTENT_COMPOSE_NOTES,
				active: true,
			  });
		}
	
		this.app.workspace.revealLeaf(
		  this.app.workspace.getLeavesOfType(VIEW_CONTENT_COMPOSE_NOTES)[0]
		);
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class NotesMergerPluginSettingTab extends PluginSettingTab {
	plugin: NotesMergerPlugin;

	constructor(app: App, plugin: NotesMergerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {

		const { containerEl } = this;

		containerEl.empty();
		
		new Setting(containerEl)
			.setName('List of links keyword')
			.setDesc('Keyword to detect list of links to be subchapters at the end of note.')
			.addText(text => text
				.setPlaceholder('Defaults to "Kam dál"')
				.setValue(this.plugin.settings.listOfLinksKeyword)
				.onChange(async (value) => {
					this.plugin.settings.listOfLinksKeyword = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
		.setName('Literature note')
		.setDesc('Name of the note with citations.')
		.addText(text => text
			.setPlaceholder('Defaults to "Literature"')
			.setValue(this.plugin.settings.literatureNote)
			.onChange(async (value) => {
				this.plugin.settings.literatureNote = value;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName('Include generated preview')
		.setDesc('Insert preview structure at the beginning of the merged note.')
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.insertPreviewContent)
			.onChange(async value => {
				this.plugin.settings.insertPreviewContent = value;
				await this.plugin.saveSettings();
			})
		);

		new Setting(containerEl)
		.setName('Include index note')
		.setDesc('Insert index note at the beginning of the merged note.')
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.insertIndexNote)
			.onChange(async value => {
				this.plugin.settings.insertIndexNote = value;
				await this.plugin.saveSettings();

			})
		);

		new Setting(containerEl)
		.setName('Remove tags')
		.setDesc('Remove tag information from notes.')
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.removeStatusTag)
			.onChange(async value => {
				this.plugin.settings.removeStatusTag = value;
				await this.plugin.saveSettings();
			})
		);

		new Setting(containerEl)
		.setName('Thesis template metadata note')
		.setDesc('Name of the note that contains metadata. Note should include title, acknowledgements, abstract (czech, english), keywords (czech, english), declaration.')
		.addText(text => text
			.setPlaceholder(`Defaults to "${this.plugin.settings.metadataNote}"`)
			.setValue(this.plugin.settings.metadataNote)
			.onChange(async (value) => {
				this.plugin.settings.metadataNote = value;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName('Name of image folder inside generated latex folder')
		.setDesc('Includes images found in markdown.')
		.addText(text => text
			.setPlaceholder(`Defaults to "${this.plugin.settings.latexImagesDirectoryName}"`)
			.setValue(this.plugin.settings.latexImagesDirectoryName)
			.onChange(async (value) => {
				this.plugin.settings.latexImagesDirectoryName = value;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName('Attachments')
		.setDesc('Path to attachments folder. One note per one attachment.')
		.addText(text => text
			.setPlaceholder(`Defaults to "${this.plugin.settings.attachmentsDir}"`)
			.setValue(this.plugin.settings.attachmentsDir)
			.onChange(async (value) => {
				this.plugin.settings.attachmentsDir = value;
				await this.plugin.saveSettings();
			}));

	}
}
