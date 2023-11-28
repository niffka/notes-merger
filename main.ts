import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { GenerateMarkdown, VIEW_CONTENT_COMPOSE_NOTES } from 'src/views/generate-markdown';
import { GenerateLatex } from 'src/views/generate-latex';
export interface GenerateMarkdownPluginSettingsType {
	listOfLinksKeyword: string;
	literatureNote: string;
	insertPreviewContent: boolean;
	insertIndexNote: boolean;
	removeStatusTag: boolean;
}

const DEFAULT_SETTINGS: GenerateMarkdownPluginSettingsType = {
	listOfLinksKeyword: 'Kam dál',
	literatureNote: 'Literature',
	insertPreviewContent: true,
	insertIndexNote: false,
	removeStatusTag: true
}

export default class GenerateMarkdownPlugin extends Plugin {
	settings: GenerateMarkdownPluginSettingsType;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new GenerateMarkdownPluginSettingTab(this.app, this));	

		this.registerView(
			VIEW_CONTENT_COMPOSE_NOTES,
			(leaf) => new GenerateMarkdown(leaf, this.settings)
		);
		
		this.addRibbonIcon("scroll", "NotesMerger", () => {
			this.activateGenerateMarkdownView();
		});

		this.addCommand({
			id: "generate latex",
			name: "generate latex from markdown",
			callback: () => {
				new GenerateLatex(this.app, this.settings);
			},
		});
	}

	async activateGenerateMarkdownView() {
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

class GenerateMarkdownPluginSettingTab extends PluginSettingTab {
	plugin: GenerateMarkdownPlugin;

	constructor(app: App, plugin: GenerateMarkdownPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {

		const { containerEl } = this;

		containerEl.empty();
		
		new Setting(containerEl)
			.setName('List of links keyword')
			.setDesc('Keyword to detect list of links at the end of note')
			.addText(text => text
				.setPlaceholder('Defaults to "Kam dál"')
				.setValue(this.plugin.settings.listOfLinksKeyword)
				.onChange(async (value) => {
					this.plugin.settings.listOfLinksKeyword = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
		.setName('Literature note')
		.setDesc('Name of note with citations')
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
			.onChange(value => {
				this.plugin.settings.insertPreviewContent = value;
			})
		);

		new Setting(containerEl)
		.setName('Include index note')
		.setDesc('Insert index note at the beginning of the merged note.')
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.insertIndexNote)
			.onChange(value => {
				this.plugin.settings.insertIndexNote = value;
			})
		);

		new Setting(containerEl)
		.setName('Remove status note tag')
		.setDesc('Always remove note status tag information from note.')
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.removeStatusTag)
			.onChange(value => {
				this.plugin.settings.removeStatusTag = value;
			})
		);

	}
}
