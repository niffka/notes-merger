import { ItemView, WorkspaceLeaf, Notice, TAbstractFile, TFile, App } from "obsidian";
import { fixSpaceInName, getNoteByName } from '../utils';

import { GenerateMarkdownPluginSettingsType } from '../../main';
import { generateSlidesMarkdown } from './generate-slides-markdown';

import {
	Button, 
	BaseLink,
	SaveModal, 
	TreeMenu,
} from '../components/index';


export const VIEW_CONTENT_COMPOSE_NOTES = "view-generate-markdown";


export interface LinkTreeType {
	name: string;
	parent?: string | undefined;
	children: LinkTreeType[];
	index: boolean;
	exists: boolean;
	inline: boolean;
	level?: number;
	order?: number;
	path: string;
}

interface BuildLinkTreeType extends LinkTreeType{
	parentRef?: BuildLinkTreeType;
}

export class GenerateMarkdown extends ItemView {
	
	settings: GenerateMarkdownPluginSettingsType;

	container: Element;
	toolbar: Element;
	structure: Element;
	generatePreviewParent: Element;
	generateMarkdownParent: Element;
	generateSlidesParent: Element;

	linksTree: LinkTreeType[] = [];
	loadedFiles: TAbstractFile[] = [];
	maxLevel: number = 0;
	processed: string[] = [];
	mainNameLinks: string[] = [];

	markdown: string = "";
	ignoredLinks: string[] = [];
	images: string[] = [];

