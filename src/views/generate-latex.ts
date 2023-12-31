import * as fs from 'fs';
import * as Path from 'path';
import { Notice, App, TFile, TAbstractFile, } from 'obsidian';
import { CitationType, BookCitationType, WebCitationType, LatexErrorType, AttachmentsType, LatexImagesStatus, LatexImageType } from 'src/types';
import { fromMarkdown } from 'mdast-util-from-markdown'
import { Root, Code, Heading, Text, InlineCode, Parent, Image } from 'mdast-util-from-markdown/lib'
import { NotesMergerPluginSettingsType } from 'main';
import { getNoteByName } from "src/utils";
import { RootContent } from 'mdast';
import { formatDateNow } from 'src/utils';
import { PEFTemplate } from 'src/latex-template/pef.template';
import { Citation } from 'src/views/citation';
import {
	Button, 
	BaseLink,
	SaveModal, 
	Checkbox,
	ErrorIcon,
	CollapsibleCitation
} from '../components/index';

export class GenerateLatex { 
	app: App;
	settings: NotesMergerPluginSettingsType;
	literatureNote: string;
	literature: {
		citations: Array<BookCitationType|WebCitationType>,
		incorrect: string[]
	}
	citations: CitationType[] = [];
	images: Image[] = [];
	errors: LatexErrorType[] = [];
	activeNote: TFile;
	activeNoteText: string;
	attachments: AttachmentsType | null; 
	allFiles: TAbstractFile[]
	template: PEFTemplate;
	structure: Element;

	imageRefRegex = new RegExp(/\[(.*(.jpg|.gif|.png|.bmp|.webp))\]/g);

	latex: string = "";

	constructor(app: App, settings: NotesMergerPluginSettingsType, structure: Element) {
		this.settings = settings;
		this.app = app;
		this.structure = structure;

		const activeNote = app.workspace.getActiveFile();

		if (!activeNote) {			
			new Notice(`Selected note is invalid.`);
			throw new Error("Selected note is invalid.");
		}

		this.activeNote = activeNote;
	}

	async loadRequirements(isPlain: boolean = false) {
		this.images = [];

		this.activeNoteText = await this.getActiveNote(this.app, this.activeNote);
		this.allFiles = app.vault.getAllLoadedFiles();
		let images: LatexImagesStatus = this.getImages(this.activeNoteText, this.allFiles);
		let metadata: Record<string, string | null> | null  = null;
		if (!isPlain) {
			this.literatureNote = await this.getLiteratureNote(this.app, this.settings.literatureNote);
			this.literature = this.parseLiteratureNote(this.literatureNote);

			this.attachments = await this.getAttachments(this.app, this.allFiles);

			const metadataNote = await this.getTemplateMetadataNote(this.app, `${this.settings.metadataNote}.md`);
			this.template = new PEFTemplate(metadataNote, this.settings);
			
			metadata = this.template.getMetadata();

			if (this.attachments?.images) {
				const { correct, incorrect, count } = this.attachments.images; 
				images = {
					...images, 
					correct: [...images.correct, ...correct],
					incorrect: [...images.incorrect, ...incorrect],
					count: images.count + count
				}
			}
		}

		return {
			metadata: metadata,
			attachments: this.attachments,
			literature: this.literature,
			images,
		}
	}

	async renderLatexStatus(generateLatex: GenerateLatex) {
		
		this.structure.empty();	
		
		new BaseLink(this.app, this.structure, generateLatex.activeNote.basename);
		const { images } = await generateLatex.loadRequirements(true);

		this.imageLatexStatus(images);

		new Button(this.structure, 'Generate LaTeX', () => {
			generateLatex.generate(images);
		}, { cls: 'generate-final-btn'});
	}

