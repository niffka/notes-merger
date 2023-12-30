import { LatexTemplate } from './template';
import { AttachmentsType } from 'src/types';
import latexStyle from './latex-style';
import { NotesMergerPluginSettingsType } from 'main';
export class PEFTemplate extends LatexTemplate {

	thesis: string;
	metadata: Record<string, string> | null = {};
	metadataParams: string[] = [
		'title',
		'author',
		'supervisor',
		'locationAndDate',
		'acknowledgment',
		'declaration',
		'abstract-title-en',
		'abstract-title-cs',
		'abstract-desc-en',
		'abstract-desc-cs',
		'keywords-en',
		'keywords-cs',
		'thesis'
	];
	thesisParts: Record<string, boolean>;

	allowedTypes = ["bachelor", "master", "dissertation", "scientific"];
	settings: NotesMergerPluginSettingsType;

	constructor(rawMetadata: string, settings: NotesMergerPluginSettingsType) {
		super();
		this.settings = settings;
		this.parseMetadata(rawMetadata);
	}

	composeThesis(
		thesisParts: Record<string, boolean>,
		body: string,
		citations: string,
		attachments: string | null
	) {
		this.thesisParts = thesisParts;
		return `
%####### Spočítání znaků s mezerami na Linuxu: 
%####### $ pdftotext document.pdf -enc UTF-8 - | wc -m 
% 1 AA = 36 000 znaků = 5 600 - 6 200 slov
% 2,5 AA = 90 000 znaků

\\documentclass[twoside,12pt]{article}%
% pro tisk po jedné straně papíru je potřebné odstranit volbu twoside
\\usepackage{latexstyle}
\\usepackage{graphicx} %package to manage images
\\graphicspath{ {./${this.settings.latexImagesDirectoryName}/} }
% \\cestina % implicitní
% \\slovencina
% \\english
\\pismo{Bookman} % nic (=LModern), Academica, Baskerville, Bookman, Cambria, Comenia, Constantia, Palatino, Times
% \\dvafonty % implicitně je \\jedenfont
% \\technika
% \\beletrie % implicitní
\\popiskyzkr
% \\popisky % implicitní 
\\pagestyle{headings} % implicitní

\\cislovat{2}
% \\bakalarska % implicitní
% \\diplomova
% \\disertacni
${this.thesisType()}

\\brokenpenalty 10000

\\begin{document}

${this.title()}\n
${this.acknowledgment()}\n
${this.declaration()}\n
${this.abstract()}\n
${this.keywords()}\n

\\obsah
\\listoffigures
\\listoftables

${body}

${thesisParts.literature && citations ? `\\begin{literatura}\n${citations}\n\\end{literatura}` : ''}

${thesisParts.attachments && attachments ? `\\prilohy\n${attachments}` : ''}

\\end{document}
`;
	}

	parseMetadata(note: string) {
		const rows = note.split("\n");
		let noteAttrs: Record<string, string> = {};

		rows.forEach((row: string) => {
			const [key, value] = row.split(":")
			if (value)
				noteAttrs[key] = value.trim();
		});

		const noteKeys = Object.keys(noteAttrs);

		if (!noteKeys.length) {
			this.metadata = null;
			return;
		}

		this.metadataParams.forEach((key: string) => {
			this.metadata = {
				...this.metadata,
				[key]: noteKeys.includes(key) ? noteAttrs[key] : ""
			} 
		});
	}

	getMetadata() {
		return this.metadata;
	}
	
	thesisType(): string {
		if(!this.metadata?.thesis || !this.thesisParts.metadata) 
			return `\\diplomova`; 

		const { thesis } = this.metadata;
		
		if(thesis === "bachelor") 
			return `\\bakalarska`;
		
		if (thesis === "master")
			return `\\diplomova`;

		if (thesis === "dissertation")
			return `\\disertacni`;

		if (thesis === "scientific")
			return `\\vedecky`;

		return `\\diplomova`;
	}

	title(): string {
		if (!this.metadata || !Object.keys(this.metadata).length || !this.thesisParts.metadata) {
			return '\\titul{}{}{}{}\n';
		}
		const { title, author, supervisor, locationAndDate} = this.metadata;
		return `\\titul{${title}}{${author}}{${supervisor}}{${locationAndDate}}\n`;
	}

	acknowledgment(): string {
		if (!this.metadata || !Object.keys(this.metadata).length || !this.thesisParts.metadata) {
			return '\\podekovani{}\n';
		}
		return `\\podekovani{${this.metadata.acknowledgment}}\n`;
	}

	declaration(): string {
		if (!this.metadata || !Object.keys(this.metadata).length || !this.thesisParts.metadata) {
			return `\\prohlasenimuz{} \\today}\n`;
		}
		return `\\prohlasenimuz{${this.metadata.declaration} \\today}\n`;
	}

	abstract(): string {
		if (!this.metadata || !Object.keys(this.metadata).length || !this.thesisParts.metadata) {
			return (
				`\\abstract{}\n` +
				`{}\n\n` + 
				`\\abstrakt{}\n` +
				`{}\n`
			)
		}
		return (
			`\\abstract{${this.metadata["abstract-title-en"]}}\n` +
			`{${this.metadata["abstract-desc-en"]}}\n\n` + 
			`\\abstrakt{${this.metadata["abstract-title-cs"]}}\n` +
			`{${this.metadata["abstract-desc-cs"]}}\n`
		)
	}

	keywords(): string {
		if (!this.metadata || !Object.keys(this.metadata).length || !this.thesisParts.metadata) {
			return (
				`\\klslova{}\n` + 
				`\\keywords{}\n`
			)
		}
		return (
			`\\klslova{${this.metadata["keywords-cs"]}}\n` + 
			`\\keywords{${this.metadata["keywords-en"]}}\n`
		)
	}

	getThesis(): string {
		return this.thesis;
	}

	getLatexStyle(): string {
		return latexStyle;
	}
}
