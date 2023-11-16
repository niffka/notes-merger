import { ItemView, WorkspaceLeaf, Notice, TAbstractFile, TFile, App } from "obsidian";
import { fixSpaceInName, getNoteByName } from '../utils';

import { GenerateMarkdownPluginSettingsType } from '../../main';

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
				index: isIndex
			};
		}).filter(Boolean);

		return existingNotes as LinkTreeType[];
	}

	readSelectedNote() {
		this.loadedFiles = app.vault.getAllLoadedFiles();

		const activeNote = this.app.workspace.getActiveFile();

		if (!activeNote) {
			new Notice(`Selected note is invalid.`);
			throw new Error("Selected note is invalid.");
		}

		const activeNoteText = getNoteByName(activeNote.basename, this.loadedFiles);

		const mainContentLinks = this.parseLinks(activeNoteText, true);

		this.mainNameLinks = mainContentLinks.map((l: LinkTreeType) => l.name);

		this.linksTree = this.generateNotesHierarchy(mainContentLinks);

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
	}

	generateMarkdownFile(links: LinkTreeType[], mainNote: string) {
		this.composeMarkdown(links);

		// transform links to anchor in index note 
		this.mainNameLinks.forEach((mnl: string) => {

			mnl = fixSpaceInName(mnl);
			mainNote = mainNote.replaceAll(`[[${mnl}]]`, `[[#${mnl}]]`)
		});

		this.markdown = mainNote + this.markdown;

		new SaveModal(this.app, (fileName) => {
			this.app.vault.adapter.write(`${fileName}.md`, this.markdown).then(() => {
				new Notice(`Note ${fileName} created successfully`);
				this.app.workspace.openLinkText(`${fileName}.md`, "")
			});
		}).open();
		
	}

	composeMarkdown(links: LinkTreeType[]) {
		links.forEach((link: LinkTreeType) => {
			let note = getNoteByName(link.name, this.loadedFiles);
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

			// replace titles with just bold text
			// noteRows = note.split('\n');
			// note = noteRows.map((noteRow: string) => {
			// 	const match = noteRow.match(/# (\w+)/);
				
			// 	if (match)
			// 		return `**${match[1]}**`;

			// 	return noteRow;
			// }).join("\n");
			
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

	generateNotesHierarchy(links: LinkTreeType[]) {
		const linksObj: BuildLinkTreeType = this.dfs(links, 0);
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

	dfs(links: BuildLinkTreeType[], level: number, parentRef?: object, titleMapping?: object) {

		titleMapping = (titleMapping as BuildLinkTreeType) ?? {}; 
		links.forEach((link: BuildLinkTreeType, order: number) => {

			// skip link from mainContent
			if (this.mainNameLinks.includes(link.name) && level != 0)
				return;

			// skip if link is already processed
			if (this.processed.includes(link.name))
				return;

			this.processed.push(link.name);

			const note = getNoteByName(link.name, this.loadedFiles);
			const subLinks = this.parseLinks(note);

			this.maxLevel = level + 1;

			(titleMapping as any)[link.name] = { ...link, parentRef, level: this.maxLevel, order};

		  if (links.length > 0) {
			this.dfs(subLinks, this.maxLevel, (titleMapping as any)[link.name], titleMapping);
		  }
		});
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