	async renderLatexWithTemplateStatus(generateLatex: GenerateLatex) {
		const insertThesisParts: Record<string, boolean> = {
			metadata: true,
			literature: true,
			attachments: true
		};

		const insertWithCheckbox = (structure: Element, type: string, onClick: (state: boolean) => void) => {

			const settingPaths: Record<string, string> = {
				attachment: this.settings.attachmentsDir,
				literature: this.settings.literatureNote,
				metadata: this.settings.metadataNote
			};

			let state: boolean = true;
			const insertAttEl = structure.createEl('div', { cls: 'insert-with-checkbox' });
			insertAttEl.createEl('span', {
				text: `Insert ${type} (${settingPaths[type]}.md)`
			});
			new Checkbox(insertAttEl, state, true, () => {
				state = !state;
				onClick(state);
				insertThesisParts[type] = state;
			})
		}
	
		const applyStateClass = (element: Element, state: boolean, className: string = "disabled-text") => {
			if (state)
				element.addClass(className);
			else
				element.removeClass(className);
		}

		new BaseLink(this.app, this.structure, generateLatex.activeNote.basename);
			
		const { 
			metadata,
			attachments,
			literature,
			images
		} = await generateLatex.loadRequirements();

		this.structure.createEl('h3', { 
			text: 'Metadata' + (metadata ? ` (${Object.keys(metadata).length})` : '')
		});
		if (metadata) {
			let table: Element;
			insertWithCheckbox(this.structure, 'metadata', (state) => {
				applyStateClass(table, !state);
			});
			table = this.structure.createEl('table');
			Object.keys(metadata).forEach((key: string) => {
				const tr = table.createEl('tr');
				tr.createEl('th', { text: key }).setAttr("align", "left");
				tr.createEl('td', { text: metadata[key] || "–⁠⁠⁠⁠⁠⁠⁠⁠⁠" });
			});
		} else {
			this.structure.createEl('div', { text: 'Metadata not loaded.'});
		}

		this.imageLatexStatus(images);

		this.structure.createEl('h3', { 
			text: 'Literature' + (literature.citations.length ? ` (${literature.citations.length})` : '')
		});

		if (this.literatureNote) {
			let contentEl: Element;
			if (literature.citations.length) {
				insertWithCheckbox(this.structure, 'literature', (state) => {
					applyStateClass(contentEl, !state);
				});
				contentEl = this.structure.createEl('div')
				literature.citations.forEach((lit: CitationType) => {
					const litEl = contentEl.createEl('div', { cls: 'row-spacy'});
					const labelEl = litEl.createEl('a', { text: lit.label, cls: 'bold' });
					labelEl.onclick = () => {
						const literatureLinkPath = `${this.settings.literatureNote}#${lit.label}`;
						this.app.workspace.openLinkText(literatureLinkPath, "")
					}
					litEl.createEl('div', { text: lit.title });
					new CollapsibleCitation(litEl, lit, false);
				});
			}

			if (literature.incorrect.length > 0) {
				contentEl = this.structure.createEl('div')
				contentEl.createEl('strong', { text: 'Incorrect citations' });
				literature.incorrect.forEach((label: string) => {
					const litEl = contentEl.createEl('div', { cls: 'row-spacy'});
					litEl.createEl('i', { cls: 'error-icon'}).appendChild(new ErrorIcon().element);
					const labelEl = litEl.createEl('a', { text: label, cls: 'bold' });
					labelEl.onclick = () => {
						const literatureLinkPath = `${this.settings.literatureNote}#${label}`;
						this.app.workspace.openLinkText(literatureLinkPath, "")
					}
				});
			}
			
		} else {
			this.structure.createEl('div', { text: 'Literature not loaded.'});
		}

		this.structure.createEl('h3', {
			text: 'Attachments' + (attachments ? ` (${attachments?.attachments.length})` : '')
		});
		if (attachments) {
			let contentEl: Element;
			insertWithCheckbox(this.structure, 'attachment', (state) => {
				applyStateClass(contentEl, !state);
			});
			const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			contentEl = this.structure.createEl('div');
			attachments.attachments.forEach((attachment: TFile, key: number) => {
				const attEl = contentEl.createEl('div', { cls: 'row-spacy'});
				attEl.createEl('div', { text: `Attachment ${alphabet[key] || '-'}`, cls: 'bold'});
				attEl.createEl('a', { text: attachment.basename, cls: 'bold' });
				attEl.onclick = () => {
					this.app.workspace.openLinkText(attachment.path, "")
				}
				attEl.createEl('span', { text: ` - ${attachment.path}`});
			});
		} else {
			this.structure.createEl('div', { text: 'Attachments not loaded.'})
		}

		new Button(this.structure, 'Generate LaTeX', () => {
			// if (!metadata) {
			// 	new Notice(`Error: Metadata not loaded.\nCreate metadata note or set correct path in settings (Thesis template metadata note).`);
			// 	throw new Error("Error: Metadata not loaded.");
			// }

			// if (!literature) {
			// 	new Notice(`Error: Literature not loaded.\nCreate literature note or set correct path in settings (Literature note).`);
			// 	throw new Error("Error: Literature not loaded.");
			// } 

			generateLatex.generate(images, insertThesisParts);
		}, { cls: 'generate-final-btn'});
	}

