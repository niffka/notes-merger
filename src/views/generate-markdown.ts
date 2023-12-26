import { App, Notice, TAbstractFile, TFile } from "obsidian";
import { fixSpaceInName, getNoteByName } from '../utils';
import { LinkTreeType, BuildLinkTreeType, SlideType, CitationType, LatexImageType, LatexImagesStatus } from "src/types";
import { NotesMergerPluginSettingsType } from '../../main';
import { SlidesMarkdown } from './generate-slides-markdown';
import { GenerateLatex } from 'src/views/generate-latex';
import {
	Button, 
	BaseLink,
	SaveModal, 
	TreeMenu,
	SlidesModal,
	Checkbox,
	ErrorIcon,
} from '../components/index';


export class GenerateMarkdown {

	app: App;
	settings: NotesMergerPluginSettingsType;
	loadedFiles: TAbstractFile[] = [];
	mainNameLinks: string[] = [];
	linksTree: LinkTreeType[] = [];
	maxLevel: number = 0;
	processed: string[] = [];
	markdown: string = "";
	ignoredLinks: string[] = [];
	images: string[] = [];
	generateLatex: GenerateLatex;
	subbar: Element;
	structure: Element;
	static imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'bmp'].map((it: string) => `.${it}`);

	constructor(app: App, settings: NotesMergerPluginSettingsType, structure: Element, subbar: Element) {
		this.app = app;
		this.settings = settings;

		this.structure = structure;
		this.subbar = subbar;

		this.linksTree = [];
		this.maxLevel = 0;
		this.processed = [];
		this.mainNameLinks = [];
		this.ignoredLinks = [];
		this.markdown = "";
	}

	async readSelectedNote() {
		this.loadedFiles = this.app.vault.getMarkdownFiles();

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

		new Button(this.subbar, 'Generate Markdown', () => {
			
			// cleanup
			this.markdown = "";

			this.generateMarkdownFile(this.linksTree, activeNoteText);
		}, { cls: 'generate-markdown-btn'});

		new Button(this.subbar, 'Generate Slideshow', () => {
			new SlidesModal(this.app, this.linksTree, this.ignoredLinks, (slides: SlideType[], hasTitleSlide: boolean, hasLastSlide: boolean) => {
				const slidesMD = new SlidesMarkdown(slides, title, hasTitleSlide, hasLastSlide);

				new SaveModal(this.app, async (path: string) => {
					slidesMD.copyTemplates();
					await this.app.vault.adapter.write(path, slidesMD.slideshow)
					new Notice(`Slideshow ${path} created successfully`);
					this.app.workspace.openLinkText(path, "")

				}).open();
			}).open();
		}, { cls: 'generate-slides-btn'})
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
				if (!inlineText.includes(`[[${cl}]]`)){
					isInline = false;
				}
					
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

	async generateMarkdownFile(links: LinkTreeType[], mainNote: string) {

		this.composeMarkdown(links);

		this.markdown = this.markdown.trim();

		if (this.settings.insertIndexNote) {
			// transform links to anchor in index note 
			this.mainNameLinks.forEach((mnl: string) => {
				mnl = fixSpaceInName(mnl);
				mainNote = mainNote.replaceAll(`[[${mnl}]]`, `[[#${mnl}]]`)
			});

			this.markdown = mainNote + '\n' + this.markdown;
		}

		if (this.settings.insertPreviewContent) {
			const contentPreview = this.makeContentPreviewMD(links, "");
			this.markdown = contentPreview + '\n' + this.markdown;
		}

		new SaveModal(this.app, async (path: string) => {		
			await this.app.vault.adapter.write(path, this.markdown)
			new Notice(`Note ${path} created successfully`);
			this.app.workspace.openLinkText(path, "");
		}).open();
		
	}

	composeMarkdown(links: LinkTreeType[]) {
		const inlineLinks = links.filter(link => link.inline);
		this.markdown = this.insertToNearestNewLine(this.markdown, inlineLinks);

		// remove inline links that start on the new line
		// they're replaced with link's note text
		inlineLinks.forEach((iLink: LinkTreeType) => {
			const re = new RegExp(`^\\[\\[#?${iLink.name}\\]\\]\n`, 'gm');
			this.markdown = this.markdown.replace(re, '');
		});

		links.forEach((link: LinkTreeType) => {

			if (this.ignoredLinks.includes(link.name))
				return;

			// trim enters and spaces
			let note = link.note.trim();

			note = this.cleanNote(link, note);
			// remove 'Kam dál' part
			if (note.includes(this.settings.listOfLinksKeyword)) {
				const [importantPart, endPart] = note.split(this.settings.listOfLinksKeyword);
				note = importantPart.trim();
			}

			const title = this.transformTitle(link);

			note = `${title}\n${note}`;

			if (!link.inline)
				this.markdown += `\n${note}\n`;

			this.markdown = this.markdown.replace(`[[${link.name}]]`, `[[#${link.name}]]`);

			if ('children' in link)
				this.composeMarkdown(link.children);
		});
	}

	cleanNote(link: LinkTreeType, note: string) {
		// remove title on a first line
		let noteRows = note.split('\n');
		const firstRow = fixSpaceInName(noteRows[0]);
		if (firstRow.includes(`# ${link.name}`)) {
			noteRows.shift();
			note = noteRows.join("\n").trim();
		}

		// remove status tag (#dokoncene, #rozpracovane)
		noteRows = note.split('\n');
		note = noteRows.reduce((acc: string, row: string) => {
			let val = acc + row;
			if (row.match(/^(#\w)+(.*)/)) {
				val = acc;
			}
			
			return val + '\n';
			
		}, '');

		// replace any titles in local note to bold 
		const localHeading = note.matchAll(/#+\s+(.*)\n/g);
		[...localHeading].forEach(([raw, cl]: [string, string]) => {
			note = note.replace(raw, `**${cl.trim()}**\n`)
		});
		return note.trim();
	}

	transformTitle(link: LinkTreeType) {
		let title = "";
		if (link.inline) {
			// h5
			title = `##### ${link.name}`;
		} else {
			// nested title e.g. h3 -> ### title3
			const nestedLevel = Array(link.level).fill('#').join('');
			title = `${nestedLevel} ${link.name}`;
		}
		return title;
	}

	async generateNotesHierarchy(links: LinkTreeType[]) {
		const linksObj: BuildLinkTreeType = await this.createParentStructure(links, 0, []);
		let linksArr: LinkTreeType[] = [];

		Object.keys(linksObj).forEach(key => {
			const {parentRef, ...rest} = linksObj[key as keyof BuildLinkTreeType] as BuildLinkTreeType; 
			linksArr.push({...rest, parent: (linksObj[key as keyof BuildLinkTreeType] as BuildLinkTreeType)?.parentRef?.name});
		});

		const buildChildrenFromParents = (arr: LinkTreeType[], parent: string | undefined) => {
			let children = [];
			for(let i = 0; i < arr.length; i++) {
				if(arr[i].parent == parent) {
					const grandChildren = buildChildrenFromParents(arr, arr[i].name);
					if(grandChildren.length) {
						arr[i].children = grandChildren;
					}
					children.push(arr[i]);
				}
			}
			return children;
		}
		return buildChildrenFromParents(linksArr, undefined);
	}

	async createParentStructure(links: BuildLinkTreeType[], level: number, processed: string[], parentRef?: object, titleMapping?: object) {
		titleMapping = (titleMapping as BuildLinkTreeType) ?? {}; 

		for await (const [order, link] of links.entries()) {

			// skip link from mainContent
			if (this.mainNameLinks.includes(link.name) && level != 0)
				continue;

			// skip if link is already processed
			if (processed.includes(link.name))
				continue;

			processed.push(link.name);

			let note = await getNoteByName(this.app, link.path)
			const subLinks = this.parseLinks(note);

			const incomplete = (note.length <= 160 && !note.includes(this.settings.listOfLinksKeyword)) ? true : false;
			this.maxLevel = level + 1;

			if (note.includes(this.settings.listOfLinksKeyword)) {
				let [importantPart, endPart] = note.split(this.settings.listOfLinksKeyword);
				note = importantPart.trim();
			}

			(titleMapping as any)[link.name] = { ...link, parentRef, level: this.maxLevel, order, note, incomplete };

			if (links.length > 0)
				await this.createParentStructure(subLinks, this.maxLevel, processed, (titleMapping as any)[link.name], titleMapping);
		}

		return titleMapping as BuildLinkTreeType;
	}

	makeContentPreviewMD(links: LinkTreeType[], previewContent: string = "") {
		links.forEach((link: LinkTreeType) => {
			if (link.exists && link.level) {
				if (this.ignoredLinks.includes(link.name))
					return;

				const tabs = Array(link.level - 1).fill('\t').join('');

				previewContent += `${tabs}- [[#${link.name}]]\n`;
			}

			if ('children' in link)
				previewContent += this.makeContentPreviewMD(link.children);
		});

		return previewContent;
	}

	insertToNearestNewLine(note: string, links: LinkTreeType[]) {
		// find common line
		// create array at that line
		// if new common comes, push it there
		// at the end make it back to string

		let specialArr: (string|[])[] = [];
	
		const rows = note.split("\n");
		const emptyLines: number[] = [];
		rows.forEach((row, index) => {
			if (row == "") { 
				specialArr.push([]);
				emptyLines.push(index);
			} else
				specialArr.push(row);
		})
		specialArr.push([]);
		emptyLines.push(specialArr.length-1)

		links.forEach(link => {
			const index = specialArr.findIndex(row => typeof row === 'string' && row.includes(`[[${link.name}]]`))
		
			//only consider numbers higher than the target
			const findClosestHigher = emptyLines.filter(candidate => candidate > index)[0];

			const title = this.transformTitle(link);

			// trim enters and spaces
			let note = link.note.trim();

			if (note.length == 0)
				return;

			if (this.ignoredLinks.includes(link.name))
				return;

			note = this.cleanNote(link, note);

			(specialArr[findClosestHigher] as Array<string>).push(title, note);
		});

		// flatten and join to string
		return specialArr
			.map(row => typeof row === 'string' ? row : row.join("\n"))
			.join("\n").trim() + "\n";
	}
}
