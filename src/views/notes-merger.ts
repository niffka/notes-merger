import { ItemView, WorkspaceLeaf } from "obsidian";
import { NotesMergerPluginSettingsType } from '../../main';
import { GenerateLatex } from 'src/views/generate-latex';
import { Button } from '../components/index';
import { GenerateMarkdown } from "./generate-markdown";

export const VIEW_CONTENT_COMPOSE_NOTES = "view-notes-merger";

export class NotesMerger extends ItemView {

	settings: NotesMergerPluginSettingsType;
	container: Element;
	toolbar: Element;
	subbar: Element;
	structure: Element;
	generateMarkdownTabParent: Element;
	generateLatexTabParent: Element;

	constructor(leaf: WorkspaceLeaf, settings: NotesMergerPluginSettingsType) {
		super(leaf);
		this.settings = settings;
	}

	async onOpen() {
		const container = this.containerEl.children[1];

		this.container = container;
		container.empty();

		this.toolbar = container.createEl('div', { cls: 'toolbar' });
		this.generateMarkdownTabParent = this.toolbar.createEl('div', { cls: 'generate-markdown-tab-btn' });
		this.generateLatexTabParent = this.toolbar.createEl('div', { cls: 'generate-latex-tab-btn' });

		this.subbar = container.createEl('div', { cls: 'subbar' });

		this.structure = this.container.createEl('div');

		new Button(this.generateMarkdownTabParent, 'Generate Merging Preview', () => {
			// empty state
			this.structure.empty();
			this.subbar.empty();

			const generateMarkdown = new GenerateMarkdown(app, this.settings, this.structure, this.subbar);

			generateMarkdown.readSelectedNote();
		});

		new Button(this.generateLatexTabParent, 'Generate Latex', async () => {
			this.subbar.empty();

			new Button(this.subbar, 'Generate Plain Latex', () => {
				this.structure.empty();

				const generateLatex = new GenerateLatex(this.app, this.settings, this.structure);
				
				generateLatex.renderLatexStatus(generateLatex);

			}, { cls: 'generate-plain-latex-btn' });
	
			new Button(this.subbar, 'Generate Latex With Template', () => {
				this.structure.empty();

				const generateLatex = new GenerateLatex(this.app, this.settings, this.structure);
	
				generateLatex.renderLatexWithTemplateStatus(generateLatex);
			}, { cls: 'generate-template-latex-btn' })
		});
	}

	async onClose() {
		// Nothing to clean up.
	}

	getViewType() {
		return VIEW_CONTENT_COMPOSE_NOTES;
	}

	getDisplayText() {
		return "Notes Merger";
	}
}