	imageLatexStatus({ 
		correct,
		incorrect,
		count
	}: LatexImagesStatus) {
		this.structure.createEl('h3', { 
			text: 'Images' + (!!count ? ` (${count})` : '')
		});
		if (!!count) {
			correct.forEach((image: LatexImageType) => {
				const imgEl = this.structure.createEl('div', { cls: 'row-spacy'});
				const a = imgEl.createEl('a', { text: image.name, cls: 'bold' });
				a.onclick = () => {
					this.app.workspace.openLinkText(image.path, "")
				}
				imgEl.createEl('div', { text: image.desc });
				image.source && imgEl.createEl('div', { text: image.source });
			});

			if (incorrect.length > 0) {
				this.structure.createEl('strong', { text: 'Incorrect images (bad format)'})
				incorrect.forEach((image: LatexImageType) => {
					const imgEl = this.structure.createEl('div', { cls: 'row-spacy'});
					imgEl.createEl('i', { cls: 'error-icon'}).appendChild(new ErrorIcon().element);
					const a = imgEl.createEl('a', { text: image.name, cls: 'bold' });
					a.onclick = () => {
						this.app.workspace.openLinkText(image.path, "")
					}
				});
			}
		} else {
			this.structure.createEl('div', { text: 'No images found.'});
		}
	}
	
	generate(images: LatexImagesStatus, thesisParts?: Record<string, boolean>) {
		const latex = this.translateMarkdown(this.activeNoteText);

		if (images.incorrect.length > 0) {
			new Notice(`Fix images format before generating Latex.`);
			throw new Error("Fix images format before generating Latex.");
		}

		if (!thesisParts) {
			// plain thesis
			this.generateLatexFiles(latex);
		} else {
			// with template
			const latexCitations = this.createLatexCitations(this.literature.citations);

			const latexAttachments = this.attachments ? this.attachments?.latex : null;

			const thesis = this.template.composeThesis(thesisParts, latex, latexCitations, latexAttachments);

			this.generateLatexFiles(thesis, false);
		}

	}

	translateMarkdown(note: string) {
		const root: Root = fromMarkdown(note);

		let latex = root.children.map((child: RootContent) => {
			const result = this.node(child, 0);

			// if tag, exlude it
			if (result && result.startsWith("#"))
				return;
			
			return result;

		}).join("\n\n");

		latex = this.refCite(latex);
		latex = this.mergeCloseRefCitations(latex);
		latex = this.refImage(latex);
		latex = this.removeMarkdownLeftovers(latex);
		latex = this.basicRef(latex); 
		
		latex = this.fixLatexSpecialCharacters(latex)

		return latex;
	}

	generateLatexFiles(thesis: string, isPlain: boolean = true) {
		new SaveModal(app, async (path: string) => {
			//@ts-ignore
			const basePath = app.vault.adapter.basePath;

			const vaultPath = Path.join(basePath, 'generated-latex');

			if (!fs.existsSync(vaultPath))
				fs.mkdirSync(vaultPath);

			const thesisName = path.replace('.md', '');

			const thesisDir = Path.join(vaultPath, thesisName + '_' + formatDateNow()); 

			fs.mkdirSync(thesisDir);

			const imageDirName = this.settings.latexImagesDirectoryName;
			const imageDirPath = Path.join(thesisDir, imageDirName);

			fs.mkdirSync(imageDirPath);

			const images: TAbstractFile[] = [];

			this.images.forEach(img => {
				const imageObject = this.allFiles.find((file: TFile) => file.name.toLowerCase() === img.url.toLowerCase())
				if (imageObject)
					images.push(imageObject);
			});

			// move images
			images.forEach((image: TAbstractFile) => {
				
				const oldPath = Path.join(basePath, image.path);
				const newPath = Path.join(imageDirPath, image.name.toLowerCase());

				fs.copyFileSync(oldPath, newPath); 
			})
			
			fs.writeFileSync(Path.join(thesisDir, 'main.tex'), thesis);
			if (!isPlain) {
				const latexTemplate = this.template.getLatexStyle();
				fs.writeFileSync(Path.join(thesisDir, 'latexStyle.sty'), latexTemplate);
			}
			
			new Notice(`${thesisName} and ${imageDirName} created successfully.`);
			new Notice(`${images.length} images copied successfully.`);
		}, false).open();

	}

