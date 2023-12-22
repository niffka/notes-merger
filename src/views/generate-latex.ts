import * as fs from 'fs';
import { Notice, App, TFile, TAbstractFile, } from 'obsidian';
import { CitationType, LatexErrorType, AttachmentsType, LatexImagesStatus, LatexImageType } from 'src/types';
import { fromMarkdown } from 'mdast-util-from-markdown'
import { Root, Code, Heading, Text, InlineCode, Parent, Image } from 'mdast-util-from-markdown/lib'
import { GenerateMarkdownPluginSettingsType } from 'main';
import { getNoteByName } from "src/utils";
import { RootContent } from 'mdast';
import { SaveModal } from 'src/components';
import { formatDateNow } from 'src/utils';
import { PEFTemplate } from 'src/latex-template/pef.template';
import { Citation } from 'src/views/citation';


export class GenerateLatex { 
	app: App;
	settings: GenerateMarkdownPluginSettingsType;
	literatureNote: string;
	literature: CitationType[] = [];
	citations: CitationType[] = [];
	images: Image[] = [];
	errors: LatexErrorType[] = [];
	activeNote: TFile;
	activeNoteText: string;
	metadata: Record<string, string | null> | null
	attachments: AttachmentsType | null; 
	allFiles: TAbstractFile[]
	template: PEFTemplate;

	imageRefRegex = new RegExp(/\[(.*(.jpg|.gif|.png|.bmp|.webp))\]/g);

	latex: string = "";

	constructor(app: App, settings: GenerateMarkdownPluginSettingsType) {
		this.settings = settings;
		this.app = app;

		const activeNote = app.workspace.getActiveFile();

		if (!activeNote) {			
			new Notice(`Selected note is invalid.`);
			throw new Error("Selected note is invalid.");
		}

		this.activeNote = activeNote;
	}

	async loadRequirements() {
		this.activeNoteText = await this.getActiveNote(this.app, this.activeNote);

		this.literatureNote = await this.getLiteratureNote(this.app, this.settings.literatureNote);
		this.literature = this.parseLiteratureNote(this.literatureNote);

		this.allFiles = app.vault.getAllLoadedFiles();
		
		this.attachments = await this.getAttachments(this.app, this.allFiles);

		const metadataNote = await this.getTemplateMetadataNote(this.app, `${this.settings.metadataNote}.md`);

		this.template = new PEFTemplate(metadataNote);

		this.metadata = this.template.getMetadata();

		let images: LatexImagesStatus = this.getImages(this.activeNoteText, this.allFiles);
		
		if (this.attachments?.images) {
			const { correct, incorrect, count } = this.attachments.images; 
			images = {
				...images, 
				correct: [...images.correct, ...correct],
				incorrect: [...images.incorrect, ...incorrect],
				count: images.count + count
			}
		}

		return {
			metadata: this.metadata,
			attachments: this.attachments,
			literature: this.literature,
			images,
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
			const latexCitations = this.createLatexCitations(this.literature);

			const thesis = this.template.composeThesis(thesisParts, latex, latexCitations, this.attachments);

			this.generateLatexFiles(thesis, false);
		}

	}

	translateMarkdown(note: string) {
		const root: Root = fromMarkdown(note);

		let latex = root.children.map((child: RootContent) => {
			const result = this.wrapper(child, 0);

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
		latex = this.fixLatexSpecialCharacters(latex);
		
		return latex;
	}

	generateLatexFiles(thesis: string, isPlain: boolean = true) {
		const latexTemplate = this.template.getLatexStyle();

		new SaveModal(app, async (path: string) => {
			//@ts-ignore
			const basePath = app.vault.adapter.basePath;

			const vaultPath = basePath  + '\\' + "generated-latex-thesis";

			if (!fs.existsSync(vaultPath))
				fs.mkdirSync(vaultPath);

			const thesisName = path.replace('.md', '');

			const thesisDir = vaultPath + '\\' + thesisName + '_' + formatDateNow(); 

			fs.mkdirSync(thesisDir);

			const imageDirName = this.settings.latexImagesDirectoryName;
			const imageDirPath = thesisDir + '\\' + imageDirName;

			fs.mkdirSync(imageDirPath);

			let images: TAbstractFile[] = [];

			this.images.forEach(img => {
				const imageObject = this.allFiles.find((file: TFile) => file.name.toLowerCase() === img.url.toLowerCase())
				if (imageObject)
					images.push(imageObject);
			});

			// move images
			images.forEach((image: TAbstractFile) => {
				
				const oldPath = basePath + '\\' + image.path;
				const newPath = imageDirPath + '\\' + image.name;

				fs.copyFileSync(oldPath, newPath); 
			})
			
			fs.writeFileSync(thesisDir + '\\' + 'main.tex', thesis);
			if (!isPlain)
				fs.writeFileSync(thesisDir + '\\' + 'latexStyle.sty', latexTemplate);

			
			new Notice(`${thesisName} and ${imageDirName} created successfully.`);
			new Notice(`${images.length} images copied successfully.`);
		}, false).open();

	}

	heading(ast: Heading) {
		const { depth, children } = ast;
		const transformHeadings: any = {
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
			heading = `\\textbf{${headingValue}}`
		}

		return heading;
	}

	// add inline code \verb|inline code text|
	// code block \begin{lstlisting}[...] ... \end{lstlisting}
	wrapper(ast: RootContent, indent: number = 0): any {
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
					ast.children.map(sub => this.wrapper(sub, indent + 1)).join("\n") + 
				"\n" + "\t".repeat(indent) + "\\end{enumerate}\n");	
			} else {
				return ("\\begin{itemize}\n" + 
					ast.children.map(sub => this.wrapper(sub, indent + 1)).join("\n") + 
				"\n\\end{itemize}\n");	
			}
		}

