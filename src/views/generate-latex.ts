import { Notice, App, TFile, } from 'obsidian';
import { CitationType, LatexImageType, LatexErrorType } from 'src/types';
import { fromMarkdown} from 'mdast-util-from-markdown'
import { Root, Code, Heading, Text, InlineCode, Parent } from 'mdast-util-from-markdown/lib'
import { GenerateMarkdownPluginSettingsType } from 'main';

import { getNoteByName } from "src/utils";
import { RootContent } from 'mdast';

class Citation {
	label: string;
	settings: GenerateMarkdownPluginSettingsType;

	constructor(label: string, settings: GenerateMarkdownPluginSettingsType) {
		this.label = label;
		this.settings = settings;
	}
			
	parseRow(mark: string, rows: string[], value: string, optional = false) {
		const row = (rows.shift() as string).replace(value, "").trim();

		// required param is missing
		if (!optional && row.length <= 0) {
			new Notice(`${this.settings.literatureNote}:\nError compiling literature citations. \nRequired citation param "${mark}" is missing in "${this.label}"`);
			throw new Error(`${this.settings.literatureNote}:\nError compiling literature citations. \nRequired citation param "${mark}" is missing in "${this.label}"`);
		}

		// skip optional row
		if (row === "-")
			return ""; 

		return row;
	}
}

export class GenerateLatex { 
	
	settings: GenerateMarkdownPluginSettingsType;
	literatureNote: string;
	citations: CitationType[] = [];
	images: LatexImageType[] = [];
	errors: LatexErrorType[] = [];

	imageRefRegex = new RegExp(/\[(.*(.jpg|.gif|.png|.bmp|.webp))\]/g);

	latex: string = "";

	constructor(app: App, settings: GenerateMarkdownPluginSettingsType) {
		this.settings = settings;

		const activeNote = app.workspace.getActiveFile();

		if (!activeNote) {			
			new Notice(`Selected note is invalid.`);
			throw new Error("Selected note is invalid.");
		}
		this.commands(activeNote);
	}
	
	async commands(activeNote: TFile) {
		
		const activeNoteText = await this.getActiveNote(app, activeNote);
		
		const literatureNote = await this.getLiteratureNote(app, this.settings.literatureNote);

		const citations = this.parseLiteratureNote(literatureNote);

		// TODO: insert latex citations at the end of doc
		const latexCitations = this.createLatexCitations(citations);
	
		const root: Root = fromMarkdown(activeNoteText);

		this.latex = root.children.map((child: RootContent) => {
			const result = this.wrapper(child, 0);

			// console.log(result);

			// // if tag, exlude it
			if (result && result.startsWith("#"))
				return;
			
			return result;

		}).join("\n\n");

		this.refCite();
		this.mergeCloseRefCitations();

		this.image();

		// this.refImage();


		// this.removeMarkdownLeftovers();

		// this.basicRef(); 

		console.log(this.latex);


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
			heading = `**${headingValue}**`
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
	}