	heading(ast: Heading) {
		const { depth, children } = ast;
		const transformHeadings: Record<number, string> = {
			1: 'kapitola',
			2: 'sekce',
			3: 'podsekce'
		}

		let heading = null;
		const headingValue = (children[0] as Text).value;
		if (depth >= 1 && depth <= 3) {
			const level = transformHeadings[depth];
			heading = `\\${level}{${headingValue}}`; 
		} else {
			heading = `\\subsubsection*{${headingValue}}`;
		}

		return heading;
	}

	node(ast: RootContent, indent: number = 0): any {
		if ('value' in ast) {
			// it must be a table
			if (ast.type == 'text' && ast.value.split("|").length >= 5) {
				return this.table(ast.value);
			}

			if (ast.type == 'code') {
				return this.code(ast);
			}

			if (ast.type == 'inlineCode') {
				return this.inlineCode(ast);
			}

			return ast.value;
		}

		if (ast.type == "heading") {
			return this.heading(ast);
		}

		if(ast.type == "list") {
			if (ast.ordered) {
				return ("\t".repeat(indent) + "\\begin{enumerate}\n" + 
					ast.children.map(sub => this.node(sub, indent + 1)).join("\n") + 
				"\n" + "\t".repeat(indent) + "\\end{enumerate}\n");	
			} else {
				return ("\\begin{itemize}\n" + 
					ast.children.map(sub => this.node(sub, indent + 1)).join("\n") + 
				"\n\\end{itemize}\n");	
			}
		}

		if (ast.type == 'image') {
			return (
				`\\obrazek\n\\vlozobrbox{${ast.url}}{0.7\\textwidth}{!}\n` +
				`\\endobrl{${ast?.alt ? `${this.fixLatexSpecialCharacters(ast?.alt)}`: ''}` +
				`${ast?.title ? ` \\obrzdroj{${this.fixLatexSpecialCharacters(ast.title)}}` : ''}}\n{${ast.url}}`
			)
		} 

		try {
			return (ast as Parent).children.map((child) => {

				if (ast.type == "paragraph") {
					return this.node(child);
				}
		
				if (ast.type == "strong") {
					return "\\textbf{" + this.node(child) + "}";
				}
		
				if (ast.type == "emphasis") {
					return "{\\it " + this.node(child) + "}";
				}

				if (ast.type == "listItem") {
					// start of sublist, dont insert "\item"
					if (child.type == "list") 
						return "\n" + this.node(child, indent);

					return "\t".repeat(indent) + "\\item " + this.node(child, indent);
				}
			}).join("");
		} catch (error) {
			this.errors.push({
				type: 'unknown_markdown',
				item: [ast.type],
				message: `Markdown translation error: ${ast.type}.`
			});
			console.error(this.errors);
		}
	}

