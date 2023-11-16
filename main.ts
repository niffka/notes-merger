import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { GenerateMarkdown, VIEW_CONTENT_COMPOSE_NOTES } from './src/views/generate-markdown';

export interface GenerateMarkdownPluginSettingsType {
	listOfLinksKeyword: string;
	literatureNote: string;
}

const DEFAULT_SETTINGS: GenerateMarkdownPluginSettingsType = {
	listOfLinksKeyword: 'Kam dál',
	literatureNote: 'Literature'
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
	}

	async activateGenerateMarkdownView() {
		this.app.workspace.detachLeavesOfType(VIEW_CONTENT_COMPOSE_NOTES);
	
		await this.app.workspace.getRightLeaf(false).setViewState({
		  type: VIEW_CONTENT_COMPOSE_NOTES,
		  active: true,
		});
	
		this.app.workspace.revealLeaf(
		  this.app.workspace.getLeavesOfType(VIEW_CONTENT_COMPOSE_NOTES)[0]
		);
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_CONTENT_COMPOSE_NOTES);
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
	}
}