	refCite() { 
		const links = [...this.latex.matchAll(/\[\[.+?#(\w+)\]\]/g)];
		links.forEach(([raw, clean]: any) => {
			this.latex = this.latex.replace(raw, `\\cite{${clean}}`);
		});
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

	image() {
		const possibleImages = [...this.latex.matchAll(/\!\[(.*)\]\[(.*)\]/g)];
		possibleImages.forEach(([raw, desc, name]) => {
			this.images.push({
				raw,
				desc,
				name
			});
			
			// overwriting ![very cool description][image_1.png] with: 
			// \obrazek
			// \vlozobrbox{image_1.png}{1.0\textwidth}{!}
			// \endobrl{very cool description}{image_1.png}
			const replaceWith = `\\obrazek\nvlozobrbox{${name}}{1.0\\textwidth}{!}\n\\endobrl{${desc}}\n{${name}}`;
			// @ts-ignore
			this.latex = this.latex.replaceAll(raw, replaceWith);
		})
	}

	refImage() {
		const possibleImages = [...this.latex.matchAll(this.imageRefRegex)];

		possibleImages.forEach(([raw, clean]) => {
			const [ match ] = this.images.filter((img: LatexImageType) => img.name === clean);

			if (match) {
				this.latex = this.latex.replace(raw, `\\ref{${clean}}`);
			} else {
				this.errors.push({ type: 'image', item: [raw, clean], message: `Reference to image '${clean}' ('${raw}') is not valid.` })
			}
			
			// compare clean with images array and
			//  get id from images
			// then make \ref{id}
			// this.note = this.note.replace(raw, `\\ref{${clean}}`);
		});
	}

	mergeCloseRefCitations() {
		const regexes = [
			new RegExp(/((\\cite{\w+}\s*){5})/g),
			new RegExp(/((\\cite{\w+}\s*){4})/g),
			new RegExp(/((\\cite{\w+}\s*){3})/g),
			new RegExp(/((\\cite{\w+}\s*){2})/g),
		]

		regexes.forEach((regex: RegExp) => {
			const refs = [...this.latex.matchAll(regex)];
			refs.forEach((ref: any) => {
				const matches = [...ref[0].matchAll(/\\cite{(\w+)}/g)];
				const cleanRefs = matches.map((m: any) => m[1]).join(',');
				this.latex = this.latex.replace(ref[0], `\\cite{${cleanRefs}}`)
			})
		})

		

		// links.forEach(([raw, clean]: any) => {
		// 	this.latex = this.latex.replace(raw, `\\cite{${clean}}`);
		// });
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

		let latexTable = `\\tabulka{${metadata.cite ? metadata.cite : ''}}\n` + 
		`\\label{${metadata.label ? metadata.label : ''}}\n\\def\\arraystretch{1.5}\n` +
		`\\begin{tabular}{|l|c|c|} \\hline\n` + 
		tHeader?.map((h: string, i: number) => `\\textbf{${h}} ` + (tHeader.length-1 != i ? '&' : `\\\\ \\hline`)).join("\n");

		if (tBody) {
			latexTable += "\n";
			latexTable += tBody.map((row: any) => {
				return Object.values(row).map((col: string, i: number) => `${col} ` + (Object.values(row).length-1 != i ? '&' : `\\\\ \\hline`)).join(" ")
			}).join("\n");
		}

		latexTable += `\n\\end{tabular}\n`;

		if (metadata.source) {
			latexTable += `\n\\tabzdroj{${metadata.source ? metadata.source : ''}}\n\\endtab`;
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

		return `\\begin{lstlisting}[language=${ast.lang ?? "javascript"}, caption=${metadata.cite ?? ""}, label={${metadata.label ?? ''}}]\n` +
			   ast.value + `\n\\end{lstlisting}`; 
	}

	inlineCode(ast: InlineCode) {
		return `\\[ ${ast.value} \\]`
	}

	removeMarkdownLeftovers() {
		// remove links [[foobar]] and [[#foobar]]
		const links = [...this.latex.matchAll(/\[\[(.*)\]\]/g)];

		links.forEach(([raw, clean]) => {
			if (clean.startsWith("#"))
				clean = clean.replace("#", '')

			this.latex = this.latex.replaceAll(raw, `${clean}`);
		});
	}

	// intext ref citation 
	basicRef() {
		const possibleRefs = [...this.latex.matchAll(/\[(\w+)\]/g)];

		possibleRefs.forEach(([raw, clean]) => {
			// const [ match ] = this.images.filter((img: any) => img.name === clean);
			
			this.latex = this.latex.replace(raw, `\\ref{${clean}}`);
			// if (match) {
			// } else {
			// 	this.errors.push({ type: 'basic_ref', item: [raw, clean], message: `Reference to '${clean}' ('${raw}') not found.` })
			// }
			
			// compare clean with images array and
			//  get id from images
			// then make \ref{id}
			// this.note = this.note.replace(raw, `\\ref{${clean}}`);
		});
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

		if (!literature) {
			new Notice('Literature note not found. Create new file or point to existing literature note in settings.');
			throw new Error(`Literature note not found. ${literature}`);
		}

		return literature
	}
}