	refCite(latex: string) { 
		const links = [...latex.matchAll(/\[\[.+#(\w+)\]\]/g)];
		links.forEach(([raw, clean]: [string, string]) => {
			latex = latex.replace(raw, `\\cite{${clean.toLowerCase()}}`);
		});
		return latex;
	}

	parseLiteratureNote(note: string) {
		const notesRow: string[] = note.split('\n');

		const allCitations = notesRow
			.filter((row: string) => row.startsWith("#"))
			.map((row: string) => row.replace("#", "").trim());

		const citations: Array<WebCitationType|BookCitationType> = [];

		while (notesRow.length > 0) {
			const row = notesRow.shift() as string;
			if (row === "")
				continue;
			
			if (row.startsWith("#")) {
				let citation, type, inline, authors, title;
				// new citation block start
				const label = row.replace("#", "").trim();
				try {
					citation = new Citation(label, this.settings);
					type = citation.parseRow("type", notesRow);
					inline = citation.parseRow("citation in text", notesRow);

					authors = [];
					while (notesRow[0].startsWith("-")) {
						authors.push(citation.parseRow("author", notesRow, "-"));
					}

				title = citation.parseRow("title", notesRow);

				} catch (e) {
					console.error(e);
					continue;
				}

				const commonParams = {
					label,
					type,
					inline,
					authors,
					title
				};

				if (type.toLowerCase() === 'book') {
					const citationBlock = {...commonParams} as BookCitationType;
					try {
						citationBlock["format"] = citation.parseRow("format", notesRow);
						citationBlock["publishedPlace"] = citation.parseRow("published place", notesRow);
						citationBlock["publisher"] = citation.parseRow("publisher", notesRow);
						citationBlock["publishedYear"] = citation.parseRow("published year", notesRow);
						citationBlock["edition"] = citation.parseRow("edition", notesRow);
						citationBlock["isbn"] = citation.parseRow("isbn", notesRow); 
						citationBlock["date"] = citation.parseRow("date", notesRow);
						citationBlock["source"] = citation.parseRow("source", notesRow);
						citations.push({ ...commonParams, ...citationBlock});
					} catch (e) {
						console.error(e);
						continue;
					}
				}
				else if (type.toLocaleLowerCase() === 'web') {
					const citationBlock = {...commonParams} as WebCitationType;
					try {
						citationBlock["webDomain"] = citation.parseRow("web domain", notesRow);
						citationBlock["publishedPlace"] = citation.parseRow("published place", notesRow);
						citationBlock["publisher"] = citation.parseRow("publisher", notesRow)
						citationBlock["publishedDate"] = citation.parseRow("published date", notesRow);
						citationBlock["revisionDate"] = citation.parseRow("revision date", notesRow);
						citationBlock["date"] = citation.parseRow("date", notesRow);
						citationBlock["source"] = citation.parseRow("source", notesRow);
						citations.push(citationBlock);
					} catch (e) {
						console.error(e);
						continue;
					}

				} else {
					console.error('Incorrect/missing type');
					continue;
				}
			}
		}

		const correctLabels = citations.map(citation => citation.label);
		const incorrectCitations = allCitations.filter(citation => !correctLabels.includes(citation));

		return {
			citations,
			incorrect: incorrectCitations
		}
	}

	createLatexCitations(citations: Array<BookCitationType|WebCitationType>) {
		citations = citations.sort((a, b) => a.label.localeCompare(b.label));

		const citationString = citations.map(citation => {

			if (citation.type.toLowerCase() === 'book') {
				const { 
					label, inline, title, format, 
					edition, isbn, publishedYear, 
					date, source, publishedPlace,
					publisher, authors
				} = citation as BookCitationType;

				return `\\citace{${label.toLowerCase()}}{${inline}}{\n\\autor{${authors.join(', ')}}\n`
					+ `\\nazev{${title && `${title}.`}}${format && ` [${format}].`}`
					+ `${publishedPlace && ` ${publishedPlace}:`}${publisher && ` ${publisher},`}`
					+ `${publishedYear && ` ${publishedYear}.`}${edition && ` ${edition}.`}${isbn && ` ${isbn}.`}`
					+ ` [${date}].${source && ` Dostupné z: ${this.fixLatexSpecialCharacters(source)}`}}`;

			} else if (citation.type.toLowerCase() === 'web') {
				const { 
					label, inline, title, 
					revisionDate, publishedDate, webDomain, 
					date, source, publishedPlace,
					publisher, authors
				} = citation as WebCitationType;

				return `\\citace{${label.toLowerCase()}}{${inline}}{\n\\autor{${authors.join(',')}}\n`
				+ `\\nazev{${title && `${title}.`}${webDomain && ` ${webDomain}`}} [online].`
				+ `${publishedPlace && ` ${publishedPlace}:`}${publisher && ` ${publisher},`}`
				+ `${publishedDate && ` ${publishedDate},`}${revisionDate && ` ${revisionDate}`}`
				+ ` [${date}].${source && ` Dostupné z: ${this.fixLatexSpecialCharacters(source)}`}}`;
			}

		}).join("\n\n");

		return citationString;
	}

	refImage(latex: string) {
		const refs = [...latex.matchAll(this.imageRefRegex)];
		refs.forEach(([raw, clean]) => {
			const [ match ] = this.images.filter((img) => img.url === clean);

			if (match) {
				latex = latex.replace(raw, `\\ref{${clean}}`);
			} else {
				this.errors.push({ type: 'ref_image', item: [raw, clean], message: `Reference to image '${clean}' ('${raw}') is not valid.` })
				console.error(this.errors)
			}
		});

		return latex;
	}

	mergeCloseRefCitations(latex: string) {
		const regexes = [
			new RegExp(/((\\cite{\w+}\s*){5})/g),
			new RegExp(/((\\cite{\w+}\s*){4})/g),
			new RegExp(/((\\cite{\w+}\s*){3})/g),
			new RegExp(/((\\cite{\w+}\s*){2})/g),
		]

		regexes.forEach((regex: RegExp) => {
			const refs = [...latex.matchAll(regex)];
			refs.forEach((ref: any) => {
				const matches = [...ref[0].matchAll(/\\cite{(\w+)}/g)];
				const cleanRefs = matches.map((m: any) => m[1]).join(',');
				latex = latex.replace(ref[0], `\\cite{${cleanRefs}}`)
			})
		})

		return latex;
	}

	table(markdownTable: string) {
		const mRows = markdownTable.split("\n");
		const mHeader = mRows.shift();
		mRows?.shift();

		const tHeader = mHeader?.split("|").filter(Boolean).map((h: string) => h.trim());

		// theoretically header can be
		let tBody = null; 
		let metadata = null;
		if (mRows.length >= 1) {

			// search for metadata at the end of table [label] [cite (This is example table)] [source of table]
			const match = [...mRows[mRows.length - 1].matchAll(/\[(.*?)\]/g)];
			metadata = {label: null, cite: null, source: null};
			const headerMetadata = ["label", "cite", "source"];
			if (match.length > 0) {
				mRows.pop();
				metadata = headerMetadata.reduce((acc, cur, i) => { 
					return {
						...acc, 
						[cur]: match.length >= i+1 ? match[i][1] : null
					};

				}, {}) as any;
			}

			// transform body to latex format
			tBody = mRows?.map((mRow: string) => {
				const cols = mRow.split("|").filter(Boolean).map((h: string) => h.trim());

				return tHeader?.reduce((acc, cur, i) =>({ ...acc, [cur]: cols[i]}), {});
			});
		}

		let latexTable = `\\tabulka{${metadata?.cite ? metadata.cite : ''}}\n` + 
		`\\label{${metadata?.label ? metadata.label : ''}}\n\\def\\arraystretch{1.5}\n` +
		`\\begin{tabular}{|l|c|c|} \\hline\n` + 
		tHeader?.map((h: string, i: number) => `\\textbf{${h}} ` + (tHeader.length-1 != i ? '&' : `\\\\ \\hline`)).join("\n");

		if (tBody) {
			latexTable += "\n";
			latexTable += tBody.map((row: any) => {
				return Object.values(row).map((col: string, i: number) => `${col} ` + (Object.values(row).length-1 != i ? '&' : `\\\\ \\hline`)).join(" ")
			}).join("\n");
		}

		latexTable += `\n\\end{tabular}\n`;

		if (metadata?.source) {
			latexTable += `\n\\tabzdroj{${metadata.source ? metadata.source : ''}}\n\\endtab`;
		} else {
			latexTable += '\\endtab';
		}

		return latexTable;
	}

	code(ast: Code) {
		const metadata: Record<string, null | string> = {
			label: null,
			cite: null
		};

		if (ast.meta) {
			const metaArr = ast.meta.split("|");

			if (metaArr.length == 1) {
				metadata["label"] = metaArr[0];
			}

			if (metaArr.length == 2) {
				metadata["label"] = metaArr[0];
				metadata["cite"] = metaArr[1];
			}
		}

		return (
			`\\begin{lstlisting}[language=java, caption=${metadata.cite ?? ""}, label={${metadata.label ?? ''}}]\n` 
			+ ast.value + `\n\\end{lstlisting}`
		); 
	}

	inlineCode(ast: InlineCode) {
		return "{\\it " + this.fixLatexSpecialCharacters(ast.value) + "}";
	}

	removeMarkdownLeftovers(latex: string) {
		// remove links [[foobar]] and [[#foobar]]
		const links = [...latex.matchAll(/\[\[(.*)\]\]/g)];

		links.forEach(([raw, clean]) => {
			if (clean.startsWith("#"))
				clean = clean.replace("#", '')

			latex = latex.replaceAll(raw, `${clean}`);
		});
		
		return latex;
	}

	// intext ref citation 
	basicRef(latex: string) {
		const possibleRefs = [...latex.matchAll(/\[(\w+)\]/g)];

		possibleRefs.forEach(([raw, clean]) => {
			latex = latex.replace(raw, `\\ref{${clean}}`);
		});

		return latex;
	}

	// find all images in active note
	// also get all possible/wrong images
	getImages(note: string, allFiles: TAbstractFile[]) {
		const images = [...note.matchAll(/\!\[(.*)\]\((.*)\)/g)];
		const correctImages: LatexImageType[] = [];
		images.forEach(([raw]) => {
			try {
				const root = fromMarkdown(raw).children;
				const image = ((root[0] as Parent).children[0] as Image);
				if (image.type === 'image') {
					correctImages.push({
						raw: image.url,
						desc: image.alt ?? undefined,
						name: image.url,
						source: image.title ?? undefined,
						path: allFiles.find((file: TFile) => file.name.toLowerCase() === image?.url.toLowerCase())?.path ?? image?.url
					});
					this.images.push(image);
				}
			} catch (e) {
				console.error(`Something went wrong: ${e}`);
			}
		});

		const incorrectImages = [
			...note.matchAll(/\!\[\[(.*)\]\]/g),
			...note.matchAll(/\!\[(.*)\]\[(.*)\]/g)
		];
		const incorrect = incorrectImages.map(([raw, name]) => ({
			raw,
			name,
			path: allFiles.find((file: TFile) => file.name.toLowerCase() === name.toLowerCase())?.path ?? name
		}));

		return {
			count: correctImages.length + incorrect.length,
			correct: correctImages,
			incorrect,
		}
	}

	async getAttachments(app: App, allFiles: TAbstractFile[]) {
		if (!this.settings.attachmentsDir)
			return null;

		const attachments = allFiles.filter(
			(file: TFile) => file.path.includes(this.settings.attachmentsDir) && file?.extension === "md"
		).sort((a, b) => a.name.localeCompare(b.name));

		if (attachments.length <= 0)
			return null;

		let attachmentLatex = "";
		let images: LatexImagesStatus = {
			correct: [],
			incorrect: [],
			count: 0
		};
		for await (const att of attachments) {
			const note = await getNoteByName(app, att.path);

			const {correct, incorrect, count} = this.getImages(note, allFiles);
			if (count > 0) {
				images = {
					...images,
					correct: [...images.correct, ...correct],
					incorrect: [...images.incorrect, ...incorrect],
					count: images.count + count
				}
			}

			const latex = this.translateMarkdown(note);

			attachmentLatex += (
				`\n\\priloha{${(att as TFile).basename}}\n` +
				`${latex}\n`
			);
		}

		return { 
			attachments,
			images,
			latex: attachmentLatex
		};
	}

	// special characters: %, #, _
	fixLatexSpecialCharacters(latex: string) {
		latex = latex.replaceAll("_", "\\_");
		latex = latex.replaceAll("%", "\\%");
		latex = latex.replaceAll("$", "\\$");
		latex = latex.replaceAll("#", "\\#");

		return latex;
	}

	async getActiveNote(app: App, activeNote: TFile) {
		const text = await getNoteByName(app, activeNote.path);

		if (!activeNote) {
			new Notice(`Selected note is invalid.`);
			throw new Error("Selected note is invalid.");
		}
		return text;
	}

	async getLiteratureNote(app: App, path: string) {
		const literature = await getNoteByName(app, `${path}.md`);
		return literature
	}

	async getTemplateMetadataNote(app: App, path: string) {
		const templateNote = await getNoteByName(app, path);
		return templateNote;
	}
}