	static imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'bmp'].map((it: string) => `.${it}`);

	constructor(leaf: WorkspaceLeaf, settings: GenerateMarkdownPluginSettingsType) {
		super(leaf);
		this.settings = settings;
	}

	async onOpen() {
		const container = this.containerEl.children[1];

		this.container = container;
		container.empty();

		this.toolbar = container.createEl("div");
		this.generatePreviewParent = this.toolbar.createEl('span');
		this.generateMarkdownParent = this.toolbar.createEl('span');
		this.generateSlidesParent = this.toolbar.createEl('span');
		this.structure = this.container.createEl("div");

		new Button(this.generatePreviewParent, 'Generate preview', () => {
			// empty state
			this.linksTree = [];
			this.maxLevel = 0;
			this.processed = [];
			this.mainNameLinks = [];
			this.ignoredLinks = [];
			this.markdown = "";
			
			this.structure.empty();
			this.generateMarkdownParent.empty();
			this.generateSlidesParent.empty();
			this.readSelectedNote();
		});
	}

	parseLinks(text: string, index: boolean = false) {
		const links = text.matchAll(/\[\[(.*?)\]\]/g);
		let cleanLinks = [...links].map(l => l[1]);

		cleanLinks = [...new Set(cleanLinks)];

		// filter out anchor links ([[#foobar]])
		cleanLinks = cleanLinks.filter(cl => !cl.startsWith('#'));
		
		cleanLinks = cleanLinks.filter(cl => !cl.startsWith(`${this.settings.literatureNote}#`));

		const existingNotes = cleanLinks.map((cl: string) => {
			cl = fixSpaceInName(cl);

			if (!!GenerateMarkdown.imageTypes.filter((it: string) => cl.includes(it.toLowerCase())).length) {
				this.images.push(cl)
				return false;
			}

			let isInline = true;			
			if (text.includes(this.settings.listOfLinksKeyword)) {
				let [inlineText, linksText] = text.split(this.settings.listOfLinksKeyword);
				if (!inlineText.includes(cl))
					isInline = false;
			}

			let isIndex = false;
			if (index) {
				isInline = false;
				isIndex = true;
			}

			const note = this.loadedFiles.find((f: TFile) => f['basename'] === cl);

			return {
				name: cl,
				exists: !!note,	
				inline: isInline,
				index: isIndex,
				path: note?.path
			};
		}).filter(Boolean);

		return existingNotes as LinkTreeType[];
	}

	async readSelectedNote() {
		this.loadedFiles = app.vault.getMarkdownFiles();

		const activeNote = this.app.workspace.getActiveFile();

		if (!activeNote) {
			new Notice(`Selected note is invalid.`);
			throw new Error("Selected note is invalid.");
		}
		const activeNoteText = await getNoteByName(this.app, activeNote.path);

		const mainContentLinks = this.parseLinks(activeNoteText, true);
		
		this.mainNameLinks = mainContentLinks.map((l: LinkTreeType) => l.name);

		this.linksTree = await this.generateNotesHierarchy(mainContentLinks);

		const title = activeNote.basename;
		new BaseLink(this.app, this.structure, title);

		new TreeMenu(this.app, this.structure, this.linksTree, (ignoredLinks: string[]) => {
			this.ignoredLinks = ignoredLinks;
		});

		new Button(this.generateMarkdownParent, 'Generate markdown', () => {
			
			// cleanup
			this.markdown = "";

			this.generateMarkdownFile(this.linksTree, activeNoteText);
		}, { cls: 'generate-markdown-btn' });

		new Button(this.generateSlidesParent, 'Generate slides', () => {
			generateSlidesMarkdown(this.linksTree);
		}, { cls: 'generate-markdown-btn' })
	}

	generateMarkdownFile(links: LinkTreeType[], mainNote: string) {
		this.composeMarkdown(links);

		// transform links to anchor in index note 
		this.mainNameLinks.forEach((mnl: string) => {

			mnl = fixSpaceInName(mnl);
			mainNote = mainNote.replaceAll(`[[${mnl}]]`, `[[#${mnl}]]`)
		});

		this.markdown = mainNote + this.markdown;

		new SaveModal(this.app, async (fileName) => {
			await this.app.vault.adapter.write(`${fileName}.md`, this.markdown)
			new Notice(`Note ${fileName} created successfully`);
			this.app.workspace.openLinkText(`${fileName}.md`, "")
			
		}).open();
		
	}

	composeMarkdown(links: LinkTreeType[]) {
		links.forEach(async (link: LinkTreeType) => {
			let note = await getNoteByName(this.app, link.path);
			const localLinks = this.parseLinks(note);

			if (this.ignoredLinks.includes(link.name))
				return;

			// trim enters and spaces
			note = note.trim();

			if (note.length == 0)
				return;

			// transform links to anchors
			localLinks.forEach((localLink: LinkTreeType) => {
				if (localLink.inline && this.ignoredLinks.includes(localLink.name))
					note = note.replaceAll(`[[${localLink.name}]]`, localLink.name);
				else
					note = note.replaceAll(`[[${localLink.name}]]`, `[[#${localLink.name}]]`)
			})

			// remove title on a first line
			let noteRows = note.split('\n');
			let firstRow = fixSpaceInName(noteRows[0]);
			if (firstRow.includes(`# ${link.name}`)) {
				noteRows.shift();
				note = noteRows.join("\n").trim();
			}
			
			// remove 'Kam dál' part
			if (note.includes(this.settings.listOfLinksKeyword)) {
				let [importantPart, endPart] = note.split(this.settings.listOfLinksKeyword);
				note = importantPart.trim();
			}
			
			// generate nested title e.g. h3 -> ### title3
			let title = "";
			if (link.inline) {
				// h5
				title = `##### ${link.name}`;
			} else {
				const nestedLevel = Array(link.level).fill('#').join('');
				title = `${nestedLevel} ${link.name}`;
			}

			note = `\n\n${title}\n${note}`;

			// should be last
			this.markdown += note;

			if ('children' in link)
				this.composeMarkdown(link.children);
		});
	}

	async generateNotesHierarchy(links: LinkTreeType[]) {
		const linksObj: BuildLinkTreeType = await this.dfs(links, 0, []);
		let linksArr: LinkTreeType[] = [];
		
		Object.keys(linksObj).forEach(key => {
			const {parentRef, ...rest} = linksObj[key as keyof BuildLinkTreeType] as BuildLinkTreeType; 
			linksArr.push({...rest, parent: (linksObj[key as keyof BuildLinkTreeType] as BuildLinkTreeType)?.parentRef?.name});
		});

		const getNestedChildren = (arr: LinkTreeType[], parent: string | undefined) => {
			let children = [];
			for(let i = 0; i < arr.length; i++) {
				if(arr[i].parent == parent) {
					const grandChildren = getNestedChildren(arr, arr[i].name);
					if(grandChildren.length) {
						arr[i].children = grandChildren;
					}
					children.push(arr[i]);
				}
			}
			return children;
		}
		return getNestedChildren(linksArr, undefined);
	}

	async dfs(links: BuildLinkTreeType[], level: number, processed: string[], parentRef?: object, titleMapping?: object) {
		titleMapping = (titleMapping as BuildLinkTreeType) ?? {}; 

		for await (const [order, link] of links.entries()) {

			// skip link from mainContent
			if (this.mainNameLinks.includes(link.name) && level != 0)
				continue;

			// skip if link is already processed
			if (processed.includes(link.name)) {
				continue;
			}
			processed.push(link.name);

			const note = await getNoteByName(this.app, link.path)
			const subLinks = this.parseLinks(note);
		
			this.maxLevel = level + 1;

			(titleMapping as any)[link.name] = { ...link, parentRef, level: this.maxLevel, order};

			if (links.length > 0)
				await this.dfs(subLinks, this.maxLevel, processed, (titleMapping as any)[link.name], titleMapping);
		}

		return titleMapping as BuildLinkTreeType;
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