		if (ast.type == 'image') {
			this.images.push(ast);
			return `\\obrazek\n\\vlozobrbox{${ast.url}}{1.0\\textwidth}{!}\n\\endobrl{${ast.alt}}\n{${ast.url}}`
		} 

		try {
			return (ast as Parent).children.map((child) => {

				if (ast.type == "paragraph") {
					return this.wrapper(child);
				}
		
				if (ast.type == "strong") {
					return "\\textbf{" + this.wrapper(child) + "}";
				}
		
				if (ast.type == "emphasis") {
					return "{\\it " + this.wrapper(child) + "}";
				}

				if (ast.type == "listItem") {
					// start of sublist, dont insert "\item"
					if (child.type == "list") 
						return "\n" + this.wrapper(child, indent);

					return "\t".repeat(indent) + "\\item " + this.wrapper(child, indent);
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
		const links = [...latex.matchAll(/\[\[.+?#(\w+)\]\]/g)];
		links.forEach(([raw, clean]: any) => {
			latex = latex.replace(raw, `\\cite{${clean}}`);
		});
		return latex;
	}

	parseLiteratureNote(note: string) {
		let notesRow: string[] = note.split('\n');

		let citations: CitationType[] = [];

		while (notesRow.length > 0) {
			const row = notesRow.shift() as string;
			if (row === "")
				continue;
			
			if (row.startsWith("#")) {
				// new citation block start
				const label = row.replace("#", "").trim(); 
				const citation = new Citation(label, this.settings);
				
				const inline = citation.parseRow("citation in text", notesRow, ">"); // required

				let authors = [];
				while (notesRow[0].startsWith("-")) {
					authors.push(citation.parseRow("author", notesRow, "-")); // required
				}
				const title = citation.parseRow("title", notesRow, ">"); // required
				const format = citation.parseRow("format", notesRow, ">") // required, e.g. online
				const publisherInfo = citation.parseRow("publisher info", notesRow, ">") // required, e.g. Miesto: vydavateľ, rok vydania 
				const source = citation.parseRow("source", notesRow, ">"); // required
				const date = citation.parseRow("date", notesRow, ">"); // required
				const isbn = citation.parseRow("isbn", notesRow, ">", true); // required
				const subTitle = citation.parseRow("subtitle", notesRow, ">", true); // optional
				const edition = citation.parseRow("edition", notesRow, ">", true); // optional
				const distribution = citation.parseRow("distribution", notesRow, ">", true) // optional

				// check link source format
				// do NOT allow (lorem ipsum)[https://foo.bar]
				if (/\[.*\]\(.*?\)/.test(source)) {
					new Notice(`${this.settings.literatureNote}:\nWrong link source format.\nFormat "(lorem ipsum)[https://foo.bar]" is not allowed.\n${source}`);
					throw new Error(`${this.settings.literatureNote}:\nWrong link source format.\nFormat "(lorem ipsum)[https://foo.bar]" is not allowed.\n${source}`);
				}

				citations.push({ 
					label,
					inline, 
					authors,
					title,
					format,
					publisherInfo,
					source, 
					date,
					isbn,
					subTitle,
					edition,
					distribution 
				});
			}
		}
		
		return citations;
	}

	createLatexCitations(citations: CitationType[]) {
		const transformAuthorName = (author: string) => {
			const names = author.split(" ");

			if (names.length == 2) {
				const [firstName, lastName] = names;
				
				return `${lastName}, ${firstName[0]}.`
			} else if (names.length == 3) {
				const [firstName, secondName, lastName] = names;
				
				return `${lastName}, ${firstName[0]}. ${secondName[0]}.`
			} else {
				throw new Error(`Author format name is not supported or something went wrong. Author: ${author}`);
			}
		}

		citations = citations.sort((a, b) => a.label.localeCompare(b.label));

		const citationString = citations.map(({
			 label, inline, authors, 
			 title, subTitle, date, 
			 source, format, edition,
			 publisherInfo, distribution
		 }: CitationType) => {
			const transformedAuthors = authors.map((author: string) => {
				// author is already defined in correct format (e.g. Lopusna, N. or Lopusna, J. N.,)
				if (/\w+,\s*\w{1}\./.test(author))
					return author;

				return transformAuthorName(author);
			}).join(", ");

			subTitle = subTitle && `${subTitle}.`;
			edition = edition && `${edition}.`;
			publisherInfo = publisherInfo && `${publisherInfo}.`;
			distribution = distribution && `${distribution}.`;
			format = format && `${format}.`;

			// remove markdown link
			if (source.startsWith('[[')) 
				source = source.replace('[[', '').replace(']]', '');

			return `\\citace{${label}}{${inline}}{\n\\autor{${transformedAuthors}}\n`
					+ `\\nazev{${title}. ${subTitle}} ${format} ${edition} ${publisherInfo} ${distribution}`
					+ `\nDostupné z: ${source}. [citováno ${date}].}`;	
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
				this.errors.push({ type: 'image', item: [raw, clean], message: `Reference to image '${clean}' ('${raw}') is not valid.` })
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
			let headerMetadata = ["label", "cite", "source"];
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

		let metadata: Record<string, null | string> = {
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

		return `\\begin{lstlisting}[language=${ast.lang ?? "java"}, caption=${metadata.cite ?? ""}, label={${metadata.label ?? ''}}]\n` +
			   ast.value + `\n\\end{lstlisting}`; 
	}

	inlineCode(ast: InlineCode) {
		return `\\[ ${ast.value} \\]`
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
			// const [ match ] = this.images.filter((img: any) => img.name === clean);
			
			latex = latex.replace(raw, `\\ref{${clean}}`);
			// if (match) {
			// } else {
			// 	this.errors.push({ type: 'basic_ref', item: [raw, clean], message: `Reference to '${clean}' ('${raw}') not found.` })
			// }
			
			// compare clean with images array and
			//  get id from images
			// then make \ref{id}
			// this.note = this.note.replace(raw, `\\ref{${clean}}`);
		});

		return latex;
	}

	// find all images in active note
	// also get all possible/wrong images
	getImages(note: string, allFiles: TAbstractFile[]) {
		const images = [...note.matchAll(/\!\[(.*)\]\((.*)\)/g)];		
		const incorrectImages = [
			...note.matchAll(/\!\[\[(.*)\]\]/g),
			...note.matchAll(/\!\[(.*)\]\[(.*)\]/g)
		];
		const correct = images.map(([raw, desc, name]) => ({ 
			raw,
			desc,
			name,
			path: allFiles.find((file: TFile) => file.name.toLowerCase() === name.toLowerCase())?.path ?? name
		}));
		const incorrect = incorrectImages.map(([raw, name]) => ({
			raw,
			name,
			path: allFiles.find((file: TFile) => file.name.toLowerCase() === name.toLowerCase())?.path ?? name
		}));

		return {
			count: correct.length + incorrect.length,
			correct,
			incorrect,
		}
	}

	async getAttachments(app: App, allFiles: TAbstractFile[]) {
		if (!this.settings.attachmentsDir)
			return null;

		const attachments = allFiles.filter(
			(file: TFile) => file.path.includes(this.settings.attachmentsDir) && file?.extension === "md"
		);

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
		};

		return { 
			attachments,
			images,
			latex: attachmentLatex
		};
	}

	// special characters: %, #, _
	fixLatexSpecialCharacters(latex: string) {
		latex = latex.replaceAll("_", "\\_");
		latex = latex.replaceAll("#", "\\#");
		latex = latex.replaceAll("%", "\\%");
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
